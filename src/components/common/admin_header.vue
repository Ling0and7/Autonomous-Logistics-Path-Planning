<template>
  <!-- 纯管理员端头部 -->
  <div class="admin-header">
    <div class="nav-buttons">
      <el-button @click="goToHome" :class="{ 'active': route.path === '/admin/dashboard' }">首页</el-button>
      <el-button @click="goToSend" :class="{ 'active': route.path === '/admin/send-orders' }">寄件管理</el-button>
      <el-button @click="goToReceive" :class="{ 'active': route.path === '/admin/receive-orders' }">取件管理</el-button>
      <el-button @click="goToOrderQuery" :class="{ 'active': route.path === '/admin/order-query' }">订单查询</el-button>
      <el-button @click="goToPayment" :class="{ 'active': route.path === '/admin/payment' }">缴费管理</el-button>
    </div>


    <div class="user-actions">
      <span class="admin-name">{{ userStore.userInfo?.username || '管理员' }}</span>
      <el-button type="text" @click="handleLogout" class="logout-btn">退出登录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 管理员端页面跳转
const goToHome = () => router.push('/admin/dashboard')
const goToSend = () => router.push('/admin/send-orders')
const goToReceive = () => router.push('/admin/receive-orders')
const goToOrderQuery = () => router.push('/admin/order-query')
const goToPayment = () => router.push('/admin/payment')

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
  ElMessage.success('退出成功')
}
</script>

<style scoped>
.admin-header {
  padding: 10px 20px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.nav-buttons .el-button {
  padding: 8px 16px;
}

.nav-buttons .active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.admin-name {
  font-size: 14px;
  color: #333;
  padding: 0 8px;
}

.logout-btn {
  color: #f56c6c;
  font-size: 14px;
}

.logout-btn:hover {
  color: #e4393c;
}
</style>