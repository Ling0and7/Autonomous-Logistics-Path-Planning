<template>
  <div ref="mapRef" class="campus-map" style="height: 400px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { useCarStore } from '@/stores/carStore'

declare global {
  interface Window {
    AMap: any
  }
}

const mapRef = ref<HTMLDivElement | null>(null)
let map: any = null
let markers: Record<string, any> = {}
const carStore = useCarStore()

// 杭州下沙坐标范围（确保车辆坐标在这个范围内）
const HANGZHOU_BOUNDS = {
  minLng: 120.365,
  maxLng: 120.375,
  minLat: 30.315,
  maxLat: 30.325
}

const updateRunningCarMarkers = () => {
  if (!map) return

  Object.values(markers).forEach(marker => marker.remove())
  markers = {}

  const validCars = carStore.getRunningCars.filter(car => {
    const [lng, lat] = car.position
    return lng >= HANGZHOU_BOUNDS.minLng && lng <= HANGZHOU_BOUNDS.maxLng &&
        lat >= HANGZHOU_BOUNDS.minLat && lat <= HANGZHOU_BOUNDS.maxLat
  })

  validCars.forEach(car => {
    // 方案1：使用稳定的在线CDN图标（推荐）
    const iconUrl = 'https://cdn-icons-png.flaticon.com/32/1544/1544764.png'

    markers[car.id] = new window.AMap.Marker({
      position: car.position,
      title: `快递车${car.id}（运行中）`,
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(32, 32), // 图标显示大小
        image: iconUrl, // 图标资源地址
        imageSize: new window.AMap.Size(32, 32) // 图标实际尺寸（需与image的尺寸匹配）
      })
    })
    markers[car.id].setMap(map)
  })
}

onMounted(async () => {
  if (!mapRef.value) return

  try {
    await AMapLoader.load({
      key: '5bab54fd93eba11f7a3c4edad4a27150', // 确认Key有效
      version: '2.0',
      plugins: ['AMap.Marker']
    })

    // 初始化地图
    map = new window.AMap.Map(mapRef.value, {
      center: [120.3702, 30.3198], // 杭州下沙中心
      zoom: 16,
      resizeEnable: true,
      controls: [],
      mapStyle: 'amap://styles/light',
      restrictBounds: new window.AMap.Bounds(
          [HANGZHOU_BOUNDS.minLng, HANGZHOU_BOUNDS.minLat],
          [HANGZHOU_BOUNDS.maxLng, HANGZHOU_BOUNDS.maxLat]
      )
    })

    // 初始化标记
    updateRunningCarMarkers()
  } catch (err) {
    console.error('地图加载失败：', err)
  }
})

// 监听车辆变化
watch(
    () => carStore.getRunningCars,
    updateRunningCarMarkers,
    { deep: true }
)
</script>

<style scoped>
.campus-map {
  width: 100%;
  min-height: 400px; /* 兜底高度 */
  border: 1px solid #ddd;
  border-radius: 4px;
}

:deep(.amap-logo),
:deep(.amap-copyright) {
  display: none !important;
}
</style>