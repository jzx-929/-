import { getFaqData, saveFaqData } from '../lib/kv.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const faqId = parseInt(req.query.faqId)
    const { content, author, files } = req.body

    if (!content) {
      return res.status(400).json({ error: '评论内容不能为空' })
    }

    const data = await getFaqData()
    const faq = data.faqList.find(item => item.id === faqId)

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' })
    }

    if (!faq.comments) faq.comments = []

    const newComment = {
      id: Date.now(),
      content,
      author: author || '匿名用户',
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }),
      files: files || [],
      isApproved: true
    }

    faq.comments.push(newComment)
    await saveFaqData(data)

    return res.status(201).json(newComment)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
