const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export function generateToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function verifyToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded.exp > Date.now() && decoded.role === 'admin'
  } catch {
    return false
  }
}

export function getAuthFromRequest(req) {
  const authHeader = req.headers['authorization']
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  return verifyToken(token) ? token : null
}

export function verifyPassword(password) {
  return password === ADMIN_PASSWORD
}
