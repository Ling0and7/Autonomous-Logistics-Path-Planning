<template>
  <!-- 根据是否为登录页，决定是否加载Layout布局 -->
  <template v-if="!isLoginPage">
    <Layout />
  </template>
  <template v-else>
    <router-view />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// 导入Layout布局组件（适配你的目录结构）
import Layout from '@/components/layout/Layout.vue'

// 初始化路由实例
const route = useRoute()

// 计算属性：判断当前是否为登录/注册页（避免Layout出现在登录页）
const isLoginPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})
</script>

<style>
/* 全局样式：清除默认边距，统一盒模型 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
  background-color: #f5f7fa;
}

/* 全局滚动条优化（可选） */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 4px;
}
::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>