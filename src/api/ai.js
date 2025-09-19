import instance from '@/utils/request'
import instance_fabric from '@/utils/request_fabric'
import axios from 'axios'

// 创建专用于AI请求的axios实例
const aiRequest = axios.create({
  timeout: 60000, // 更长的超时时间
})

// 简化响应处理
aiRequest.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err),
)

/**
 * 发送AI聊天请求
 * @param {string} content - 用户输入的内容
 * @param {Array} history - 聊天历史记录
 * @returns {Promise} - 返回请求Promise
 */
export function chatWithAI(content, history = []) {
  // 格式化历史记录为API所需格式
  const messages = []

  // 添加历史消息
  if (history && history.length > 0) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    })
  }

  // 添加当前用户消息
  messages.push({
    role: 'user',
    content: content,
  })

  return aiRequest({
    url: 'http://10.138.50.151:7941/api/chat/network',
    method: 'post',
    data: {
      user_content: content,
      history_message: history,
    },
  })
}

/**
 * 发送流式AI聊天请求
 * @param {string} content - 用户输入的内容
 * @param {Array} history - 聊天历史记录
 * @returns {Object} - 返回请求配置
 */
export function streamChatWithAI(content, history = []) {
  // 返回请求配置，用于流式请求 - 适配新的网络分析API格式
  return {
    propmt: '',
    url: 'http://10.138.50.151:7941/api/chat/network',
    // url: 'http://43.135.181.183:8338/api/chat/network', 内网穿透
    method: 'post',
    data: {
      user_content: content,
      history_messages: history,
    },
  }
}

/**
 * 检查API健康状态
 * @returns {Promise} - 返回健康检查Promise
 */
export function checkApiHealth() {
  return axios({
    url: 'http://10.138.50.151:7941/api/health',
    method: 'get',
  })
}

//传给后端资源数据如CPU温度，内存使用率，磁盘使用率，网络使用率等数据
// 保存AI输入
// 对应文档：POST /admin/aiInput/saveAiInput
// 参数：dataType(string)、dataValue(string)、deviceId(integer)
export function saveAiInput({ dataType, dataValue, deviceId }) {
  const form = new URLSearchParams()
  if (dataType !== undefined) form.append('dataType', String(dataType))
  if (dataValue !== undefined) form.append('dataValue', String(dataValue))
  if (deviceId !== undefined) form.append('deviceId', String(deviceId))

  return instance({
    url: '/aiInput/saveAiInput',
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: form,
  })
}

// 保存AI预警（表单：application/x-www-form-urlencoded）
// 接口：POST /admin/aiWarn/saveAiWarn
// 参数：anomalyProblem(string)、predictedFailure(string)
export function saveAiWarn({ anomalyProblem, predictedFailure }) {
  const form = new URLSearchParams()
  form.append('anomalyProblem', anomalyProblem ?? '')
  form.append('predictedFailure', predictedFailure ?? '')
  return instance({
    url: '/aiWarn/saveAiWarn',
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: form,
  })
}

//区块链部分
//保存AI资源安全报告
//接口：POST /report/addResourceReport
//参数：id  reportName  gatewayName  content   reportTime
export function saveResourceReport({ id, reportName, gatewayName, content, reportTime }) {
  return instance_fabric({
    url: '/report/addResourceReport',
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      id,
      reportName,
      gatewayName,
      content,
      reportTime,
      details: {},
    },
  })
}

//保存AI流量威胁报告
//接口：POST /report/addTrafficReport
//参数：id  reportName  gatewayName  content   reportTime
export function saveTrafficReport({ id, reportName, gatewayName, content, reportTime }) {
  return instance_fabric({
    url: '/report/addTrafficReport',
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      id,
      reportName,
      gatewayName,
      content,
      reportTime,
      details: {},
    },
  })
}


