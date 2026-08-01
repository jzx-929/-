const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
})

const FAQ_KEY = 'faq:data'

const DEFAULT_CATEGORIES = [
  '入学报到', '宿舍生活', '军训安排', '学习课程',
  '校园活动', '校园生活', '竞赛科研', '招新宣传', '其他'
]

async function getFaqData() {
  try {
    const data = await redis.get(FAQ_KEY)
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data
    }
  } catch (e) {
    console.error('Redis get error:', e.message)
  }
  return { faqList: [], categories: DEFAULT_CATEGORIES }
}

async function saveFaqData(data) {
  try {
    await redis.set(FAQ_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Redis set error:', e.message)
    return false
  }
}

function reindexIds(data) {
  if (data.faqList && Array.isArray(data.faqList)) {
    data.faqList.forEach((item, index) => {
      item.id = index + 1
    })
  }
  return data
}

async function initFaqData(initialData) {
  try {
    const existing = await redis.get(FAQ_KEY)
    if (!existing) {
      await redis.set(FAQ_KEY, JSON.stringify(initialData))
      return true
    }
  } catch (e) {
    console.error('Redis init error:', e.message)
  }
  return false
}

module.exports = {
  getFaqData,
  saveFaqData,
  reindexIds,
  initFaqData,
  DEFAULT_CATEGORIES
}
