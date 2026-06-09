<template>
  <div class="admin-payment">
    <h2>缴费中心管理</h2>
    <el-table :data="paymentRecords" border>
      <el-table-column prop="paymentId" label="缴费单号" width="200"></el-table-column>
      <el-table-column prop="orderId" label="关联订单号" width="200"></el-table-column>
      <el-table-column prop="amount" label="金额(元)" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'paid' ? 'success' : 'warning'">
            {{ scope.row.status === 'paid' ? '已支付' : '未支付' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payTime" label="支付时间" width="200"></el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { usePaymentStore } from '@/stores/paymentStore'

const paymentStore = usePaymentStore()
// 获取所有缴费记录（假设paymentStore中有paymentRecords状态）
const paymentRecords = paymentStore.paymentRecords
</script>