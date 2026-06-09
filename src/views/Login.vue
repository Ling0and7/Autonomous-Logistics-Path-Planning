<template>
  <div class="login-container">
    <!-- 登录卡片 -->
    <el-card class="login-card" shadow="hover">
      <div class="login-title">校园快递系统登录</div>
      <el-form
          :model="loginForm"
          ref="loginFormRef"
          label-width="80px"
          @submit.prevent="handleLogin"
      >
        <!-- 账号输入项 -->
        <el-form-item
            label="账号"
            prop="username"
            :rules="[{ required: true, message: '请输入账号', trigger: 'blur' }]"
        >
          <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              clearable
              :disabled="isLoading"
          />
        </el-form-item>

        <!-- 密码输入项 -->
        <el-form-item
            label="密码"
            prop="password"
            :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
        >
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              :disabled="isLoading"
          />
        </el-form-item>

        <!-- 角色选择项 -->
        <el-form-item
            label="角色"
            prop="role"
            :rules="[{ required: true, message: '请选择角色', trigger: 'change' }]"
        >
          <el-select
              v-model="loginForm.role"
              placeholder="请选择角色"
              :disabled="isLoading"
          >
            <el-option label="学生" value="student" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>

        <!-- 登录+注册按钮（增加加载状态） -->
        <el-form-item>
          <el-button
              type="primary"
              class="login-btn"
              @click="handleLogin"
              :loading="isLoading"
          >
            登录
          </el-button>
          <el-button
              type="text"
              class="register-btn"
              @click="goToRegister"
              :disabled="isLoading"
          >
            注册账号
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
// 导入用户状态Store和类型
import { useUserStore } from '@/stores/userStore'
import type { UserRole } from '@/stores/userStore'

// 1. 初始化核心依赖
const userStore = useUserStore()
const router = useRouter()

// 2. 登录表单相关（增强类型定义）
const loginFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const loginForm = reactive<{
  username: string
  password: string
  role: UserRole
}>({
  username: '',
  password: '',
  role: 'student' // 默认选中学生角色，提升用户体验
})

// 3. 加载状态（防止重复点击登录）
const isLoading = ref(false)

// 4. 登录核心逻辑（优化异常处理+角色校验）
const handleLogin = async () => {
  if (isLoading.value) return // 防止重复提交
  if (!loginFormRef.value) return

  // 第一步：表单校验
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
  } catch (error) {
    ElMessage.error('表单校验失败，请检查输入！')
    return
  }

  // 第二步：执行登录（添加加载状态）
  isLoading.value = true
  try {
    // 调用userStore的登录方法
    const loginSuccess = await userStore.login(loginForm.username, loginForm.password)

    // 登录成功后二次校验角色（防止账号角色和选择角色不一致）
    if (userStore.userInfo?.role !== loginForm.role) {
      userStore.logout() // 清空错误的登录状态
      ElMessage.error(`账号【${loginForm.username}】不属于${loginForm.role === 'student' ? '学生' : '管理员'}角色！`)
      return
    }

    // 第三步：根据角色跳转对应首页
    const redirectPath = loginForm.role === 'student' ? '/student/home' : '/admin/dashboard'
    await router.push(redirectPath)
    ElMessage.success(`登录成功！欢迎${loginForm.role === 'student' ? '同学' : '管理员'}使用校园快递系统`)
  } catch (error) {
    // 捕获登录失败的具体错误
    const errMsg = (error as Error).message || '登录失败，请检查账号密码或角色！'
    ElMessage.error(errMsg)
  } finally {
    // 无论成功失败，都关闭加载状态
    isLoading.value = false
  }
}

// 5. 跳转注册页方法（增加基础校验）
const goToRegister = () => {
  if (isLoading.value) return
  router.push('/register').catch(err => {
    console.error('跳转注册页失败：', err)
    ElMessage.error('注册页面暂未开放，请稍后再试')
  })
}
</script>

<style scoped>

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-image: url('/bg.png');
  /* 背景图适配属性 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  /* 兜底颜色 */
  background-color: #f5f7fa;
  margin: 0;
  padding: 20px;
}

/* 登录卡片样式 */
.login-card {
  width: 420px;
  padding: 30px 20px;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 22px;
  text-align: center;
  margin-bottom: 25px;
  color: #2c3e50;
  font-weight: 600;
}

/* 登录按钮样式 */
.login-btn {
  width: 70%;
  height: 40px;
  font-size: 16px;
  margin-right: 10px;
}

/* 注册按钮样式 */
.register-btn {
  width: 25%;
  height: 40px;
  font-size: 16px;
  color: #409eff;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .login-card {
    width: 90%;
  }
  .login-btn {
    width: 65%;
  }
  .register-btn {
    width: 30%;
  }
}
</style>