import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000'
const BATCH_SIZE = 50 // 每批50条，避免超时
const RETRY_DELAY = 2000 // 重试延迟2秒
const MAX_RETRIES = 3

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function apiRequest(path, options, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${VERCEL_URL}${path}`, {
        ...options,
        timeout: 0 // 不超时，靠Node.js默认超时
      })
      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        data = { raw: text }
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`)
      }
      return data
    } catch (e) {
      if (attempt === retries) throw e
      console.log(`  ⏳ 第${attempt}次失败，${RETRY_DELAY/1000}秒后重试... (${e.message})`)
      await sleep(RETRY_DELAY)
    }
  }
}

async function initData() {
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

  console.log(`\n========================================`)
  console.log(`📍 目标: ${VERCEL_URL}`)
  console.log(`📊 待初始化: ${faqList.length} 条 FAQ, ${categories.length} 个分类`)
  console.log(`📦 分批大小: ${BATCH_SIZE} 条/批`)
  console.log(`========================================\n`)

  // 第一步：先检查是否已有数据
  console.log('🔍 检查当前数据状态...')
  const status = await apiRequest('/api/init', { method: 'GET' })
  console.log(`   → 现有数据: ${status.faqCount} 条, hasData: ${status.hasData}\n`)

  // 如果已有数据，询问是否清空并重置（此处直接覆盖，带FORCE参数控制）
  const force = process.env.FORCE === '1'
  if (status.hasData && !force) {
    console.log(`⚠️  数据库已有 ${status.faqCount} 条数据`)
    console.log(`   如需清空重新初始化，请设置环境变量 FORCE=1 再运行`)
    console.log(`   或者先调用 /api/init 的 DELETE 清空\n`)
    console.log('✅ 初始化跳过（数据已存在）')
    return
  }

  if (status.hasData && force) {
    console.log('🗑️  FORCE=1，清空旧数据...')
    try {
      await apiRequest('/api/init', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('   → 清空完成\n')
    } catch (e) {
      console.log(`   → 清空失败（可能不支持DELETE，尝试覆盖写入）: ${e.message}\n`)
    }
  }

  // 第二步：先初始化分类和第一批数据
  console.log(`📝 第 1 批（${BATCH_SIZE}条）发送中...`)
  const firstBatch = faqList.slice(0, BATCH_SIZE)
  const initResult = await apiRequest('/api/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      faqList: firstBatch,
      categories
    })
  })
  console.log(`   → ${initResult.message || '成功'}，已上传 ${firstBatch.length} 条\n`)

  // 第三步：分批追加写入剩余数据（用POST /api/faq）
  for (let i = BATCH_SIZE; i < faqList.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(faqList.length / BATCH_SIZE)
    const batch = faqList.slice(i, i + BATCH_SIZE)

    console.log(`📝 第 ${batchNum}/${totalBatches} 批（第${i+1}-${Math.min(i+BATCH_SIZE, faqList.length)}条）发送中...`)

    // 逐条发送，避免批量接口超时
    let successCount = 0
    for (let j = 0; j < batch.length; j++) {
      const faq = batch[j]
      try {
        await apiRequest('/api/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(faq)
        })
        successCount++
      } catch (e) {
        console.log(`   ❌ 第${i+j+1}条 (ID:${faq.id}) 失败: ${e.message}`)
      }
    }
    console.log(`   → 本批成功 ${successCount}/${batch.length} 条\n`)
  }

  // 第四步：验证
  console.log('🔍 验证最终数据...')
  const finalStatus = await apiRequest('/api/init', { method: 'GET' })
  console.log(`\n========================================`)
  console.log(`✅ 初始化完成！`)
  console.log(`   最终 FAQ 数量: ${finalStatus.faqCount} 条`)
  console.log(`   分类数量: ${finalStatus.categories?.length || 0} 个`)
  console.log(`========================================\n`)
}

initData().catch(err => {
  console.error(`\n❌ 初始化失败：${err.message}`)
  console.error(`💡 可能的原因：`)
  console.error(`   1. VERCEL_URL 不对，当前为: ${VERCEL_URL}`)
  console.error(`   2. 部署还没完成或域名还没生效`)
  console.error(`   3. Upstash Redis 还没配置好（在 Vercel Storage 创建）`)
  console.error(`   4. 网络问题，可多次重试`)
  console.error(`\n💡 用法：`)
  console.error(`   PowerShell: $env:VERCEL_URL="https://xxxxx.vercel.app"; $env:FORCE="1"; node scripts/init-vercel-data-batch.js`)
  console.error(`   CMD: set VERCEL_URL=https://xxxxx.vercel.app && set FORCE=1 && node scripts/init-vercel-data-batch.js`)
  process.exit(1)
})