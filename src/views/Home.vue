<template>
  <div class="app-container">
    <section class="hero-banner">
      <div class="banner-content">
        <div class="banner-left">
          <div class="logo-placeholder">
            <span class="logo-text">数智</span>
          </div>
          <div class="banner-title-group">
            <p class="banner-subtitle">重庆文理学院</p>
            <h1 class="banner-title">2026级新生FAQ</h1>
            <p class="banner-desc">新生问答智能指南 · 你的大学生活从这里开始</p>
          </div>
        </div>
        <div class="banner-right">
          <div class="banner-actions">
            <div class="search-wrapper">
              <SearchBar 
                :faq-data="faqList" 
                :active-category="activeCategory"
                @search="handleSearch" 
              />
            </div>
            <div class="header-buttons">
              <el-button 
                class="ask-btn" 
                @click="showAskDialog = true"
                type="primary"
              >
                <el-icon><Message /></el-icon>
                我要提问
              </el-button>
              <el-button 
                class="admin-btn"
                @click="handleAdminClick"
              >
                <el-icon><Setting /></el-icon>
                管理
              </el-button>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ faqList.length }}</span>
              <span class="stat-label">问答总数</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ categories.length }}</span>
              <span class="stat-label">分类数量</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">2026</span>
              <span class="stat-label">新生年度</span>
            </div>
          </div>
        </div>
      </div>
      <div class="banner-motto">
        <span class="motto-line"></span>
        <span class="motto-text">进德修业 · 博文达理</span>
        <span class="motto-line"></span>
      </div>
    </section>

    <main class="app-main">
      <aside class="app-sidebar">
        <div class="sidebar-section">
          <h3 class="section-title">
            <el-icon><Menu /></el-icon>
            问题分类
          </h3>
          <CategoryMenu 
            :active-category="activeCategory" 
            :faq-data="faqList" 
            @select="handleCategorySelect" 
          />
        </div>
        
        <div class="sidebar-section">
          <h3 class="section-title">
            <el-icon><CollectionTag /></el-icon>
            热门标签
          </h3>
          <div class="tag-cloud">
            <el-tag 
              v-for="tag in hotTags" 
              :key="tag" 
              class="hot-tag"
              @click="handleTagSearch(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3 class="section-title">
            <el-icon><Clock /></el-icon>
            最新动态
          </h3>
          <div class="latest-list">
            <div 
              v-for="item in latestFaq" 
              :key="item.id" 
              class="latest-item"
              @click="scrollToFaq(item.id)"
            >
              <el-icon class="latest-icon"><Star /></el-icon>
              <span class="latest-text">{{ item.question.slice(0, 20) }}...</span>
            </div>
          </div>
        </div>
      </aside>

      <section class="app-content">
        <div class="content-header">
          <div class="header-title-group">
            <h3>{{ activeCategory === '全部' ? '全部问答' : activeCategory }}</h3>
            <el-tag type="info" size="small" class="count-tag">{{ filteredCount }} 条</el-tag>
          </div>
          <div class="header-actions-group">
            <el-select 
              v-model="sortBy" 
              placeholder="排序方式" 
              size="small"
              class="sort-select"
            >
              <el-option label="最新发布" value="time" />
              <el-option label="问题排序" value="id" />
            </el-select>
          </div>
        </div>
        
        <FaqList 
          :faq-data="sortedFaqList" 
          :active-category="activeCategory" 
          :search-keyword="searchKeyword" 
        />
      </section>
    </main>

    <el-dialog 
      title="管理员登录" 
      v-model="showLoginDialog" 
      width="min(400px, 92%)"
      :close-on-click-modal="false"
    >
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">
        <el-form-item label="密令" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入管理员密令"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLoginDialog = false">取消</el-button>
        <el-button type="primary" @click="handleLogin">登录</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      title="我要提问" 
      v-model="showAskDialog" 
      width="min(600px, 92%)"
    >
      <el-form :model="askForm" :rules="askRules" ref="askFormRef" label-width="72px" class="ask-form">
        <el-form-item label="问题标题" prop="question">
          <el-input 
            v-model="askForm.question" 
            placeholder="请输入您的问题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="问题分类" prop="category">
          <el-select v-model="askForm.category" placeholder="请选择分类">
            <el-option 
              v-for="cat in categories" 
              :key="cat" 
              :label="cat" 
              :value="cat" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="详细描述" prop="description">
          <el-input 
            v-model="askForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请详细描述您的问题，以便更好地获得帮助"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input 
            v-model="askForm.contact" 
            placeholder="选填，方便他人联系您解答问题（如QQ号、微信号）"
          />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload
            v-model:file-list="askUploadFiles"
            :auto-upload="false"
            :on-change="handleAskUploadChange"
            :on-remove="handleAskRemove"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            :limit="5"
            list-type="picture-card"
          >
            <el-icon><Upload /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                支持图片、PDF、Word等格式，单个文件不超过5MB，最多上传5个文件
              </div>
            </template>
            <template #file="{ file }">
              <div class="upload-file-preview">
                <img
                  v-if="file.raw && file.raw.type && file.raw.type.startsWith('image/')"
                  :src="file.url"
                  class="upload-preview-img"
                />
                <div v-else class="upload-doc-preview">
                  <el-icon class="upload-doc-icon"><Document /></el-icon>
                  <span class="upload-doc-name">{{ file.name }}</span>
                </div>
                <span class="upload-remove-btn" @click.stop="handleAskRemoveFile(file)">
                  <el-icon><Close /></el-icon>
                </span>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAskDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAsk">提交提问</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, CollectionTag, Clock, Star, Message, Setting, Upload, Document, Close } from '@element-plus/icons-vue'
import SearchBar from '../components/SearchBar.vue'
import CategoryMenu from '../components/CategoryMenu.vue'
import FaqList from '../components/FaqList.vue'
import { useFaqData } from '../composables/useFaqData'
import { compressImage, dataURLtoBlob, isImageFile, validateFileSize, uploadFileToCloud } from '../utils/fileUpload'

const router = useRouter()
const { faqList, categories, addFaq } = useFaqData()

const activeCategory = ref('全部')
const searchKeyword = ref('')
const sortBy = ref('time')
const showLoginDialog = ref(false)
const showAskDialog = ref(false)
const loginFormRef = ref(null)
const askFormRef = ref(null)

const loginForm = reactive({
  password: ''
})

const askForm = reactive({
  question: '',
  category: '',
  description: '',
  contact: '',
  files: []
})

const askUploadFiles = ref([])

const loginRules = {
  password: [{ required: true, message: '请输入密令', trigger: 'blur' }]
}

const askRules = {
  question: [{ required: true, message: '请输入问题标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  description: [{ required: true, message: '请详细描述问题', trigger: 'blur' }]
}

const hotTags = [
  '选课', '宿舍', '军训', '课程', '食堂', '图书馆', '转专业', '奖学金'
]

const latestFaq = computed(() => {
  return [...faqList.value]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5)
})

const sortedFaqList = computed(() => {
  const list = [...faqList.value]
  if (sortBy.value === 'time') {
    return list.sort((a, b) => {
      if (a.isTop !== b.isTop) return a.isTop ? -1 : 1
      return new Date(b.time) - new Date(a.time)
    })
  }
  return list.sort((a, b) => {
    if (a.isTop !== b.isTop) return a.isTop ? -1 : 1
    return a.id - b.id
  })
})

const handleCategorySelect = (category) => {
  activeCategory.value = category
}

const handleSearch = (keyword) => {
  searchKeyword.value = keyword
}

const handleTagSearch = (tag) => {
  searchKeyword.value = tag
}

const scrollToFaq = (id) => {
  const element = document.getElementById(`faq-${id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const handleAdminClick = () => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    router.push('/admin')
  } else {
    showLoginDialog.value = true
  }
}

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: loginForm.password })
        })
        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('admin_token', data.token)
          showLoginDialog.value = false
          loginForm.password = ''
          router.push('/admin')
        } else {
          alert('密令错误，请重新输入')
        }
      } catch (error) {
        alert('网络错误，请稍后重试')
      }
    }
  })
}

const handleAskUploadChange = async (file, fileList) => {
  if (!validateFileSize(file.raw, 5)) {
    alert('文件大小不能超过5MB')
    return false
  }
  
  try {
    let fileData
    if (isImageFile(file.raw)) {
      const compressedUrl = await compressImage(file.raw)
      const blob = dataURLtoBlob(compressedUrl)
      fileData = await uploadFileToCloud(blob, file.raw.name, file.raw.type)
    } else {
      fileData = await uploadFileToCloud(file.raw)
    }
    
    askForm.files.push(fileData)
    askUploadFiles.value = fileList
  } catch (error) {
    console.error('文件上传失败:', error)
    alert('文件上传失败，请重试')
  }
}

const handleAskRemove = (file, fileList) => {
  const index = askForm.files.findIndex(f => f.name === file.name)
  if (index !== -1) {
    askForm.files.splice(index, 1)
  }
  askUploadFiles.value = fileList
}

const handleAskRemoveFile = (file) => {
  const index = askUploadFiles.value.findIndex(f => f.uid === file.uid || f.name === file.name)
  if (index !== -1) {
    askUploadFiles.value.splice(index, 1)
  }
  const formIndex = askForm.files.findIndex(f => f.name === file.name)
  if (formIndex !== -1) {
    askForm.files.splice(formIndex, 1)
  }
}

const handleAsk = async () => {
  askFormRef.value.validate(async (valid) => {
    if (valid) {
      await addFaq({
        question: askForm.question,
        answer: askForm.description + (askForm.contact ? `\n\n联系方式：${askForm.contact}` : ''),
        category: askForm.category,
        source: '用户提问',
        files: [...askForm.files]
      })
      showAskDialog.value = false
      askForm.question = ''
      askForm.category = ''
      askForm.description = ''
      askForm.contact = ''
      askForm.files = []
      askUploadFiles.value = []
      alert('提问成功！管理员将尽快为您解答。')
    }
  })
}

const handleShowLoginDialog = () => {
  showLoginDialog.value = true
}

onMounted(() => {
  window.addEventListener('showLoginDialog', handleShowLoginDialog)
})

onUnmounted(() => {
  window.removeEventListener('showLoginDialog', handleShowLoginDialog)
})

const filteredCount = computed(() => {
  let count = faqList.value.length
  
  if (activeCategory.value !== '全部') {
    count = faqList.value.filter(item => item.category === activeCategory.value).length
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    const filtered = faqList.value.filter(item => {
      const matchesCategory = activeCategory.value === '全部' || item.category === activeCategory.value
      const matchesSearch = item.question.toLowerCase().includes(keyword) ||
                           item.answer.toLowerCase().includes(keyword) ||
                           item.category.toLowerCase().includes(keyword) ||
                           item.source.toLowerCase().includes(keyword)
      return matchesCategory && matchesSearch
    })
    count = filtered.length
  }
  
  return count
})
</script>

<style scoped>
.upload-file-preview {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.upload-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-doc-preview {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
}

.upload-doc-icon {
  font-size: 28px;
  color: #409EFF;
}

.upload-doc-name {
  font-size: 11px;
  color: #606266;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
  max-height: 28px;
  overflow: hidden;
}

.upload-remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
  transition: background 0.2s;
}

.upload-remove-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  max-width: 100vw;
}

.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #0f2c5c 0%, #1e4d8c 35%, #2563eb 70%, #3b82f6 100%);
  color: #fff;
  padding: 48px 40px 36px;
  box-shadow: 0 8px 32px rgba(15, 44, 92, 0.25);
}

.banner-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  width: 100%;
  min-width: 0;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* ===== Logo Placeholder ===== */
.logo-placeholder {
  position: relative;
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  border: 2px solid rgba(147, 197, 253, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(147,197,253,0.12) 100%);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.banner-title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.banner-subtitle {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.85;
  margin: 0;
  letter-spacing: 2px;
}

.banner-title {
  font-size: 38px;
  font-weight: 800;
  margin: 0;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #fff 0%, #93c5fd 60%, #c7d2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.banner-desc {
  font-size: 13px;
  opacity: 0.75;
  margin: 2px 0 0 0;
  letter-spacing: 1px;
}

.banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 20px;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-wrapper {
  flex-shrink: 0;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.ask-btn {
  border-radius: 22px;
  padding: 10px 22px;
  font-weight: 600;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
}

.ask-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.admin-btn {
  border-radius: 22px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.admin-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
}

/* ===== Motto ===== */
.banner-motto {
  position: absolute;
  top: 24px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.motto-line {
  width: 20px;
  height: 1px;
  background: rgba(255, 255, 255, 0.4);
}

.motto-text {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 3px;
  opacity: 0.7;
  font-family: 'KaiTi', 'STKaiti', serif;
}

/* ===== Main Layout ===== */
.app-main {
  flex: 1;
  display: flex;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 40px;
  gap: 24px;
  overflow-x: hidden;
}

.app-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(15, 44, 92, 0.06);
  transition: box-shadow 0.3s ease;
}

.sidebar-section:hover {
  box-shadow: 0 4px 20px rgba(15, 44, 92, 0.1);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f2c5c;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e7ff;
}

.section-title :deep(.el-icon) {
  color: #2563eb;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.hot-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.latest-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.latest-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.latest-item:hover {
  background: #eff6ff;
  transform: translateX(4px);
}

.latest-icon {
  color: #f59e0b;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.latest-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.app-content {
  flex: 1;
  min-width: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 44, 92, 0.04);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title-group h3 {
  font-size: 20px;
  font-weight: 700;
  color: #0f2c5c;
  margin: 0;
}

.count-tag {
  font-size: 12px;
}

.sort-select {
  width: 120px;
}

/* ===== Responsive ===== */
@media screen and (max-width: 1024px) {
  .hero-banner {
    padding: 32px 20px 24px;
  }
  
  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }
  
  .banner-right {
    align-items: flex-start;
    width: 100%;
  }
  
  .banner-actions {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .search-wrapper {
    flex: 1;
    min-width: 240px;
  }
  
  .app-main {
    flex-direction: column;
    padding: 20px;
  }
  
  .app-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .sidebar-section {
    flex: 1;
    min-width: 200px;
  }
  
  .banner-motto {
    position: static;
    margin-top: 16px;
    justify-content: center;
  }
}

@media screen and (max-width: 768px) {
  .hero-banner {
    padding: 20px 14px 16px;
  }
  
  .banner-content {
    gap: 16px;
  }
  
  .banner-left {
    flex-direction: row;
    text-align: left;
    gap: 14px;
    align-items: center;
  }
  
  .logo-placeholder {
    width: 52px;
    height: 52px;
  }
  
  .logo-text {
    font-size: 13px;
  }
  
  .banner-title {
    font-size: 22px;
    letter-spacing: 1px;
  }
  
  .banner-subtitle {
    font-size: 11px;
    letter-spacing: 1px;
  }
  
  .banner-desc {
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  
  .banner-right {
    width: 100%;
    align-items: stretch;
    gap: 14px;
  }
  
  .banner-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-wrapper {
    width: 100%;
  }
  
  .header-buttons {
    justify-content: stretch;
    gap: 8px;
  }
  
  .ask-btn, .admin-btn {
    flex: 1;
    padding: 9px 12px;
    font-size: 13px;
  }
  
  .header-stats {
    gap: 10px;
    padding: 8px 12px;
    justify-content: space-around;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .stat-label {
    font-size: 10px;
  }
  
  .stat-divider {
    height: 22px;
  }
  
  .banner-motto {
    display: none;
  }
  
  .app-main {
    padding: 10px;
    gap: 10px;
  }
  
  .app-sidebar {
    flex-direction: column;
    order: 2;
    gap: 10px;
  }
  
  .app-content {
    order: 1;
  }
  
  .sidebar-section {
    padding: 12px;
  }
  
  .sidebar-section:last-child {
    display: none;
  }
  
  .section-title {
    font-size: 13px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }
  
  .content-header {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 12px 14px;
  }
  
  .header-title-group h3 {
    font-size: 16px;
  }
  
  .sort-select {
    width: 100px;
  }
  
  .tag-cloud {
    gap: 6px;
  }
  
  .hot-tag {
    font-size: 12px;
  }
}

@media screen and (max-width: 480px) {
  .hero-banner {
    padding: 16px 12px 14px;
  }
  
  .banner-left {
    gap: 10px;
  }
  
  .logo-placeholder {
    width: 44px;
    height: 44px;
  }
  
  .logo-text {
    font-size: 12px;
  }
  
  .banner-title {
    font-size: 18px;
  }
  
  .banner-subtitle {
    font-size: 10px;
  }
  
  .banner-desc {
    display: none;
  }
  
  .header-stats {
    padding: 6px 8px;
    gap: 6px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  .stat-label {
    font-size: 9px;
  }
  
  .stat-divider {
    height: 18px;
  }
  
  .app-main {
    padding: 8px;
    gap: 8px;
  }
  
  .content-header {
    padding: 10px 12px;
  }
  
  .header-title-group h3 {
    font-size: 15px;
  }
  
  .ask-form :deep(.el-form-item__label) {
    font-size: 13px;
  }
  
  .ask-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>