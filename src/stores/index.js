import { createPinia } from 'pinia'
//引入pinia持久化插件
import persist from 'pinia-plugin-persistedstate'
// 创建pinia实例
const pinia = createPinia()
pinia.use(persist)
//导出pinia实例
export default pinia

export * from './modules/user.js'
export * from './modules/file.js'
