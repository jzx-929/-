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
                <div v-else class="file-doc">
                  <el-icon class="doc-icon"><Files /></el-icon>
                  <span>{{ file.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="answer-actions">
          <el-button size="small" class="action-btn reply-btn" @click.stop="showReplyForm = !showReplyForm">
            <el-icon><Message /></el-icon>
            {{ showReplyForm ? '收起回复框' : '我来回答' }}
          </el-button>
          <el-button size="small" class="action-btn" @click.stop="handleShare">
            <el-icon><Share /></el-icon>
            分享
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
                    <div v-else class="comment-file-doc">
                      <el-icon><Files /></el-icon>
                      <span>{{ file.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </el-card>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { 
  ArrowDown, HelpFilled, ChatDotRound, Message, 
  Share, Warning, User, Upload, Picture, Files
} from '@element-plus/icons-vue'
import { useFaqData } from '../composables/useFaqData'
import { compressImage, fileToBase64, isImageFile, validateFileSize } from '../utils/fileUpload'

const props = defineProps({
  faq: {
    type: Object,
    required: true
  }
})

const { addComment } = useFaqData()

const isExpanded = ref(false)
const showReplyForm = ref(false)
const replyFormRef = ref(null)

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
      fileData = await compressImage(file.raw)
    } else {
      fileData = await fileToBase64(file.raw)
    }
    
    replyForm.files.push({
      name: file.raw.name,
      type: file.raw.type,
      url: fileData
    })
    replyUploadFiles.value = fileList
  } catch (error) {
    console.error('文件处理失败:', error)
    alert('文件处理失败，请重试')
  }
}

const handleReplyRemove = (file, fileList) => {
  const index = replyForm.files.findIndex(f => f.name === file.name)
  if (index !== -1) {
    replyForm.files.splice(index, 1)
  }
  replyUploadFiles.value = fileList
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

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: props.faq.question,
      text: props.faq.answer,
      url: window.location.href + `#faq-${props.faq.id}`
    })
  } else {
    navigator.clipboard.writeText(window.location.href + `#faq-${props.faq.id}`)
    alert('链接已复制到剪贴板')
  }
}

const handleReport = () => {
  alert('感谢您的反馈，我们会尽快处理')
}
</script>

<style scoped>
.faq-card {
  margin-bottom: 16px;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
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
    margin-bottom: 12px;
    border-radius: 12px;
  }
  
  .question-content {
    font-size: 14px;
  }
  
  .answer-content p {
    font-size: 13px;
  }
  
  .source-tag {
    display: none;
  }
  
  .question-number {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .answer-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-btn {
    padding: 5px 12px;
    font-size: 11px;
  }
  
  .comment-item {
    padding: 10px;
    gap: 10px;
  }
  
  .comment-avatar {
    width: 32px;
    height: 32px;
  }
}
</style>