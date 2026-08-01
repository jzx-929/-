<template>
  <div class="faq-list">
    <div v-if="filteredData.length === 0" class="empty-state">
      <el-empty description="暂无相关问答" />
    </div>
    <div v-else class="list-container">
      <div
        v-for="(faq) in visibleData"
        :key="faq.id"
        class="list-item"
      >
        <FaqCard :faq="faq" />
      </div>
      <div v-if="hasMore" class="load-more" ref="loadMoreRef">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载更多...</span>
      </div>
      <div v-else-if="filteredData.length > pageSize" class="load-end">
        <span>已加载全部 {{ filteredData.length }} 条问答</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import FaqCard from './FaqCard.vue'

const props = defineProps({
  faqData: {
    type: Array,
    default: () => []
  },
  activeCategory: {
    type: String,
    default: '全部'
  },
  searchKeyword: {
    type: String,
    default: ''
  }
})

const pageSize = 20
const visibleCount = ref(pageSize)
const loadMoreRef = ref(null)
let observer = null

const filteredData = computed(() => {
  let data = props.faqData

  if (props.activeCategory !== '全部') {
    data = data.filter(item => item.category === props.activeCategory)
  }

  if (props.searchKeyword) {
    const keyword = props.searchKeyword.toLowerCase()
    data = data.filter(item =>
      item.question.toLowerCase().includes(keyword) ||
      item.answer.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword) ||
      item.source.toLowerCase().includes(keyword)
    )
  }

  return data
})

const hasMore = computed(() => visibleCount.value < filteredData.value.length)

const visibleData = computed(() => {
  return filteredData.value.slice(0, visibleCount.value)
})

const loadMore = () => {
  if (hasMore.value) {
    visibleCount.value += pageSize
  }
}

const setupObserver = () => {
  if (observer) observer.disconnect()
  if (!loadMoreRef.value) return

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value) {
      loadMore()
    }
  }, { rootMargin: '200px' })

  observer.observe(loadMoreRef.value)
}

watch(() => filteredData.value, () => {
  visibleCount.value = pageSize
})

watch(hasMore, () => {
  setupObserver()
})

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.faq-list {
  padding: 0;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-state {
  padding: 60px 0;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #909399;
  font-size: 13px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.load-end {
  text-align: center;
  padding: 16px;
  color: #c0c4cc;
  font-size: 12px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
