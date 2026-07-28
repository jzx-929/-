import { getFaqData, saveFaqData } from '../lib/kv.js'
import { getAuthFromRequest } from '../lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const token = getAuthFromRequest(req)
    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' })
    }

    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供要删除的ID数组' })
    }

    const data = await getFaqData()
    const deleteIds = ids.map(id => parseInt(id))
    const beforeCount = data.faqList.length
    data.faqList = data.faqList.filter(item => !deleteIds.includes(item.id))
    const deletedCount = beforeCount - data.faqList.length

    if (deletedCount > 0) {
      await saveFaqData(data)
    }

    return res.status(200).json({
      success: true,
      deletedCount,
      remainingCount: data.faqList.length
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}