const fs = require('fs')
const https = require('https')

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'jzx-929/CampusFAQ'
const GITHUB_BRANCH = 'master'
const GITHUB_FILE = 'src/data/faqData.json'

const faqData = require('../src/data/faq.json')
const categories = ['入学报到', '宿舍生活', '军训安排', '学习课程', '校园活动', '校园生活', '竞赛科研', '招新宣传', '其他']

const dataToUpload = {
  faqList: faqData.map(item => ({
    ...item,
    comments: [],
    files: [],
    isTop: false,
    isApproved: true
  })),
  categories: categories
}

const content = Buffer.from(JSON.stringify(dataToUpload, null, 2)).toString('base64')

function checkFileExists(callback) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`,
    method: 'GET',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CampusFAQ'
    }
  }

  const req = https.request(options, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      if (res.statusCode === 200) {
        const existing = JSON.parse(data)
        callback(null, existing.sha)
      } else if (res.statusCode === 404) {
        callback(null, null)
      } else {
        callback(new Error(`Check failed: ${res.statusCode} - ${data}`), null)
      }
    })
  })

  req.on('error', callback)
  req.end()
}

function uploadFile(sha) {
  const body = {
    message: 'feat: initialize FAQ data from local file',
    content: content,
    branch: GITHUB_BRANCH
  }
  
  if (sha) {
    body.sha = sha
  }

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CampusFAQ'
    }
  }

  const req = https.request(options, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ 数据上传成功！')
        const result = JSON.parse(data)
        console.log('Commit:', result.commit.html_url)
      } else {
        console.error('❌ 上传失败:', res.statusCode)
        console.error('Response:', data)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ 请求错误:', error)
  })

  req.write(JSON.stringify(body))
  req.end()
}

checkFileExists((err, sha) => {
  if (err) {
    console.error('❌ 检查文件失败:', err)
    return
  }
  console.log('文件sha:', sha ? sha : '新文件')
  uploadFile(sha)
})