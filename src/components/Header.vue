<template>
  <el-header class="header">
    <div class="header-content">
      <div class="header-title">
        <h1>重庆文理学院数学与人工智能学院</h1>
        <h2>2026级新生问答库</h2>
      </div>
      <div class="header-search">
        <el-input
          v-model="searchText"
          placeholder="搜索问题..."
          prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['search'])

const searchText = ref('')

const handleSearch = () => {
  emit('search', searchText.value)
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #409EFF 0%, #667EEA 100%);
  color: #fff;
  padding: 0 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-title h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 5px 0 0 0;
}

.header-search {
  width: 300px;
}

.search-input {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
}

.search-input .el-input__wrapper {
  border-radius: 20px;
}

@media screen and (max-width: 768px) {
  .header {
    padding: 0 15px;
  }
  
  .header-content {
    flex-direction: column;
    padding: 15px 0;
  }
  
  .header-title h1 {
    font-size: 14px;
  }
  
  .header-title h2 {
    font-size: 18px;
  }
  
  .header-search {
    width: 100%;
    margin-top: 10px;
  }
}
</style>
