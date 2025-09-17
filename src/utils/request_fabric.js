import { useUserStore } from '@/stores/modules/user'
import axios from 'axios'
import router from '@/router'
import { ElMessage } from 'element-plus'

//基地址:后端主机地址
const baseURL = 'https://4ba35589722c.ngrok-free.app'

const instance = axios.create({
  baseURL,
  timeout: 100000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
})

instance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = userStore.token
    }
    return config
  },
  (err) => Promise.reject(err),
)

instance.interceptors.response.use(
  (res) => {
    if (res.data.code === 200) {
      return res
    }
    ElMessage({ message: res.data.message || '服务异常', type: 'error' })
    return Promise.reject(res.data)
  },
  (err) => {
    return Promise.reject(err)
  },
)

export default instance
export { baseURL }
