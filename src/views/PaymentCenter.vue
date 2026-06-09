<template>
  <div class="payment-center">

    <el-main class="payment-content">
      <el-card class="payment-container">
        <div slot="header">缴费中心</div>

        <!-- 功能选项卡（确保模板中实际使用） -->
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="订单支付" name="orderPay">
            <!-- 待支付订单列表 -->
            <el-input v-model="searchKeyword" placeholder="搜索订单号" style="margin-bottom: 15px;" />
            <el-table :data="pendingOrders" border>
              <el-table-column prop="orderId" label="订单号" width="180" />
              <el-table-column prop="type" label="类型" width="100" :formatter="formatOrderType" />
              <el-table-column prop="createTime" label="创建时间" width="180" />
              <el-table-column prop="fee" label="应付金额(元)" width="120" />
              <el-table-column label="支付方式" width="180">
                <template #default="scope">
                  <el-radio-group v-model="scope.row.payMethod" size="small">
                    <el-radio label="balance">账户余额（{{ paymentStore.formattedBalance }}元）</el-radio>
                    <el-radio label="wechat">微信支付</el-radio>
                    <el-radio label="alipay">支付宝支付</el-radio>
                  </el-radio-group>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button
                      type="primary"
                      size="small"
                      @click="payOrder(scope.row.orderId, scope.row.payMethod)"
                      :disabled="!scope.row.payMethod"
                  >
                    立即支付
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="账户充值" name="recharge">
            <el-form :model="rechargeForm" ref="rechargeFormRef" :rules="rechargeRules" label-width="120px" style="max-width: 500px; margin: 20px auto;">
              <el-form-item label="充值金额" prop="amount">
                <el-input
                    v-model="rechargeForm.amount"
                    type="number"
                    placeholder="请输入充值金额（≥1元）"
                />
              </el-form-item>
              <el-form-item label="支付方式" prop="payMethod">
                <el-radio-group v-model="rechargeForm.payMethod">
                  <el-radio label="wechat">微信支付</el-radio>
                  <el-radio label="alipay">支付宝支付</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitRecharge">确认充值</el-button>
                <div style="margin-top: 10px; color: #666;">当前账户余额：{{ paymentStore.formattedBalance }}元</div>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="支付记录" name="payRecords">
            <el-input v-model="recordSearchKeyword" placeholder="搜索订单号/支付ID" style="margin-bottom: 15px;" />
            <el-table :data="filteredPayRecords" border>

              <el-table-column prop="payId" label="支付ID" width="180" />
              <el-table-column prop="orderId" label="关联订单号" width="180" />
              <el-table-column prop="amount" label="金额(元)" width="120" />
              <el-table-column prop="payMethod" label="支付方式" width="120" :formatter="formatPayMethod" />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                    {{ scope.row.status === 'success' ? '支付成功' : '支付失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="payTime" label="支付时间" width="180" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button type="text" size="small" @click="showInvoice(scope.row)">开具发票</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-main>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '@/stores/orderStore'
import { usePaymentStore } from '@/stores/paymentStore'
// 引入Element Plus组件（确保el-tabs被导入并使用）
import { ElMain, ElCard, ElTabs, ElTabPane, ElTable, ElTableColumn, ElInput, ElRadioGroup, ElRadio, ElButton, ElForm, ElFormItem, ElTag } from 'element-plus'
import type { FormRules } from 'element-plus'

// 实例化store
const orderStore = useOrderStore()
const paymentStore = usePaymentStore()

// 选项卡激活状态
const activeTab = ref('orderPay')

// 订单支付相关
const searchKeyword = ref('')
const pendingOrders = computed(() => {
  return orderStore.sendOrders
      .filter(order => order.status === 'pending' && order.fee)
      .map(order => ({
        ...order,
        payMethod: 'balance' as 'balance' | 'wechat' | 'alipay'
      }))
      .filter(order =>
          order.orderId.includes(searchKeyword.value) ||
          (order.pickupAddress && order.pickupAddress.includes(searchKeyword.value))
      )
})

// 账户充值相关
const rechargeForm = reactive({
  amount: 0,
  payMethod: 'wechat' as 'wechat' | 'alipay'
})
const rechargeFormRef = ref<InstanceType<typeof ElForm>>()
const rechargeRules: FormRules = {
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 1, message: '充值金额不能小于1元', trigger: 'blur' }
  ],
  payMethod: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
  ]
}

// 支付记录相关
const recordSearchKeyword = ref('')
const filteredPayRecords = computed(() => {
  return (paymentStore.paymentRecords || []).filter(record =>
      (record.payId && record.payId.includes(recordSearchKeyword.value)) ||
      (record.orderId && record.orderId.includes(recordSearchKeyword.value))
  )
})

// 格式化订单类型
const formatOrderType = (row: any) => {
  return row.type === 'send' ? '寄件' : '取件'
}

// 格式化支付方式
const formatPayMethod = (row: any) => {
  const methodMap = {
    balance: '账户余额',
    wechat: '微信支付',
    alipay: '支付宝支付'
  }
  return methodMap[row.payMethod as keyof typeof methodMap] || '未知'
}

const payOrder = (orderId: string, payMethod: 'balance' | 'wechat' | 'alipay') => {
  if (!payMethod) {
    ElMessage.warning('请选择支付方式')
    return
  }

  // 找到订单信息
  const order = orderStore.sendOrders.find(o => o.orderId === orderId)
  if (!order || !order.fee) {
    ElMessage.error('订单信息不存在')
    return
  }

  let success = false
  if (payMethod === 'balance') {
    // 余额支付：调用扣款方法
    success = paymentStore.deduct(order.fee)
  } else {
    // 微信/支付宝支付：模拟成功（实际需对接SDK）
    success = true
  }

  // 支付成功后记录
  if (success) {
    paymentStore.paymentRecords.push({
      payId: `PAY_${Date.now()}`,
      orderId,
      amount: order.fee,
      type: 'payment', // 新增：支付/消费类型
      payMethod,
      status: 'success' as 'success' | 'failed',
      payTime: new Date().toLocaleString()
    })
    ElMessage.success('支付成功！订单已开始处理')
  } else {
    ElMessage.error(payMethod === 'balance' ? '账户余额不足，请选择其他支付方式或充值' : '支付失败，请重试')
  }
}

// 提交充值
const submitRecharge = async () => {
  if (!rechargeFormRef.value) return
  try {
    const valid = await rechargeFormRef.value.validate()
    if (!valid) return

    ElMessageBox.confirm(
        `确认充值${rechargeForm.amount}元？将通过${formatPayMethod({ payMethod: rechargeForm.payMethod })}完成支付`,
        '充值确认',
        {
          confirmButtonText: '确认支付',
          cancelButtonText: '取消',
          type: 'info' as const
        }
    ).then(() => {
      // 调用充值方法
      paymentStore.recharge(rechargeForm.amount)
      // 记录充值记录
      paymentStore.paymentRecords.push({
        payId: `PAY_${Date.now()}`,
        orderId: `RECHARGE_${Date.now()}`,
        amount: rechargeForm.amount,
        type: 'recharge',
        payMethod: rechargeForm.payMethod,
        status: 'success' as 'success' | 'failed',
        payTime: new Date().toLocaleString()
      })
      ElMessage.success('充值成功！余额已更新')
      rechargeForm.amount = 0
    })
  } catch (error) {
    ElMessage.error('表单填写有误，请检查')
  }
}

// 开具发票
const showInvoice = (record: any) => {
  ElMessageBox.alert(
      `<div style="padding: 16px;">
      <h3>电子发票</h3>
      <p>支付ID：${record.payId}</p>
      <p>订单ID：${record.orderId}</p>
      <p>金额：${typeof record.amount === 'number' ? record.amount.toFixed(2) : record.amount}元</p>
      <p>支付时间：${record.payTime}</p>
      <p>发票状态：已生成（将发送至您的邮箱）</p>
    </div>`,
      '发票详情',
      {
        confirmButtonText: '确认',
        dangerouslyUseHTMLString: true,
        type: 'info' as const
      }
  )
}
</script>

<style scoped>
.payment-content {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.payment-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.el-tabs {
  margin-top: 10px;
}
</style>