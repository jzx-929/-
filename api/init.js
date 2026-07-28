import { initFaqData, getFaqData, saveFaqData, DEFAULT_CATEGORIES } from './lib/kv.js'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

function verifyAdminPassword(req) {
  // 允许通过 header 或 query 参数传入密码（可选保护，避免误删）
  const pwdFromHeader = req.headers['x-admin-password']
  const pwdFromQuery = req.query?.admin_password
  const pwd = pwdFromHeader || pwdFromQuery
  // 如果没有配置密码，或密码正确，或为空（默认放开），则允许
  return !pwd || pwd === ADMIN_PASSWORD
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Password')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const { faqList, categories } = req.body
    const data = { faqList: faqList || [], categories: categories || DEFAULT_CATEGORIES }

    // 先尝试 init（无数据才写入），如果已有数据则覆盖
    let result = await initFaqData(data)
    if (!result) {
      // 数据已存在，直接覆盖写入
      await saveFaqData(data)
      return res.status(200).json({ message: '数据覆盖写入成功', count: data.faqList.length })
    }

    return res.status(201).json({ message: '数据初始化成功', count: data.faqList.length })
  }

  if (req.method === 'GET') {
    const data = await getFaqData()
    return res.status(200).json({
      faqCount: data.faqList.length,
      categories: data.categories,
      hasData: data.faqList.length > 0
    })
  }

  if (req.method === 'DELETE') {
    if (!verifyAdminPassword(req)) {
      return res.status(401).json({ error: '需要管理员密码' })
    }
    await saveFaqData({ faqList: [], categories: DEFAULT_CATEGORIES })
    return res.status(200).json({ message: '数据已清空' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
