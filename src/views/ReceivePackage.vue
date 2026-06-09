<template>
  <div class="receive-package-container">
    <el-card shadow="hover" class="receive-card">
      <div slot="header">我的取件</div>

      <!-- 取件订单筛选 -->
      <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          size="small"
          style="margin-bottom: 15px;"
          @change="handleStatusChange"
      >
        <el-option label="全部取件" value="" />
        <el-option label="待取件" value="pending" />
        <el-option label="已取件" value="picked" />
        <el-option label="已过期" value="expired" />
      </el-select>

      <!-- 取件订单列表 -->
      <el-table
          :data="filteredOrders"
          border
          style="width: 100%"
          :empty-text="isEmpty ? '暂无取件订单' : '加载中...'"
      >
        <el-table-column prop="orderId" label="订单号" width="180" />
        <el-table-column prop="packageId" label="快递单号" width="180" />
        <el-table-column prop="sender" label="寄件方" width="150" />
        <el-table-column prop="arriveTime" label="到达时间" width="180" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="status" label="状态" width="120" :formatter="formatStatus" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
                type="primary"
                size="small"
                @click="showPickupCode(scope.row)"
                v-if="scope.row.status === 'pending'"
            >
              显示取件码
            </el-button>
            <el-button
                type="success"
                size="small"
                @click="confirmPickup(scope.row)"
                v-if="scope.row.status === 'pending'"
                style="margin-left: 5px;"
            >
              确认取件
            </el-button>
            <el-tag type="info" v-else>已完成</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 取件码弹窗 -->
    <el-dialog v-model="codeVisible" title="取件码" width="300px">
      <div class="code-content" v-if="currentOrder">
        <p>订单号：{{ currentOrder.orderId }}</p>
        <p>快递单号：{{ currentOrder.packageId }}</p>
        <p class="pickup-code">取件码：{{ currentOrder.pickupCode }}</p>
        <p>请在智能柜输入取件码取件</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElDialog, ElTag, ElButton, ElTable, ElTableColumn, ElSelect, ElOption, ElCard } from 'element-plus'
import { useReceiveStore } from '@/stores/receiveStore'
import type { ReceiveOrder } from '@/stores/receiveStore'

// 状态管理
const receiveStore = useReceiveStore()

// 筛选状态
const statusFilter = ref('')
// 取件码弹窗控制
const codeVisible = ref(false)
// 当前选中的订单（明确类型为ReceiveOrder）
const currentOrder = ref<ReceiveOrder | null>(null)
// 空状态判断
const isEmpty = ref(true)

// 筛选后的订单列表（明确类型为ReceiveOrder数组）
const filteredOrders = computed<ReceiveOrder[]>(() => {
  const orders = receiveStore.receiveOrders
  isEmpty.value = orders.length === 0

  if (!statusFilter.value) return orders
  return orders.filter(order => order.status === statusFilter.value)
})

// 格式化订单状态
const formatStatus = (row: ReceiveOrder) => {
  const statusMap = {
    pending: '待取件',
    picked: '已取件',
    expired: '已过期'
  }
  return statusMap[row.status] || row.status
}

// 状态筛选变化
const handleStatusChange = () => {
  // 筛选逻辑由computed自动处理
}

// 显示取件码（参数类型明确为ReceiveOrder）
const showPickupCode = (order: ReceiveOrder) => {
  currentOrder.value = order
  codeVisible.value = true
}

const confirmPickup = (order: ReceiveOrder) => {
  ElMessageBox.confirm(
      '确认已取件？', // 提示内容
      '提示', // 标题
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info' as const // 明确类型为info，匹配Element Plus的重载定义
      }
  ).then(() => {
    receiveStore.updateReceiveStatus(order.orderId, 'picked')
    ElMessage.success('已确认取件') // 成功提示使用ElMessage
  }).catch(() => {
    // 取消取件时的回调
    ElMessage.info('已取消确认')
  })
}

// 初始化：模拟加载取件订单
onMounted(() => {
  // 实际项目中可替换为接口请求
  setTimeout(() => {
    receiveStore.importReceiveOrders([
      {
        orderId: 'REC_123456',
        type: 'receive',
        packageId: 'SF1234567890',
        sender: '京东商城',
        receiverName: '张三',
        receiverPhone: '13800138000',
        arriveTime: '2025-11-04 09:30:00',
        location: '2号智能柜A3格口',
        pickupCode: '887766',
        status: 'pending',
        createTime: '2025-11-04 09:30:00'
      },
      {
        orderId: 'REC_789012',
        type: 'receive',
        packageId: 'YT9876543210',
        sender: '淘宝商家',
        receiverName: '张三',
        receiverPhone: '13800138000',
        arriveTime: '2025-11-03 15:45:00',
        location: '1号智能柜B5格口',
        pickupCode: '123456',
        status: 'picked',
        createTime: '2025-11-03 15:45:00'
      }
    ])
  }, 500)
})
</script>

<style scoped>
.receive-package-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.receive-card {
  max-width: 1200px;
  margin: 0 auto;
}

.code-content {
  text-align: center;
  padding: 20px 0;
}

.pickup-code {
  font-size: 24px;
  font-weight: bold;
  color: #165DFF;
  margin: 15px 0;
  letter-spacing: 2px;
}
</style>