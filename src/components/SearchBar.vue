<template>
  <div class="search-bar">
    <el-input 
      v-model="keyword"
      placeholder="搜索问题、答案、分类..."
      size="large"
      class="search-input"
      @input="handleInput"
      @clear="handleClear"
    >
      <template #prefix>
        <el-icon class="search-icon"><Search /></el-icon>
      </template>
      <template #suffix>
        <div v-if="resultCount > 0" class="search-result-count">
          {{ resultCount }} 条结果
        </div>
      </template>
    </el-input>
    <div v-if="suggestions.length > 0" class="search-suggestions">
      <div 
        v-for="(suggestion, index) in suggestions" 
        :key="index"
        class="suggestion-item"
        @click="selectSuggestion(suggestion)"
      >
        <el-icon class="suggestion-icon"><Search /></el-icon>
        <span class="suggestion-text">{{ suggestion }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  faqData: {
    type: Array,
    default: () => []
  },
  activeCategory: {
    type: String,
    default: '全部'
  }
})

const emit = defineEmits(['search'])

const keyword = ref('')

const filteredData = computed(() => {
  let data = props.faqData
  
  if (props.activeCategory !== '全部') {
    data = data.filter(item => item.category === props.activeCategory)
  }
  
  if (keyword.value) {
    const searchKeyword = keyword.value.toLowerCase()
    data = data.filter(item => 
      item.question.toLowerCase().includes(searchKeyword) ||
      item.answer.toLowerCase().includes(searchKeyword) ||
      item.category.toLowerCase().includes(searchKeyword) ||
      item.source.toLowerCase().includes(searchKeyword)
    )
  }
  
  return data
})

const resultCount = computed(() => filteredData.value.length)

const suggestions = computed(() => {
  if (!keyword.value || keyword.value.length < 2) return []
  
  const searchKeyword = keyword.value.toLowerCase()
  const seen = new Set()
  const results = []
  
  props.faqData.forEach(item => {
    if (item.question.toLowerCase().includes(searchKeyword) && !seen.has(item.question)) {
      seen.add(item.question)
      results.push(item.question)
    }
  })
  
  return results.slice(0, 5)
})

const handleInput = () => {
  emit('search', keyword.value)
}

const handleClear = () => {
  emit('search', '')
}

const selectSuggestion = (suggestion) => {
  keyword.value = suggestion
  emit('search', suggestion)
}

watch(() => props.activeCategory, () => {
  if (keyword.value) {
    emit('search', keyword.value)
  }
})
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 360px;
  max-width: 100%;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 25px;
  padding: 6px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

.search-icon {
  color: #909399;
  font-size: 18px;
}

.search-result-count {
  font-size: 12px;
  color: #909399;
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 10px;
  margin-right: 8px;
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 1000;
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: #f5f7fa;
}

.suggestion-icon {
  color: #409EFF;
  font-size: 14px;
}

.suggestion-text {
  font-size: 14px;
  color: #303133;
}

@media screen and (max-width: 768px) {
  .search-bar {
    width: 100%;
    max-width: 100%;
  }
  
  .search-input :deep(.el-input__wrapper) {
    padding: 5px 14px;
    border-radius: 20px;
  }
  
  .search-icon {
    font-size: 16px;
  }
  
  .search-result-count {
    font-size: 11px;
    padding: 1px 6px;
  }
  
  .suggestion-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>