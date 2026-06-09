import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
// 导入 Layout 布局组件
import Layout from '@/components/layout/Layout.vue'

import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import StudentHome from '@/views/StudentHome.vue'
import SendPackage from '@/views/SendPackage.vue'
import ReceivePackage from '@/views/ReceivePackage.vue'
import OrderQuery from '@/views/OrderQuery.vue'
import PaymentCenter from '@/views/PaymentCenter.vue'
import UserProfile from '@/views/UserProfile.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import AdminOrderQuery from '@/views/AdminOrderQuery.vue'
import AdminPayment from '@/views/AdminPayment.vue'
import AdminReceiveOrders from '@/views/AdminReceiveOrders.vue'
import AdminSendOrders from '@/views/AdminSendOrders.vue'

const routes: RouteRecordRaw[] = [
    // 公共路由
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },

    // 唯一的顶层Layout（所有需要登录的页面都嵌套在此）
    {
        path: '/',
        component: Layout,
        meta: { requiresAuth: true }, // 统一要求登录
        children: [
            // 学生端路由（作为Layout的子路由，无独立Layout）
            {
                path: 'student',
                redirect: '/student/home',
                meta: { role: 'student' }, // 学生角色可见
                children: [
                    { path: 'home', name: 'StudentHome', component: StudentHome },
                    { path: 'send', name: 'StudentSend', component: SendPackage },
                    { path: 'receive', name: 'StudentReceive', component: ReceivePackage },
                    { path: 'order-query', name: 'StudentOrderQuery', component: OrderQuery },
                    { path: 'payment', name: 'StudentPayment', component: PaymentCenter },
                    { path: 'profile', name: 'UserProfile', component: UserProfile }
                ]
            },
            // 管理员端路由（作为Layout的子路由，无独立Layout）
            {
                path: 'admin',
                redirect: '/admin/dashboard',
                meta: { role: 'admin' }, // 管理员角色可见
                children: [
                    { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard },
                    { path: 'send-orders', name: 'AdminSendOrders', component: AdminSendOrders },
                    { path: 'receive-orders', name: 'AdminReceiveOrders', component: AdminReceiveOrders },
                    { path: 'order-query', name: 'AdminOrderQuery', component: AdminOrderQuery },
                    { path: 'payment', name: 'AdminPayment', component: AdminPayment }
                ]
            },

            {
                path: 'user/profile',
                redirect: '/student/profile',
                meta: { role: 'student' }
            }
        ]
    },

    { path: '/:pathMatch(.*)*', redirect: '/login' }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫（
router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const isLogin = !!userStore.userInfo
    const requiresAuth = to.meta.requiresAuth ?? false
    const requiredRole = to.meta.role as string | undefined

    if (requiresAuth && !isLogin) {
        next('/login')
        return
    }

    if (isLogin && requiresAuth) {
        const userRole = userStore.userInfo.role
        if (requiredRole && userRole !== requiredRole) {
            next(userRole === 'student' ? '/student/home' : '/admin/dashboard')
            return
        }
    }

    if (isLogin && to.path === '/login') {
        next(userStore.userInfo.role === 'student' ? '/student/home' : '/admin/dashboard')
        return
    }

    next()
})

export default router