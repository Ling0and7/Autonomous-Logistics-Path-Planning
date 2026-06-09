<template>
  <div class="register-container">
    <!-- 注册卡片 -->
    <el-card class="register-card" shadow="hover">
      <div class="register-title">校园快递系统 - 用户注册</div>
      <el-form
          :model="registerForm"
          ref="registerFormRef"
          label-width="80px"
          @submit.prevent="handleRegister"
      >
        <!-- 账号输入 + 实时校验 + √号 -->
        <el-form-item label="账号" prop="username">
          <div class="input-with-check">
            <el-input
                v-model="registerForm.username"
                placeholder="必须包含字母+数字（1-12位）"
                clearable
                @input="checkUsername"
                @clear="resetUsernameValid"
            />
            <img
                v-if="usernameValid"
                src="/gou.png"
                class="check-icon"
                alt="正确"
            />
          </div>
        </el-form-item>

        <!-- 密码输入 + 实时校验 + √号 -->
        <el-form-item label="密码" prop="password">
          <div class="input-with-check">
            <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="必须包含字母+数字（1-12位）"
                show-password
                @input="checkPassword"
                @clear="resetPasswordValid"
            />
            <img
                v-if="passwordValid"
                src="/gou.png"
                class="check-icon"
                alt="正确"
            />
          </div>
        </el-form-item>

        <!-- 确认密码 + 实时校验 + √号 -->
        <el-form-item label="确认密码" prop="confirmPwd">
          <div class="input-with-check">
            <el-input
                v-model="registerForm.confirmPwd"
                type="password"
                placeholder="请再次输入密码"
                show-password
                @input="checkConfirmPwd"
                @clear="resetConfirmPwdValid"
            />
            <img
                v-if="confirmPwdValid"
                src="/gou.png"
                class="check-icon"
                alt="正确"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              class="register-btn"
              @click="handleRegister"
              :disabled="!usernameValid || !passwordValid || !confirmPwdValid"
          >
            完成注册
          </el-button>
          <!-- 返回登录按钮 -->
          <el-button
              type="text"
              class="back-login-btn"
              @click="backToLogin"
          >
            返回登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 注册成功提示弹窗 -->
    <el-dialog
        v-model="showSuccessDialog"
        title="注册成功"
        width="300px"
        :close-on-click-modal="false"
        :show-close="false"
    >
      <div class="success-content">
        <el-icon size="40" color="#67c23a"><CircleCheck /></el-icon>
        <p>恭喜！账号注册成功</p>
        <p>将在 {{ countDown }} 秒后自动返回登录页...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
// 导入用户状态Store
import { useUserStore } from '@/stores/userStore'
import type { UserRole } from '@/stores/userStore'

// 1. 初始化核心依赖
const userStore = useUserStore()
const router = useRouter()

// 2. 注册表单相关
const registerFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const registerForm = reactive({
  username: '',
  password: '',
  confirmPwd: ''
})

// 3. 校验状态（控制√号显示）
const usernameValid = ref(false)
const passwordValid = ref(false)
const confirmPwdValid = ref(false)

// 4. 注册成功弹窗+倒计时
const showSuccessDialog = ref(false)
const countDown = ref(3)
let timer: NodeJS.Timeout | null = null

// 5. 核心正则规则：必须同时包含字母+数字，长度1-12位
const accountReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{1,12}$/
const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{1,12}$/

// 6. 账号校验（实时输入触发，清空时重置状态）
const checkUsername = () => {
  // 清空输入时直接重置
  if (!registerForm.username) {
    usernameValid.value = false
    return
  }
  // 校验正则
  if (accountReg.test(registerForm.username)) {
    usernameValid.value = true
  } else {
    usernameValid.value = false
    ElMessage.warning('账号必须同时包含字母和数字（1-12位）')
  }
}

// 账号清空时重置校验状态
const resetUsernameValid = () => {
  usernameValid.value = false
}

// 7. 密码校验（实时输入触发，清空时重置状态）
const checkPassword = () => {
  if (!registerForm.password) {
    passwordValid.value = false
    return
  }
  if (passwordReg.test(registerForm.password)) {
    passwordValid.value = true
  } else {
    passwordValid.value = false
    ElMessage.warning('密码必须同时包含字母和数字（1-12位）')
  }
}

// 密码清空时重置校验状态
const resetPasswordValid = () => {
  passwordValid.value = false
}

// 8. 确认密码校验（实时输入触发，清空时重置状态）
const checkConfirmPwd = () => {
  if (!registerForm.confirmPwd) {
    confirmPwdValid.value = false
    return
  }
  if (registerForm.confirmPwd === registerForm.password && passwordValid.value) {
    confirmPwdValid.value = true
  } else {
    confirmPwdValid.value = false
    // 仅在输入内容后提示，避免空输入时频繁弹窗
    if (registerForm.confirmPwd) {
      ElMessage.warning('两次输入的密码不一致或密码格式错误')
    }
  }
}

// 确认密码清空时重置校验状态
const resetConfirmPwdValid = () => {
  confirmPwdValid.value = false
}

// 9. 核心注册逻辑
const handleRegister = () => {
  // 最终校验（防止绕过输入校验）
  checkUsername()
  checkPassword()
  checkConfirmPwd()

  // 校验不通过则阻止注册
  if (!usernameValid.value || !passwordValid.value || !confirmPwdValid.value) {
    ElMessage.error('请完善所有字段并确保格式正确！')
    return
  }

  // 读取现有用户列表
  const mockUsers = userStore.getMockUsers()

  // 检查账号是否已存在
  if (mockUsers.some((u: any) => u.username === registerForm.username)) {
    ElMessage.error('该账号已存在！')
    return
  }

  // 新增用户（默认学生角色）
  const newUser = {
    id: Date.now().toString(), // 生成唯一ID
    username: registerForm.username,
    password: registerForm.password,
    role: 'student' as UserRole
  }
  mockUsers.push(newUser)

  // 保存到本地存储
  userStore.setMockUsers(mockUsers)

  // 显示成功弹窗并启动倒计时
  showSuccessDialog.value = true
  startCountDown()
}

// 10. 倒计时跳转逻辑
const startCountDown = () => {
  timer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(timer!)
      backToLogin()
    }
  }, 1000)
}

// 11. 返回登录页
const backToLogin = () => {
  if (timer) clearInterval(timer)
  router.push('/login')
}

// 12. 组件卸载时清除定时器（防止内存泄漏）
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* 注册容器：背景图用public目录路径（100%生效） */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  /* 改用public目录路径，避免路径解析问题 */
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

/* 注册卡片样式 */
.register-card {
  width: 420px;
  padding: 30px 20px;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.register-title {
  font-size: 22px;
  text-align: center;
  margin-bottom: 25px;
  color: #2c3e50;
  font-weight: 600;
}

/* 输入框+√号容器 */
.input-with-check {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* √号图标样式 */
.check-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 按钮样式 */
.register-btn {
  width: 70%;
  height: 40px;
  font-size: 16px;
  margin-right: 10px;
}

.back-login-btn {
  width: 25%;
  height: 40px;
  font-size: 16px;
  color: #409eff;
}

/* 注册成功弹窗样式 */
.success-content {
  text-align: center;
  padding: 10px 0;
}

.success-content p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .register-card {
    width: 90%;
  }
  .register-btn {
    width: 65%;
  }
  .back-login-btn {
    width: 30%;
  }
}
</style>