import { App } from 'vue'
import io from 'socket.io-client'

type Socket = ReturnType<typeof io>
let socket: Socket | null = null

import { useCarStore } from '@/stores/carStore'
import { useOrderStore } from '@/stores/orderStore'

export default {
    install(app: App): void {
        // 连接后端WebSocket服务
        socket = io('http://localhost:3000', {
            reconnection: true,
            reconnectionAttempts: 5,
            timeout: 10000
        })

        // 监听连接成功
        socket.on('connect', () => {
            console.log('✅ 实时通信已连接')
        })

        // 监听车辆状态更新
        socket.on('carStatus', (data: {
            id: string
            position: [number, number]
            battery: number
            status: 'running' | 'idle' | 'error'
        }) => {
            const carStore = useCarStore()
            carStore.updateCar(data.id, {
                position: data.position,
                battery: data.battery,
                status: data.status
            })
        })

        // 监听订单状态更新
        socket.on('orderStatus', (data: {
            orderId: string
            status: 'pending' | 'processing' | 'completed' | 'cancelled'
        }) => {
            const orderStore = useOrderStore()
            orderStore.updateOrderStatus(data.orderId, data.status)
        })

        // 监听断开连接
        socket.on('disconnect', () => {
            console.log('🔌 实时通信已断开')
        })

        // 挂载到Vue原型
        app.config.globalProperties.$socket = socket
    }
}