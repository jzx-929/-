<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
}

/* 移动端对话框优化 */
@media screen and (max-width: 768px) {
  .el-dialog {
    margin: 8vh auto !important;
  }
  
  .el-dialog__body {
    padding: 16px !important;
  }
  
  .el-dialog__header {
    padding: 14px 16px !important;
  }
  
  .el-dialog__title {
    font-size: 15px !important;
  }
  
  .el-dialog__footer {
    padding: 10px 16px 16px !important;
  }
  
  /* 移动端上传组件缩小 */
  .el-upload--picture-card {
    width: 80px !important;
    height: 80px !important;
  }
  
  .el-upload-list--picture-card .el-upload-list__item {
    width: 80px !important;
    height: 80px !important;
  }
  
  /* 移动端表格优化 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table .el-button {
    padding: 5px 8px;
    font-size: 11px;
  }
}
</style>