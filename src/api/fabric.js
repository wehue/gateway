import instance from '@/utils/request_fabric'


//获取所有流量安全报告
export const getTrafficReports = () => {
  return instance.get('/report/getTrafficReports')
}

//获取所有资源安全报告
export const getResourceReports = () => {
  return instance.get('/report/getResourceReports')
}


//根据id获取流量安全报告
export const getTrafficReportById = (id) => {
  return instance.get(`/report/getTrafficReport/${id}`)
}

//根据id获取资源安全报告
export const getResourceReportById = (id) => {
  return instance.get(`/report/getResourceReport/${id}`)
}
