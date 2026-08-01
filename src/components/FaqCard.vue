<template>
  <el-card 
    class="faq-card" 
    hover
    :id="`faq-${faq.id}`"
  >
    <div class="card-header" @click="toggleExpand">
      <div class="header-left">
        <el-tag v-if="faq.isTop" type="danger" size="small" class="top-tag">置顶</el-tag>
        <el-tag :type="tagType" class="category-tag">{{ faq.category }}</el-tag>
        <el-tag size="small" type="info" class="source-tag">{{ faq.source }}</el-tag>
      </div>
      <div class="header-right">
        <span class="comment-count" v-if="faq.comments?.length">
          <el-icon><Message /></el-icon>
          {{ faq.comments.length }}
        </span>
        <span class="time">{{ faq.time }}</span>
        <el-icon class="expand-icon" :class="{ expanded: isExpanded }">
          <ArrowDown />
        </el-icon>
      </div>
    </div>
    <div class="question" @click="toggleExpand">
      <div class="question-number">{{ faq.id }}</div>
      <div class="question-content">
        <el-icon class="question-icon"><HelpFilled /></el-icon>
        <span>{{ faq.question }}</span>
      </div>
    </div>
    <transition name="expand">
      <div v-show="isExpanded" class="answer-section">
        <div class="answer">
          <div class="answer-header">
            <el-icon class="answer-icon"><ChatDotRound /></el-icon>
            <span class="answer-title">解答</span>
          </div>
          <div class="answer-content">
            <p>{{ faq.answer }}</p>
          </div>
          <div v-if="faq.files && faq.files.length > 0" class="answer-files">
            <div class="files-title">
              <el-icon><Picture /></el-icon>
              <span>附件 ({{ faq.files.length }})</span>
            </div>
            <div class="files-list">
              <div 
                v-for="(file, index) in faq.files" 
                :key="index" 
                class="file-item"
              >
                <el-image 
                  v-if="file.type.startsWith('image/')" 
                  :src="file.url" 
                  :preview-src-list="[file.url]"
                  class="file-image"
                  fit="cover"
                  lazy
                />
                <a v-else :href="file.url" :download="file.name" class="file-doc" target="_blank">
                  <el-icon class="doc-icon"><Files /></el-icon>
                  <span>{{ file.name }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="answer-actions">
          <el-button size="small" class="action-btn reply-btn" @click.stop="showReplyForm = !showReplyForm">
            <el-icon><Message /></el-icon>
            {{ showReplyForm ? '收起回复框' : '我来回答' }}
          </el-button>
          <el-button size="small" class="action-btn" @click.stop="handleReport">
            <el-icon><Warning /></el-icon>
            举报
          </el-button>
        </div>
        
        <transition name="fade">
          <div v-if="showReplyForm" class="reply-form">
            <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef">
              <el-form-item prop="author">
                <el-input 
                  v-model="replyForm.author" 
                  placeholder="请输入您的昵称（选填）"
                  size="small"
                  maxlength="20"
                />
              </el-form-item>
              <el-form-item prop="content">
                <el-input 
                  v-model="replyForm.content" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入您的回答..."
                  maxlength="500"
                  show-word-limit
                  size="small"
                />
              </el-form-item>
              <el-form-item label="附件">
                <el-upload
                  v-model:file-list="replyUploadFiles"
                  :auto-upload="false"
                  :on-change="handleReplyUploadChange"
                  :on-remove="handleReplyRemove"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  :limit="3"
                  list-type="picture-card"
                >
                  <el-icon><Upload /></el-icon>
                  <template #tip>
                    <div class="el-upload__tip">支持图片、PDF、Word等格式，单个文件不超过5MB，最多上传3个文件</div>
                  </template>
                  <template #file="{ file }">
                    <div class="upload-file-preview">
                      <img
                        v-if="file.raw && file.raw.type && file.raw.type.startsWith('image/')"
                        :src="file.url"
                        class="upload-preview-img"
                      />
                      <div v-else class="upload-doc-preview">
                        <el-icon class="upload-doc-icon"><Files /></el-icon>
                        <span class="upload-doc-name">{{ file.name }}</span>
                      </div>
                      <span class="upload-remove-btn" @click.stop="handleReplyRemoveFile(file)">
                        <el-icon><Close /></el-icon>
                      </span>
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
              <div class="reply-actions">
                <el-button size="small" @click="showReplyForm = false">取消</el-button>
                <el-button type="primary" size="small" @click="handleReply">提交回答</el-button>
              </div>
            </el-form>
          </div>
        </transition>
        
        <div v-if="faq.comments?.length > 0" class="comments-section">
          <div class="comments-header">
            <el-icon><Message /></el-icon>
            <span>回答列表 ({{ faq.comments.length }})</span>
          </div>
          <div class="comments-list">
            <div 
              v-for="comment in faq.comments" 
              :key="comment.id" 
              class="comment-item"
            >
              <div class="comment-avatar">
                <el-icon><User /></el-icon>
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author }}</span>
                  <span class="comment-time">{{ comment.time }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <div v-if="comment.files && comment.files.length > 0" class="comment-files">
                  <div 
                    v-for="(file, index) in comment.files" 
                    :key="index" 
                    class="comment-file-item"
                  >
                    <el-image 
                      v-if="file.type.startsWith('image/')" 
                      :src="file.url" 
                      :preview-src-list="[file.url]"
                      class="comment-file-image"
                      fit="cover"
                      lazy
                    />
                    <a v-else :href="file.url" :download="file.name" class="comment-file-doc" target="_blank">
                      <el-icon><Files /></el-icon>
                      <span>{{ file.name }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <el-dialog
      title="举报这条问答"
      v-model="showReportDialog"
      width="min(440px, 90%)"
      append-to-body
    >
      <el-form :model="reportForm" label-position="top">
        <el-form-item label="举报原因">
          <el-radio-group v-model="reportForm.reason" class="report-reason-group">
            <el-radio value="信息错误">信息有误</el-radio>
            <el-radio value="内容不当">内容不当</el-radio>
            <el-radio value="垃圾信息">垃圾/广告信息</el-radio>
            <el-radio value="重复内容">重复内容</el-radio>
            <el-radio value="其他">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="补充说明（选填）">
          <el-input
            v-model="reportForm.detail"
            type="textarea"
            :rows="3"
            placeholder="请详细描述举报原因..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="danger" @click="submitReport" :loading="reportLoading">确认举报</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import {
  ArrowDown, HelpFilled, ChatDotRound, Message,
  Warning, User, Upload, Picture, Files, Close
} from '@element-plus/icons-vue'
import { useFaqData } from '../composables/useFaqData'
import { compressImage, dataURLtoBlob, isImageFile, validateFileSize, uploadFileToCloud } from '../utils/fileUpload'
import { getTempFileUrls } from '../utils/cloudbase'
import { ElMessage } from 'element-plus'

const props = defineProps({
  faq: {
    type: Object,
    required: true
  }
})

const { addComment, reportFaq } = useFaqData()

const isExpanded = ref(false)
const showReplyForm = ref(false)
const replyFormRef = ref(null)
const fileUrlsResolved = ref(false)
const showReportDialog = ref(false)
const reportLoading = ref(false)

const reportForm = reactive({
  reason: '',
  detail: ''
})

const replyForm = reactive({
  author: '',
  content: '',
  files: []
})

const replyUploadFiles = ref([])

const replyRules = {
  content: [{ required: true, message: '请输入回答内容', trigger: 'blur' }]
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value && !fileUrlsResolved.value) {
    resolveFileUrls()
  }
}

async function resolveFileUrls() {
  const fileIDs = []
  const faq = props.faq
  if (faq.files) {
    for (const file of faq.files) {
      if (file.fileID) fileIDs.push(file.fileID)
    }
  }
  if (faq.comments) {
    for (const comment of faq.comments) {
      if (comment.files) {
        for (const file of comment.files) {
          if (file.fileID) fileIDs.push(file.fileID)
        }
      }
    }
  }
  if (fileIDs.length === 0) {
    fileUrlsResolved.value = true
    return
  }
  try {
    const urlMap = await getTempFileUrls(fileIDs)
    if (faq.files) {
      for (const file of faq.files) {
        if (file.fileID && urlMap[file.fileID]) file.url = urlMap[file.fileID]
      }
    }
    if (faq.comments) {
      for (const comment of faq.comments) {
        if (comment.files) {
          for (const file of comment.files) {
            if (file.fileID && urlMap[file.fileID]) file.url = urlMap[file.fileID]
          }
        }
      }
    }
  } catch (e) {
    console.error('获取文件URL失败:', e)
  }
  fileUrlsResolved.value = true
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

const tagType = computed(() => {
  return tagTypes[props.faq.category] || 'info'
})

const handleReplyUploadChange = async (file, fileList) => {
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
    
    replyForm.files.push(fileData)
    replyUploadFiles.value = fileList
  } catch (error) {
    console.error('文件上传失败:', error)
    alert('文件上传失败，请重试')
  }
}

const handleReplyRemove = (file, fileList) => {
  const index = replyForm.files.findIndex(f => f.name === file.name)
  if (index !== -1) {
    replyForm.files.splice(index, 1)
  }
  replyUploadFiles.value = fileList
}

const handleReplyRemoveFile = (file) => {
  const index = replyUploadFiles.value.findIndex(f => f.uid === file.uid || f.name === file.name)
  if (index !== -1) {
    replyUploadFiles.value.splice(index, 1)
  }
  const formIndex = replyForm.files.findIndex(f => f.name === file.name)
  if (formIndex !== -1) {
    replyForm.files.splice(formIndex, 1)
  }
}

const handleReply = async () => {
  replyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await addComment(props.faq.id, {
          content: replyForm.content,
          author: replyForm.author || '匿名用户',
          files: [...replyForm.files]
        })
        showReplyForm.value = false
        replyForm.author = ''
        replyForm.content = ''
        replyForm.files = []
        replyUploadFiles.value = []
        alert('回答提交成功！')
      } catch (error) {
        alert(error.message)
      }
    }
  })
}

const handleReport = () => {
  reportForm.reason = ''
  reportForm.detail = ''
  showReportDialog.value = true
}

const submitReport = async () => {
  if (!reportForm.reason) {
    ElMessage.warning('请选择举报原因')
    return
  }
  reportLoading.value = true
  try {
    const reason = reportForm.detail
      ? `${reportForm.reason}：${reportForm.detail}`
      : reportForm.reason
    await reportFaq(props.faq.id, reason)
    showReportDialog.value = false
    ElMessage.success('举报已提交，管理员将尽快处理')
  } catch (error) {
    ElMessage.error(error.message || '举报失败，请稍后重试')
  } finally {
    reportLoading.value = false
  }
}
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

.faq-card {
  margin-bottom: 16px;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.report-reason-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 0;
}

.header-left {
  display: flex;
  gap: 10px;
}

.category-tag {
  font-size: 12px;
  padding: 4px 12px;
  font-weight: 500;
}

.source-tag {
  font-size: 11px;
  padding: 3px 10px;
  opacity: 0.8;
}

.top-tag {
  font-size: 11px;
  padding: 3px 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 10px;
}

.time {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.expand-icon {
  font-size: 18px;
  color: #909399;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.question {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
}

.question-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #409EFF 0%, #667EEA 100%);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.question-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.6;
  flex: 1;
}

.question-icon {
  color: #409EFF;
  font-size: 20px;
  flex-shrink: 0;
  margin-top: -2px;
}

.answer-section {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 2px solid #f0f0f0;
}

.answer {
  margin-bottom: 14px;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.answer-icon {
  color: #67c23a;
  font-size: 18px;
}

.answer-title {
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
}

.answer-content {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
}

.answer-content p {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

.answer-files {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.files-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-item {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.file-image {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-doc {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #606266;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.file-doc:hover {
  background: #ecf5ff;
}

.doc-icon {
  font-size: 24px;
  color: #409EFF;
}

.comment-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.comment-file-item {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
}

.comment-file-image {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.comment-file-doc {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 10px;
  color: #909399;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.comment-file-doc:hover {
  background: #ecf5ff;
}

.answer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.action-btn {
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
  border: 1px solid #ebeef5;
  background: #fff;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f7fa;
  color: #409EFF;
  border-color: #c6e2ff;
}

.reply-btn {
  color: #409EFF;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.reply-btn:hover {
  background: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

.reply-form {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.reply-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.reply-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.comments-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.comments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 14px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #409EFF 0%, #667EEA 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 11px;
  color: #909399;
}

.comment-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
}

.expand-enter-active,
.expand-leave-active {
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1200px;
}

@media screen and (max-width: 768px) {
  .faq-card {
    margin-bottom: 10px;
    border-radius: 10px;
  }
  
  .faq-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .card-header {
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .header-left {
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .category-tag {
    font-size: 11px;
    padding: 2px 8px;
  }
  
  .source-tag {
    display: none;
  }
  
  .top-tag {
    font-size: 10px;
    padding: 2px 8px;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .comment-count {
    font-size: 11px;
    padding: 1px 6px;
  }
  
  .time {
    font-size: 11px;
  }
  
  .expand-icon {
    font-size: 16px;
  }
  
  .question {
    gap: 8px;
  }
  
  .question-number {
    width: 22px;
    height: 22px;
    font-size: 11px;
    border-radius: 6px;
  }
  
  .question-content {
    font-size: 14px;
    gap: 6px;
    line-height: 1.5;
  }
  
  .question-icon {
    font-size: 16px;
  }
  
  .answer-section {
    margin-top: 12px;
    padding-top: 12px;
  }
  
  .answer-content {
    padding: 12px;
    border-radius: 8px;
  }
  
  .answer-content p {
    font-size: 13px;
    line-height: 1.7;
  }
  
  .answer-files {
    margin-top: 12px;
    padding-top: 12px;
  }
  
  .files-list {
    gap: 8px;
  }
  
  .file-item {
    width: 72px;
    height: 72px;
    border-radius: 6px;
  }
  
  .doc-icon {
    font-size: 20px;
  }
  
  .file-doc span {
    font-size: 10px;
  }
  
  .answer-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  
  .action-btn {
    padding: 5px 10px;
    font-size: 11px;
    border-radius: 16px;
  }
  
  .reply-form {
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  
  .reply-form :deep(.el-upload--picture-card) {
    width: 80px;
    height: 80px;
  }
  
  .reply-form :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 80px;
    height: 80px;
  }
  
  .reply-actions {
    gap: 8px;
    margin-top: 8px;
  }
  
  .comments-section {
    padding-top: 12px;
  }
  
  .comments-header {
    font-size: 13px;
    margin-bottom: 10px;
  }
  
  .comments-list {
    gap: 8px;
  }
  
  .comment-item {
    padding: 8px;
    gap: 8px;
    border-radius: 8px;
  }
  
  .comment-avatar {
    width: 28px;
    height: 28px;
  }
  
  .comment-avatar :deep(.el-icon) {
    font-size: 14px;
  }
  
  .comment-header {
    margin-bottom: 4px;
  }
  
  .comment-author {
    font-size: 12px;
  }
  
  .comment-time {
    font-size: 10px;
  }
  
  .comment-text {
    font-size: 12px;
    line-height: 1.5;
  }
  
  .comment-files {
    gap: 6px;
  }
  
  .comment-file-item {
    width: 48px;
    height: 48px;
  }
}

@media screen and (max-width: 480px) {
  .faq-card :deep(.el-card__body) {
    padding: 10px;
  }
  
  .card-header {
    gap: 4px;
  }
  
  .header-left {
    gap: 4px;
  }
  
  .category-tag {
    font-size: 10px;
    padding: 1px 6px;
  }
  
  .question-content {
    font-size: 13px;
  }
  
  .answer-content p {
    font-size: 12px;
  }
  
  .file-item {
    width: 64px;
    height: 64px;
  }
  
  .action-btn {
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .reply-form :deep(.el-upload--picture-card) {
    width: 70px;
    height: 70px;
  }
  
  .reply-form :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 70px;
    height: 70px;
  }
}
</style>