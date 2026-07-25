import { ref, watch } from 'vue'
import faqData from '../data/faq.json'

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH
const GITHUB_FILE = import.meta.env.VITE_GITHUB_FILE

const STORAGE_KEY = 'faq_data'

const faqList = ref([])
const categories = ref([])
const loading = ref(false)

const encodeBase64 = (str) => {
  return btoa(unescape(encodeURIComponent(str)))
}

const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return str
  }
}

const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return null
}

const fetchFromGitHub = async () => {
  if (!GITHUB_REPO) {
    console.log('GitHub config not set, using local data')
    return null
  }
  
  try {
    if (import.meta.env.DEV) {
      const baseUrl = '/CampusFAQ/github-api'
      const url = `${baseUrl}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          const content = decodeBase64(data.content)
          return JSON.parse(content)
        }
      } else if (response.status === 404) {
        console.log('GitHub file not found, will create')
        return null
      } else {
        console.error('GitHub API error:', response.status, await response.text())
      }
    } else {
      const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FILE}`
      const response = await fetch(rawUrl)
      
      if (response.ok) {
        return await response.json()
      } else if (response.status === 404) {
        console.log('GitHub raw file not found')
        return null
      } else {
        console.error('Failed to fetch raw file:', response.status)
      }
    }
  } catch (e) {
    console.error('Failed to fetch from GitHub:', e)
  }
  return null
}

const saveToGitHub = async () => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('GitHub API config not set, skipping save')
    return
  }
  
  try {
    const baseUrl = import.meta.env.DEV 
      ? '/CampusFAQ/github-api' 
      : 'https://api.github.com'
    
    let sha = null
    const checkUrl = `${baseUrl}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`
    const checkResponse = await fetch(checkUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    })
    
    if (checkResponse.ok) {
      const existing = await checkResponse.json()
      sha = existing.sha
    }
    
    const content = encodeBase64(JSON.stringify({
      faqList: faqList.value,
      categories: categories.value
    }, null, 2))
    
    const saveUrl = `${baseUrl}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`
    const response = await fetch(saveUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'chore: update FAQ data',
        content: content,
        branch: GITHUB_BRANCH,
        sha: sha
      })
    })
    
    if (!response.ok) {
      console.error('Failed to save to GitHub:', response.status, await response.text())
    }
  } catch (e) {
    console.error('Failed to save to GitHub:', e)
  }
}

const initializeData = () => {
  return {
    faqList: faqData.map(item => ({
      ...item,
      comments: [],
      files: [],
      isTop: false,
      isApproved: true
    })),
    categories: ['入学报到', '宿舍生活', '军训安排', '学习课程', '校园活动', '校园生活', '竞赛科研', '招新宣传', '其他']
  }
}

const fetchData = async () => {
  loading.value = true
  
  try {
    const githubData = await fetchFromGitHub()
    
    if (githubData) {
      faqList.value = githubData.faqList || []
      categories.value = githubData.categories || []
      saveToLocalStorage(githubData)
    } else {
      const localData = loadFromLocalStorage()
      if (localData) {
        faqList.value = localData.faqList || []
        categories.value = localData.categories || []
      } else {
        const initData = initializeData()
        faqList.value = initData.faqList
        categories.value = initData.categories
        
        await saveToGitHub()
        saveToLocalStorage(initData)
      }
    }
  } catch (e) {
    console.error('Failed to fetch data:', e)
    const localData = loadFromLocalStorage()
    if (localData) {
      faqList.value = localData.faqList || []
      categories.value = localData.categories || []
    } else {
      const initData = initializeData()
      faqList.value = initData.faqList
      categories.value = initData.categories
      saveToLocalStorage(initData)
    }
  } finally {
    loading.value = false
  }
}

watch(faqList, async (newData) => {
  saveToLocalStorage({
    faqList: newData,
    categories: categories.value
  })
  await saveToGitHub()
}, { deep: true })

const addFaq = async (faq) => {
  const newFaq = {
    id: Date.now(),
    ...faq,
    time: new Date().toLocaleDateString('zh-CN'),
    isTop: false,
    comments: []
  }
  
  faqList.value.unshift(newFaq)
  return newFaq
}

const removeFaq = async (id) => {
  const index = faqList.value.findIndex(item => item.id === id)
  if (index !== -1) {
    faqList.value.splice(index, 1)
  }
}

const updateFaq = async (id, updates) => {
  const index = faqList.value.findIndex(item => item.id === id)
  if (index !== -1) {
    faqList.value[index] = { ...faqList.value[index], ...updates }
    return faqList.value[index]
  }
  return null
}

const toggleTop = async (id) => {
  const index = faqList.value.findIndex(item => item.id === id)
  if (index !== -1) {
    faqList.value[index].isTop = !faqList.value[index].isTop
    faqList.value.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1
      if (!a.isTop && b.isTop) return 1
      return 0
    })
  }
}

const addComment = async (faqId, comment) => {
  const index = faqList.value.findIndex(item => item.id === faqId)
  if (index !== -1) {
    if (!faqList.value[index].comments) {
      faqList.value[index].comments = []
    }
    const newComment = {
      id: Date.now(),
      ...comment,
      time: new Date().toLocaleDateString('zh-CN')
    }
    faqList.value[index].comments.push(newComment)
    return newComment
  }
  return null
}

export const useGitHubData = () => {
  fetchData()
  
  return {
    faqList,
    categories,
    loading,
    fetchData,
    addFaq,
    deleteFaq: removeFaq,
    updateFaq,
    toggleTop,
    addComment
  }
}