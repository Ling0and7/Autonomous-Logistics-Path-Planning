<template>
  <div class="student-home-container">
    <!-- 欢迎卡片 -->
    <el-card shadow="hover" class="welcome-card">
      <div class="welcome-content">
        <h2>欢迎回来，{{ userStore.userInfo?.username }} 同学</h2>
        <p>当前可使用的服务：快递寄件 / 快递取件 / 订单查询</p>
      </div>
    </el-card>

    <!-- 功能入口区 -->
    <div class="function-grid">
      <el-card shadow="hover" class="function-card" @click="handleNavigate('send')">
        <div class="function-icon">
          <el-icon :size="36"><Paperclip /></el-icon>
        </div>
        <div class="function-name">快递寄件</div>
        <div class="function-desc">一键下单，智能柜取件</div>
      </el-card>
      <el-card shadow="hover" class="function-card" @click="handleNavigate('receive')">
        <div class="function-icon">
          <el-icon :size="36"><Download /></el-icon>
        </div>
        <div class="function-name">快递取件</div>
        <div class="function-desc">输入取件码，快速取件</div>
      </el-card>
      <el-card shadow="hover" class="function-card" @click="handleNavigate('query')">
        <div class="function-icon">
          <el-icon :size="36"><Search /></el-icon>
        </div>
        <div class="function-name">订单查询</div>
        <div class="function-desc">查看所有订单状态</div>
      </el-card>
      <el-card shadow="hover" class="function-card">
        <div class="function-icon">
          <el-icon :size="36"><Monitor /></el-icon>
        </div>
        <div class="function-name">服务状态</div>
        <div class="function-desc">智能柜在线率：{{ onlineRate }}%</div>
        <el-progress :percentage="onlineRate" :stroke-width="6" style="margin-top: 10px;" />
      </el-card>
    </div>

    <!-- 核心布局：订单+图片左、地图右（完全对齐） -->
    <div class="order-map-wrapper">
      <!-- 左侧：订单 + 图片（纵向容器） -->
      <div class="order-img-container">
        <!-- 最近订单（顶部与地图顶部对齐） -->
        <el-card shadow="hover" class="recent-orders">
          <div slot="header">最近订单</div>
          <el-table :data="recentOrders" border :max-height="200">
            <el-table-column prop="orderId" label="订单号" width="160" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'send' ? 'primary' : 'success'">
                  {{ scope.row.type === 'send' ? '寄件' : '取件' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="180" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)">
                  {{ scope.row.statusText }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleViewOrder(scope.row.orderId)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 图片容器（底部与地图底部对齐，宽度与订单对齐） -->
        <div class="img-wrapper"></div>
      </div>

      <!-- 右侧：地图卡片（对齐基准） -->
      <el-card shadow="hover" class="delivery-map-card">
        <div slot="header">快递无人车实时位置</div>
        <CampusMap ref="campusMapRef" :center="[120.3699, 30.3195]" :zoom="16" />
        <div class="car-status">
          <p>当前配送订单：<span>{{ currentDeliveryOrder }}</span></p>
          <p>预计到达时间：<span>{{ estimatedArrival }}</span></p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { Paperclip, Download, Search, Monitor } from '@element-plus/icons-vue'
import { ElCard, ElIcon, ElProgress, ElTable, ElTableColumn, ElTag, ElButton } from 'element-plus'
// 导入地图组件（路径根据实际项目调整）
import { CampusMap } from '@/plugins/map'

// 初始化核心实例
const userStore = useUserStore()
const router = useRouter()
const onlineRate = ref<number>(92)

// 地图相关变量
const campusMapRef = ref<any>(null)
const currentDeliveryOrder = ref('SEND_345678')
const estimatedArrival = ref('15:40')
let carPosition = ref<[number, number]>([120.3699, 30.3195])
let carMoveTimer: NodeJS.Timeout | null = null

// 路由导航方法
const handleNavigate = (path: string) => {
  const pathMap = { send: 'send', receive: 'receive', query: 'order-query' }
  const targetPath = pathMap[path] || path
  router.push(`/student/${targetPath}`)
}

// 最近订单数据
const recentOrders = ref([
  {
    orderId: 'SEND_123456',
    type: 'send',
    createTime: '2025-11-04 10:20:30',
    status: 'completed',
    statusText: '已完成'
  },
  {
    orderId: 'REC_789012',
    type: 'receive',
    createTime: '2025-11-03 16:45:12',
    status: 'picked',
    statusText: '已取件'
  },
  {
    orderId: 'SEND_345678',
    type: 'send',
    createTime: '2025-11-02 09:15:55',
    status: 'processing',
    statusText: '处理中'
  }
])

// 订单状态标签类型映射
const getStatusTagType = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    picked: 'success',
    cancelled: 'danger',
    expired: 'danger'
  } as const
  return typeMap[status as keyof typeof typeMap] || 'info'
}

// 查看订单详情
const handleViewOrder = (orderId: string) => {
  router.push(`/student/query?orderId=${orderId}`)
}

// 模拟快递车位置更新
const updateCarPosition = () => {
  carPosition.value[0] += (Math.random() - 0.5) * 0.0005
  carPosition.value[1] += (Math.random() - 0.5) * 0.0005
  campusMapRef.value?.addCarMarker('car001', carPosition.value)
}

// 页面挂载时初始化
onMounted(() => {
  setTimeout(() => {
    campusMapRef.value?.addCarMarker('car001', carPosition.value)
    carMoveTimer = setInterval(updateCarPosition, 3000)
  }, 1000)
})

// 页面卸载时清理资源
onUnmounted(() => {
  if (carMoveTimer) clearInterval(carMoveTimer)
})
</script>

<style scoped>
.student-home-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.welcome-card {
  padding: 20px;
  margin-bottom: 20px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.function-card {
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.function-card:hover {
  transform: translateY(-5px);
}

.function-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.function-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
}

.function-desc {
  color: #666;
  font-size: 14px;
}

/* 核心布局：订单+图片 与 地图 左右分布，顶部对齐 */
.order-map-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-start; /* 订单顶部 ↔ 地图顶部 对齐 */
}

/* 左侧容器：订单+图片纵向排列，高度与地图一致 */
.order-img-container {
  flex: 1;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(500px + 40px); /* 匹配地图卡片总高度 */
}

/* 最近订单：宽度100%，与地图顶部对齐 */
.recent-orders {
  width: 100%;
}

/* 图片容器：填充剩余空间，底部与地图底部对齐 */
.img-wrapper {
  flex: 1;
  background-image: url('/Zjweu.png');
  background-size: cover;
  background-position: bottom;
  background-repeat: no-repeat;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 右侧地图卡片：固定高度作为对齐基准 */
.delivery-map-card {
  flex: 1;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  height: calc(500px + 40px); /* 与左侧容器高度完全一致 */
}

/* 地图组件样式（修复选择器未使用问题） */
:deep(.campus-map-container) {
  flex: 1;
  min-height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.car-status {
  padding: 10px 0;
  font-size: 14px;
  color: #333;
  margin-top: 10px;
}

.car-status span {
  color: #409eff;
  font-weight: 500;
}

/* 响应式适配：小屏幕堆叠 */
@media (max-width: 1024px) {
  .order-map-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .order-img-container, .delivery-map-card {
    min-width: 100%;
    height: auto;
  }
  .img-wrapper {
    min-height: 300px;
  }
  :deep(.campus-map-container) {
    min-height: 300px;
  }
}
</style>