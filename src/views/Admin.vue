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
            <div class="stat-item" :class="{ 'report-pending': pendingReportCount > 0 }">
              <span class="stat-value">{{ pendingReportCount }}</span>
              <span class="stat-label">待处理举报</span>
            </div>
          </div>
        </div>
      </aside>

      <section class="admin-content">
        <!-- 举报告警横幅 -->
        <transition name="banner-slide">
          <div v-if="pendingReportCount > 0" class="report-banner">
            <div class="banner-left">
              <el-icon class="banner-icon"><Warning /></el-icon>
              <span class="banner-text">
                有 <strong>{{ pendingReportCount }}</strong> 条问答待处理举报，请及时审核！
              </span>
            </div>
            <el-button
              type="danger"
              size="small"
              round
              class="banner-btn"
              @click="showOnlyReported = !showOnlyReported"
            >
              {{ showOnlyReported ? '显示全部' : '只看举报' }}
            </el-button>
          </div>
        </transition>

        <div class="content-header">
          <div class="header-top">
            <h2>问答列表</h2>
            <div class="header-actions">
              <el-button
                :type="showOnlyReported ? 'danger' : 'primary'"
                size="small"
                class="select-all-btn"
                @click="showOnlyReported = !showOnlyReported"
              >
                <el-icon><Warning /></el-icon>
                {{ showOnlyReported ? '显示全部' : '只看举报' }}
                <span v-if="pendingReportCount > 0" class="btn-badge">{{ pendingReportCount }}</span>
              </el-button>
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

        <!-- 移动端卡片列表 -->
        <div v-if="isMobile" class="mobile-faq-list" v-loading="loading">
          <div v-if="paginatedList.length === 0" class="mobile-empty">
            <el-empty description="暂无数据" />
          </div>
          <div
            v-for="row in paginatedList"
            :key="row.id"
            class="mobile-faq-card"
            :class="{ 'is-top': row.isTop, 'has-report': getPendingReports(row).length > 0 }"
          >
            <div class="mobile-card-top">
              <div class="mobile-card-tags">
                <el-checkbox
                  :model-value="selectedIds.includes(row.id)"
                  @change="toggleMobileSelect(row.id)"
                  size="small"
                />
                <span class="mobile-id">#{{ row.id }}</span>
                <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
                <el-tag :type="getTagType(row.category)" size="small">{{ row.category }}</el-tag>
                <el-tag
                  v-if="getPendingReports(row).length > 0"
                  type="danger"
                  size="small"
                  effect="dark"
                  class="report-flag"
                  @click.stop="handleViewReport(row)"
                >
                  举报 {{ getPendingReports(row).length }}
                </el-tag>
              </div>
            </div>
            <div class="mobile-card-question" @click="handleEdit(row)">
              <span class="mobile-q-label">问：</span>
              <span class="mobile-q-text">{{ row.question }}</span>
            </div>
            <div class="mobile-card-answer">
              <span class="mobile-a-label">答：</span>
              <span class="mobile-a-text">{{ row.answer }}</span>
            </div>
            <div class="mobile-card-actions">
              <el-button
                :type="row.isTop ? 'warning' : 'success'"
                size="small"
                @click="handleTop(row)"
              >
                <el-icon><Top /></el-icon>
                {{ row.isTop ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="handleManageComments(row)"
              >
                <el-icon><ChatDotRound /></el-icon>
                回答{{ row.comments?.length ? `(${row.comments.length})` : '' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 桌面端表格 -->
        <el-table
          v-else
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
          <el-table-column type="selection" width="50" align="center" :resizable="false" />
          <el-table-column prop="id" label="ID" width="65" align="center" :resizable="false" />
          <el-table-column prop="isTop" label="置顶" width="65" align="center" :resizable="false">
            <template #default="{ row }">
              <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
              <span v-else class="no-top">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="100" :resizable="false">
            <template #default="{ row }">
              <el-tag :type="getTagType(row.category)" size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="question" label="问题" min-width="260">
            <template #default="{ row }">
              <el-tooltip
                :content="row.question"
                placement="top"
                :show-after="200"
                :hide-after="0"
                popper-class="faq-tooltip"
                :disabled="!row.question"
              >
                <div class="cell-text">{{ row.question }}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="answer" label="答案" min-width="360">
            <template #default="{ row }">
              <el-tooltip
                :content="row.answer"
                placement="top"
                :show-after="200"
                :hide-after="0"
                popper-class="faq-tooltip"
                :disabled="!row.answer"
              >
                <div class="cell-text">{{ row.answer }}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="来源" width="110" v-if="!isMobile && !showOnlyReported" show-overflow-tooltip />
          <el-table-column prop="time" label="更新时间" width="120" v-if="!isMobile && !showOnlyReported" :resizable="false" />
          <el-table-column label="举报" width="220" align="center" :resizable="false" fixed="right">
            <template #default="{ row }">
              <div v-if="getPendingReports(row).length > 0" class="report-cell-wrapper">
                <div class="report-cell-info" @click="handleViewReport(row)">
                  <span class="report-pulse"></span>
                  <el-tag type="danger" size="small" effect="dark" class="report-tag">
                    <el-icon class="report-icon"><Warning /></el-icon>
                    待处理 {{ getPendingReports(row).length }}
                  </el-tag>
                </div>
                <div class="report-cell-actions">
                  <el-button
                    type="warning"
                    size="small"
                    plain
                    class="report-action-btn"
                    @click.stop="handleQuickResolve(row, 'ignore')"
                    :loading="quickResolvingId === row.id"
                  >
                    忽略
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    class="report-action-btn"
                    @click.stop="handleQuickResolve(row, 'delete')"
                    :loading="quickResolvingId === row.id"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              <span v-else class="no-top">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right" :resizable="false">
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
              <el-button 
                type="info" 
                size="small" 
                class="comment-btn"
                @click="handleManageComments(row)"
              >
                <el-icon><ChatDotRound /></el-icon>
                回答{{ row.comments?.length ? `(${row.comments.length})` : '' }}
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
      width="min(650px, 92%)"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="formRules" ref="formRef" label-width="72px" class="edit-form">
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
                <span class="upload-remove-btn" @click.stop="handleEditRemoveFile(file)">
                  <el-icon><Close /></el-icon>
                </span>
              </div>
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
      width="min(350px, 90%)"
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
      width="min(350px, 90%)"
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

    <el-dialog
      title="举报详情"
      v-model="showReportDetailDialog"
      width="min(520px, 92%)"
      :close-on-click-modal="false"
    >
      <div v-if="reportDetailItem" class="report-detail">
        <div class="report-faq-info">
          <div class="report-faq-question">
            <span class="report-label">问题：</span>
            <span>{{ reportDetailItem.question }}</span>
          </div>
          <div class="report-faq-answer">
            <span class="report-label">答案：</span>
            <span>{{ reportDetailItem.answer }}</span>
          </div>
        </div>
        <el-divider />
        <div class="report-list-section">
          <h4>举报记录</h4>
          <div
            v-for="report in getPendingReports(reportDetailItem)"
            :key="report.id"
            class="report-record"
          >
            <div class="report-record-header">
              <el-tag type="danger" size="small">待处理</el-tag>
              <span class="report-time">{{ report.time }}</span>
            </div>
            <p class="report-reason">{{ report.reason }}</p>
          </div>
          <div
            v-if="reportDetailItem.reports && reportDetailItem.reports.filter(r => r.status === 'resolved').length > 0"
            class="report-resolved-note"
          >
            <el-tag type="info" size="small">已处理举报 {{ reportDetailItem.reports.filter(r => r.status === 'resolved').length }} 条</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="report-actions">
          <el-button @click="showReportDetailDialog = false">关闭</el-button>
          <el-button
            type="warning"
            @click="handleResolveReport('ignore')"
            :loading="reportResolving"
          >
            忽略举报
          </el-button>
          <el-button
            type="danger"
            @click="handleResolveReport('delete')"
            :loading="reportResolving"
          >
            删除该FAQ
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      title="管理回答"
      v-model="showCommentsDialog"
      width="min(700px, 92%)"
      :close-on-click-modal="false"
    >
      <div v-if="commentManageItem" class="comments-manage">
        <div class="comments-manage-question">
          <span class="comments-question-label">问题：</span>
          <span class="comments-question-text">{{ commentManageItem.question }}</span>
        </div>
        <el-divider />
        <div v-if="commentManageItem.comments && commentManageItem.comments.length > 0">
          <div class="comments-manage-toolbar">
            <el-checkbox
              :model-value="isAllCommentsSelected"
              @change="toggleAllComments"
            >
              全选
            </el-checkbox>
            <el-button
              v-if="selectedCommentIds.length > 0"
              type="danger"
              size="small"
              @click="handleBatchDeleteComments"
              :loading="commentDeleting"
            >
              <el-icon><Delete /></el-icon>
              删除选中 ({{ selectedCommentIds.length }})
            </el-button>
            <span class="comments-count-text">共 {{ commentManageItem.comments.length }} 条回答</span>
          </div>
          <div class="comments-manage-list">
            <div
              v-for="comment in commentManageItem.comments"
              :key="comment.id"
              class="comment-manage-item"
              :class="{ 'is-selected': selectedCommentIds.includes(comment.id) }"
            >
              <el-checkbox
                :model-value="selectedCommentIds.includes(comment.id)"
                @change="toggleCommentSelect(comment.id)"
                class="comment-checkbox"
              />
              <div class="comment-manage-body">
                <div class="comment-manage-meta">
                  <span class="comment-manage-author">{{ comment.author }}</span>
                  <span class="comment-manage-time">{{ comment.time }}</span>
                </div>
                <p class="comment-manage-text">{{ comment.content }}</p>
                <div v-if="comment.files && comment.files.length > 0" class="comment-manage-files">
                  <el-tag v-for="(file, idx) in comment.files" :key="idx" size="small" type="info">
                    <el-icon><Document /></el-icon>
                    {{ file.name }}
                  </el-tag>
                </div>
              </div>
              <el-button
                type="danger"
                size="small"
                plain
                circle
                @click="handleDeleteSingleComment(comment.id)"
                :loading="commentDeleting"
                class="comment-delete-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="该问题暂无回答" />
      </div>
      <template #footer>
        <el-button @click="showCommentsDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Setting, HomeFilled, Grid, DataAnalysis, Plus, Download,
  Edit, Delete, SwitchButton, Search, Warning, Upload, Top, Check, Document, Close, ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFaqData } from '../composables/useFaqData'
import { compressImage, dataURLtoBlob, isImageFile, validateFileSize, uploadFileToCloud } from '../utils/fileUpload'

const router = useRouter()
const { faqList, categories, addFaq, updateFaq, deleteFaq, batchDelete, toggleTop, exportJson, resolveReport, deleteComment } = useFaqData()

const loading = ref(false)
const isMobile = ref(window.innerWidth <= 768)
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
const showReportDetailDialog = ref(false)
const reportDetailItem = ref(null)
const reportResolving = ref(false)
const showOnlyReported = ref(false)
const quickResolvingId = ref(null)
const showCommentsDialog = ref(false)
const commentManageItem = ref(null)
const selectedCommentIds = ref([])
const commentDeleting = ref(false)

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
  '校园生活': 'info',
  '竞赛科研': 'warning',
  '招新宣传': 'danger',
  '其他': 'info'
}

const getTagType = (category) => {
  return tagTypes[category] || 'info'
}

const isAllSelected = computed(() => {
  return selectedIds.value.length === filteredFaqList.value.length && filteredFaqList.value.length > 0
})

const isAllCommentsSelected = computed(() => {
  if (!commentManageItem.value || !commentManageItem.value.comments) return false
  return commentManageItem.value.comments.length > 0 &&
    selectedCommentIds.value.length === commentManageItem.value.comments.length
})

const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredFaqList.value.map(item => item.id)
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
  
  if (showOnlyReported.value) {
    list = list.filter(item => item.reports && item.reports.some(r => r.status === 'pending'))
  }
  
  const hasPendingReport = (item) => {
    return item.reports && item.reports.some(r => r.status === 'pending')
  }
  
  switch (sortBy.value) {
    case 'newest':
      list.sort((a, b) => {
        if (hasPendingReport(a) !== hasPendingReport(b)) return hasPendingReport(a) ? -1 : 1
        return new Date(b.time) - new Date(a.time)
      })
      break
    case 'oldest':
      list.sort((a, b) => {
        if (hasPendingReport(a) !== hasPendingReport(b)) return hasPendingReport(a) ? -1 : 1
        return new Date(a.time) - new Date(b.time)
      })
      break
    case 'id-asc':
      list.sort((a, b) => {
        if (hasPendingReport(a) !== hasPendingReport(b)) return hasPendingReport(a) ? -1 : 1
        return a.id - b.id
      })
      break
    case 'id-desc':
      list.sort((a, b) => {
        if (hasPendingReport(a) !== hasPendingReport(b)) return hasPendingReport(a) ? -1 : 1
        return b.id - a.id
      })
      break
  }
  
  return list
})

const pendingReportCount = computed(() => {
  return faqList.value.filter(item => 
    item.reports && item.reports.some(r => r.status === 'pending')
  ).length
})

const getPendingReports = (item) => {
  if (!item.reports) return []
  return item.reports.filter(r => r.status === 'pending')
}

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFaqList.value.slice(start, end)
})

const tableRowClassName = ({ row, rowIndex }) => {
  const hasReport = row.reports && row.reports.some(r => r.status === 'pending')
  if (hasReport) return 'row-reported'
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
      const compressedUrl = await compressImage(file.raw)
      const blob = dataURLtoBlob(compressedUrl)
      fileData = await uploadFileToCloud(blob, file.raw.name, file.raw.type)
    } else {
      fileData = await uploadFileToCloud(file.raw)
    }
    
    editForm.files.push(fileData)
    editUploadFiles.value = fileList
  } catch (error) {
    console.error('文件上传失败:', error)
    alert('文件上传失败，请重试')
  }
}

const handleEditRemove = (file, fileList) => {
  const index = editForm.files.findIndex(f => f.name === file.name)
  if (index !== -1) {
    editForm.files.splice(index, 1)
  }
  editUploadFiles.value = fileList
}

const handleEditRemoveFile = (file) => {
  const index = editUploadFiles.value.findIndex(f => f.uid === file.uid || f.name === file.name)
  if (index !== -1) {
    editUploadFiles.value.splice(index, 1)
  }
  const formIndex = editForm.files.findIndex(f => f.name === file.name)
  if (formIndex !== -1) {
    editForm.files.splice(formIndex, 1)
  }
}

const handleSave = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editForm.id) {
          await updateFaq(editForm.id, {
            question: editForm.question,
            answer: editForm.answer,
            category: editForm.category,
            source: editForm.source,
            files: [...editForm.files]
          })
          ElMessage.success('更新成功')
        } else {
          await addFaq({
            question: editForm.question,
            answer: editForm.answer,
            category: editForm.category,
            source: editForm.source,
            files: [...editForm.files]
          })
          ElMessage.success('添加成功')
        }
        showDialog.value = false
        resetForm()
      } catch (e) {
        ElMessage.error(e.message || '操作失败，请重试')
      }
    }
  })
}

const handleDelete = (row) => {
  deleteItem.value = row
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (deleteItem.value) {
    try {
      await deleteFaq(deleteItem.value.id)
      ElMessage.success('删除成功')
    } catch (e) {
      ElMessage.error(e.message || '删除失败，请重试')
    }
    showDeleteDialog.value = false
    deleteItem.value = null
  }
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const toggleMobileSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index !== -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleBatchDelete = () => {
  if (selectedIds.value.length > 0) {
    showBatchDeleteDialog.value = true
  }
}

const confirmBatchDelete = async () => {
  try {
    await batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    showBatchDeleteDialog.value = false
    selectedIds.value = []
  } catch (e) {
    ElMessage.error(e.message || '批量删除失败，请重试')
    showBatchDeleteDialog.value = false
  }
}

const handleTop = async (row) => {
  try {
    await toggleTop(row.id)
  } catch (e) {
    ElMessage.error(e.message || '置顶操作失败，请重试')
  }
}

const handleViewReport = (row) => {
  reportDetailItem.value = row
  showReportDetailDialog.value = true
}

const handleResolveReport = async (action) => {
  if (!reportDetailItem.value) return
  reportResolving.value = true
  try {
    await resolveReport(reportDetailItem.value.id, action)
    if (action === 'delete') {
      ElMessage.success('已删除被举报的FAQ')
    } else {
      ElMessage.success('举报已忽略，FAQ恢复正常')
    }
    showReportDetailDialog.value = false
    reportDetailItem.value = null
  } catch (e) {
    ElMessage.error(e.message || '处理失败，请重试')
  } finally {
    reportResolving.value = false
  }
}

const handleQuickResolve = async (row, action) => {
  quickResolvingId.value = row.id
  try {
    await resolveReport(row.id, action)
    if (action === 'delete') {
      ElMessage.success('已删除被举报的FAQ')
    } else {
      ElMessage.success('举报已忽略，FAQ恢复正常')
    }
  } catch (e) {
    ElMessage.error(e.message || '处理失败，请重试')
  } finally {
    quickResolvingId.value = null
  }
}

const handleManageComments = (row) => {
  commentManageItem.value = row
  selectedCommentIds.value = []
  showCommentsDialog.value = true
}

const toggleCommentSelect = (commentId) => {
  const index = selectedCommentIds.value.indexOf(commentId)
  if (index !== -1) {
    selectedCommentIds.value.splice(index, 1)
  } else {
    selectedCommentIds.value.push(commentId)
  }
}

const toggleAllComments = (val) => {
  if (val) {
    selectedCommentIds.value = commentManageItem.value.comments.map(c => c.id)
  } else {
    selectedCommentIds.value = []
  }
}

const handleBatchDeleteComments = async () => {
  if (selectedCommentIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCommentIds.value.length} 条回答吗？此操作不可恢复。`,
      '确认删除回答',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  commentDeleting.value = true
  const faqId = commentManageItem.value.id
  const idsToDelete = [...selectedCommentIds.value]
  try {
    for (const commentId of idsToDelete) {
      await deleteComment(faqId, commentId)
    }
    ElMessage.success(`成功删除 ${idsToDelete.length} 条回答`)
    selectedCommentIds.value = []
    if (!commentManageItem.value.comments || commentManageItem.value.comments.length === 0) {
      showCommentsDialog.value = false
    }
  } catch (e) {
    ElMessage.error(e.message || '删除回答失败')
  } finally {
    commentDeleting.value = false
  }
}

const handleDeleteSingleComment = async (commentId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条回答吗？此操作不可恢复。',
      '确认删除回答',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  commentDeleting.value = true
  try {
    await deleteComment(commentManageItem.value.id, commentId)
    ElMessage.success('回答已删除')
    const idx = selectedCommentIds.value.indexOf(commentId)
    if (idx !== -1) selectedCommentIds.value.splice(idx, 1)
    if (!commentManageItem.value.comments || commentManageItem.value.comments.length === 0) {
      showCommentsDialog.value = false
    }
  } catch (e) {
    ElMessage.error(e.message || '删除回答失败')
  } finally {
    commentDeleting.value = false
  }
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

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* ===== 移动端卡片列表 ===== */
.mobile-faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-empty {
  padding: 40px 0;
}

.mobile-faq-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px;
  transition: box-shadow 0.2s;
}

.mobile-faq-card.is-top {
  border-color: #f56c6c;
  border-width: 1.5px;
}

.mobile-faq-card:active {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.mobile-card-top {
  margin-bottom: 8px;
}

.mobile-card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.mobile-id {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
}

.mobile-card-question {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  cursor: pointer;
}

.mobile-q-label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.mobile-q-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-card-answer {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  padding: 8px 10px;
  background: #fafafa;
  border-radius: 6px;
}

.mobile-a-label {
  font-size: 12px;
  font-weight: 600;
  color: #67c23a;
  flex-shrink: 0;
}

.mobile-a-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.mobile-card-actions .el-button {
  flex: 1;
  min-width: 70px;
  font-size: 12px;
  padding: 6px 8px;
}

/* ===== 举报告警横幅 ===== */
.report-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff1f0 0%, #ffe0e0 100%);
  border: 2px solid #f56c6c;
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.2);
  animation: banner-glow 2s ease-in-out infinite;
}

@keyframes banner-glow {
  0%, 100% { box-shadow: 0 4px 16px rgba(245, 108, 108, 0.2); }
  50% { box-shadow: 0 4px 24px rgba(245, 108, 108, 0.45); }
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-icon {
  font-size: 22px;
  color: #f56c6c;
  animation: banner-shake 1.5s ease-in-out infinite;
}

@keyframes banner-shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.banner-text {
  font-size: 15px;
  color: #c45656;
  font-weight: 500;
}

.banner-text strong {
  font-size: 20px;
  color: #f56c6c;
  margin: 0 2px;
}

.banner-btn {
  flex-shrink: 0;
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.4s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* ===== "只看举报"按钮徽章 ===== */
.btn-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  background: #f56c6c;
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  padding: 0 5px;
  margin-left: 4px;
  animation: badge-pulse 1.5s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* ===== 桌面端表格行高亮（被举报） ===== */
.faq-table :deep(.row-reported) {
  background: #fff1f0 !important;
}

.faq-table :deep(.row-reported):hover > td {
  background: #ffe0e0 !important;
}

/* ===== 桌面端举报列单元格 ===== */
.report-cell-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.report-cell-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
}

.report-cell-actions {
  display: flex;
  gap: 4px;
}

.report-action-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
}

.report-pulse {
  width: 10px;
  height: 10px;
  background: #f56c6c;
  border-radius: 50%;
  animation: report-pulse-ring 1.5s ease-out infinite;
}

@keyframes report-pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6);
  }
  100% {
    box-shadow: 0 0 0 8px rgba(245, 108, 108, 0);
  }
}

.report-tag {
  cursor: pointer;
  padding: 6px 10px;
  font-weight: 600;
  font-size: 13px;
  animation: tag-bounce 2s ease-in-out infinite;
}

@keyframes tag-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.report-icon {
  margin-right: 4px;
}

/* ===== 移动端卡片举报样式 ===== */
.mobile-faq-card.has-report {
  border: 2px solid #f56c6c;
  background: #fff8f8;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.15);
}

.report-flag {
  cursor: pointer;
}

.mobile-faq-card.has-report .report-flag {
  animation: flag-pulse 1.5s ease-in-out infinite;
}

@keyframes flag-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.05); }
}

/* ===== 侧边栏统计举报样式 ===== */
.stat-item.report-pending {
  background: #fef0f0;
  animation: report-blink 2s ease-in-out infinite;
}

.stat-item.report-pending .stat-value {
  color: #f56c6c;
}

@keyframes report-blink {
  0%, 100% { background: #fef0f0; }
  50% { background: #fde2e2; }
}

/* ===== 举报详情弹窗 ===== */
.report-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.report-faq-info {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px;
}

.report-faq-question {
  margin-bottom: 8px;
}

.report-faq-answer {
  font-size: 13px;
  color: #606266;
}

.report-label {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.report-list-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.report-record {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.report-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.report-time {
  font-size: 11px;
  color: #909399;
}

.report-reason {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.report-resolved-note {
  margin-top: 8px;
}

.report-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* ===== 回答管理弹窗 ===== */
.comments-manage {
  max-height: 60vh;
  overflow-y: auto;
}

.comments-manage-question {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 14px;
}

.comments-question-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.comments-question-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.comments-manage-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.comments-count-text {
  font-size: 13px;
  color: #909399;
  margin-left: auto;
}

.comments-manage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-manage-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  transition: all 0.2s;
}

.comment-manage-item.is-selected {
  background: #fef0f0;
  border-color: #f56c6c;
}

.comment-manage-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.comment-checkbox {
  margin-top: 2px;
  flex-shrink: 0;
}

.comment-manage-body {
  flex: 1;
  min-width: 0;
}

.comment-manage-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.comment-manage-author {
  font-size: 13px;
  font-weight: 600;
  color: #409EFF;
}

.comment-manage-time {
  font-size: 12px;
  color: #909399;
}

.comment-manage-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
}

.comment-manage-files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.comment-manage-files .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-delete-btn {
  flex-shrink: 0;
}

.comment-btn {
  border-radius: 6px;
  padding: 6px 10px;
}

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
  background: #fafbfc;
}

.faq-table :deep(.el-table__body tr:hover > td) {
  background: #ecf5ff !important;
}

.faq-table :deep(.el-table__header-wrapper th) {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.faq-table :deep(.el-table__body td) {
  font-size: 13px;
  padding: 8px 0;
}

.faq-table :deep(.el-table__body .cell) {
  line-height: 1.6;
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.top-btn {
  border-radius: 6px;
  margin-right: 4px;
  padding: 6px 10px;
}

.edit-btn {
  border-radius: 6px;
  margin-right: 4px;
  padding: 6px 10px;
}

.delete-btn {
  border-radius: 6px;
  padding: 6px 10px;
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
  .admin-container {
    overflow-x: hidden;
    max-width: 100vw;
  }

  .admin-header {
    padding: 12px 14px;
  }

  .header-brand h1 {
    font-size: 16px;
  }

  .brand-icon {
    font-size: 22px;
  }

  .home-link, .logout-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .admin-main {
    padding: 10px;
    gap: 10px;
    max-width: 100%;
    overflow-x: hidden;
  }

  .admin-sidebar {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .sidebar-section {
    padding: 10px;
    width: 100%;
  }

  .stats-grid {
    gap: 10px;
    flex-wrap: wrap;
  }

  .stat-item {
    min-width: 80px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
  }

  .action-btn {
    padding: 8px;
    font-size: 13px;
  }

  .admin-content {
    padding: 10px;
    overflow-x: hidden;
    min-width: 0;
    width: 100%;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .content-header h2 {
    font-size: 15px;
  }

  .header-actions {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }

  .report-banner {
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
  }

  .banner-text {
    font-size: 13px;
  }

  .select-all-btn, .batch-delete-btn {
    font-size: 12px;
    padding: 6px 10px;
  }

  .search-bar {
    flex-direction: column;
    gap: 8px;
  }

  .search-input {
    max-width: 100%;
  }

  .search-bar-right {
    width: 100%;
  }

  .category-select, .sort-select {
    width: 100%;
  }

  .faq-table {
    font-size: 12px;
  }

  .top-btn, .edit-btn {
    margin-right: 4px;
    padding: 5px 8px;
    font-size: 11px;
  }

  .delete-btn {
    padding: 5px 8px;
    font-size: 11px;
  }

  .comment-btn {
    padding: 5px 8px;
    font-size: 11px;
  }

  .comments-manage-toolbar {
    gap: 8px;
  }

  .comments-count-text {
    margin-left: 0;
    width: 100%;
  }

  .comment-manage-item {
    padding: 10px;
    gap: 8px;
  }

  .comment-manage-text {
    font-size: 13px;
  }

  .pagination {
    margin-top: 12px;
  }

  .edit-form :deep(.el-form-item__label) {
    font-size: 13px;
  }

  .edit-form :deep(.el-upload--picture-card) {
    width: 80px;
    height: 80px;
  }

  .edit-form :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 80px;
    height: 80px;
  }

  .delete-icon {
    font-size: 36px;
  }

  .delete-confirm p {
    font-size: 14px;
  }

  .delete-hint {
    font-size: 12px;
  }
}
</style>