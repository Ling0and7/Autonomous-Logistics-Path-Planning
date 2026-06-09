import { App, defineComponent, h } from 'vue'
import { useOrderStore } from '@/stores/orderStore'

// 订单表单组件（示例，根据实际需求调整）
const OrderForm = defineComponent({
    props: {
        type: {
            type: String as () => 'send' | 'receive',
            required: true,
            default: 'send'
        }
    },
    setup(props) {
        const orderStore = useOrderStore()

        // 暴露订单操作方法（根据实际需求实现）
        const submitOrder = (orderData: any) => {
            if (props.type === 'send') {
                return orderStore.addSendOrder(orderData) // 调用寄件订单方法（Store中已定义）
            } else {
                return orderStore.addReceiveOrder(orderData) // 调用取件订单方法（Store中已定义）
            }
        }

        return { submitOrder }
    },
    render() {
        return h('div', { class: 'order-form' }, '订单表单组件（根据需求实现UI）')
    }
})

// 插件安装函数
const install = (app: App) => {
    // 注册订单相关组件（全局可用）
    app.component('OrderForm', OrderForm)

    // 提供全局订单操作方法
    app.provide('order', {
        addSendOrder: useOrderStore().addSendOrder,
        addReceiveOrder: useOrderStore().addReceiveOrder,
        getOrderDetail: useOrderStore().getOrderDetail
    })
}

// 导出插件
export default { install }