import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000'

async function initData() {
  const faqPath = path.join(__dirname, '..', 'src', 'data', 'faq.json')
  const faqData = JSON.parse(fs.readFileSync(faqPath, 'utf8'))

  const faqList = faqData.map(item => ({
    ...item,
    comments: [],
    files: [],
    isTop: false,
    isApproved: true
  }))

  const categories = [...new Set(faqData.map(item => item.category))]

  console.log(`准备初始化 ${faqList.length} 条FAQ数据到 ${VERCEL_URL}`)

  const response = await fetch(`${VERCEL_URL}/api/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ faqList, categories })
  })

  const result = await response.json()
  console.log('初始化结果:', result)
}

initData().catch(console.error)
