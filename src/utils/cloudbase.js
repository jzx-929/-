import tcb from '@cloudbase/js-sdk'

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV || 'faq-cqust-d5gnb5tda6d2a55ee'

let app = null
let authPromise = null

function getApp() {
  if (!app) {
    app = tcb.init({
      env: ENV_ID,
      region: 'ap-shanghai'
    })
  }
  return app
}

async function ensureAuth() {
  if (!authPromise) {
    const cbApp = getApp()
    const auth = cbApp.auth()
    authPromise = auth.signInAnonymously().catch(err => {
      console.error('CloudBase 匿名登录失败:', err)
      authPromise = null
      throw err
    })
  }
  return authPromise
}

/**
 * 上传文件到 CloudBase 云存储
 * @param {File|Blob} file - 文件对象
 * @param {string} fileName - 文件名
 * @param {string} fileType - 文件MIME类型
 * @returns {Promise<{name: string, type: string, fileID: string}>}
 */
export async function uploadFileToCloud(file, fileName, fileType) {
  const cbApp = getApp()
  await ensureAuth()

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const name = fileName || file.name || 'file'
  const ext = name.split('.').pop() || 'bin'
  const cloudPath = `faq-files/${timestamp}-${random}.${ext}`

  const result = await cbApp.uploadFile({
    cloudPath,
    filePath: file
  })

  return {
    name: name,
    type: fileType || file.type || 'application/octet-stream',
    fileID: result.fileID
  }
}

export { getApp, ensureAuth }

/**
 * 批量获取云存储文件的临时下载URL
 * @param {string[]} fileIDs - CloudBase fileID 数组
 * @returns {Promise<Object>} fileID -> tempFileURL 的映射
 */
export async function getTempFileUrls(fileIDs) {
  if (!fileIDs || fileIDs.length === 0) return {}
  const cbApp = getApp()
  await ensureAuth()
  try {
    const result = await cbApp.getTempFileURL({ fileList: fileIDs })
    const urlMap = {}
    for (const item of result.fileList) {
      if (item.tempFileURL) urlMap[item.fileID] = item.tempFileURL
    }
    return urlMap
  } catch (err) {
    console.error('getTempFileURL 失败:', err)
    return {}
  }
}
