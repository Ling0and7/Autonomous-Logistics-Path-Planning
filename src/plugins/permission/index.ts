import { App, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/userStore'
import type { Permission } from '@/stores/userStore'

// 自定义权限指令
const permissionDirective = {
    mounted(el: HTMLElement, binding: DirectiveBinding<Permission[]>): void {
        const { value } = binding
        const userStore = useUserStore()
        if (value && !value.some((p: Permission) => userStore.permissions.includes(p))) {
            el.style.display = 'none'
        }
    }
}

// 安装指令（
export default {
    install(app: App): void {
        app.directive('permission', permissionDirective)
    }
}