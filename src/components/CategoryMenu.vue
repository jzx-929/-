<template>
  <div class="category-menu">
    <div 
      v-for="item in categories" 
      :key="item.name"
      class="menu-item"
      :class="{ active: activeCategory === item.name }"
      @click="$emit('select', item.name)"
    >
      <div class="icon-wrapper" :style="{ background: item.color }">
        <component :is="item.icon" class="item-icon" />
      </div>
      <span class="item-name">{{ item.name }}</span>
      <el-badge 
        v-if="getCategoryCount(item.name) > 0" 
        :value="getCategoryCount(item.name)" 
        class="item-badge"
      />
    </div>
  </div>
</template>

<script setup>
import {
  HomeFilled,
  OfficeBuilding,
  Flag,
  Notebook,
  Briefcase,
  Coffee,
  Trophy,
  Promotion,
  More
} from '@element-plus/icons-vue'

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

defineEmits(['select'])

const categories = [
  { name: '全部', icon: HomeFilled, color: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' },
  { name: '入学报到', icon: OfficeBuilding, color: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)' },
  { name: '宿舍生活', icon: HomeFilled, color: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' },
  { name: '军训安排', icon: Flag, color: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' },
  { name: '学习课程', icon: Notebook, color: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
  { name: '校园活动', icon: Briefcase, color: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' },
  { name: '校园生活', icon: Coffee, color: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)' },
  { name: '竞赛科研', icon: Trophy, color: 'linear-gradient(135deg, #ca8a04 0%, #eab308 100%)' },
  { name: '招新宣传', icon: Promotion, color: 'linear-gradient(135deg, #be185d 0%, #db2777 100%)' },
  { name: '其他', icon: More, color: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)' }
]

const getCategoryCount = (category) => {
  if (category === '全部') {
    return props.faqData.length
  }
  return props.faqData.filter(item => item.category === category).length
}
</script>

<style scoped>
.category-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.menu-item:hover {
  background: #eff6ff;
  color: #2563eb;
}

.menu-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  font-weight: 600;
}

.icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon {
  font-size: 14px;
  color: #fff;
}

.item-name {
  flex: 1;
  text-align: left;
}

.item-badge {
  flex-shrink: 0;
}

.menu-item.active .item-badge :deep(.el-badge__content) {
  background: #2563eb;
  color: #fff;
  border: none;
}

@media screen and (max-width: 768px) {
  .menu-item {
    padding: 8px 10px;
    font-size: 13px;
    gap: 10px;
  }
  
  .icon-wrapper {
    width: 24px;
    height: 24px;
  }
  
  .item-icon {
    font-size: 12px;
  }
}
</style>