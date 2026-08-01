import { ref } from 'vue'
import faqData from '../data/faq.json'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const FETCH_TIMEOUT = 8000 // 8秒超时

const faqList = ref([])
const categories = ref([])
const loading = ref(false)

async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

const getDefaultData = () => {
  const list = faqData.map(item => ({
    ...item,
    comments: [],
    files: [],
    isTop: false,
    isApproved: true
  }))
  const cats = [...new Set(faqData.map(item => item.category))]
  return { faqList: list, categories: cats }
}

const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/faq`)
    if (response.ok) {
      const data = await response.json()
      faqList.value = data.faqList || []
      categories.value = data.categories || []
      // API成功，清除可能存在的本地缓存（防止旧缓存导致数据不一致）
      localStorage.removeItem('faq_data')
    } else {
      throw new Error('API not available')
    }
  } catch (e) {
    console.warn('API请求失败，使用本地数据:', e.message)
    const localData = localStorage.getItem('faq_data')
    if (localData) {
      try {
        const parsed = JSON.parse(localData)
        faqList.value = parsed.faqList || []
        categories.value = parsed.categories || []
      } catch {
        const defaultData = getDefaultData()
        faqList.value = defaultData.faqList
        categories.value = defaultData.categories
      }
    } else {
      const defaultData = getDefaultData()
      faqList.value = defaultData.faqList
      categories.value = defaultData.categories
    }
  } finally {
    loading.value = false
  }
}

const addFaq = async (faq) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/faq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faq)
    })
    if (response.ok) {
      const newFaq = await response.json()
      faqList.value.unshift(newFaq)
      return newFaq
    }
    throw new Error('提交失败')
  } catch (e) {
    console.warn('API提交失败，使用本地模式:', e.message)
    const newFaq = {
      ...faq,
      id: faq.id || Date.now(),
      time: new Date().toISOString().split('T')[0],
      comments: [],
      files: faq.files || [],
      isTop: false,
      isApproved: true
    }
    faqList.value.unshift(newFaq)
    localStorage.setItem('faq_data', JSON.stringify({
      faqList: faqList.value,
      categories: categories.value
    }))
    return newFaq
  }
}

const deleteFaq = async (id) => {
  const token = localStorage.getItem('admin_token')
  const response = await fetchWithTimeout(`${API_BASE}/api/faq/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `删除失败 (HTTP ${response.status})`)
  }
  // API删除成功，同步更新本地数据
  const index = faqList.value.findIndex(item => item.id === id)
  if (index !== -1) {
    faqList.value.splice(index, 1)
    // 重新索引ID，与后端reindexIds保持一致
    faqList.value.forEach((item, idx) => {
      item.id = idx + 1
    })
  }
  return true
}

const batchDelete = async (ids) => {
  const token = localStorage.getItem('admin_token')
  const response = await fetchWithTimeout(`${API_BASE}/api/faq/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ids })
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `批量删除失败 (HTTP ${response.status})`)
  }
  const result = await response.json()
  // API删除成功，同步更新本地数据
  const deleteIds = ids.map(id => parseInt(id))
  faqList.value = faqList.value.filter(item => !deleteIds.includes(item.id))
  // 重新索引ID，与后端reindexIds保持一致
  faqList.value.forEach((item, idx) => {
    item.id = idx + 1
  })
  return result
}

const updateFaq = async (id, updates) => {
  const token = localStorage.getItem('admin_token')
  const response = await fetchWithTimeout(`${API_BASE}/api/faq/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `更新失败 (HTTP ${response.status})`)
  }
  const updated = await response.json()
  const index = faqList.value.findIndex(item => item.id === id)
  if (index !== -1) faqList.value[index] = updated
  return updated
}

const toggleTop = async (id) => {
  const faq = faqList.value.find(item => item.id === id)
  if (faq) {
    return updateFaq(id, { isTop: !faq.isTop })
  }
}

const addComment = async (faqId, comment) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/comments/${faqId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    })
    if (response.ok) {
      const newComment = await response.json()
      const faq = faqList.value.find(item => item.id === faqId)
      if (faq) {
        if (!faq.comments) faq.comments = []
        faq.comments.push(newComment)
      }
      return newComment
    }
  } catch (e) {
    console.warn('API评论失败:', e.message)
    const faq = faqList.value.find(item => item.id === faqId)
    if (faq) {
      if (!faq.comments) faq.comments = []
      const newComment = {
        id: Date.now(),
        ...comment,
        time: new Date().toLocaleString('zh-CN'),
        isApproved: true
      }
      faq.comments.push(newComment)
      return newComment
    }
  }
  return null
}

const deleteComment = async (faqId, commentId) => {
  const token = localStorage.getItem('admin_token')
  const response = await fetchWithTimeout(`${API_BASE}/api/comments/${faqId}?commentId=${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `删除评论失败 (HTTP ${response.status})`)
  }
  const faq = faqList.value.find(item => item.id === faqId)
  if (faq && faq.comments) {
    const index = faq.comments.findIndex(c => c.id === commentId)
    if (index !== -1) faq.comments.splice(index, 1)
  }
  return true
}

// 用户举报FAQ
const reportFaq = async (faqId, reason, reporter) => {
  const response = await fetchWithTimeout(`${API_BASE}/api/report/${faqId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, reporter })
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || '举报失败')
  }
  // 同步更新本地数据
  const faq = faqList.value.find(item => item.id === faqId)
  if (faq) {
    if (!faq.reports) faq.reports = []
    faq.reports.push({
      id: Date.now(),
      reason,
      reporter: reporter || 'anonymous',
      time: new Date().toLocaleString('zh-CN'),
      status: 'pending'
    })
  }
  return result
}

// 管理员处理举报
const resolveReport = async (faqId, action, reportId) => {
  const token = localStorage.getItem('admin_token')
  const response = await fetchWithTimeout(`${API_BASE}/api/resolve/${faqId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, reportId })
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || '处理失败')
  }
  // 同步更新本地数据
  if (action === 'delete') {
    const index = faqList.value.findIndex(item => item.id === faqId)
    if (index !== -1) {
      faqList.value.splice(index, 1)
      faqList.value.forEach((item, idx) => { item.id = idx + 1 })
    }
  } else {
    // ignore：将举报标记为已处理
    const faq = faqList.value.find(item => item.id === faqId)
    if (faq && faq.reports) {
      if (reportId) {
        const report = faq.reports.find(r => r.id === reportId)
        if (report) report.status = 'resolved'
      } else {
        faq.reports.forEach(r => { r.status = 'resolved' })
      }
    }
  }
  return result
}

export const useApiData = () => {
  fetchData()

  return {
    faqList,
    categories,
    loading,
    fetchData,
    addFaq,
    deleteFaq,
    batchDelete,
    updateFaq,
    toggleTop,
    addComment,
    deleteComment,
    reportFaq,
    resolveReport
  }
}
