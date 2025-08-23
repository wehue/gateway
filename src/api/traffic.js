import instance from '@/utils/request'

// 开始抓取流量
export const startTrafficCapture = () => {
  const form = new URLSearchParams()
  return instance
    .post('/flow/start', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((res) => res.data)
}

// 停止抓取流量
export const stopTrafficCapture = () => {
  const form = new URLSearchParams()
  return instance
    .post('/flow/stop', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((res) => res.data)
}

//流量异常统计（7天）
export const getTrafficCount7Day = (params) => {
  return instance.get('/flowReport/get7DaysTrafficCount', { params })
}

//流量数据概览入站出站总量
export const getTrafficTotalData = () => {
  return instance.get('/flow/total-packets')
}

//流量数据入站数据包、出站数据包、入站异常包、出站异常包
export const getTrafficData = () => {
  return instance.get('flow/traffic-data')
}

//实时IP访问统计接口
export const getTrafficIpData = () => {
  return instance.get('/flow/network-info-frontend')
}

// 上传文件接口
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  // 让浏览器自动设置 multipart/form-data 的边界
  return instance.post('/flow/upload', formData)
}
