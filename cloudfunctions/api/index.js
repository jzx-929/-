/**
 * CloudBase 云函数 - FAQ API
 * 统一入口，处理所有 /api/* 路由
 */
const { getFaqData, saveFaqData, reindexIds, initFaqData, DEFAULT_CATEGORIES } = require('./lib/kv')
const { generateToken, getAuthFromHeaders, verifyPassword } = require('./lib/auth')

// CloudBase Node SDK - 用于云存储文件临时URL生成
let tcbApp = null
function getTcbApp() {
  if (!tcbApp) {
    try {
      const tcb = require('@cloudbase/node-sdk')
      tcbApp = tcb.init()
    } catch (e) {
      console.error('Failed to load @cloudbase/node-sdk:', e.message)
    }
  }
  return tcbApp
}

/**
 * 为 FAQ 数据中的云存储文件生成临时下载URL
 * 兼容旧数据（base64 url）和新数据（fileID）
 */
async function resolveFileUrls(faqList) {
  const fileIDs = []
  for (const faq of faqList) {
    if (faq.files) {
      for (const file of faq.files) {
        if (file.fileID && !file.url) fileIDs.push(file.fileID)
      }
    }
    if (faq.comments) {
      for (const comment of faq.comments) {
        if (comment.files) {
          for (const file of comment.files) {
            if (file.fileID && !file.url) fileIDs.push(file.fileID)
          }
        }
      }
    }
  }

  if (fileIDs.length === 0) return faqList

  const app = getTcbApp()
  if (!app) return faqList

  try {
    const result = await app.getTempFileURL({ fileList: fileIDs })
    const urlMap = {}
    for (const item of result.fileList) {
      if (item.tempFileURL) urlMap[item.fileID] = item.tempFileURL
    }
    for (const faq of faqList) {
      if (faq.files) {
        for (const file of faq.files) {
          if (file.fileID && urlMap[file.fileID]) file.url = urlMap[file.fileID]
        }
      }
      if (faq.comments) {
        for (const comment of faq.comments) {
          if (comment.files) {
            for (const file of comment.files) {
              if (file.fileID && urlMap[file.fileID]) file.url = urlMap[file.fileID]
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('getTempFileURL error:', e.message)
  }
  return faqList
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password',
  'Content-Type': 'application/json'
}

const ALLOWED_UPDATE_FIELDS = [
  'question', 'answer', 'category', 'source', 'author',
  'time', 'files', 'comments', 'isTop', 'isApproved'
]

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  }
}

function parsePath(path) {
  let cleanPath = (path || '/').replace(/^\/+|\/+$/g, '')
  // 兼容 event.path 包含或不包含 /api 前缀的情况
  if (cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(4)
  } else if (cleanPath === 'api') {
    cleanPath = ''
  }
  return cleanPath.split('/').filter(Boolean)
}

function getHeader(headers, name) {
  const lower = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key]
  }
  return undefined
}

function parseBody(event) {
  if (!event.body) return {}
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body
  } catch {
    return {}
  }
}

// ========== 路由处理函数 ==========

async function handleFaqList(method, body) {
  if (method === 'GET') {
    const data = await getFaqData()
    if (data.faqList && data.faqList.length > 0) {
      await resolveFileUrls(data.faqList)
    }
    return jsonResponse(200, data)
  }

  if (method === 'POST') {
    const { id, question, answer, category, source, author, files, comments, isTop, isApproved } = body
    if (!question || !category) {
      return jsonResponse(400, { error: '问题和分类为必填项' })
    }
    const data = await getFaqData()
    const newFaq = {
      id: id || Date.now(),
      question,
      answer: answer || '',
      category,
      source: source || '用户提问',
      author: author || '匿名用户',
      time: body.time || new Date().toISOString().split('T')[0],
      comments: comments || [],
      files: files || [],
      isTop: isTop || false,
      isApproved: isApproved !== undefined ? isApproved : true
    }
    data.faqList.unshift(newFaq)
    await saveFaqData(data)
    return jsonResponse(201, newFaq)
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}

async function handleFaqBatch(method, body, headers) {
  if (method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const token = getAuthFromHeaders(headers)
  if (!token) {
    return jsonResponse(401, { error: '未授权，请先登录' })
  }

  const { ids } = body
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return jsonResponse(400, { error: '请提供要删除的ID数组' })
  }

  const data = await getFaqData()
  const deleteIds = ids.map(id => parseInt(id))
  const beforeCount = data.faqList.length
  data.faqList = data.faqList.filter(item => !deleteIds.includes(item.id))
  const deletedCount = beforeCount - data.faqList.length

  if (deletedCount > 0) {
    reindexIds(data)
    await saveFaqData(data)
  }

  return jsonResponse(200, {
    success: true,
    deletedCount,
    remainingCount: data.faqList.length
  })
}

async function handleFaqById(method, idStr, body, headers) {
  const id = parseInt(idStr)
  const data = await getFaqData()
  const index = data.faqList.findIndex(item => item.id === id)

  if (index === -1) {
    return jsonResponse(404, { error: 'FAQ not found' })
  }

  if (method === 'GET') {
    return jsonResponse(200, data.faqList[index])
  }

  if (method === 'PUT') {
    const token = getAuthFromHeaders(headers)
    if (!token) {
      return jsonResponse(401, { error: '未授权，请先登录' })
    }
    const filteredUpdates = {}
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (body[key] !== undefined) {
        filteredUpdates[key] = body[key]
      }
    }
    data.faqList[index] = { ...data.faqList[index], ...filteredUpdates }
    await saveFaqData(data)
    return jsonResponse(200, data.faqList[index])
  }

  if (method === 'DELETE') {
    const token = getAuthFromHeaders(headers)
    if (!token) {
      return jsonResponse(401, { error: '未授权，请先登录' })
    }
    const deleted = data.faqList.splice(index, 1)[0]
    reindexIds(data)
    await saveFaqData(data)
    return jsonResponse(200, { ...deleted, reindexed: true })
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}

async function handleAuthLogin(method, body) {
  if (method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const { password } = body
  if (verifyPassword(password)) {
    const token = generateToken()
    return jsonResponse(200, { token, message: '登录成功' })
  }
  return jsonResponse(401, { error: '密码错误' })
}

async function handleComments(method, faqIdStr, body, query, headers) {
  const faqId = parseInt(faqIdStr)
  const data = await getFaqData()
  const faq = data.faqList.find(item => item.id === faqId)

  if (!faq) {
    return jsonResponse(404, { error: 'FAQ not found' })
  }

  if (method === 'POST') {
    const { content, author, files } = body
    if (!content) {
      return jsonResponse(400, { error: '评论内容不能为空' })
    }
    if (!faq.comments) faq.comments = []
    const newComment = {
      id: body.id || Date.now(),
      content,
      author: author || '匿名用户',
      time: body.time || new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }),
      files: files || [],
      isApproved: body.isApproved !== undefined ? body.isApproved : true
    }
    faq.comments.push(newComment)
    await saveFaqData(data)
    return jsonResponse(201, newComment)
  }

  if (method === 'DELETE') {
    const token = getAuthFromHeaders(headers)
    if (!token) {
      return jsonResponse(401, { error: '未授权，请先登录' })
    }
    const commentId = parseInt(query.commentId)
    if (!faq.comments) {
      return jsonResponse(404, { error: 'Comment not found' })
    }
    const commentIndex = faq.comments.findIndex(c => c.id === commentId)
    if (commentIndex === -1) {
      return jsonResponse(404, { error: 'Comment not found' })
    }
    const deleted = faq.comments.splice(commentIndex, 1)[0]
    await saveFaqData(data)
    return jsonResponse(200, deleted)
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}

async function handleReport(method, faqIdStr, body) {
  const faqId = parseInt(faqIdStr)

  if (method === 'POST') {
    const { reason, reporter } = body
    if (!reason) {
      return jsonResponse(400, { error: '请填写举报原因' })
    }
    const data = await getFaqData()
    const faq = data.faqList.find(item => item.id === faqId)
    if (!faq) {
      return jsonResponse(404, { error: 'FAQ not found' })
    }
    if (!faq.reports) faq.reports = []
    // 防止重复举报（同一用户）
    const reporterId = reporter || 'anonymous'
    const existing = faq.reports.find(r => r.reporter === reporterId)
    if (existing) {
      return jsonResponse(200, { message: '您已举报过此条信息', reportCount: faq.reports.length })
    }
    faq.reports.push({
      id: Date.now(),
      reason,
      reporter: reporterId,
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }),
      status: 'pending'
    })
    await saveFaqData(data)
    return jsonResponse(201, { message: '举报成功，管理员将尽快处理', reportCount: faq.reports.length })
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}

async function handleResolveReport(method, faqIdStr, body, headers) {
  const token = getAuthFromHeaders(headers)
  if (!token) {
    return jsonResponse(401, { error: '未授权，请先登录' })
  }

  const faqId = parseInt(faqIdStr)
  const data = await getFaqData()
  const faq = data.faqList.find(item => item.id === faqId)
  if (!faq) {
    return jsonResponse(404, { error: 'FAQ not found' })
  }

  if (method === 'PUT') {
    // action: 'ignore' | 'delete'
    const { action, reportId } = body
    if (!faq.reports || faq.reports.length === 0) {
      return jsonResponse(400, { error: '该FAQ无举报记录' })
    }

    if (action === 'delete') {
      // 删除该FAQ
      const index = data.faqList.findIndex(item => item.id === faqId)
      data.faqList.splice(index, 1)
      reindexIds(data)
      await saveFaqData(data)
      return jsonResponse(200, { message: '已删除被举报的FAQ', deleted: true })
    }

    // action === 'ignore'：将举报标记为已处理
    if (reportId) {
      const report = faq.reports.find(r => r.id === reportId)
      if (report) report.status = 'resolved'
    } else {
      // 处理该FAQ的所有举报
      faq.reports.forEach(r => { r.status = 'resolved' })
    }
    await saveFaqData(data)
    return jsonResponse(200, { message: '举报已处理', faq })
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}

async function handleInit(method, body, query, headers) {
  if (method === 'POST') {
    const { faqList, categories } = body
    const data = { faqList: faqList || [], categories: categories || DEFAULT_CATEGORIES }
    let result = await initFaqData(data)
    if (!result) {
      await saveFaqData(data)
      return jsonResponse(200, { message: '数据覆盖写入成功', count: data.faqList.length })
    }
    return jsonResponse(201, { message: '数据初始化成功', count: data.faqList.length })
  }

  if (method === 'GET') {
    const data = await getFaqData()
    return jsonResponse(200, {
      faqCount: data.faqList.length,
      categories: data.categories,
      hasData: data.faqList.length > 0
    })
  }

  if (method === 'DELETE') {
    const adminPwd = getHeader(headers, 'x-admin-password') || query.admin_password
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
    if (!adminPwd || adminPwd !== ADMIN_PASSWORD) {
      return jsonResponse(401, { error: '需要管理员密码' })
    }
    await saveFaqData({ faqList: [], categories: DEFAULT_CATEGORIES })
    return jsonResponse(200, { message: '数据已清空' })
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}

// ========== 主入口 ==========

exports.main = async (event, context) => {
  try {
    const method = (event.httpMethod || event.method || 'GET').toUpperCase()
    const headers = event.headers || {}
    const query = event.queryStringParameters || event.query || {}
    const body = parseBody(event)
    const parts = parsePath(event.path || event.url || '/')
    const route = parts[0] || ''

    // CORS 预检
    if (method === 'OPTIONS') {
      return jsonResponse(200, {})
    }

    // /api/faq
    if (route === 'faq') {
      if (parts.length === 1) {
        return await handleFaqList(method, body)
      }
      if (parts.length === 2 && parts[1] === 'batch') {
        return await handleFaqBatch(method, body, headers)
      }
      if (parts.length === 2) {
        return await handleFaqById(method, parts[1], body, headers)
      }
    }

    // /api/auth/login
    if (route === 'auth' && parts[1] === 'login') {
      return await handleAuthLogin(method, body)
    }

    // /api/comments/:faqId
    if (route === 'comments' && parts.length >= 2) {
      return await handleComments(method, parts[1], body, query, headers)
    }

    // /api/report/:faqId  — 用户举报
    if (route === 'report' && parts.length >= 2) {
      return await handleReport(method, parts[1], body)
    }

    // /api/resolve/:faqId  — 管理员处理举报
    if (route === 'resolve' && parts.length >= 2) {
      return await handleResolveReport(method, parts[1], body, headers)
    }

    // /api/init
    if (route === 'init') {
      return await handleInit(method, body, query, headers)
    }

    return jsonResponse(404, { error: 'Not found', path: event.path })
  } catch (err) {
    console.error('Handler error:', err)
    return jsonResponse(500, { error: '服务器内部错误', message: err.message })
  }
}
