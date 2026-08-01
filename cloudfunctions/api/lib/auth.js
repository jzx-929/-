const crypto = require('crypto')

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

const SECRET = crypto
  .createHash('sha256')
  .update(ADMIN_PASSWORD + '|faq-auth-secret')
  .digest('hex')

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex')
}

function generateToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000
  }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = Buffer.from(payloadStr).toString('base64')
  const signature = sign(payloadB64)
  return `${payloadB64}.${signature}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, signature] = parts
  const expectedSig = sign(payloadB64)
  if (signature !== expectedSig) return false
  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
    return decoded.exp > Date.now() && decoded.role === 'admin'
  } catch {
    return false
  }
}

function getAuthFromHeaders(headers) {
  const authHeader = headers['authorization'] || headers['Authorization']
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  return verifyToken(token) ? token : null
}

function verifyPassword(password) {
  return password === ADMIN_PASSWORD
}

module.exports = {
  generateToken,
  verifyToken,
  getAuthFromHeaders,
  verifyPassword
}
