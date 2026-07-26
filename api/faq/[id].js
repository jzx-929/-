import { getFaqData, saveFaqData } from '../lib/kv.js'
import { getAuthFromRequest } from '../lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const id = parseInt(req.query.id)
  const data = await getFaqData()
  const index = data.faqList.findIndex(item => item.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'FAQ not found' })
  }

  if (req.method === 'GET') {
    return res.status(200).json(data.faqList[index])
  }

  if (req.method === 'PUT') {
    const token = getAuthFromRequest(req)
    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' })
    }

    const updates = req.body
    data.faqList[index] = { ...data.faqList[index], ...updates }
    await saveFaqData(data)
    return res.status(200).json(data.faqList[index])
  }

  if (req.method === 'DELETE') {
    const token = getAuthFromRequest(req)
    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' })
    }

    const deleted = data.faqList.splice(index, 1)[0]
    await saveFaqData(data)
    return res.status(200).json(deleted)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
