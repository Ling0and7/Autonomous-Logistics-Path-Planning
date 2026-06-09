import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 自定义插件
import mapPlugin from './plugins/map'
import realtimePlugin from './plugins/realtime'
import orderPlugin from './plugins/order'
import permissionPlugin from './plugins/permission'
import CampusMapPlugin from './plugins/map'
// 创建实例
const app = createApp(App)

// 注册核心工具
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册自定义插件
app.use(mapPlugin)
app.use(realtimePlugin)
app.use(orderPlugin)
app.use(permissionPlugin)
app.use(CampusMapPlugin)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
// 挂载应用
app.mount('#app')