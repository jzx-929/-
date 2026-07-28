import { ref } from 'vue'
import faqData from '../data/faq.json'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const faqList = ref([])
const categories = ref([])
const loading = ref(false)

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
    const response = await fetch(`${API_BASE}/api/faq`)
    if (response.ok) {
      const data = await response.json()
      faqList.value = data.faqList || []
      categories.value = data.categories || []
    } else {
      throw new Error('API not available')
    }
  } catch (e) {
    const localData = localStorage.getItem('faq_data')
    if (localData) {
      const parsed = JSON.parse(localData)
      faqList.value = parsed.faqList || []
      categories.value = parsed.categories || []
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
    const response = await fetch(`${API_BASE}/api/faq`, {
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
    const newFaq = {
      id: Date.now(),
      ...faq,
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
  try {
    const token = localStorage.getItem('admin_token')
    const response = await fetch(`${API_BASE}/api/faq/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const index = faqList.value.findIndex(item => item.id === id)
      if (index !== -1) faqList.value.splice(index, 1)
    }
  } catch (e) {
    const index = faqList.value.findIndex(item => item.id === id)
    if (index !== -1) faqList.value.splice(index, 1)
  }
}

const batchDelete = async (ids) => {
  try {
    const token = localStorage.getItem('admin_token')
    const response = await fetch(`${API_BASE}/api/faq/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids })
    })
    if (response.ok) {
      const result = await response.json()
      const deleteIds = ids.map(id => parseInt(id))
      faqList.value = faqList.value.filter(item => !deleteIds.includes(item.id))
      return result
    }
  } catch (e) {
    const deleteIds = ids.map(id => parseInt(id))
    faqList.value = faqList.value.filter(item => !deleteIds.includes(item.id))
  }
}

const updateFaq = async (id, updates) => {
  try {
    const token = localStorage.getItem('admin_token')
    const response = await fetch(`${API_BASE}/api/faq/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })
    if (response.ok) {
      const updated = await response.json()
      const index = faqList.value.findIndex(item => item.id === id)
      if (index !== -1) faqList.value[index] = updated
      return updated
    }
  } catch (e) {
    const index = faqList.value.findIndex(item => item.id === id)
    if (index !== -1) {
      faqList.value[index] = { ...faqList.value[index], ...updates }
      return faqList.value[index]
    }
  }
  return null
}

const toggleTop = async (id) => {
  const faq = faqList.value.find(item => item.id === id)
  if (faq) {
    return updateFaq(id, { isTop: !faq.isTop })
  }
}

const addComment = async (faqId, comment) => {
  try {
    const response = await fetch(`${API_BASE}/api/comments/${faqId}`, {
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
    addComment
  }
}
