<template>
  <div class="admin-order-query">
    <h2>订单查询</h2>
    <el-row :gutter="20" class="query-form">
      <el-col :span="6">
        <el-input v-model="searchKey" placeholder="搜索订单号/快递单号"></el-input>
      </el-col>
      <el-col :span="4">
        <el-select v-model="orderType" placeholder="订单类型">
          <el-option label="全部" value=""></el-option>
          <el-option label="寄件" value="send"></el-option>
          <el-option label="取件" value="receive"></el-option>
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="handleQuery">查询</el-button>
      </el-col>
    </el-row>

    <el-table :data="filteredOrders" border style="margin-top: 20px">
      <el-table-column prop="orderId" label="订单号" width="200"></el-table-column>
      <el-table-column
          label="类型"
          width="100"
          :formatter="(row) => row.type === 'send' ? '寄件' : '取件'"
      ></el-table-column>
      <el-table-column
          prop="status"
          label="状态"
          width="120"
          :formatter="(row) => row.type === 'send' ? row.status :
          row.status === 'pending' ? '待取件' : row.status === 'picked' ? '已取件' : '已过期'"
      ></el-table-column>
      <el-table-column
          label="关键信息"
          width="200"
          :formatter="(row) => row.type === 'send' ? row.receiverName : row.packageId"
      ></el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="200"></el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'

const orderStore = useOrderStore()
const searchKey = ref('')
const orderType = ref('') // send/receive/''

// 筛选订单
const filteredOrders = computed(() => {
  return orderStore.orders.filter(order => {
    // 筛选类型
    if (orderType.value && order.type !== orderType.value) return false
    // 筛选搜索关键词
    if (searchKey.value) {
      const key = searchKey.value.toLowerCase()
      return order.orderId.toLowerCase().includes(key) ||
          (order.type === 'receive' && order.packageId.toLowerCase().includes(key))
    }
    return true
  })
})

// 手动触发查询
const handleQuery = () => { /* 依赖computed自动响应，无需额外逻辑 */ }
</script>