<template>
  <el-card class="send-package-container">
    <div slot="header">寄件下单</div>

    <el-form :model="sendForm" :rules="rules" ref="sendFormRef" label-width="100px">
      <!-- 寄件人信息 -->
      <el-divider content-position="left">寄件人信息</el-divider>
      <el-form-item label="姓名" prop="senderName">
        <el-input v-model="sendForm.senderName" />
      </el-form-item>
      <el-form-item label="电话" prop="senderPhone">
        <el-input v-model="sendForm.senderPhone" />
      </el-form-item>
      <el-form-item label="取件地址" prop="pickupAddress">
        <el-input v-model="sendForm.pickupAddress" placeholder="如：1号宿舍楼3单元" />
      </el-form-item>
      <el-form-item label="取件时间" prop="pickupTime">
        <el-date-picker
            v-model="sendForm.pickupTime"
            type="datetime"
            placeholder="选择取件时间"
            :disabled-date="disabledPastDate"
        />
      </el-form-item>

      <!-- 收件人信息 -->
      <el-divider content-position="left">收件人信息</el-divider>
      <el-form-item label="姓名" prop="receiverName">
        <el-input v-model="sendForm.receiverName" />
      </el-form-item>
      <el-form-item label="电话" prop="receiverPhone">
        <el-input v-model="sendForm.receiverPhone" />
      </el-form-item>
      <el-form-item label="收件地址" prop="deliveryAddress">
        <el-input v-model="sendForm.deliveryAddress" placeholder="详细到街道门牌号" />
      </el-form-item>

      <!-- 物品信息 -->
      <el-divider content-position="left">物品信息</el-divider>
      <el-form-item label="物品类型" prop="itemType">
        <el-select v-model="sendForm.itemType" placeholder="选择物品类型">
          <el-option label="文件" value="document" />
          <el-option label="生活用品" value="daily" />
          <el-option label="食品" value="food" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="重量(kg)" prop="weight">
        <el-input v-model="sendForm.weight" type="number" />
      </el-form-item>
      <el-form-item label="是否保价">
        <el-switch v-model="sendForm.insurance" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="sendForm.remark" type="textarea" rows="3" />
      </el-form-item>

      <!-- 费用计算 -->
      <el-divider content-position="left">费用信息</el-divider>
      <el-form-item label="预估费用">
        <el-input v-model="estimatedFee" disabled suffix="元" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">提交订单</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useOrderStore } from '@/stores/orderStore'

// 表单数据
const sendForm = reactive({
  senderName: '',
  senderPhone: '',
  pickupAddress: '',
  pickupTime: '',
  receiverName: '',
  receiverPhone: '',
  deliveryAddress: '',
  itemType: '',
  weight: 0,
  insurance: false,
  remark: ''
})

// 表单验证规则
const rules = {
  senderName: [{ required: true, message: '请输入寄件人姓名', trigger: 'blur' }],
  senderPhone: [{ required: true, message: '请输入寄件人电话', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确手机号', trigger: 'blur' }],
  pickupAddress: [{ required: true, message: '请输入取件地址', trigger: 'blur' }],
  pickupTime: [{ required: true, message: '请选择取件时间', trigger: 'change' }],
  receiverName: [{ required: true, message: '请输入收件人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入收件人电话', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确手机号', trigger: 'blur' }],
  deliveryAddress: [{ required: true, message: '请输入收件地址', trigger: 'blur' }],
  itemType: [{ required: true, message: '请选择物品类型', trigger: 'change' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }, { type: 'number', min: 0.1, message: '重量不能小于0.1kg', trigger: 'blur' }]
}

// 表单引用
const sendFormRef = ref()

// 订单仓库
const orderStore = useOrderStore()

// 禁止选择过去的时间
const disabledPastDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7 // 只能选择明天及以后
}

// 预估费用计算
const estimatedFee = computed(() => {
  let baseFee = 8 // 基础费用
  const weightFee = Math.max(0, sendForm.weight - 1) * 3 // 超重费用（1kg内免费，超出每kg3元）
  const insuranceFee = sendForm.insurance ? 5 : 0 // 保价费
  return (baseFee + weightFee + insuranceFee).toFixed(2)
})

// 提交表单
const submitForm = async () => {
  if (!sendFormRef.value) return
  try {
    await sendFormRef.value.validate()
    // 创建订单
    const orderId = orderStore.addSendOrder({
      ...sendForm,
      fee: Number(estimatedFee.value),
      status: 'pending'
    })
    ElMessage.success(`订单创建成功！订单号：${orderId}`)
    // 重置表单
    resetForm()
  } catch (error) {
    ElMessage.error('表单填写有误，请检查')
  }
}

// 重置表单
const resetForm = () => {
  if (sendFormRef.value) {
    sendFormRef.value.resetFields()
  }
}
</script>

<style scoped>
.send-package-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}
</style>