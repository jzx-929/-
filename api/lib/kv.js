import { kv } from '@vercel/kv'

const FAQ_KEY = 'faq:data'

const DEFAULT_CATEGORIES = [
  '入学报到', '宿舍生活', '军训安排', '学习课程',
  '校园活动', '校园生活', '竞赛科研', '招新宣传', '其他'
]

export async function getFaqData() {
  const data = await kv.get(FAQ_KEY)
  if (data) {
    return typeof data === 'string' ? JSON.parse(data) : data
  }
  return { faqList: [], categories: DEFAULT_CATEGORIES }
}

export async function saveFaqData(data) {
  await kv.set(FAQ_KEY, JSON.stringify(data))
}

export async function initFaqData(initialData) {
  const existing = await kv.get(FAQ_KEY)
  if (!existing) {
    await kv.set(FAQ_KEY, JSON.stringify(initialData))
    return true
  }
  return false
}
