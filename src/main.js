import { createApp } from 'vue'

//引入基础css样式
import './css/main.css'
// 引入Element Plus样式
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
//引入pinia
import pinia from './stores/index.js'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
