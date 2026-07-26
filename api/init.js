import { initFaqData, getFaqData, saveFaqData } from './lib/kv.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const { faqList, categories } = req.body
    const data = { faqList: faqList || [], categories: categories || [] }
    const result = await initFaqData(data)

    if (result) {
      return res.status(201).json({ message: '数据初始化成功', count: faqList.length })
    }

    return res.status(200).json({ message: '数据已存在，如需重置请先清空' })
  }

  if (req.method === 'GET') {
    const data = await getFaqData()
    return res.status(200).json({
      faqCount: data.faqList.length,
      categories: data.categories,
      hasData: data.faqList.length > 0
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
