import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 优先读取 .env.local（本地开发）
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const lines = content.split('\n')
      lines.forEach(line => {
        const [key, ...rest] = line.split('=')
        if (key && !key.startsWith('#')) {
          process.env[key.trim()] = rest.join('=').trim()
        }
      })
    }
  } catch (e) {
    // 忽略
  }
}

loadEnv()

const KV_REST_API_URL = process.env.KV_REST_API_URL
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN

const FAQ_KEY = 'faq:data'
const BATCH_SIZE = 100 // 每批 100 条，逐步写入
const RETRY_MAX = 3

async function redisSet(key, value, retries = RETRY_MAX) {
  // 直接调用 Upstash REST API，不走 Vercel Function
  const url = `${KV_REST_API_URL}/set/${encodeURIComponent(key)}`
  for (let i = 1; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
      return true
    } catch (e) {
      if (i === retries) throw e
      console.log(`   ⏳ 写入失败第${i}次，2秒后重试... (${e.message})`)
      await sleep(2000)
    }
  }
}

async function redisGet(key, retries = RETRY_MAX) {
  const url = `${KV_REST_API_URL}/get/${encodeURIComponent(key)}`
  for (let i = 1; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${KV_REST_API_TOKEN}`
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
      const json = await response.json()
      return json.result
    } catch (e) {
      if (i === retries) throw e
      console.log(`   ⏳ 读取失败第${i}次，2秒后重试... (${e.message})`)
      await sleep(2000)
    }
  }
}

async function initData() {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.error(`\n❌ 错误：缺少 Upstash Redis 配置\n`)
    console.error(`   请在 .env.local 中填写：`)
    console.error(`     KV_REST_API_URL=https://xxxxxx.upstash.io`)
    console.error(`     KV_REST_API_TOKEN=你的token\n`)
    console.error(`   或用环境变量：`)
    console.error(`     PowerShell: $env:KV_REST_API_URL="..."; $env:KV_REST_API_TOKEN="..."`)
    process.exit(1)
  }

  const faqPath = path.join(__dirname, '..', 'src', 'data', 'faq.json')
  const faqData = JSON.parse(fs.readFileSync(faqPath, 'utf8'))

  const faqList = faqData.map((item, idx) => ({
    id: item.id || idx + 1,
    question: item.question,
    answer: item.answer || '',
    category: item.category,
    source: item.source || 'QQ群整理',
    time: item.time || new Date().toISOString().split('T')[0],
    comments: [],
    files: [],
    isTop: false,
    isApproved: true
  }))

  const categories = [...new Set(faqList.map(item => item.category))]
  const fullData = { faqList, categories }

  console.log(`\n========================================`)
  console.log(`📡 模式：直接写入 Upstash Redis（绕过 Vercel）`)
  console.log(`📍 Redis URL: ${KV_REST_API_URL.replace(/^(https?:\/\/[^/]+).*$/, '$1')}`)
  console.log(`📊 待写入: ${faqList.length} 条 FAQ, ${categories.length} 个分类`)
  console.log(`========================================\n`)

  // 先检查现有数据
  console.log('🔍 检查现有数据...')
  const existing = await redisGet(FAQ_KEY)
  let existingCount = 0
  if (existing) {
    try {
      const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing
      existingCount = (parsed.faqList || []).length
    } catch (e) {}
  }
  console.log(`   → 现有 ${existingCount} 条记录\n`)

  if (existingCount > 0 && process.env.FORCE !== '1') {
    console.log(`⚠️  Redis 已有 ${existingCount} 条数据`)
    console.log(`   如需覆盖，请设置 FORCE=1\n`)
    return
  }

  // 写入（先写一小部分测试，再全量）
  console.log(`🔧 测试写入 1 条...`)
  const testData = {
    faqList: [faqList[0]],
    categories
  }
  await redisSet(FAQ_KEY, testData)
  console.log(`   → 测试成功\n`)

  // 逐步构建全量数据，分批模拟写入进度显示
  console.log(`🚀 开始全量写入 ${faqList.length} 条...`)
  for (let i = 0; i < faqList.length; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, faqList.length)
    const progress = Math.round((batchEnd / faqList.length) * 100)
    console.log(`   ⬆️  进度 ${progress}% (${batchEnd}/${faqList.length} 条)...`)
    const data = {
      faqList: faqList.slice(0, batchEnd),
      categories
    }
    await redisSet(FAQ_KEY, data)
  }

  console.log(`\n🔍 验证最终写入...`)
  const finalData = await redisGet(FAQ_KEY)
  const parsedFinal = typeof finalData === 'string' ? JSON.parse(finalData) : finalData
  const finalCount = (parsedFinal.faqList || []).length

  console.log(`\n========================================`)
  console.log(`✅ 数据初始化完成！`)
  console.log(`   最终 FAQ 数量: ${finalCount} 条`)
  console.log(`   分类: ${(parsedFinal.categories || []).join(', ')}`)
  console.log(`========================================\n`)
  console.log(`💡 接下来在 Vercel 上重新部署一下（或等已部署好的刷新），`)
  console.log(`   然后访问 https://你的项目.vercel.app 就能看到数据啦！\n`)
}

initData().catch(err => {
  console.error(`\n❌ 初始化失败：${err.message}`)
  console.error(`\n💡 排查建议：`)
  console.error(`   1. 检查 KV_REST_API_URL 和 KV_REST_API_TOKEN 是否正确`)
  console.error(`      （在 Vercel 控制台 → Storage → Upstash Redis 可获取）`)
  console.error(`   2. 确认网络可以访问 Upstash（.upstash.io）`)
  console.error(`   3. 如果数据量特别大，可以降低脚本中的 BATCH_SIZE\n`)
  process.exit(1)
})