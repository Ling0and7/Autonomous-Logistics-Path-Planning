<template>
  <div class="admin-dashboard">
    <!-- 数据概览 -->
    <div class="stats-card">
      <el-card shadow="hover" class="stat-item">
        <div class="stat-title">今日订单总数</div>
        <div class="stat-value">{{ todayOrderCount }}</div>
        <div class="stat-desc">较昨日 <span class="up">+12%</span></div>
      </el-card>

      <el-card shadow="hover" class="stat-item">
        <div class="stat-title">待处理订单</div>
        <div class="stat-value">{{ pendingOrderCount }}</div>
        <div class="stat-desc">较昨日 <span class="down">-5%</span></div>
      </el-card>

      <el-card shadow="hover" class="stat-item">
        <div class="stat-title">正常运行车辆</div>
        <div class="stat-value">{{ normalCarCount }}</div>
        <div class="stat-desc">共{{ carStore.cars.length }}辆（{{ carStore.cars.length > 0 ? (normalCarCount / carStore.cars.length * 100).toFixed(0) : 0 }}%）</div>
      </el-card>

      <el-card shadow="hover" class="stat-item">
        <div class="stat-title">今日收入(元)</div>
        <div class="stat-value">{{ todayIncome.toFixed(2) }}</div>
        <div class="stat-desc">较昨日 <span class="up">+8%</span></div>
      </el-card>
    </div>

    <!-- 主体内容：左右布局（优化高度计算，避免挤压） -->
    <div class="main-layout">
      <!-- 左侧：地图和车辆管理 -->
      <div class="left-panel">
        <!-- 快递车实时地图（强制高度，恢复显示） -->
        <el-card class="map-card">
          <div slot="header">快递车实时位置</div>
          <!-- 强制地图容器高度，确保地图渲染 -->
          <div class="campus-map-wrapper">
            <CampusMap :center="[120.3702, 30.3198]" :zoom="16" />
          </div>
        </el-card>

        <!-- 车辆管理 -->
        <el-card class="car-manage-card">
          <div slot="header">
            <span>车辆管理</span>
            <el-button type="primary" size="small" @click="showAddCarDialog = true">添加车辆</el-button>
          </div>

          <el-table
              :data="carStore.cars"
              border
              @row-click="handleCarRowClick"
              :max-height="500"
          style="width: 100%;"
          >
          <el-table-column prop="id" label="车辆ID" width="120" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="statusTagType(scope.row.status as CarStatus)">
                {{ formatCarStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="battery" label="电量(%)" width="120">
            <template #default="scope">
              <el-progress
                  :percentage="Number(scope.row.battery)"
                  :stroke-width="8"
                  :status="Number(scope.row.battery) < 20 ? 'exception' : ''"
              />
            </template>
          </el-table-column>
          <el-table-column prop="currentTask" label="当前任务" />
          <el-table-column label="操作" width="280">
            <template #default="scope">
              <el-button
                  type="text"
                  size="small"
                  @click="updateCarStatus(scope.row.id, 'running')"
                  :disabled="scope.row.status === 'running'"
              >
                启动
              </el-button>
              <el-button
                  type="text"
                  size="small"
                  @click="updateCarStatus(scope.row.id, 'idle')"
                  :disabled="scope.row.status === 'idle'"
              >
                闲置
              </el-button>
              <el-button
                  type="text"
                  size="small"
                  @click="updateCarStatus(scope.row.id, 'error')"
                  :disabled="scope.row.status === 'error'"
                  style="color: #f56c6c;"
              >
                故障
              </el-button>
              <!-- 删除车辆按钮 -->
              <el-button
                  type="text"
                  size="small"
                  @click="deleteCar(scope.row.id)"
                  style="color: #ff4d4f;"
                  icon="el-icon-delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 右侧：订单管理和数据图表（底部对齐） -->
      <div class="right-panel">
        <!-- 订单管理（固定高度，避免影响对齐） -->
        <el-card class="order-manage-card">
          <div slot="header">订单管理</div>
          <el-input v-model="orderSearchKeyword" placeholder="搜索订单号/地址" style="margin-bottom: 15px;" />
          <el-table :data="filteredOrders" border :max-height="300">
            <el-table-column prop="orderId" label="订单号" width="180" />
            <el-table-column prop="type" label="类型" width="100" :formatter="formatOrderType" />
            <el-table-column prop="senderName" label="寄件人" width="120" v-if="orderTypeFilter === 'send'" />
            <el-table-column prop="receiverName" label="收件人" width="120" v-if="orderTypeFilter === 'send'" />
            <el-table-column prop="packageId" label="快递单号" width="180" v-if="orderTypeFilter === 'receive'" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="orderStatusTagType(scope.row.status as OrderStatus)">
                  {{ formatOrderStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fee" label="金额(元)" width="120" v-if="orderTypeFilter === 'send'" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="text" size="small" @click="viewOrderDetail(scope.row.orderId)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="order-filter" style="margin-top: 15px; text-align: right;">
            <el-select v-model="orderTypeFilter" placeholder="订单类型" size="small" @change="handleOrderTypeChange">
              <el-option label="全部订单" value="all" />
              <el-option label="寄件订单" value="send" />
              <el-option label="取件订单" value="receive" />
            </el-select>
            <el-select v-model="orderStatusFilter" placeholder="订单状态" size="small" style="margin-left: 10px;">
              <el-option label="全部状态" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
              <el-option label="已取件" value="picked" />
              <el-option label="已过期" value="expired" />
            </el-select>
          </div>
        </el-card>

        <!-- 数据图表（订单趋势）→ 占满剩余高度，底部对齐 -->
        <el-card class="chart-card">
          <div slot="header">近7日订单趋势</div>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </div>
    </div>

    <!-- 添加车辆弹窗 -->
    <el-dialog v-model="showAddCarDialog" title="添加新快递车" width="400px">
      <el-form :model="newCarForm" ref="newCarFormRef" label-width="100px">
        <el-form-item label="车辆ID" prop="id">
          <el-input v-model="newCarForm.id" placeholder="如：CAR_004" />
        </el-form-item>
        <el-form-item label="初始状态" prop="status">
          <el-select v-model="newCarForm.status" placeholder="选择初始状态">
            <el-option label="闲置" value="idle" />
            <el-option label="运行中" value="running" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始电量(%)" prop="battery">
          <el-input v-model.number="newCarForm.battery" type="number" min="0" max="100" />
        </el-form-item>
        <el-form-item label="初始位置" prop="position">
          <el-input v-model="newCarForm.position" placeholder="经度,纬度（如：120.3702,30.3198）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCarDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAddCar">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="orderDetailVisible" title="订单详情" width="600px">
      <el-descriptions :column="1" v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderId }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ formatOrderType(currentOrder) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ formatOrderStatus(currentOrder.status) }}</el-descriptions-item>

        <el-descriptions-item label="寄件人信息" v-if="currentOrder.type === 'send'">
          <div>姓名：{{ currentOrder.senderName }}</div>
          <div>电话：{{ currentOrder.senderPhone }}</div>
          <div>取件地址：{{ currentOrder.pickupAddress }}</div>
          <div>取件时间：{{ currentOrder.pickupTime }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="收件人信息" v-if="currentOrder.type === 'send'">
          <div>姓名：{{ currentOrder.receiverName }}</div>
          <div>电话：{{ currentOrder.receiverPhone }}</div>
          <div>收件地址：{{ currentOrder.deliveryAddress }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="快递信息" v-if="currentOrder.type === 'receive'">
          <div>快递单号：{{ currentOrder.packageId }}</div>
          <div>寄件方：{{ currentOrder.sender }}</div>
          <div>到达时间：{{ currentOrder.arriveTime }}</div>
          <div>存放位置：{{ currentOrder.location }}</div>
          <div>取件码：{{ currentOrder.pickupCode }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="费用信息" v-if="currentOrder.type === 'send'">
          <div>应付金额：{{ currentOrder.fee }}元</div>
          <div>支付状态：{{ getPaymentStatus(currentOrder.orderId) }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="处理进度" v-if="currentOrder.type === 'send' && 'progress' in currentOrder">
          <el-timeline>
            <el-timeline-item
                v-for="(step, index) in currentOrder.progress"
                :key="index"
                :timestamp="step.time"
                :status="index === currentOrder.progress.length - 1 ? 'success' : 'process'"
            >
              {{ step.desc }}
            </el-timeline-item>
          </el-timeline>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useCarStore } from '@/stores/carStore'
import { useOrderStore } from '@/stores/orderStore'
import { usePaymentStore } from '@/stores/paymentStore'
import CampusMap from '@/components/map/CampusMap.vue'
import {
  ElCard, ElTable, ElTableColumn, ElInput, ElButton,
  ElTag, ElProgress, ElSelect, ElOption, ElDialog, ElForm,
  ElFormItem, ElDescriptions, ElDescriptionsItem, ElTimeline,
  ElTimelineItem
} from 'element-plus'
import * as echarts from 'echarts'

// 初始化核心Store和路由
const userStore = useUserStore()
const carStore = useCarStore()
const orderStore = useOrderStore()
const paymentStore = usePaymentStore()
const router = useRouter()

// 核心类型定义
type CarStatus = 'running' | 'idle' | 'error'
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'picked' | 'expired'
type OrderType = 'send' | 'receive'
interface BaseOrder {
  orderId: string
  type: OrderType
  status: OrderStatus
  createTime: string
  [key: string]: any
}

// 状态控制变量
const showAddCarDialog = ref(false)
const orderDetailVisible = ref(false)
const currentOrder = ref<BaseOrder | null>(null)
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 订单筛选变量
const orderSearchKeyword = ref('')
const orderTypeFilter = ref<OrderType | 'all'>('all')
const orderStatusFilter = ref<OrderStatus | ''>('')

// 车辆表单数据
const newCarForm = reactive({
  id: '',
  status: 'idle' as CarStatus,
  battery: 100 as number,
  position: '120.3702,30.3198' // 强制杭州下沙坐标
})
const newCarFormRef = ref<InstanceType<typeof ElForm> | null>(null)

// 数据概览统计
const todayOrderCount = computed(() => {
  const today = new Date().toLocaleDateString()
  return orderStore.orders.filter(order => order.createTime.includes(today)).length
})

const pendingOrderCount = computed(() => {
  return orderStore.orders.filter(order => order.status === 'pending').length
})

const normalCarCount = computed(() => {
  return carStore.cars.filter(car => car.status !== 'error').length
})

const todayIncome = computed<number>(() => {
  const today = new Date().toLocaleDateString()
  return paymentStore.paymentRecords
      .filter(record => record.status === 'success' && record.payTime.includes(today))
      .reduce((sum, record) => {
        const amount = typeof record.amount === 'string' ? parseFloat(record.amount) : record.amount
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
})

// 筛选后的订单列表
const filteredOrders = computed<BaseOrder[]>(() => {
  let orders: BaseOrder[] = []
  if (orderTypeFilter.value === 'all') {
    orders = orderStore.orders as BaseOrder[]
  } else if (orderTypeFilter.value === 'send') {
    orders = (orderStore.sendOrders || orderStore.orders.filter(o => o.type === 'send')) as BaseOrder[]
  } else {
    orders = (orderStore.receiveOrders || orderStore.orders.filter(o => o.type === 'receive')) as BaseOrder[]
  }

  if (orderStatusFilter.value) {
    orders = orders.filter(order => order.status === orderStatusFilter.value)
  }

  if (orderSearchKeyword.value) {
    orders = orders.filter(order =>
        order.orderId.includes(orderSearchKeyword.value) ||
        (order.pickupAddress && order.pickupAddress.includes(orderSearchKeyword.value)) ||
        (order.deliveryAddress && order.deliveryAddress.includes(orderSearchKeyword.value)) ||
        (order.packageId && order.packageId.includes(orderSearchKeyword.value))
    )
  }

  return orders
})

// 状态标签类型映射
const statusTagType = (status: CarStatus): 'success' | 'info' | 'danger' => {
  const typeMap = {
    running: 'success',
    idle: 'info',
    error: 'danger'
  } as const
  return typeMap[status]
}

const orderStatusTagType = (status: OrderStatus): 'success' | 'info' | 'danger' | 'warning' => {
  const typeMap = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    cancelled: 'danger',
    picked: 'success',
    expired: 'danger'
  } as const
  return typeMap[status]
}

// 格式化函数
const formatCarStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    idle: '闲置',
    error: '故障'
  }
  return statusMap[status] || '未知状态'
}

const formatOrderType = (order: BaseOrder): string => {
  return order.type === 'send' ? '寄件订单' : '取件订单'
}

const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
    picked: '已取件',
    expired: '已过期'
  }
  return statusMap[status] || '未知状态'
}

// 支付状态查询
const getPaymentStatus = (orderId: string): string => {
  const record = paymentStore.getPaymentByOrderId(orderId)
  if (!record) return '未支付'
  return record.status === 'success' ? '已支付' : '支付失败'
}

// 订单类型筛选切换
const handleOrderTypeChange = () => {
  orderStatusFilter.value = ''
}

// 车辆行点击事件
const handleCarRowClick = (car: any) => {
  ElMessageBox.alert(
      `<div>
      <p>车辆ID：${car.id}</p>
      <p>状态：${formatCarStatus(car.status)}</p>
      <p>电量：${car.battery}%</p>
      <p>当前任务：${car.currentTask || '无'}</p>
      <p>位置：${car.position?.join(', ') || '未知'}</p>
    </div>`,
      `车辆${car.id}详情`,
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
        type: 'info' as const,
        draggable: false
      }
  )
}

// 更新车辆状态
const updateCarStatus = (carId: string, status: CarStatus) => {
  carStore.updateCarStatus(carId, status)
  ElMessage.success(`车辆${carId}状态已更新为${formatCarStatus(status)}`)
}

const deleteCar = async (carId: string) => {
  try {

    await ElMessageBox.confirm(
        `确定要删除车辆【${carId}】吗？此操作不可恢复！`,
        {
          title: '删除车辆确认', // 标题移到配置对象内
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        }
    )
    // 调用Store的删除方法
    carStore.deleteCarById(carId)
    ElMessage.success(`车辆【${carId}】已成功删除`)
  } catch (error) {
    ElMessage.info('已取消删除车辆操作')
  }
}

// 提交添加车辆
const submitAddCar = async () => {
  if (!newCarFormRef.value) return
  try {
    if (!newCarForm.id.trim()) throw new Error('请输入车辆ID')
    if (carStore.cars.some(car => car.id === newCarForm.id)) throw new Error('该车辆ID已存在')

    const position = newCarForm.position.split(',').map(Number)
    // 校验坐标是否在杭州下沙范围内（增强校验）
    const [lng, lat] = position
    if (position.length !== 2 || isNaN(lng) || isNaN(lat) || lng < 120.365 || lng > 120.375 || lat < 30.315 || lat > 30.325) {
      throw new Error('请输入杭州下沙范围内的经纬度（如：120.3702,30.3198）')
    }
    if (newCarForm.battery < 0 || newCarForm.battery > 100) {
      throw new Error('电量必须在0-100之间')
    }

    carStore.addCar({
      id: newCarForm.id,
      status: newCarForm.status,
      battery: newCarForm.battery,
      position: position as [number, number],
      currentTask: '无'
    })

    ElMessage.success('车辆添加成功')
    showAddCarDialog.value = false
    // 重置表单
    newCarForm.id = ''
    newCarForm.status = 'idle'
    newCarForm.battery = 100
    newCarForm.position = '120.3702,30.3198'
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '添加失败，请重试'
    ElMessage.error(errorMsg)
  }
}

// 查看订单详情
const viewOrderDetail = (orderId: string) => {
  const order = orderStore.getOrderDetail(orderId) as BaseOrder | undefined
  if (order) {
    currentOrder.value = order
    orderDetailVisible.value = true
  } else {
    ElMessage.error('订单不存在或已删除')
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + i)
    return date.getDate() + '日'
  })
  const sendOrderData = [12, 19, 15, 22, 18, 25, 28]
  const receiveOrderData = [8, 15, 10, 18, 12, 20, 22]

  chartInstance = echarts.init(chartRef.value as HTMLDivElement)
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['寄件订单', '取件订单'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: days },
    yAxis: { type: 'value', min: 0 },
    series: [
      {
        name: '寄件订单',
        type: 'line',
        data: sendOrderData,
        smooth: true,
        itemStyle: { color: '#3498db' },
        lineStyle: { color: '#3498db' }
      },
      {
        name: '取件订单',
        type: 'line',
        data: receiveOrderData,
        smooth: true,
        itemStyle: { color: '#2ecc71' },
        lineStyle: { color: '#2ecc71' }
      }
    ]
  })

  const resizeHandler = () => {
    chartInstance?.resize()
  }
  window.addEventListener('resize', resizeHandler)

  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler)
  })
}

// 组件生命周期
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

onMounted(() => {
  initChart()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px 0;
}

.stat-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #2c3e50;
}

.stat-desc {
  font-size: 14px;
  color: #999;
}

.up { color: #2ecc71; }
.down { color: #e74c3c; }

/* 主布局：优化高度计算，避免内容挤压 */
.main-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  height: calc(100vh - 220px); /* 调整高度，适配数据概览的高度 */
}

/* 左右面板：占满高度，允许内部滚动 */
.left-panel, .right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

/* 地图卡片：强制高度，确保地图渲染 */
.map-card {
  flex-shrink: 0;
}
.campus-map-wrapper {
  width: 100%;
  height: 400px !important; /* 强制高度，优先级最高 */
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

/* 车辆管理卡片：优化布局，表格滚动正常 */
.car-manage-card {
  flex: 1;
  min-height: 400px; /* 调大最小高度 */
  display: flex;
  flex-direction: column;
}
/* 强制车辆表格滚动条显示，确保4辆车能完整展示 */
:deep(.car-manage-card .el-table) {
  flex: 1;
}
:deep(.car-manage-card .el-table__body-wrapper) {
  overflow-y: auto !important;
  max-height: calc(100% - 40px) !important; /* 适配卡片内边距 */
}

/* 订单管理卡片：固定高度 */
.order-manage-card {
  flex-shrink: 0;
  height: 350px;
}

/* 图表卡片：占满剩余高度 */
.chart-card {
  flex: 1;
}
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.order-filter {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 响应式适配：小屏幕优化 */
@media (max-width: 1200px) {
  .main-layout {
    flex-direction: column;
    height: auto; /* 小屏幕高度自适应 */
  }
  .campus-map-wrapper {
    height: 350px !important;
  }
  .order-manage-card {
    height: auto;
  }
  .chart-container {
    min-height: 250px;
  }
  /* 小屏幕表格高度自适应 */
  :deep(.car-manage-card .el-table__body-wrapper) {
    max-height: none !important;
  }
}

@media (max-width: 768px) {
  .stats-card {
    grid-template-columns: 1fr;
  }
  .admin-dashboard {
    padding: 10px;
  }
  .campus-map-wrapper {
    height: 300px !important;
  }
  .chart-container {
    min-height: 200px;
  }
  /* 小屏幕操作列换行 */
  :deep(.car-manage-card .el-table .el-button) {
    margin-bottom: 5px;
  }
}

/* 隐藏高德地图logo和版权信息 */
:deep(.amap-logo),
:deep(.amap-copyright),
:deep(.amap-control-bar) {
  display: none !important;
}
</style>