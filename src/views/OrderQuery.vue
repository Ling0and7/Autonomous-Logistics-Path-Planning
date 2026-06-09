<template>
  <div class="order-query-container">
    <el-card shadow="hover" class="query-card">
      <div slot="header">订单查询</div>

      <!-- 查询表单 -->
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="订单号">
          <el-input v-model="queryForm.orderId" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="queryForm.type" placeholder="全部类型" clearable>
            <el-option label="寄件订单" value="send" />
            <el-option label="取件订单" value="receive" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 订单列表 -->
      <el-table
          :data="queryResult"
          border
          style="width: 100%; margin-top: 20px"
          :empty-text="isLoading ? '查询中...' : '暂无符合条件的订单'"
      >
        <el-table-column prop="orderId" label="订单号" width="180" />
        <el-table-column prop="type" label="类型" width="100" :formatter="formatType" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="120" :formatter="formatStatus" />
        <el-table-column prop="senderName" label="寄件人" width="120" v-if="queryForm.type === 'send'" />
        <el-table-column prop="receiverName" label="收件人" width="120" v-if="queryForm.type === 'send'" />
        <el-table-column prop="packageId" label="快递单号" width="180" v-if="queryForm.type === 'receive'" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button type="text" size="small" @click="viewDetail(scope.row.orderId)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElCard, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElTable, ElTableColumn } from 'element-plus'

// 订单查询表单数据
const queryForm = reactive({
  orderId: '',
  type: '',
  status: ''
})

// 查询结果（模拟数据，实际应从接口获取）
const queryResult = reactive([])
// 加载状态
const isLoading = reactive({ value: false })

// 处理查询
const handleQuery = () => {
  isLoading.value = true
  // 模拟接口请求延迟
  setTimeout(() => {
    // 实际项目中应替换为真实接口调用
    queryResult.splice(0, queryResult.length) // 清空现有数据
    // 模拟查询结果（仅作示例）
    if (queryForm.orderId || queryForm.type || queryForm.status) {
      queryResult.push({
        orderId: queryForm.orderId || 'ORD_' + Math.random().toString(36).substr(2, 8),
        type: queryForm.type || 'send',
        createTime: new Date().toLocaleString(),
        status: queryForm.status || 'pending',
        senderName: '张三',
        receiverName: '李四',
        packageId: 'PKG_' + Math.random().toString(36).substr(2, 8)
      })
    }
    isLoading.value = false
  }, 500)
}

// 重置查询
const resetQuery = () => {
  queryForm.orderId = ''
  queryForm.type = ''
  queryForm.status = ''
  queryResult.splice(0, queryResult.length) // 清空结果
}

// 格式化订单类型
const formatType = (row: any) => {
  return row.type === 'send' ? '寄件订单' : '取件订单'
}

// 格式化订单状态
const formatStatus = (row: any) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[row.status] || row.status
}

// 查看订单详情（实际项目中应跳转或弹窗展示详情）
const viewDetail = (orderId: string) => {
  console.log('查看订单详情：', orderId)
  // 示例：可在这里调用接口获取详情并弹窗展示
}
</script>

<style scoped>
.order-query-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.query-form {
  margin-bottom: 10px;
}

.el-form-item {
  margin-right: 15px;
}
</style>