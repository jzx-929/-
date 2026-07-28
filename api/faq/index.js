import { getFaqData, saveFaqData } from '../lib/kv.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    const data = await getFaqData()
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { id, question, answer, category, source, author, files, comments, isTop, isApproved } = req.body

    if (!question || !category) {
      return res.status(400).json({ error: '问题和分类为必填项' })
    }

    const data = await getFaqData()
    const newFaq = {
      id: id || Date.now(),
      question,
      answer: answer || '',
      category,
      source: source || '用户提问',
      author: author || '匿名用户',
      time: req.body.time || new Date().toISOString().split('T')[0],
      comments: comments || [],
      files: files || [],
      isTop: isTop || false,
      isApproved: isApproved !== undefined ? isApproved : false
    }

    data.faqList.unshift(newFaq)
    await saveFaqData(data)

    return res.status(201).json(newFaq)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
