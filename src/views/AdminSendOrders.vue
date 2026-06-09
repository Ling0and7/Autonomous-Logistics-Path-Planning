<template>
  <div class="admin-send-orders">
    <h2>寄件订单管理</h2>
    <el-table :data="sendOrders" border>
      <el-table-column prop="orderId" label="订单号" width="200"></el-table-column>
      <el-table-column prop="senderName" label="寄件人" width="120"></el-table-column>
      <el-table-column prop="receiverName" label="收件人" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="statusTypeMap[scope.row.status]">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="200"></el-table-column>
      <el-table-column prop="fee" label="费用(元)" width="100"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button
              size="small"
              @click="handleUpdateStatus(scope.row.orderId, 'processing')"
              :disabled="scope.row.status !== 'pending'"
          >
            开始处理
          </el-button>
          <el-button
              size="small"
              type="success"
              @click="handleUpdateStatus(scope.row.orderId, 'completed')"
              :disabled="!['pending', 'processing'].includes(scope.row.status)"
          >
            完成
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { useOrderStore } from '@/stores/orderStore'

const orderStore = useOrderStore()
// 获取所有寄件订单
const sendOrders = orderStore.sendOrders

// 状态标签样式映射
const statusTypeMap = {
  pending: 'info',
  processing: 'warning',
  completed: 'success',
  cancelled: 'danger'
}

// 更新订单状态
const handleUpdateStatus = (orderId: string, status: 'processing' | 'completed') => {
  orderStore.updateOrderStatus(orderId, status)
}
</script>