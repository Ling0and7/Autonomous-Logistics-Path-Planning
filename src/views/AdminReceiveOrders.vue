<template>
  <div class="admin-receive-orders">
    <h2>取件订单管理</h2>
    <el-table :data="receiveOrders" border>
      <el-table-column prop="orderId" label="订单号" width="200"></el-table-column>
      <el-table-column prop="packageId" label="快递单号" width="180"></el-table-column>
      <el-table-column prop="sender" label="寄件方" width="150"></el-table-column>
      <el-table-column prop="arriveTime" label="到达时间" width="200"></el-table-column>
      <el-table-column prop="location" label="存放位置" width="150"></el-table-column>
      <el-table-column prop="pickupCode" label="取件码" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="statusTypeMap[scope.row.status]">
            {{ scope.row.status === 'pending' ? '待取件' : scope.row.status === 'picked' ? '已取件' : '已过期' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { useOrderStore } from '@/stores/orderStore'

const orderStore = useOrderStore()
// 获取所有取件订单
const receiveOrders = orderStore.receiveOrders

// 状态标签样式映射
const statusTypeMap = {
  pending: 'info',
  picked: 'success',
  expired: 'danger'
}
</script>