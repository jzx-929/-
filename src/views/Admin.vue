<template>
  <div class="admin-container">
    <header class="admin-header">
      <div class="header-content">
        <div class="header-brand">
          <el-icon class="brand-icon"><Setting /></el-icon>
          <h1>FAQ管理系统</h1>
        </div>
        <div class="header-actions">
          <router-link to="/" class="home-link">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </router-link>
          <el-button class="logout-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </header>

    <main class="admin-main">
      <aside class="admin-sidebar">
        <div class="sidebar-section">
          <h3 class="section-title">
            <el-icon><Grid /></el-icon>
            管理操作
          </h3>
          <el-button 
            type="primary" 
            class="action-btn add-btn" 
            @click="showAddDialog = true"
          >
            <el-icon><Plus /></el-icon>
            添加FAQ
          </el-button>
          <el-button 
            type="success" 
            class="action-btn export-btn" 
            @click="handleExport"
          >
            <el-icon><Download /></el-icon>
            导出JSON
          </el-button>
        </div>
        
        <div class="sidebar-section">
          <h3 class="section-title">
            <el-icon><DataAnalysis /></el-icon>
            数据统计
          </h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ faqList.length }}</span>
              <span class="stat-label">总问答数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ categories.length }}</span>
              <span class="stat-label">分类数</span>
            </div>
          </div>
        </div>
      </aside>

      <section class="admin-content">
        <div class="content-header">
          <div class="header-top">
            <h2>问答列表</h2>
            <div class="header-actions">
              <el-button 
                type="primary" 
                size="small" 
                class="select-all-btn"
                @click="handleSelectAll"
              >
                <el-icon><Check /></el-icon>
                {{ isAllSelected ? '取消全选' : '全选' }}
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                class="batch-delete-btn"
                :disabled="selectedIds.length === 0"
                @click="handleBatchDelete"
              >
                <el-icon><Delete /></el-icon>
                批量删除 ({{ selectedIds.length }})
              </el-button>
            </div>
          </div>
          <div class="search-bar">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索问题或答案..." 
              size="large"
              class="search-input"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="search-bar-right">
              <el-select 
                v-model="filterCategory" 
                placeholder="选择分类" 
                clearable
                class="category-select"
                size="large"
              >
                <el-option label="全部" value="" />
                <el-option 
                  v-for="cat in categories" 
                  :key="cat" 
                  :label="cat" 
                  :value="cat" 
                />
              </el-select>
              <el-select 
                v-model="sortBy" 
                placeholder="排序方式" 
                class="sort-select"
                size="large"
              >
                <el-option label="最新发布" value="newest" />
                <el-option label="最早发布" value="oldest" />
                <el-option label="ID升序" value="id-asc" />
                <el-option label="ID降序" value="id-desc" />
              </el-select>
            </div>
          </div>
        </div>

        <el-table 
          :data="paginatedList" 
          border 
          class="faq-table"
          v-loading="loading"
          :row-class-name="tableRowClassName"
          @selection-change="handleSelectionChange"
          :row-key="(row) => row.id"
          :reserve-selection="true"
          ref="tableRef"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column prop="isTop" label="置顶" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
              <span v-else class="no-top">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="110">
            <template #default="{ row }">
              <el-tag :type="getTagType(row.category)" size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="question" label="问题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="answer" label="答案" min-width="300" show-overflow-tooltip />
          <el-table-column prop="source" label="来源" width="120" />
          <el-table-column prop="time" label="更新时间" width="140" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button 
                :type="row.isTop ? 'warning' : 'success'" 
                size="small" 
                class="top-btn"
                @click="handleTop(row)"
              >
                <el-icon><Top /></el-icon>
                {{ row.isTop ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                class="edit-btn"
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                class="delete-btn"
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination 
          v-model:current-page="currentPage" 
          v-model:page-size="pageSize"
          :total="filteredFaqList.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          class="pagination"
          background
        />
      </section>
    </main>

    <el-dialog 
      :title="editForm.id ? '编辑FAQ' : '添加FAQ'" 
      v-model="showDialog" 
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="问题" prop="question">
          <el-input 
            v-model="editForm.question" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入问题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="答案" prop="answer">
          <el-input 
            v-model="editForm.answer" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入答案"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择分类">
            <el-option 
              v-for="cat in categories" 
              :key="cat" 
              :label="cat" 
              :value="cat" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源" prop="source">
          <el-input 
            v-model="editForm.source" 
            placeholder="请输入来源（如：QQ群整理、管理员添加）"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            v-model:file-list="editUploadFiles"
            :auto-upload="false"
            :on-change="handleEditUploadChange"
            :on-remove="handleEditRemove"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            :limit="5"
            list-type="picture-card"
          >
            <el-icon><Upload /></el-icon>
            <template #tip>
              <div class="el-upload__tip">支持图片、PDF、Word等格式，单个文件不超过5MB，最多上传5个文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      title="确认删除" 
      v-model="showDeleteDialog" 
      width="350px"
      :close-on-click-modal="false"
    >
      <div class="delete-confirm">
        <el-icon class="delete-icon"><Warning /></el-icon>
        <p>确定要删除这条FAQ吗？</p>
        <p class="delete-hint">此操作不可恢复，请谨慎操作。</p>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      title="批量删除确认" 
      v-model="showBatchDeleteDialog" 
      width="350px"
      :close-on-click-modal="false"
    >
      <div class="delete-confirm">
        <el-icon class="delete-icon"><Warning /></el-icon>
        <p>确定要删除选中的 {{ selectedIds.length }} 条FAQ吗？</p>
        <p class="delete-hint">此操作不可恢复，请谨慎操作。</p>
      </div>
      <template #footer>
        <el-button @click="showBatchDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmBatchDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  Setting, HomeFilled, Grid, DataAnalysis, Plus, Download,
  Edit, Delete, SwitchButton, Search, Warning, Upload, Picture, Files, Top, Check
} from '@element-plus/icons-vue'
import { useFaqData } from '../composables/useFaqData'
import { compressImage, fileToBase64, isImageFile, validateFileSize } from '../utils/fileUpload'

const router = useRouter()
const { faqList, categories, addFaq, updateFaq, deleteFaq, toggleTop, exportJson } = useFaqData()

const loading = ref(false)
const searchKeyword = ref('')
const filterCategory = ref('')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(20)
const showAddDialog = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const formRef = ref(null)
const tableRef = ref(null)
const deleteItem = ref(null)
const selectedIds = ref([])

const editForm = reactive({
  id: null,
  question: '',
  answer: '',
  category: '',
  source: '',
  files: []
})

const editUploadFiles = ref([])

const formRules = {
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }]
}

const tagTypes = {
  '入学报到': 'primary',
  '宿舍生活': 'success',
  '军训安排': 'warning',
  '学习课程': 'info',
  '校园活动': 'danger',
  '校园生活': '',
  '竞赛科研': 'warning',
  '招新宣传': 'danger',
  '其他': ''
}

const getTagType = (category) => {
  return tagTypes[category] || ''
}

const isAllSelected = computed(() => {
  return selectedIds.value.length === filteredFaqList.value.length && filteredFaqList.value.length > 0
})

const handleSelectAll = () => {
  if (!tableRef.value) return
  if (isAllSelected.value) {
    tableRef.value.clearSelection()
  } else {
    tableRef.value.toggleAllSelection()
  }
}

const filteredFaqList = computed(() => {
  let list = [...faqList.value]
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => 
      item.question.toLowerCase().includes(keyword) ||
      item.answer.toLowerCase().includes(keyword)
    )
  }
  
  if (filterCategory.value) {
    list = list.filter(item => item.category === filterCategory.value)
  }
  
  switch (sortBy.value) {
    case 'newest':
      list.sort((a, b) => new Date(b.time) - new Date(a.time))
      break
    case 'oldest':
      list.sort((a, b) => new Date(a.time) - new Date(b.time))
      break
    case 'id-asc':
      list.sort((a, b) => a.id - b.id)
      break
    case 'id-desc':
      list.sort((a, b) => b.id - a.id)
      break
  }
  
  return list
})

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFaqList.value.slice(start, end)
})

const tableRowClassName = ({ row, rowIndex }) => {
  if (rowIndex % 2 === 0) {
    return 'row-even'
  }
  return 'row-odd'
}

const handleEdit = (row) => {
  editForm.id = row.id
  editForm.question = row.question
  editForm.answer = row.answer
  editForm.category = row.category
  editForm.source = row.source
  editForm.files = row.files ? [...row.files] : []
  editUploadFiles.value = row.files ? row.files.map(f => ({
    name: f.name,
    url: f.url,
    type: f.type,
    status: 'success'
  })) : []
  showDialog.value = true
}

const handleEditUploadChange = async (file, fileList) => {
  if (!validateFileSize(file.raw, 5)) {
    alert('文件大小不能超过5MB')
    return false
  }
  
  try {
    let fileData
    if (isImageFile(file.raw)) {
      fileData = await compressImage(file.raw)
    } else {
      fileData = await fileToBase64(file.raw)
    }
    
    editForm.files.push({
      name: file.raw.name,
      type: file.raw.type,
      url: fileData
    })
    editUploadFiles.value = fileList
  } catch (error) {
    console.error('文件处理失败:', error)
    alert('文件处理失败，请重试')
  }
}

const handleEditRemove = (file, fileList) => {
  const index = editForm.files.findIndex(f => f.name === file.name)
  if (index !== -1) {
    editForm.files.splice(index, 1)
  }
  editUploadFiles.value = fileList
}

const handleSave = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      if (editForm.id) {
        await updateFaq(editForm.id, {
          question: editForm.question,
          answer: editForm.answer,
          category: editForm.category,
          source: editForm.source,
          files: [...editForm.files]
        })
      } else {
        await addFaq({
          question: editForm.question,
          answer: editForm.answer,
          category: editForm.category,
          source: editForm.source,
          files: [...editForm.files]
        })
      }
      showDialog.value = false
      resetForm()
    }
  })
}

const handleDelete = (row) => {
  deleteItem.value = row
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (deleteItem.value) {
    await deleteFaq(deleteItem.value.id)
    showDeleteDialog.value = false
    deleteItem.value = null
  }
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const handleBatchDelete = () => {
  if (selectedIds.value.length > 0) {
    showBatchDeleteDialog.value = true
  }
}

const confirmBatchDelete = async () => {
  for (const id of selectedIds.value) {
    await deleteFaq(id)
  }
  showBatchDeleteDialog.value = false
  selectedIds.value = []
}

const handleTop = async (row) => {
  await toggleTop(row.id)
}

const handleExport = () => {
  exportJson()
}

const resetForm = () => {
  editForm.id = null
  editForm.question = ''
  editForm.answer = ''
  editForm.category = ''
  editForm.source = ''
  editForm.files = []
  editUploadFiles.value = []
}

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  router.push('/')
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.admin-header {
  background: linear-gradient(135deg, #409EFF 0%, #667EEA 100%);
  color: #fff;
  padding: 20px 40px;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.25);
  position: relative;
}

.admin-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 50%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  font-size: 28px;
}

.header-brand h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s;
}

.home-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.logout-btn {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  transition: all 0.25s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.admin-main {
  flex: 1;
  display: flex;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
}

.admin-sidebar {
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.action-btn {
  width: 100%;
  margin-bottom: 10px;
  border-radius: 10px;
  font-weight: 500;
  padding: 12px;
  font-size: 14px;
}

.stats-grid {
  display: flex;
  gap: 16px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.admin-content {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.content-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.select-all-btn {
  border-radius: 6px;
}

.batch-delete-btn {
  border-radius: 6px;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.search-bar-right {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.category-select {
  width: 150px;
}

.sort-select {
  width: 130px;
}

.faq-table {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.faq-table :deep(.row-even) {
  background: #fff;
}

.faq-table :deep(.row-odd) {
  background: #fafafa;
}

.faq-table :deep(.el-table__body tr:hover > td) {
  background: #ecf5ff;
}

.top-btn {
  border-radius: 6px;
  margin-right: 6px;
}

.edit-btn {
  border-radius: 6px;
  margin-right: 6px;
}

.delete-btn {
  border-radius: 6px;
}

.no-top {
  color: #c0c4cc;
  font-size: 12px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.delete-confirm {
  text-align: center;
  padding: 20px 0;
}

.delete-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 16px;
}

.delete-confirm p {
  font-size: 16px;
  color: #303133;
  margin: 0 0 8px 0;
}

.delete-hint {
  font-size: 13px;
  color: #909399;
}

@media screen and (max-width: 1024px) {
  .admin-main {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .sidebar-section {
    flex: 1;
    min-width: 200px;
  }
}

@media screen and (max-width: 768px) {
  .admin-header {
    padding: 15px;
  }
  
  .header-brand h1 {
    font-size: 18px;
  }
  
  .admin-main {
    padding: 12px;
    gap: 12px;
  }
  
  .admin-content {
    padding: 16px;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-input {
    max-width: 100%;
  }
  
  .category-select {
    width: 100%;
  }
  
  .sidebar-section {
    padding: 12px;
  }
}
</style>