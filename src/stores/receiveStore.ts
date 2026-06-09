import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid' // 用于生成唯一订单ID

// 定义取件订单类型（取件订单特有属性）
export interface ReceiveOrder {
    orderId: string
    type: 'receive'
    packageId: string
    sender: string
    receiverName: string
    receiverPhone: string
    arriveTime: string
    location: string
    pickupCode: string
    status: 'pending' | 'picked' | 'expired'
    createTime: string
}

export const useReceiveStore = defineStore('receive', {
    state: () => ({
        // 取件订单列表（初始可放示例数据）
        receiveOrders: [] as ReceiveOrder[]
    }),

    getters: {
        // 获取所有待取件订单
        pendingReceives: (state) => {
            return state.receiveOrders.filter(order => order.status === 'pending')
        },
        // 获取所有已取件订单
        pickedReceives: (state) => {
            return state.receiveOrders.filter(order => order.status === 'picked')
        },
        // 根据订单ID查询订单
        getReceiveOrderById: (state) => (orderId: string) => {
            return state.receiveOrders.find(order => order.orderId === orderId)
        }
    },

    actions: {
        // 添加新取件订单
        addReceiveOrder(orderData: Omit<ReceiveOrder, 'orderId' | 'type' | 'createTime'>) {
            const newOrder: ReceiveOrder = {
                orderId: `REC_${uuidv4().slice(0, 8)}`, // 生成唯一ID（前缀REC标识取件）
                type: 'receive',
                createTime: new Date().toISOString(), // 生成当前时间
                ...orderData
            }
            this.receiveOrders.unshift(newOrder) // 新增订单放最前面
            return newOrder.orderId // 返回新订单ID
        },

        // 更新取件订单状态
        updateReceiveStatus(orderId: string, status: ReceiveOrder['status']) {
            const order = this.getReceiveOrderById(orderId)
            if (order) {
                order.status = status
                // 若状态改为"已取件"，可记录取件时间
                if (status === 'picked') {
                    (order as any).pickupTime = new Date().toISOString()
                }
            }
        },

        // 删除取件订单（通常用于过期或错误订单）
        deleteReceiveOrder(orderId: string) {
            this.receiveOrders = this.receiveOrders.filter(order => order.orderId !== orderId)
        },

        // 批量导入历史取件订单（用于初始化或同步数据）
        importReceiveOrders(orders: ReceiveOrder[]) {
            this.receiveOrders = [...orders, ...this.receiveOrders] // 历史订单放后面
        }
    }
})