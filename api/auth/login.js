import { generateToken, verifyPassword } from '../lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const { password } = req.body

    if (verifyPassword(password)) {
      const token = generateToken()
      return res.status(200).json({ token, message: '登录成功' })
    }

    return res.status(401).json({ error: '密码错误' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
