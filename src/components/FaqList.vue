<template>
  <div class="faq-list">
    <div v-if="filteredData.length === 0" class="empty-state">
      <el-empty description="暂无相关问答" />
    </div>
    <div v-else class="list-container" ref="listContainer">
      <div 
        v-for="(faq) in visibleData" 
        :key="faq.id" 
        class="list-item"
      >
        <FaqCard :faq="faq" />
      </div>
      <div class="scroll-sentinel" ref="sentinelTop"></div>
      <div class="scroll-sentinel" ref="sentinelBottom"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

const listContainer = ref(null)
const sentinelTop = ref(null)
const sentinelBottom = ref(null)
const visibleStart = ref(0)
const visibleCount = ref(20)

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

const visibleData = computed(() => {
  return filteredData.value.slice(visibleStart.value, visibleStart.value + visibleCount.value)
})

const handleScroll = () => {
  if (!listContainer.value) return
  const container = listContainer.value
  const scrollTop = container.scrollTop
  const itemHeight = 120
  const newStart = Math.max(0, Math.floor(scrollTop / itemHeight) - 2)
  
  if (newStart !== visibleStart.value) {
    visibleStart.value = newStart
  }
}

watch(() => filteredData.value, () => {
  visibleStart.value = 0
})

onMounted(() => {
  if (listContainer.value) {
    listContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (listContainer.value) {
    listContainer.value.removeEventListener('scroll', handleScroll)
  }
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
  max-height: 800px;
  overflow-y: auto;
}

.empty-state {
  padding: 60px 0;
}

.scroll-sentinel {
  height: 1px;
}
</style>
