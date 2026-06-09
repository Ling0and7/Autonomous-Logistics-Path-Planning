import { defineStore } from 'pinia'

// 寄件订单类型
interface SendOrder {
    orderId: string
    type: 'send'
    senderName: string
    senderPhone: string
    pickupAddress: string
    pickupTime: string
    receiverName: string
    receiverPhone: string
    deliveryAddress: string
    itemType: string
    weight: number
    insurance: boolean
    remark: string
    fee: number
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
    createTime: string
    progress: Array<{ time: string; desc: string }> // 处理进度
}

// 取件订单类型（关联快递）
interface ReceiveOrder {
    orderId: string
    type: 'receive'
    packageId: string // 快递单号
    sender: string // 寄件方（外部快递）
    arriveTime: string // 到达时间
    location: string // 存放位置（智能柜/无人车）
    pickupCode: string // 取件码
    status: 'pending' | 'picked' | 'expired'
    createTime: string
}

type Order = SendOrder | ReceiveOrder

export const useOrderStore = defineStore('order', {
    state: () => ({
        orders: [] as Order[] // 所有订单
    }),
    actions: {
        // 添加寄件订单
        addSendOrder(orderData: Omit<SendOrder, 'orderId' | 'type' | 'createTime' | 'progress'>): string {
            const orderId = `SEND_${Date.now()}`
            const newOrder: SendOrder = {
                ...orderData,
                orderId,
                type: 'send',
                createTime: new Date().toLocaleString(),
                progress: [{ time: new Date().toLocaleString(), desc: '订单已创建，等待无人车取件' }]
            }
            this.orders.push(newOrder)
            return orderId // 返回订单号
        },
        // 添加取件订单（模拟外部快递入库）
        addReceiveOrder(pkgData: Omit<ReceiveOrder, 'orderId' | 'type' | 'createTime'>): string {
            const orderId = `RECV_${Date.now()}`
            const newOrder: ReceiveOrder = {
                ...pkgData,
                orderId,
                type: 'receive',
                createTime: new Date().toLocaleString()
            }
            this.orders.push(newOrder)
            return orderId
        },
        // 更新订单状态
        updateOrderStatus(orderId: string, status: Order['status']): boolean {
            const order = this.orders.find(o => o.orderId === orderId)
            if (!order) return false

            order.status = status
            // 自动添加进度记录（寄件订单）
            if (order.type === 'send' && 'progress' in order) {
                const statusDescMap = {
                    pending: '订单已创建，等待无人车取件',
                    processing: '无人车已取件，正在配送',
                    completed: '配送完成，订单已结束',
                    cancelled: '订单已取消'
                }
                order.progress.push({
                    time: new Date().toLocaleString(),
                    desc: statusDescMap[status as keyof typeof statusDescMap] || '状态更新'
                })
            }
            return true
        },
        // 取消订单
        cancelOrder(orderId: string): boolean {
            return this.updateOrderStatus(orderId, 'cancelled')
        },
        // 获取单个订单详情
        getOrderDetail(orderId: string): Order | undefined {
            return this.orders.find(o => o.orderId === orderId)
        }
    },
    getters: {
        // 按类型筛选订单
        sendOrders(): SendOrder[] {
            return this.orders.filter(o => o.type === 'send') as SendOrder[]
        },
        receiveOrders(): ReceiveOrder[] {
            return this.orders.filter(o => o.type === 'receive') as ReceiveOrder[]
        }
    }
})