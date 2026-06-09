<template>
  <!-- 纯学生端头部 -->
  <div class="student-header">
    <div class="nav-buttons">
      <el-button @click="goToHome" :class="{ 'active': route.path === '/student/home' }">首页</el-button>
      <el-button @click="goToSend" :class="{ 'active': route.path === '/student/send' }">寄件</el-button>
      <el-button @click="goToReceive" :class="{ 'active': route.path === '/student/receive' }">取件</el-button>
      <el-button @click="goToOrderQuery" :class="{ 'active': route.path === '/student/order-query' }">订单查询</el-button>
      <el-button @click="goToPayment" :class="{ 'active': route.path === '/student/payment' }">缴费中心</el-button>
    </div>


    <div class="user-actions">
      <div class="avatar-wrapper">
        <!-- 学生头像 -->
        <el-avatar :src="userAvatar" class="avatar" style="width: 40px; height: 40px;">
          <el-icon v-if="!userAvatar"><User /></el-icon>
        </el-avatar>
        <span
            class="home-text"
            @click="goToUserProfile"
            style="
            display: block;
            text-align: center;
            margin-top: 4px;
            font-size: 12px;
            color: #333;
            cursor: pointer;
          "
            :style="{ color: hoverFlag ? '#409eff' : '#333', textDecoration: hoverFlag ? 'underline' : 'none' }"
            @mouseenter="hoverFlag = true"
            @mouseleave="hoverFlag = false"
        >
          我的主页
        </span>
      </div>

      <el-button type="text" @click="handleLogout" class="logout-btn">退出登录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const hoverFlag = ref(false) // 我的主页hover高亮

// 学生头像
const userAvatar = computed(() => userStore.userInfo?.avatar || '')

// 学生端页面跳转
const goToHome = () => router.push('/student/home')
const goToSend = () => router.push('/student/send')
const goToReceive = () => router.push('/student/receive')
const goToOrderQuery = () => router.push('/student/order-query')
const goToPayment = () => router.push('/student/payment')

// 点击「我的主页」跳转
const goToUserProfile = () => {
  if (!userStore.userInfo) {
    ElMessageBox.confirm('未登录无法访问我的主页', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消'
    }).then(() => router.push('/login'))
    return
  }
  // 直接跳转学生个人中心
  window.location.href = window.location.hash.includes('#') ? '/#/user/profile' : '/user/profile'
  ElMessage.success('进入我的主页')
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
  ElMessage.success('退出成功')
}
</script>

<style scoped>
.student-header {
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

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
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