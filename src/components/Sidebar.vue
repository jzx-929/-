<template>
  <el-aside class="sidebar">
    <div class="sidebar-content">
      <h3 class="sidebar-title">问题分类</h3>
      <el-menu
        :default-active="activeCategory"
        class="sidebar-menu"
        @select="handleSelect"
      >
        <el-menu-item index="全部">
          <span>全部</span>
          <el-badge :value="allCount" class="badge" />
        </el-menu-item>
        <el-menu-item v-for="category in categories" :key="category.name" :index="category.name">
          <span>{{ category.name }}</span>
          <el-badge :value="category.count" class="badge" />
        </el-menu-item>
      </el-menu>
    </div>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeCategory: {
    type: String,
    default: '全部'
  },
  faqData: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

const categoryList = [
  '入学报到',
  '宿舍生活',
  '军训安排',
  '学习课程',
  '校园活动',
  '校园生活',
  '竞赛科研',
  '招新宣传',
  '其他'
]

const categories = computed(() => {
  return categoryList.map(name => {
    const count = props.faqData.filter(item => item.category === name).length
    return {
      name,
      count
    }
  })
})

const allCount = computed(() => props.faqData.length)

const handleSelect = (index) => {
  emit('select', index)
}
</script>

<style scoped>
.sidebar {
  background: #fff;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
}

.sidebar-content {
  padding: 0 15px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu .el-menu-item {
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 8px;
  transition: all 0.3s;
}

.sidebar-menu .el-menu-item:hover {
  background: #ecf5ff;
}

.sidebar-menu .el-menu-item.is-active {
  background: #409EFF;
  color: #fff;
}

.badge {
  margin-left: auto;
  background: #f56c6c;
}

@media screen and (max-width: 768px) {
  .sidebar {
    width: 100% !important;
    height: auto !important;
    padding: 10px 0;
  }
  
  .sidebar-content {
    padding: 0 10px;
  }
  
  .sidebar-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .sidebar-menu .el-menu-item {
    padding: 8px 12px;
    margin-bottom: 5px;
  }
}
</style>
