<template>
  <div class="user-profile-page">
    <el-card class="profile-card">
      <div slot="header">
        <h2>个人中心</h2>
        <p class="subtitle">完善信息，提升服务体验</p>
      </div>

      <!-- 1. 头像上传区域 -->
      <div class="profile-section avatar-section">
        <h3>头像设置</h3>
        <div class="avatar-upload-container">
          <el-avatar :src="userAvatar" class="current-avatar">
            <el-icon v-if="!userAvatar"><User /></el-icon>
          </el-avatar>
          <el-upload
              class="avatar-uploader"
              action="/api/user/upload-avatar"
              :show-file-list="false"
              :on-success="handleAvatarUploadSuccess"
              :before-upload="beforeAvatarUpload"
          >
            <el-button size="small" type="primary">更换头像</el-button>
          </el-upload>
          <p class="hint-text">支持JPG、PNG格式，建议尺寸200x200px</p>
        </div>
      </div>

      <!-- 2. 实名认证区域 -->
      <div class="profile-section realname-section">
        <h3>实名认证
          <el-tag :type="realnameStatus.tagType" size="small" class="status-tag">
            {{ realnameStatus.text }}
          </el-tag>
        </h3>
        <el-form
            :model="realnameForm"
            ref="realnameFormRef"
            label-width="120px"
            :disabled="realnameStatus.disabled"
        >
          <el-form-item label="真实姓名" prop="name" :rules="[{ required: true, message: '请输入真实姓名' }]">
            <el-input v-model="realnameForm.name" placeholder="请输入与身份证一致的姓名" />
          </el-form-item>
          <el-form-item label="身份证号" prop="idCard" :rules="[{ required: true, validator: validateIdCard }]">
            <el-input v-model="realnameForm.idCard" placeholder="18位身份证号码" maxlength="18" />
          </el-form-item>
          <el-form-item v-if="!realnameStatus.disabled">
            <el-button type="primary" @click="submitRealname">提交认证</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 3. 手机号绑定区域 -->
      <div class="profile-section phone-section">
        <h3>手机号绑定</h3>
        <el-form
            :model="phoneForm"
            ref="phoneFormRef"
            label-width="120px"
            :disabled="isPhoneBound"
        >
          <el-form-item label="手机号" prop="phone" :rules="[{ required: true, validator: validatePhone }]">
            <el-input v-model="phoneForm.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="验证码" prop="code" :rules="[{ required: true, message: '请输入验证码' }]">
            <el-row :gutter="10">
              <el-col :span="14">
                <el-input v-model="phoneForm.code" placeholder="6位数字验证码" maxlength="6" />
              </el-col>
              <el-col :span="10">
                <el-button
                    type="info"
                    @click="sendCode"
                    :disabled="countdown > 0 || isPhoneBound"
                >
                  {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
                </el-button>
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item v-if="!isPhoneBound">
            <el-button type="primary" @click="bindPhone">绑定手机号</el-button>
          </el-form-item>
          <el-form-item v-else>
            <el-button type="warning" @click="showUnbindConfirm">更换手机号</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 4. 地址簿管理区域 -->
      <div class="profile-section address-section">
        <div class="section-header">
          <h3>地址管理</h3>
          <el-button type="primary" size="small" @click="handleAddAddress">
            <el-icon><Plus /></el-icon> 添加新地址
          </el-button>
        </div>

        <el-empty
            v-if="addressList.length === 0"
            description="暂无保存的地址，点击添加按钮新增"
        />

        <el-table
            v-else
            :data="addressList"
            border
            style="width: 100%; margin-top: 10px"
        >
          <el-table-column prop="name" label="收件人" width="120" />
          <el-table-column prop="phone" label="联系电话" width="150" />
          <el-table-column prop="fullAddress" label="详细地址" />
          <el-table-column prop="isDefault" label="默认地址" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.isDefault" type="success" size="small">默认</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button
                  type="text"
                  size="small"
                  @click="handleEditAddress(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                  type="text"
                  size="small"
                  @click="handleSetDefault(scope.row.id)"
                  :disabled="scope.row.isDefault"
              >
                设为默认
              </el-button>
              <el-button
                  type="text"
                  size="small"
                  style="color: #f56c6c"
                  @click="handleDeleteAddress(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 地址编辑弹窗（在线加载省市区） -->
    <el-dialog
        v-model="showAddressDialog"
        :title="addressDialogTitle"
        width="500px"
    >
      <el-form
          :model="addressForm"
          ref="addressFormRef"
          label-width="100px"
      >
        <el-form-item label="收件人" prop="name" :rules="[{ required: true, message: '请输入收件人姓名' }]">
          <el-input v-model="addressForm.name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone" :rules="[{ required: true, validator: validatePhone }]">
          <el-input v-model="addressForm.phone" maxlength="11" />
        </el-form-item>
        <!-- 省市区级联选择（加载中状态） -->
        <el-form-item label="省市区" prop="region" :rules="[{ required: true, message: '请选择省市区' }]">
          <el-cascader
              v-model="addressForm.region"
              :options="regionOptions"
              :loading="regionLoading"
              placeholder="请选择省/市/区"
              @change="handleRegionChange"
              collapse-tags
              style="width: 100%;"
              :disabled="regionLoading"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail" :rules="[{ required: true, message: '请输入详细地址' }]">
          <el-input v-model="addressForm.detail" placeholder="街道、门牌号等" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAddress" :disabled="regionLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { User, Plus } from '@element-plus/icons-vue'

// 类型声明
interface RegionItem {
  label: string
  value: string
  children?: RegionItem[]
}

interface AddressItem {
  id: string
  name: string
  phone: string
  region: string[]
  detail: string
  fullAddress: string
  isDefault: boolean
}

type RealnameStatusType = 'unverified' | 'verifying' | 'verified' | 'rejected'

// 初始化核心数据
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || null)

// 1. 头像相关
const userAvatar = ref<string>(userInfo.value?.avatar || '')
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPG) ElMessage.error('只能上传JPG/PNG格式的图片')
  if (!isLt2M) ElMessage.error('图片大小不能超过2MB')
  return isJPG && isLt2M
}
const handleAvatarUploadSuccess = (response: any) => {
  if (response.code === 200 && userInfo.value) {
    userAvatar.value = response.data.avatarUrl
    userStore.updateUserInfo({ ...userInfo.value, avatar: response.data.avatarUrl })
    ElMessage.success('头像更新成功')
  }
}

// 2. 实名认证相关
const realnameForm = reactive({
  name: userInfo.value?.realname || '',
  idCard: userInfo.value?.idCard || ''
})
const realnameFormRef = ref<InstanceType<typeof ElForm> | null>(null)

const validateIdCard = (rule: any, value: string, callback: (error?: Error) => void) => {
  const reg = /^\d{17}[\dXx]$/
  if (!value) {
    callback(new Error('请输入身份证号'))
  } else if (!reg.test(value)) {
    callback(new Error('请输入18位有效身份证号'))
  } else {
    callback()
  }
}

const realnameStatus = computed(() => {
  if (!userInfo.value) {
    return { text: '未登录', tagType: 'info', disabled: true }
  }
  const status = userInfo.value.realnameStatus || 'unverified'
  const statusMap: Record<RealnameStatusType, { text: string, tagType: string, disabled: boolean }> = {
    unverified: { text: '未认证', tagType: 'info', disabled: false },
    verifying: { text: '审核中', tagType: 'warning', disabled: true },
    verified: { text: '已认证', tagType: 'success', disabled: true },
    rejected: { text: '已驳回', tagType: 'danger', disabled: false }
  }
  return statusMap[status as RealnameStatusType] || statusMap.unverified
})

const submitRealname = async () => {
  if (!realnameFormRef.value || !userInfo.value) return
  try {
    await realnameFormRef.value.validate()
    userStore.updateUserInfo({
      ...userInfo.value,
      realname: realnameForm.name,
      idCard: realnameForm.idCard,
      realnameStatus: 'verifying' as RealnameStatusType
    })
    ElMessage.success('提交成功，等待审核')
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入')
  }
}

// 3. 手机号绑定相关
const phoneForm = reactive({
  phone: userInfo.value?.phone || '',
  code: ''
})
const phoneFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const isPhoneBound = computed(() => !!userInfo.value?.phone)
const countdown = ref(0)

const validatePhone = (rule: any, value: string, callback: (error?: Error) => void) => {
  const reg = /^1[3-9]\d{9}$/
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!reg.test(value)) {
    callback(new Error('请输入正确的11位手机号'))
  } else {
    callback()
  }
}

const sendCode = () => {
  validatePhone({}, phoneForm.phone, (err: any) => {
    if (err) {
      ElMessage.error(err.message)
      return
    }
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
    ElMessage.success('验证码已发送至您的手机')
  })
}

const bindPhone = async () => {
  if (!phoneFormRef.value || !userInfo.value) return
  try {
    await phoneFormRef.value.validate()
    userStore.updateUserInfo({ ...userInfo.value, phone: phoneForm.phone })
    ElMessage.success('手机号绑定成功')
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入')
  }
}

const showUnbindConfirm = () => {
  ElMessageBox.confirm(
      '解绑后将影响部分功能使用，是否继续？',
      '确认解绑',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(() => {
    if (userInfo.value) {
      userStore.updateUserInfo({ ...userInfo.value, phone: '' })
      phoneForm.phone = ''
      phoneForm.code = ''
      ElMessage.success('已解绑手机号')
    }
  })
}

// 4. 地址簿管理相关
const addressList = ref<AddressItem[]>(userInfo.value?.addresses || [])
const showAddressDialog = ref(false)
const addressDialogTitle = ref('添加地址')
const currentAddressId = ref('')

const regionOptions = ref<RegionItem[]>([])
const regionLoading = ref(false)

const addressForm = reactive({
  name: '',
  phone: '',
  region: [] as string[],
  detail: '',
  isDefault: false
})
const addressFormRef = ref<InstanceType<typeof ElForm> | null>(null)

const loadRegionData = async () => {
  if (regionOptions.value.length > 0) return
  regionLoading.value = true
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/element-china-area-data@5.0.0/dist/app.json')
    if (!res.ok) throw new Error('数据加载失败')

    const rawData: Record<string, any> = await res.json()
    const formatData: RegionItem[] = Object.entries(rawData).map(([code, name]) => {
      const province: RegionItem = {
        label: name as string,
        value: code
      }
      const cityData = rawData[code]
      if (cityData) {
        province.children = Object.entries(cityData).map(([cityCode, cityName]) => {
          const city: RegionItem = {
            label: cityName as string,
            value: cityCode
          }
          const areaData = cityData[cityCode]
          if (areaData) {
            city.children = Object.entries(areaData).map(([areaCode, areaName]) => ({
              label: areaName as string,
              value: areaCode
            }))
          }
          return city
        })
      }
      return province
    })
    regionOptions.value = formatData
  } catch (error) {
    ElMessage.error('省市区数据加载失败，请刷新页面重试')
    console.error('省市区加载失败：', error)
  } finally {
    regionLoading.value = false
  }
}

const handleRegionChange = (value: string[]) => {
  if (value.length === 3 && regionOptions.value.length > 0) {
    const province = regionOptions.value.find(item => item.value === value[0])?.label || ''
    const city = regionOptions.value.find(item => item.value === value[0])?.children?.find(item => item.value === value[1])?.label || ''
    const district = regionOptions.value.find(item => item.value === value[0])?.children?.find(item => item.value === value[1])?.children?.find(item => item.value === value[2])?.label || ''
    console.log(`选中地址：${province} ${city} ${district}`)
  }
}

const handleAddAddress = async () => {
  await loadRegionData()
  addressDialogTitle.value = '添加地址'
  currentAddressId.value = ''
  Object.assign(addressForm, { name: '', phone: '', region: [], detail: '', isDefault: false })
  showAddressDialog.value = true
}

const handleEditAddress = async (address: AddressItem) => {
  await loadRegionData()
  addressDialogTitle.value = '编辑地址'
  currentAddressId.value = address.id
  Object.assign(addressForm, {
    name: address.name,
    phone: address.phone,
    region: address.region || [],
    detail: address.detail,
    isDefault: address.isDefault
  })
  showAddressDialog.value = true
}

const submitAddress = async () => {
  if (!addressFormRef.value || !userInfo.value || regionLoading.value) return
  try {
    await addressFormRef.value.validate()

    let regionName = ''
    if (addressForm.region.length === 3 && regionOptions.value.length > 0) {
      const province = regionOptions.value.find(item => item.value === addressForm.region[0])?.label || ''
      const city = regionOptions.value.find(item => item.value === addressForm.region[0])?.children?.find(item => item.value === addressForm.region[1])?.label || ''
      const district = regionOptions.value.find(item => item.value === addressForm.region[0])?.children?.find(item => item.value === addressForm.region[1])?.children?.find(item => item.value === addressForm.region[2])?.label || ''
      regionName = `${province} ${city} ${district}`
    }

    const newAddress: AddressItem = {
      id: currentAddressId.value || Date.now().toString(),
      name: addressForm.name,
      phone: addressForm.phone,
      region: addressForm.region,
      detail: addressForm.detail,
      fullAddress: `${regionName} ${addressForm.detail}`,
      isDefault: addressForm.isDefault
    }

    if (currentAddressId.value) {
      addressList.value = addressList.value.map(addr =>
          addr.id === currentAddressId.value ? newAddress : addr
      )
    } else {
      if (newAddress.isDefault) {
        addressList.value = addressList.value.map(addr => ({ ...addr, isDefault: false }))
      }
      addressList.value.push(newAddress)
    }

    userStore.updateUserInfo({ ...userInfo.value, addresses: addressList.value })
    showAddressDialog.value = false
    ElMessage.success(currentAddressId.value ? '地址更新成功' : '地址添加成功')
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入')
  }
}

const handleSetDefault = (id: string) => {
  if (!userInfo.value) return
  addressList.value = addressList.value.map(addr => ({
    ...addr,
    isDefault: addr.id === id
  }))
  userStore.updateUserInfo({ ...userInfo.value, addresses: addressList.value })
  ElMessage.success('已设为默认地址')
}

const handleDeleteAddress = (id: string) => {
  if (!userInfo.value) return
  ElMessageBox.confirm(
      '确定要删除该地址吗？',
      '确认删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(() => {
    addressList.value = addressList.value.filter(addr => addr.id !== id)
    userStore.updateUserInfo({ ...userInfo.value, addresses: addressList.value })
    ElMessage.success('地址已删除')
  })
}

onMounted(() => {
  addressList.value = userInfo.value?.addresses || []
})
</script>

<style scoped>
.user-profile-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.profile-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.subtitle {
  color: #666;
  margin-top: 5px;
  font-size: 14px;
}

.profile-section {
  padding: 20px 0;
  border-bottom: 1px dashed #eee;
  &:last-child {
    border-bottom: none;
  }
}

.profile-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-upload-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-avatar {
  width: 120px;
  height: 120px;
  border: 2px solid #f0f0f0;
}

.hint-text {
  color: #999;
  font-size: 12px;
  margin-top: 10px;
}

/* 地址管理区域 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-tag {
  margin-left: 10px;
}
</style>