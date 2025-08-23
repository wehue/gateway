import instance from '@/utils/request'

//首页网关信息
export const getGatewayInfo = (id) => {
  return instance.get(`/hard/devices/${id}`)
}

// 获取资源监测的数据
export const getRealtimeData = (params) => {
  return instance.get('/realtime/get-realtime-data', {
    params,
  })
}

// 获取内存使用率的饼图数据
export const getMemoryPieData = (params) => {
  return instance.get('/realtime/memory/usage/random', {
    params,
  })
}

// 获取存储占有率的饼图数据
export const getStoragePieData = (params) => {
  return instance.get('/realtime/storage/total-usage/random', {
    params,
  })
}

// 获取流量数据包（入站和出站）
export const getTrafficData = (params) => {
  return instance.get('/flow/total-packets', {
    params,
  })
}

// 获取入站出站数量包、错误包
export const getInboundOutboundData = (params) => {
  return instance.get('/flow/traffic-data', {
    params,
  })
}

//获取资源异常统计（7天）
export const getWarnCount7Day = (params) => {
  return instance.get('/aiWarn/get7DaysExceptionCount', {
    params,
  })
}

//获取告警历史数据
export const getAIWarnsData = () => {
  return instance.get('/aiWarn/getAiWarns')
}
