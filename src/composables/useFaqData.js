import { computed } from 'vue'
import { useApiData } from './useApiData'

const BAD_WORDS = ['敏感词1', '敏感词2', '敏感词3', '暴力', '色情', '违法', '赌博', '毒品']

const { faqList, categories: githubCategories, addFaq: githubAddFaq, deleteFaq: githubDeleteFaq, batchDelete: githubBatchDelete, updateFaq: githubUpdateFaq, toggleTop: githubToggleTop, addComment: githubAddComment } = useApiData()

const filterBadWords = (text) => {
  if (!text) return text
  let filtered = text
  BAD_WORDS.forEach(word => {
    filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length))
  })
  return filtered
}

const checkContentSafety = (text) => {
  if (!text) return { safe: true, message: '' }
  const lowerText = text.toLowerCase()
  for (const word of BAD_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return { safe: false, message: `内容包含敏感词：${word}` }
    }
  }
  return { safe: true, message: '' }
}

export function useFaqData() {
  const categories = computed(() => {
    return githubCategories.value.length > 0 
      ? githubCategories.value 
      : [
        '入学报到',
        '宿舍生活',
        '军训安排',
        '学习课程',
        '校园活动',
        '校园生活',
        '竞赛科研',
        '招新宣传',
        '其他'
      ]
  })

  const getNextId = () => {
    if (faqList.value.length === 0) return 1
    return Math.max(...faqList.value.map(item => item.id)) + 1
  }

  const getNextCommentId = () => {
    let maxId = 0
    faqList.value.forEach(faq => {
      if (faq.comments) {
        faq.comments.forEach(comment => {
          if (comment.id > maxId) maxId = comment.id
        })
      }
    })
    return maxId + 1
  }

  const addFaq = async (faq) => {
    const safetyResult = checkContentSafety(faq.question + (faq.answer || ''))
    if (!safetyResult.safe) {
      throw new Error(safetyResult.message)
    }

    const newFaq = {
      ...faq,
      id: getNextId(),
      time: new Date().toISOString().split('T')[0],
      comments: [],
      files: faq.files || [],
      isTop: faq.isTop || false,
      isApproved: true
    }
    
    await githubAddFaq(newFaq)
    return faqList.value.find(item => item.question === faq.question) || newFaq
  }

  const updateFaq = async (id, updatedFaq) => {
    const safetyResult = checkContentSafety(updatedFaq.question + (updatedFaq.answer || ''))
    if (!safetyResult.safe) {
      throw new Error(safetyResult.message)
    }

    const index = faqList.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const updated = {
        ...faqList.value[index],
        ...updatedFaq,
        time: new Date().toISOString().split('T')[0],
        files: updatedFaq.files !== undefined ? updatedFaq.files : faqList.value[index].files
      }
      
      const result = await githubUpdateFaq(id, updated)
      return result || updated
    }
    return null
  }

  const deleteFaq = async (id) => {
    const index = faqList.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const deleted = faqList.value[index]
      await githubDeleteFaq(id)
      return deleted
    }
    return null
  }

  const batchDelete = async (ids) => {
    if (!ids || ids.length === 0) return null
    const result = await githubBatchDelete(ids)
    return result
  }

  const toggleTop = async (id) => {
    await githubToggleTop(id)
    return faqList.value.find(item => item.id === id)
  }

  const addComment = async (faqId, comment) => {
    const safetyResult = checkContentSafety(comment.content)
    if (!safetyResult.safe) {
      throw new Error(safetyResult.message)
    }

    const faq = faqList.value.find(item => item.id === faqId)
    if (!faq) return null

    const newComment = {
      id: getNextCommentId(),
      content: filterBadWords(comment.content),
      author: comment.author || '匿名用户',
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      files: comment.files || [],
      isApproved: true
    }

    await githubAddComment(faqId, newComment)
    return newComment
  }

  const deleteComment = (faqId, commentId) => {
    const faq = faqList.value.find(item => item.id === faqId)
    if (!faq || !faq.comments) return null

    const index = faq.comments.findIndex(c => c.id === commentId)
    if (index !== -1) {
      const deleted = faq.comments.splice(index, 1)[0]
      return deleted
    }
    return null
  }

  const getFaqById = (id) => {
    return faqList.value.find(item => item.id === id)
  }

  const exportJson = () => {
    const dataStr = JSON.stringify(faqList.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faq.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getCategoryCount = (category) => {
    if (category === '全部') return faqList.value.length
    return faqList.value.filter(item => item.category === category).length
  }

  const searchFaq = (keyword) => {
    if (!keyword) return faqList.value
    const lowerKeyword = keyword.toLowerCase()
    return faqList.value.filter(item =>
      item.question.toLowerCase().includes(lowerKeyword) ||
      item.answer.toLowerCase().includes(lowerKeyword) ||
      item.category.toLowerCase().includes(lowerKeyword) ||
      item.source.toLowerCase().includes(lowerKeyword)
    )
  }

  const sortFaq = (list, sortBy = 'time') => {
    const sorted = [...list]
    if (sortBy === 'time') {
      return sorted.sort((a, b) => {
        if (a.isTop !== b.isTop) {
          return a.isTop ? -1 : 1
        }
        return new Date(b.time) - new Date(a.time)
      })
    } else if (sortBy === 'comments') {
      return sorted.sort((a, b) => {
        if (a.isTop !== b.isTop) {
          return a.isTop ? -1 : 1
        }
        return (b.comments?.length || 0) - (a.comments?.length || 0)
      })
    }
    return sorted.sort((a, b) => {
      if (a.isTop !== b.isTop) {
        return a.isTop ? -1 : 1
      }
      return a.id - b.id
    })
  }

  const getAllComments = () => {
    const allComments = []
    faqList.value.forEach(faq => {
      if (faq.comments) {
        faq.comments.forEach(comment => {
          allComments.push({
            ...comment,
            faqId: faq.id,
            faqQuestion: faq.question
          })
        })
      }
    })
    return allComments.sort((a, b) => new Date(b.time) - new Date(a.time))
  }

  const faqStats = computed(() => {
    return {
      total: faqList.value.length,
      totalComments: faqList.value.reduce((sum, faq) => sum + (faq.comments?.length || 0), 0),
      categoryStats: categories.value.map(cat => ({
        name: cat,
        count: getCategoryCount(cat)
      }))
    }
  })

  return {
    faqList,
    categories,
    addFaq,
    updateFaq,
    deleteFaq,
    batchDelete,
    toggleTop,
    addComment,
    deleteComment,
    getFaqById,
    exportJson,
    getCategoryCount,
    searchFaq,
    sortFaq,
    getAllComments,
    faqStats,
    checkContentSafety,
    filterBadWords
  }
}