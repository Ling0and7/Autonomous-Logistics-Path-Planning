<template>
  <!-- 整体布局容器：垂直方向排列（Header + 主体内容 + 底部） -->
  <div class="app-layout">
    <!-- 1. 根据用户角色加载对应头部组件 -->
    <template v-if="userStore.userInfo">
      <!-- 学生端头部（添加ref用于定位） -->
      <student-header
          v-if="userStore.hasRole('student')"
          ref="headerRef"
          class="unique-header"
      />
      <!-- 管理员端头部（添加ref用于定位） -->
      <admin-header
          v-else-if="userStore.hasRole('admin')"
          ref="headerRef"
          class="unique-header"
      />
    </template>

    <!-- 2. 页面主体内容区（路由视图出口） -->
    <main class="main-content">
      <router-view />
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import StudentHeader from '../common/student_header.vue'
import AdminHeader from '../common/admin_header.vue'

const userStore = useUserStore()
const route = useRoute()
const headerRef = ref(null) // 定位头部组件

// 计算属性：判断是否为登录页（登录页不需要显示Layout）
const isLoginPage = computed(() => route.path === '/login' || route.path === '/register')

const removeDuplicateHeaders = () => {
  // 只处理已登录且非登录页的场景
  if (!userStore.userInfo || isLoginPage.value) return

  // 查找所有头部组件节点（按class定位）
  const headerNodes = document.querySelectorAll('.unique-header')
  // 如果存在多个头部节点，只保留第一个，删除其余
  if (headerNodes.length > 1) {
    for (let i = 1; i < headerNodes.length; i++) {
      headerNodes[i].remove()
      console.log('已删除多余的导航栏节点') // 控制台提示，确认生效
    }
  }
}

// 1. 页面挂载时执行一次
onMounted(() => {
  // 加微延迟，确保DOM渲染完成
  setTimeout(removeDuplicateHeaders, 100)
})

// 2. 路由切换时再执行一次（防止跳转页面时重复渲染）
watch(
    () => route.path,
    () => {
      setTimeout(removeDuplicateHeaders, 100)
    }
)

// 3. 用户角色变化时执行（防止角色切换导致重复）
watch(
    () => userStore.userInfo?.role,
    () => {
      setTimeout(removeDuplicateHeaders, 100)
    }
)
</script>

<style scoped>
/* 整体布局：占满视口高度，垂直排列 */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 主体内容区：自动填充剩余高度，防止内容过少时底部上移 */
.main-content {
  flex: 1;
  padding: 20px;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto; /* 内容居中 */
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
}
/* 给头部组件加唯一标识，方便定位删除 */
.unique-header {
  position: relative;
  z-index: 100;
}
</style>