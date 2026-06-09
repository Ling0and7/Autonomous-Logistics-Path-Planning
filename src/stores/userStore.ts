import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义用户角色类型（和项目角色体系匹配：学生/管理员）
export type UserRole = 'student' | 'admin'

// 定义权限类型（枚举所有合法权限，避免拼写错误）
export type Permission = 'order:view' | 'car:manage' | 'order:manage' | 'user:manage' | 'map:view' | 'user:delete'

// 定义所有合法权限的常量（用于类型守卫/权限分配）
export const ALL_PERMISSIONS = ['order:view', 'car:manage', 'order:manage', 'user:manage', 'map:view', 'user:delete'] as const

//地址簿项类型
export interface AddressItem {
    id: string
    name: string
    phone: string
    region: string[]
    detail: string // 详细地址
    fullAddress: string // 拼接后的完整地址
    isDefault: boolean // 是否默认地址
}

// 实名认证状态类型
export type RealnameStatus = 'unverified' | 'verifying' | 'verified' | 'rejected'

// 用户信息类型（
export interface UserInfo {
    id: string
    username: string
    role: UserRole
    token: string // 简单版token，实际项目可替换为JWT
    password?: string // 仅本地模拟用，生产环境后端存储
    // 新增个人中心相关字段
    avatar?: string // 头像URL
    realname?: string // 真实姓名
    idCard?: string // 身份证号
    realnameStatus?: RealnameStatus // 实名认证状态
    phone?: string // 绑定的手机号
    addresses?: AddressItem[] // 地址簿列表
}

// 定义本地模拟用户的类型
interface MockUser {
    id: string
    username: string
    password: string
    role: UserRole
}

// 类型守卫：判断字符串是否为合法的Permission类型
export const isPermission = (value: string): value is Permission => {
    return (ALL_PERMISSIONS as readonly string[]).includes(value)
}

export const useUserStore = defineStore('user', () => {
    // 1. 全局用户状态（响应式）：存储当前登录用户信息（初始化新增字段默认值）
    const userInfo = ref<UserInfo | null>(null)

    // 2. 权限列表响应式状态（严格匹配Permission类型）
    const permissions = ref<Permission[]>([])

    // 3. 根据角色动态分配权限（核心方法）
    const updatePermissions = () => {
        if (!userInfo.value) {
            permissions.value = [] // 未登录时无权限
            return
        }

        // 按角色分配权限（可按需扩展，适配学生/管理员权限差异）
        switch (userInfo.value.role) {
            case 'admin':
                permissions.value = ['order:view', 'order:manage', 'car:manage', 'user:manage', 'map:view', 'user:delete']
                break
            case 'student':
                permissions.value = ['order:view', 'map:view'] // 学生新增地图查看权限，更贴合实际场景
                break
            default:
                permissions.value = []
        }
    }

    // 4. 初始化：页面刷新后从localStorage恢复登录状态
    const initUser = () => {
        const savedUser = localStorage.getItem('userInfo')
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser)

                userInfo.value = {
                    id: parsedUser.id || Math.random().toString(36).slice(2, 10), // 兜底生成id
                    username: parsedUser.username || '',
                    role: (parsedUser.role as UserRole) || 'student', // 兜底默认学生角色
                    token: parsedUser.token || Math.random().toString(36).slice(2, 15), // 兜底生成token

                    avatar: parsedUser.avatar || '',
                    realname: parsedUser.realname || '',
                    idCard: parsedUser.idCard || '',
                    realnameStatus: parsedUser.realnameStatus || 'unverified',
                    phone: parsedUser.phone || '',
                    addresses: parsedUser.addresses || []
                }
                updatePermissions() // 恢复登录状态后同步权限
            } catch (e) {
                console.error('恢复用户状态失败：', e)
                localStorage.removeItem('userInfo') // 防止存储异常
                userInfo.value = null
                permissions.value = []
            }
        }
    }

    // 5. 读取本地模拟用户列表
    const getMockUsers = (): MockUser[] => {
        try {
            const savedUsers = localStorage.getItem('mockUsers')
            if (savedUsers) {
                return JSON.parse(savedUsers) as MockUser[]
            }
        } catch (e) {
            console.error('读取用户列表失败：', e)
            localStorage.removeItem('mockUsers') // 防止存储异常
        }
        // 默认初始用户
        return [
            { id: '1001', username: 'student1', password: '123456', role: 'student' },
            { id: '2001', username: 'admin1', password: '123456', role: 'admin' }
        ]
    }

    // 6. 更新本地模拟用户列表
    const setMockUsers = (users: MockUser[]): void => {
        try {
            localStorage.setItem('mockUsers', JSON.stringify(users))
        } catch (e) {
            console.error('存储用户列表失败：', e)
        }
    }

    // 7. 登录方法
    const login = (username: string, password: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            // 从本地获取最新用户列表（包含默认+注册的用户）
            const mockUsers = getMockUsers()
            // 匹配账号+密码
            const matchedUser = mockUsers.find(
                u => u.username === username && u.password === password
            )

            if (matchedUser) {
                // 生成随机token（模拟后端返回的令牌）
                const token = Math.random().toString(36).substring(2, 15)
                // 组装登录用户信息
                userInfo.value = {
                    id: matchedUser.id,
                    username: matchedUser.username,
                    role: matchedUser.role,
                    token,
                    // 新增字段默认值
                    avatar: matchedUser.role === 'student'
                        ? 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' // 学生默认头像
                        : '', // 管理员无默认头像
                    realname: '',
                    idCard: '',
                    realnameStatus: 'unverified',
                    phone: '',
                    addresses: []
                }
                updatePermissions() // 登录成功后立即分配权限

                // 持久化登录状态到localStorage
                localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
                resolve(true)
            } else {
                reject(new Error('账号或密码错误'))
            }
        })
    }

    // 8. 退出登录：清除状态+本地存储（适配路由守卫，确保退出后跳登录页）
    const logout = (): void => {
        userInfo.value = null
        permissions.value = [] // 清空权限
        localStorage.removeItem('userInfo')
        // 可选：清除用户列表（如需重置）
        // localStorage.removeItem('mockUsers')
    }

    // 9. 角色校验：判断当前用户是否为指定角色（适配Header的角色判断）
    const hasRole = (role: UserRole): boolean => {
        if (!userInfo.value) return false
        return userInfo.value.role === role
    }

    // 10. 权限校验：判断是否拥有某个权限（严格类型校验）
    const hasPermission = (permission: Permission): boolean => {
        return permissions.value.includes(permission)
    }

    // 11. 扩展：批量校验权限（至少拥有一个）
    const hasAnyPermission = (permissionsList: Permission[]): boolean => {
        return permissionsList.some(perm => permissions.value.includes(perm))
    }

    const updateUserInfo = (updateData: Partial<UserInfo>): void => {
        if (!userInfo.value) return
        // 合并更新用户信息（兼容可选字段）
        userInfo.value = { ...userInfo.value, ...updateData }
        // 同步更新localStorage（持久化，刷新后不丢失）
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }

    // 初始化用户状态（页面加载时自动执行，确保Header能读取到角色/头像）
    initUser()

    // 导出所有需要的方法/状态（核心修正：添加initUser导出）
    return {
        userInfo,
        permissions, // 导出权限列表
        login,
        logout,
        hasRole, // 核心：供Header判断角色（学生/管理员）
        hasPermission, // 导出单权限校验
        hasAnyPermission, // 导出批量权限校验
        updatePermissions,
        getMockUsers,
        setMockUsers,
        updateUserInfo,
        initUser
    }
})