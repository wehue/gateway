<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { streamChatWithAI, checkApiHealth, saveAiInput, saveAiWarn,saveResourceReport } from '@/api/ai'
import { useRoute } from 'vue-router'

const analysisProblems = ref('')
const analysisPredictions = ref('')
// 获取路由参数
const route = useRoute()

// 创建markdown解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  xhtmlOut: true,
  breaks: true,
  highlight: true,
})

// 聊天相关状态
const newMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const isStreaming = ref(false)
const isTyping = ref(false)
const streamingContent = ref('')
const controller = ref(null)
const errorDisplayed = ref(false)
const hasReceivedData = ref(false)
const currentMessageType = ref('')
const isAutoScroll = ref(true)
const chatContainer = ref(null)
const lastScrollTop = ref(0)
const showPrompts = ref(false) // 是否显示提示词
const isLoadingApp = ref(true) // 添加页面加载状态
const ok = ref(true) // API健康状态

// 添加弹窗相关状态
const showAlertDialog = ref(false) // 控制弹窗显示
const alertContent = ref({
  title: '异常检测提醒',
  problems: '',
  predictions: '',
})

// 预设的提示词列表
const promptTemplates = [
  '请根据上方你所分析可能出现的故障提供更加详细的解决方案',
  '将上面的所有结果整合成一个安全报告',
  '请对此次异常流量攻击进行溯源分析',
  '请将此次异常流量攻击分析总结成一个安全威胁报告',
  '将上述安全报告共享到区块链平台中',
]

// 选择提示词
const selectPrompt = (prompt) => {
  newMessage.value = prompt
  showPrompts.value = false
  // 聚焦输入框
  nextTick(() => {
    document.querySelector('.message-input').focus()
  })
}

// 显示提示词
const handleInputFocus = () => {
  showPrompts.value = true
}

// 隐藏提示词（点击其他区域时）
const handleClickOutside = (event) => {
  const promptsContainer = document.querySelector('.prompt-templates')
  const inputElement = document.querySelector('.message-input')

  if (
    promptsContainer &&
    !promptsContainer.contains(event.target) &&
    inputElement &&
    !inputElement.contains(event.target)
  ) {
    showPrompts.value = false
  }
}

// 滚动处理
const handleScroll = () => {
  const container = chatContainer.value
  if (!container) return

  const { scrollTop, scrollHeight, clientHeight } = container
  const isAtBottom = scrollTop >= scrollHeight - clientHeight - 10

  if (isAutoScroll.value && !isAtBottom) {
    // 暂停自动滚动
    isAutoScroll.value = false
  } else if (!isAutoScroll.value && isAtBottom) {
    // 恢复自动滚动
    isAutoScroll.value = true
  }

  lastScrollTop.value = scrollTop
}

// 健康检查
const checkAppHealth = () => {
  checkApiHealth()
    .then((response) => {
      if (response.data && response.data.status === 'ok') {
        handleHealthCheckSuccess()
      } else {
        throw new Error('健康检查返回非ok状态')
      }
    })
    .catch((error) => {
      console.error('健康检查错误:', error)
      ok.value = false
      isLoadingApp.value = false
    })
}

// 处理健康检查成功
const handleHealthCheckSuccess = () => {
  setTimeout(() => {
    isLoadingApp.value = false
  }, 1000)
}

// 发送消息
const sendMessage = () => {
  const message = newMessage.value.trim()
  if (!message || isLoading.value) return

  // 重置状态
  errorDisplayed.value = false
  streamingContent.value = ''
  hasReceivedData.value = false
  isTyping.value = true

  // 限制历史记录长度
  const MAX_HISTORY_LENGTH = 10
  const recentMessages = messages.value.slice(-MAX_HISTORY_LENGTH)
  const historyMessage = recentMessages.map((msg) => {
    const processedContent = msg.normal_content || msg.content
    return { ...msg, content: processedContent, normal_content: undefined }
  })

  // 添加用户消息
  const userMsg = {
    role: 'user',
    content: newMessage.value,
  }
  messages.value.push(userMsg)

  // 如果是从资源页带来的"网关中xxx为xxx，…"格式，则保存AI输入
  trySaveAiInput(newMessage.value)

  // 检查是否是特定的区块链共享请求
  if (newMessage.value.includes('将上述安全报告共享到区块链平台中')) {
    handleBlockchainShareRequest()
    newMessage.value = ''
    return
  }

  // 构建用户问题，添加格式指导
  let userQuestion = newMessage.value // 保存用户问题

  // 如果问题可能涉及到故障分析，添加格式要求
  if (isAnalysisRelatedQuestion(userQuestion)) {
    // 添加输出格式要求
    userQuestion = addFormatRequirement(userQuestion)
  }

  // 如果是"解决方案"请求，为其增加格式提示并标记样式
  if (newMessage.value.includes('解决方案')) {
    currentMessageType.value = 'solution'
    const solutionFormatGuide = `\n\n请以"解决方案蓝皮书"风格输出，要求如下：\n\n- 使用分节标题（建议使用二级标题），不要数字编号，例如：- 每个分节下用若干条目说明，条目以列表呈现；条目里的关键短语采用"关键字：说明"形式，关键字加粗，例如：\n  - **日志轮替**：说明\n  - **日志级别调整**：说明\n  - **外部日志服务器**：说明\n- 严格使用中文全角冒号"："。`
    userQuestion += solutionFormatGuide
  } else {
    currentMessageType.value = ''
  }

  // 如果是"整合安全报告"，也套用解决方案样式，确保报告中的解决方案部分按图片样式输出
  if (newMessage.value.includes('将上面的所有结果整合成一个安全报告')) {
    currentMessageType.value = 'solution'
  }

  newMessage.value = ''

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })

  // 开始加载状态
  isLoading.value = true

  // 取消之前的请求
  if (controller.value) {
    controller.value.abort()
  }

  // 创建新的控制器
  controller.value = new AbortController()
  const signal = controller.value.signal

  // 发送请求并处理流式响应
  fetchAndStreamResponse(userQuestion, historyMessage, signal)
}

// 解析并保存"网关中xxx为xxx，…"格式到后端
const trySaveAiInput = (text) => {
  if (!text) return
  const match = text.match(/^\s*网关中(.+?)为\s*([^，,。\s]+)\s*[，,。]?/)
  if (!match) return
  const dataType = match[1].trim()
  const dataValue = match[2].trim()
  const deviceId = 25

  console.log(
    '准备保存AI输入 -> dataType:',
    dataType,
    'dataValue:',
    dataValue,
    'deviceId:',
    deviceId,
  )

  saveAiInput({ dataType, dataValue, deviceId })
}

// 处理区块链共享请求
const handleBlockchainShareRequest = () => {
  // 1. 查找最近一次AI生成的安全报告内容
  const lastAiReportMsg = messages.value.filter(m => m.role === 'assistant' && m.content.startsWith('安全报告:')).pop();
  if (lastAiReportMsg) {
    const reportName = extractReportName(lastAiReportMsg.content)
    const content = extractReportContent(lastAiReportMsg.content)
    const gatewayName = 'gateway1'
    const reportTime = Date.now()
    const id = generateUniqueId()
    saveResourceReport({
      id,
      reportName,
      gatewayName,
      content,
      reportTime,
    })
      .then((res) => {
        console.log('资源安全报告已保存', res);
        ElMessage.success('资源安全报告已保存并已共享到区块链平台')
        // 流式打字效果
        const text = '安全报告已保存至区块链平台上';
          streamingContent.value = '';
          isTyping.value = true;
          isStreaming.value = false;

          // 先只显示思考动画
          setTimeout(() => {
            isTyping.value = false;
            isStreaming.value = true;
            let idx = 0;
            const typeInterval = setInterval(() => {
              streamingContent.value += text[idx];
              idx++;
              nextTick(() => {
                scrollToBottom();
              });
              if (idx >= text.length) {
                clearInterval(typeInterval);
                isStreaming.value = false;
                // 先保存完整内容
                const finalText = streamingContent.value;
                messages.value.push({
                  role: 'assistant',
                  content: finalText,
                  normal_content: finalText,
                });
                streamingContent.value = '';
              }
            }, 60);
          }, 800); // 800ms思考时间，可根据需要调整
      })
      .catch((err) => {
        console.error('资源安全报告保存失败', err);
        ElMessage.error('资源安全报告保存失败')
      })
  } else {
    ElMessage.warning('未找到可共享的安全报告，请先生成安全报告')
    // AI流式打字效果提示
    const text = '未找到可共享的安全报告，请先生成安全报告';
    streamingContent.value = '';
    isTyping.value = true;
    let idx = 0;
    const typeInterval = setInterval(() => {
      streamingContent.value += text[idx];
      idx++;
      if (idx >= text.length) {
        clearInterval(typeInterval);
        isTyping.value = false;
        messages.value.push({
          role: 'assistant',
          content: streamingContent.value,
          normal_content: streamingContent.value,
        });
        streamingContent.value = '';
      }
    }, 60);
  }
}


// 提取报告名称
function extractReportName(content) {
  // 匹配"安全报告: xxx"或"安全报告：xxx"
  const match = content.match(/^安全报告[:：]\s*(.+)/)
  return match ? match[1].split('\n')[0].trim() : '未命名报告'
}

// 提取正文（去掉第一行标题，保留所有分节标题和内容）
function extractReportContent(content) {
  // 去掉第一行（安全报告: xxx），保留后面所有内容
  return content.replace(/^安全报告[:：].+\n?/, '').trim()
}

// 生成唯一ID
function generateUniqueId() {
  // 生成5位随机数字字符串
  return Math.floor(10000 + Math.random() * 90000).toString();
}


// 判断问题是否与分析相关且需要特定格式
const isAnalysisRelatedQuestion = (question) => {
  // 检查是否是安全报告整合请求
  if (question.includes('报告') && question.includes('整合') && question.includes('安全')) {
    return true
  }

  // 检查是否是流量攻击分析请求
  if (
    (question.includes('分析') && question.includes('攻击')) ||
    (question.includes('流量') && question.includes('异常'))
  ) {
    return true
  }

  // 检查是否是攻击溯源请求
  if (question.includes('溯源') && question.includes('攻击')) {
    return true
  }

  // 检查是否是安全威胁报告请求
  if (
    question.includes('威胁报告') ||
    (question.includes('安全威胁') && question.includes('报告'))
  ) {
    return true
  }

  // 检查是否同时包含"分析"和"预测"关键词，表明用户要求分析问题并预测可能的故障
  const hasAnalysisIntent =
    /分析.{0,30}(异常|问题)/.test(question) || /(异常|问题).{0,30}分析/.test(question)

  const hasPredictionIntent =
    /预测.{0,30}(故障|风险)/.test(question) || /(故障|风险).{0,30}预测/.test(question)

  // 检查是否提到了具体的硬件指标
  const hasHardwareMetric =
    /(CPU|内存|存储|磁盘|网关|带宽|温度).{0,10}(占[用率]|使用率|为|达到).{0,10}\d+%?/.test(question)

  // 只有当问题同时包含分析意图、预测意图和硬件指标时，才添加格式要求
  return (hasAnalysisIntent || hasPredictionIntent) && hasHardwareMetric
}

// 添加格式要求
const addFormatRequirement = (question) => {
  // 检查是否是安全报告整合请求
  if (question.includes('报告') && question.includes('整合') && question.includes('安全')) {
    // 安全报告的固定格式要求
    // 设备潜在风险优先取第一条分析的"异常问题+故障预测"，否则退回当前缓存中的预测
    const riskText =
      analysisProblems.value || analysisPredictions.value
        ? `${analysisProblems.value}\n\n${analysisPredictions.value}`.trim()
        : alertContent.value?.predictions || ''
    const injectedProblems = riskText ? `\n\n**设备潜在风险**：\n${riskText}` : ''
    const injectedSolutions = alertContent.value?.solutions
      ? `\n\n**解决方案**：\n${alertContent.value.solutions}`
      : ''

    const reportFormatRequirement = `\n\n请按照以下格式输出安全报告：
安全报告: [报告标题]
## **一、摘要**
[用一段话简要描述整体情况，概述问题和发现]
## **二、介绍**
[介绍报告分析的背景，设备作用和重要性]
## **三、异常问题**
[详细的分析结果，包括关键发现]${injectedProblems}
## **四、解决方案**
[针对报告的建议和优化方案]
## **五、总结**
[总结报告的主要发现和建议]`

    return question + reportFormatRequirement
  } else if (question.includes('溯源') && question.includes('攻击')) {
    const attackTraceFormat = `\n\n请按照以下格式输出溯源分析：
溯源链路是对攻击过程的深入解析，以便准确确定攻击路径和手段。以下是详细的攻击溯源分析：
## 一、攻击起始
• **1.扫描阶段**：
  ○ 攻击者使用工具[工具名称]对互联网进行端口扫描，以发现暴露的[服务类型]服务。
  ○ 确定目标服务器[IP地址]的[端口号]端口处于开放状态，并可进行连接。
• **2.攻击阶段**：
  ○ 工具配置：攻击者配置暴力破解工具([工具名称])，指定目标IP和端口，并载入字典文件。
  ○ 并发尝试：工具对[服务类型]服务进行开发的密码尝试，使用多个线程以加快破解速度。

## 二、具体过程
• **1.扫描命令**：
  ○ 攻击者利用获取的[访问类型]访问权限登录服务器。
  ○ 使用[工具名称]对内部网络进行扫描，以识别其他可访问和脆弱的系统。

• **2.攻击命令**：
  ○ -l [用户名]：指定用户名 ([用户名])
  ○ -P [字典路径]：指定密码字典文件。
  ○ -t [线程数]：使用[数字]个线程同时进行尝试。

## 三、解决措施
[应对措施的详细讲解]

## 四、总结
[对整个攻击的总结评估，包括威胁程度和]
`

    return question + attackTraceFormat
  } else if (
    question.includes('威胁报告') ||
    (question.includes('安全威胁') && question.includes('报告'))
  ) {
    // 安全威胁报告（更全面版本）
    const injectedAttackAnalysis = attackAnalysisCache.value
      ? `\n${attackAnalysisCache.value}\n`
      : '\n[基于前述数据生成攻击分析]\n'
    const injectedAttackType = attackTypeCache.value
      ? `\n${attackTypeCache.value}\n`
      : '\n[结合流量与手法识别攻击类型]\n'
    const injectedAttackerProfile = attackerProfileCache.value
      ? `\n${attackerProfileCache.value}\n`
      : '\n[从工具、手法、门槛推测攻击者画像]\n'
    const injectedSolutions = alertContent.value?.solutions
      ? `\n${alertContent.value.solutions}\n`
      : '\n[应对措施的详细讲解]\n'

    const threatReportFormat = `\n\n请按照以下结构输出"安全威胁报告"，内容尽量具体、可执行：
安全威胁报告：[事件名称]

## **一、攻击分析**
${injectedAttackAnalysis}
## **二、攻击类型**
${injectedAttackType}
## **三、攻击者画像**
${injectedAttackerProfile}
## **四、攻击影响**
**数据泄露风险**：[高/中/低，加简要说明]
**系统可用性**：[高/中/低，加简要说明]
**进一步威胁**：[高/中/低，如果攻击者获得更多控制可能的后果]

## **五、解决措施**
${injectedSolutions}

## **六、总结**
[对整个攻击的总结评估，包括威胁程度和应对措施的概述]
`

    return question + threatReportFormat
  } else if (
    (question.includes('分析') && question.includes('攻击')) ||
    (question.includes('流量') && question.includes('异常'))
  ) {
    // 流量攻击分析的统一格式 - 参照截图中的格式
    const attackAnalysisFormat = `\n\n请按照以下格式回复流量攻击分析：
以下是关于此次流量攻击事件的分析 ：

## **一、攻击分析**
**源IP地址和端口**：[识别攻击流量的源IP地址和端口，并简要说明其含义]
**攻击者IP地址和端口**：[识别攻击者的IP地址和端口，并解释其意义]
**协议和流量大小**：[分析使用的协议和流量规模特征]

## **二、攻击类型 - [具体攻击类型]**
**定义**：[对此类型攻击的简短定义]
**影响**：[攻击成功可能造成的影响]

## **三、攻击者画像**
基于提供的信息，我们可以初步推断：
**技术水平**：[攻击者可能的技术水平评估]
**动机**：[推测攻击者的可能动机]

## **四、攻击影响评估**
**数据泄露风险**：[高/中/低，加简要说明]
**系统可用性**：[高/中/低，加简要说明]
**进一步威胁**：[高/中/低，如果攻击者获得更多控制可能的后果]

## **五、防御建议**

## **六、总结**
[对整个攻击的总结评估，包括威胁程度和应对措施的概述]`

    return question + attackAnalysisFormat
  } else {
    // 原有的异常分析格式要求
    const formatRequirement = `\n\n请按照以下格式回复：
1. 先用一段话简要描述整体情况
2. 使用"**异常问题**："作为标题，列出当前检测到的具体问题
3. 使用"**故障预测**："作为标题，列出可能导致的故障风险
4. 如有必要，可以添加"**补充说明**："部分提供更多信息`

    return question + formatRequirement
  }
}

// 获取和处理流式响应
const fetchAndStreamResponse = (userContent, historyMessage, signal, modelId) => {
  // 获取流式请求配置，添加模型ID
  const requestConfig = streamChatWithAI(userContent, historyMessage, modelId)

  console.log('发送请求:', requestConfig.url)
  console.log('请求数据:', JSON.stringify(requestConfig.data))

  fetch(requestConfig.url, {
    method: requestConfig.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestConfig.data),
    signal,
  })
    .then((response) => {
      console.log('收到响应状态:', response.status, response.statusText)
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }
      if (!response.body) {
        throw new Error('响应中没有数据')
      }
      return processStream(response.body)
    })
    .catch((err) => {
      console.error('请求失败:', err)
      handleError(err)
    })
}

// 处理流数据 - 修改为适应新API的SSE格式
const processStream = (body) => {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let accumulatedData = ''

  const processChunk = (chunk) => {
    if (chunk.done) {
      handleStreamClose()
      return
    }

    // 解码新数据并添加到缓冲区
    const text = decoder.decode(chunk.value, { stream: true })
    console.log('收到数据块:', text)
    accumulatedData += text

    // 处理SSE格式数据
    const ssePattern = /data: (.*?)[\n\r]+/g
    let match
    let lastIndex = 0

    while ((match = ssePattern.exec(accumulatedData)) !== null) {
      const jsonStr = match[1].trim()
      if (jsonStr === '[DONE]' || jsonStr === '') {
        continue
      }

      try {
        const res = JSON.parse(jsonStr)
        handleMessage(res)
      } catch (err) {
        console.error('解析SSE数据失败:', err, jsonStr)
      }

      lastIndex = ssePattern.lastIndex
    }

    // 保留未处理完的数据
    accumulatedData = accumulatedData.substring(lastIndex)

    // 继续读取下一个块
    return reader.read().then(processChunk)
  }

  return reader.read().then(processChunk)
}

// 处理消息 - 修改为适应新API的响应格式
const handleMessage = (res) => {
  if (!hasReceivedData.value) {
    isTyping.value = false // 收到第一条数据后隐藏输入指示器
    isStreaming.value = true // 显示流式响应
    hasReceivedData.value = true // 标记已接收数据
  }

  try {
    console.log('处理消息:', res) // 调试日志

    // 从API响应中提取内容 (适应新API格式)
    let content = ''

    if (res.content) {
      content = res.content
    } else {
      console.log('无法从响应中提取内容')
      return
    }

    // 忽略无效内容
    if (!content || content === 'undefined' || content === '' || content == '\n\n') {
      return
    }

    // 更新流式内容（在追加前做 Markdown 规范化，修复可能缺失的换行）
    streamingContent.value += normalizeMarkdown(content)
    // 自动滚动到底部
    if (isAutoScroll.value) {
      scrollToBottom()
    }
  } catch (error) {
    console.error('处理消息时出错:', error) // 调试日志
    if (!errorDisplayed.value) {
      errorDisplayed.value = true
      console.error('处理消息时发生错误:', error)
      addErrorMsg('抱歉，处理消息时发生错误。')
    }
  }
}

// 处理流结束
const handleStreamClose = () => {
  isLoading.value = false
  isStreaming.value = false

  // 确保流式内容不为空时添加到消息列表
  if (streamingContent.value.trim()) {
    const cleanContent = normalizeMarkdown(streamingContent.value)

    const aiMsg = {
      role: 'assistant',
      content: cleanContent,
      normal_content: cleanContent,
      type: currentMessageType.value || 'default',
    }
    messages.value.push(aiMsg)
    currentMessageType.value = ''

    // 检测内容中是否包含异常问题和故障预测
    detectAnomalyAndFaults(cleanContent)

    nextTick(() => {
      scrollToBottom()
    })
  } else {
    // 处理空响应的情况
    if (!errorDisplayed.value) {
      addErrorMsg('抱歉，未获取到有效响应。')
    }
  }
}


// 添加检测异常和故障预测的函数
const detectAnomalyAndFaults = (content) => {
  // 获取当前用户的最后一个问题
  const lastUserMessage = messages.value.filter((msg) => msg.role === 'user').pop()
  const lastUserQuestion = lastUserMessage ? lastUserMessage.content : ''

  // 判断是否需要弹框（不影响内容提取和缓存注入）
  const shouldShowAlert = isAlertRequiredQuestion(lastUserQuestion)

  // 将内容分割为段落
  const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 0)

  // 识别文本结构并分类内容（无论是否弹框，均提取用于后续报告注入）
  const {
    problemSections,
    predictionSections,
    solutionSections,
    attackAnalysisSections,
    attackTypeSections,
    attackerProfileSections,
  } = extractStructuredContent(content)

  // 合并内容
  const problems = problemSections.join('\n\n')
  const predictions = predictionSections.join('\n\n')
  const solutions = solutionSections.join('\n\n')
  const attackAnalysis = attackAnalysisSections.join('\n\n')
  const attackType = attackTypeSections.join('\n\n')
  const attackerProfile = attackerProfileSections.join('\n\n')



  // 更新缓存（供报告整合注入使用）
  if (problems || predictions || solutions) {
    alertContent.value = {
      title: '故障风险预警',
      problems: problems || '',
      predictions: predictions || '',
      solutions: solutions || '',
    }

    // 若是第一次分析类回复，缓存"异常问题+故障预测"作为报告的设备潜在风险来源
    const alreadyCached = analysisProblems.value || analysisPredictions.value
    if (!alreadyCached) {
      analysisProblems.value = problems || ''
      analysisPredictions.value = predictions || ''
    }
    // 仅在需要时展示弹框
    if (shouldShowAlert) {
      showAlertDialog.value = true
    }

    // 将异常和预测结果发送到后端保存
    saveAnomalyResults(problems, predictions, solutions)
  }

  // 缓存攻击情报片段（即便不弹框也缓存，供后续"安全威胁报告"注入）
  if (attackAnalysis) attackAnalysisCache.value = attackAnalysis
  if (attackType) attackTypeCache.value = attackType
  if (attackerProfile) attackerProfileCache.value = attackerProfile
}

// 判断是否是需要弹框的问题类型
const isAlertRequiredQuestion = (question) => {
  // 安全报告不需要弹框
  if (question.includes('报告') && question.includes('整合') && question.includes('安全')) {
    return false
  }

  // 检查是否包含存储占用率相关内容
  const hasStorageMetric = /(存储|磁盘|空间|内存).{0,10}(占[用率]|使用率|为|达到).{0,10}\d+%?/.test(
    question,
  )

  // 检查是否包含分析和预测意图
  const hasAnalysisIntent =
    /分析.{0,30}(异常|问题)/.test(question) || /(异常|问题).{0,30}分析/.test(question)

  const hasPredictionIntent =
    /预测.{0,30}(故障|风险)/.test(question) || /(故障|风险).{0,30}预测/.test(question)

  // 只有当问题同时满足这些条件时，才需要弹框
  return hasStorageMetric && (hasAnalysisIntent || hasPredictionIntent)
}

// 提取结构化内容
const extractStructuredContent = (content) => {
  const problemSections = []
  const predictionSections = []
  const solutionSections = []
  const attackAnalysisSections = []
  const attackTypeSections = []
  const attackerProfileSections = []

  // 1) 优先：根据小节标题精确解析，保证与消息内容对应
  try {
    const lines = content.split('\n')
    const problemTitles = ['异常问题', '异常状态', '问题分析', '检测到的异常']
    const predictionTitles = ['故障预测', '风险预测', '可能故障', '潜在风险', '预测结果']
    const solutionTitles = ['解决方案', '修复措施', '处理方案', '处置建议', '应对措施', '优化方案']
    const attackAnalysisTitles = ['攻击分析']
    const attackTypeTitles = ['攻击类型']
    const attackerProfileTitles = ['攻击者画像']
    const stopTitles = ['补充说明', '注意事项', '特别提醒', '总结', '结论', '建议', '参考']

    const isHeadingOf = (line, titles) => {
      const t = line.trim()
      return titles.some((title) =>
        new RegExp(`^(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?${title}(?:\\s*[：:])?\\s*$`, 'i').test(t),
      )
    }

    let current = null
    let captured = false

    const pushLine = (arr, line) => {
      if (!line || !line.trim()) return
      arr.push(line)
    }

    for (const line of lines) {
      if (isHeadingOf(line, problemTitles)) {
        current = 'problem'
        captured = true
        continue
      }
      if (isHeadingOf(line, predictionTitles)) {
        current = 'prediction'
        captured = true
        continue
      }
      if (isHeadingOf(line, solutionTitles)) {
        current = 'solution'
        captured = true
        continue
      }
      if (isHeadingOf(line, attackAnalysisTitles)) {
        current = 'attackAnalysis'
        captured = true
        continue
      }
      if (isHeadingOf(line, attackTypeTitles)) {
        current = 'attackType'
        captured = true
        continue
      }
      if (isHeadingOf(line, attackerProfileTitles)) {
        current = 'attackerProfile'
        captured = true
        continue
      }
      if (isHeadingOf(line, stopTitles)) {
        current = null
        continue
      }

      if (current === 'problem') pushLine(problemSections, line)
      else if (current === 'prediction') pushLine(predictionSections, line)
      else if (current === 'solution') pushLine(solutionSections, line)
      else if (current === 'attackAnalysis') pushLine(attackAnalysisSections, line)
      else if (current === 'attackType') pushLine(attackTypeSections, line)
      else if (current === 'attackerProfile') pushLine(attackerProfileSections, line)
    }

    if (
      captured &&
      (problemSections.length ||
        predictionSections.length ||
        solutionSections.length ||
        attackAnalysisSections.length ||
        attackTypeSections.length ||
        attackerProfileSections.length)
    ) {
      return {
        problemSections,
        predictionSections,
        solutionSections,
        attackAnalysisSections,
        attackTypeSections,
        attackerProfileSections,
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  // 2) 回退：正则与关键词解析
  const problemSectionRegex =
    /(异常问题|异常状态|异常情况|问题分析|检测到的异常|系统异常|当前异常)(:|：)[\s\n]*/i
  const predictionSectionRegex =
    /(故障预测|风险预测|可能故障|潜在风险|未来风险|预测结果|如不处理|可能导致)(:|：)[\s\n]*/i

  const hasProblemSection = problemSectionRegex.test(content)
  const hasPredictionSection = predictionSectionRegex.test(content)

  if (hasProblemSection || hasPredictionSection) {
    let matches = []
    let match
    const problemRegex = new RegExp(problemSectionRegex, 'g')
    while ((match = problemRegex.exec(content)) !== null) {
      matches.push({ index: match.index, title: match[0], type: 'problem' })
    }
    const predictionRegex = new RegExp(predictionSectionRegex, 'g')
    while ((match = predictionRegex.exec(content)) !== null) {
      matches.push({ index: match.index, title: match[0], type: 'prediction' })
    }
    const solutionSectionRegex =
      /(解决方案|修复措施|处理方案|处置建议|应对措施|优化方案)(:|：)[\s\n]*/g
    while ((match = solutionSectionRegex.exec(content)) !== null) {
      matches.push({ index: match.index, title: match[0], type: 'solution' })
    }
    const otherSectionRegex = /(补充说明|注意事项|特别提醒|建议|结论)(:|：)[\s\n]*/g
    while ((match = otherSectionRegex.exec(content)) !== null) {
      matches.push({ index: match.index, title: match[0], type: 'other' })
    }
    matches.sort((a, b) => a.index - b.index)

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i]
      const startPos = currentMatch.index + currentMatch.title.length
      const endPos = i < matches.length - 1 ? matches[i + 1].index : content.length
      let sectionContent = content.substring(startPos, endPos).trim()
      if (currentMatch.type === 'problem') {
        sectionContent = highlightKeyTerms(sectionContent, 'problem')
        problemSections.push(sectionContent)
      } else if (currentMatch.type === 'prediction') {
        sectionContent = highlightKeyTerms(sectionContent, 'prediction')
        predictionSections.push(sectionContent)
      } else if (currentMatch.type === 'solution') {
        sectionContent = highlightKeyTerms(sectionContent, 'solution')
        solutionSections.push(sectionContent)
      }
    }
  } else {
    const problemKeywords = [
      '异常问题',
      '异常状态',
      'CPU温度',
      '内存使用率',
      '内存占用',
      '存储空间',
      '磁盘空间',
      '网络延迟',
      '网络带宽',
      '系统负载',
      '进程异常',
      '服务异常',
      '资源占用',
      '温度过高',
      '功耗异常',
    ]
    const predictionKeywords = [
      '故障预测',
      '潜在风险',
      '可能导致',
      '未来可能',
      '如果不处理',
      '预计会',
      '将会',
      '可能出现',
      '性能下降',
      '网络包丢失',
      '延迟增加',
      '无故重启',
      '配置丢失',
      '安全风险',
      '过载',
      '不稳定',
      '崩溃',
      '损坏',
      '设备寿命缩短',
      '硬件故障',
    ]
    const solutionKeywords = [
      '解决方案',
      '修复',
      '优化',
      '建议',
      '措施',
      '处理方案',
      '应对',
      '处置',
    ]
    const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 0)
    for (const para of paragraphs) {
      let isProblem = false
      let isPrediction = false
      let isSolution = false
      for (const keyword of problemKeywords) {
        if (para.includes(keyword)) {
          isProblem = true
          break
        }
      }
      // 先判断是否为解决方案（优先级高于预测，避免"包含可能/风险"等词误归类到预测）
      if (!isProblem) {
        for (const keyword of solutionKeywords) {
          if (para.includes(keyword)) {
            isSolution = true
            break
          }
        }
      }
      // 再判断预测（仅当不属于解决方案时）
      if (!isProblem && !isSolution) {
        for (const keyword of predictionKeywords) {
          if (para.includes(keyword)) {
            isPrediction = true
            break
          }
        }
      }
      if (!isProblem && !isPrediction && !isSolution) {
        for (const keyword of solutionKeywords) {
          if (para.includes(keyword)) {
            isSolution = true
            break
          }
        }
      }
      if (
        !isProblem &&
        !isPrediction &&
        !isSolution &&
        (para.startsWith('-') || para.startsWith('•') || /^\d+\./.test(para))
      ) {
        isProblem = /(当前|目前|现在|检测到|发现|显示|存在)/.test(para)
        isPrediction = !isProblem && /(可能|潜在|预计|未来|将会|如果|有可能)/.test(para)
        // 列表项中若出现"建议/措施/优化/修复/处理/应对/处置"等，更倾向判为解决方案
        if (!isProblem && !isPrediction && /(建议|措施|优化|修复|处理|应对|处置)/.test(para)) {
          isSolution = true
        }
      }
      if (!isProblem && !isPrediction) {
        const criticalPredictions = ['性能下降', '设备崩溃', '连接不稳定', '数据丢失', '安全漏洞']
        for (const term of criticalPredictions) {
          if (para.includes(term)) {
            isPrediction = true
            break
          }
        }
      }
      if (isProblem) {
        const highlightedPara = highlightKeyTerms(para, 'problem')
        problemSections.push(highlightedPara)
      } else if (isPrediction) {
        const highlightedPara = highlightKeyTerms(para, 'prediction')
        predictionSections.push(highlightedPara)
      } else if (isSolution) {
        const highlightedPara = highlightKeyTerms(para, 'solution')
        solutionSections.push(highlightedPara)
      }
    }
  }

  return {
    problemSections,
    predictionSections,
    solutionSections,
    attackAnalysisSections,
    attackTypeSections,
    attackerProfileSections,
  }
}

// 高亮关键术语 - 专注于高亮冒号前的文本
const highlightKeyTerms = (text, type) => {
  // 按行处理文本
  const lines = text.split('\n')
  const processedLines = lines.map((line) => {
    // 跳过空行
    if (!line.trim()) {
      return line
    }

    // 处理带有冒号的行 - 高亮冒号前的文本
    if (line.includes('：') || line.includes(':')) {
      // 处理列表项（以'-'、'•'或数字开头）
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\s*\d+\./.test(line)) {
        // 提取列表项标记和内容
        const listItemMatch = line.match(/^(\s*[-•]|\s*\d+\.)\s+(.+)$/)
        if (listItemMatch) {
          const [_, prefix, content] = listItemMatch

          // 检查内容中是否有冒号
          if (content.includes('：') || content.includes(':')) {
            const colonIndex =
              content.indexOf('：') >= 0 ? content.indexOf('：') : content.indexOf(':')
            const beforeColon = content.substring(0, colonIndex)
            const afterColon = content.substring(colonIndex)

            // 高亮冒号前的文本
            return `${prefix} <strong>${beforeColon}</strong>${afterColon}`
          }
        }
      }

      // 处理普通行
      const colonIndex = line.indexOf('：') >= 0 ? line.indexOf('：') : line.indexOf(':')
      if (colonIndex > 0) {
        const beforeColon = line.substring(0, colonIndex)
        const afterColon = line.substring(colonIndex)

        // 保留行首的空白字符
        const leadingSpaceMatch = beforeColon.match(/^(\s*)/)
        const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : ''
        const content = beforeColon.substring(leadingSpace.length)

        return `${leadingSpace}<strong>${content}</strong>${afterColon}`
      }
    }

    return line
  })

  return processedLines.join('\n')
}

// 规范化 Markdown：
// - 统一换行符为 \n
// - 纠正标题与列表项前缺失的换行，避免内容黏连
const normalizeMarkdown = (text) => {
  if (!text) return ''
  // 统一为 \n
  let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // 在不是行首的位置出现的 Markdown 标题（#、##、###…）前补换行
  // 例如："……分析与建议## 一、执行摘要" -> "……分析与建议\n## 一、执行摘要"
  t = t.replace(/([^\n])\s*(#{1,6}\s+)/g, (m, prev, hashes) => `${prev}\n${hashes}`)

  // 在不是行首的位置出现的列表标记前补换行：-、*、•、数字.
  t = t.replace(/([^\n])\s+(-\s+|\*\s+|•\s+|\d+\.\s+)/g, (m, prev, bullet) => `${prev}\n${bullet}`)

  // 压缩过多空行
  t = t.replace(/\n{3,}/g, '\n\n')

  return t
}

// 保存异常/预测/解决方案结果到后端
const saveAnomalyResults = (anomalyText, predictionText, solutionText) => {
  // 同时使用两个API保存异常检测结果
  try {
    // 保存到专门的故障预警API（统一使用 saveAiWarn 表单接口）
    saveAiWarn({
      anomalyProblem: anomalyText,
      predictedFailure: predictionText,
    })
  } catch (error) {
    console.error('发送异常检测结果失败:', error)
  }
}

// 关闭弹窗
const closeAlertDialog = () => {
  showAlertDialog.value = false
}

// 处理错误
const handleError = (err) => {
  isTyping.value = false
  console.error(err)

  if (!errorDisplayed.value) {
    errorDisplayed.value = true
    isLoading.value = false
    isStreaming.value = false
    addErrorMsg('抱歉，请求处理失败，请稍后再试。')
  }
}

// 添加错误消息
const addErrorMsg = (content) => {
  const errorMsg = {
    role: 'assistant',
    content: content,
  }
  messages.value.push(errorMsg)
  nextTick(() => {
    scrollToBottom()
  })
}

// 滚动到底部
const scrollToBottom = () => {
  const container = chatContainer.value
  if (container && isAutoScroll.value) {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
  }
}

// 生命周期钩子
onMounted(() => {
  // 检查是否从流量分析页面跳转过来
  if (route.query.flowId) {
    deviceInfo.value = {
      id: route.query.flowId,
      sourceIP: route.query.sourceIP,
      sourcePort: route.query.sourcePort,
      attackerIP: route.query.attackerIP,
      attackerPort: route.query.attackerPort,
      protocol: route.query.protocol,
      trafficSize: route.query.trafficSize,
      duration: route.query.duration,
      attackType: route.query.attackType,
      timestamp: route.query.timestamp,
      asset: route.query.asset,
    }

    // 如果有prompt参数，自动填充并发送消息
    if (route.query.prompt) {
      setTimeout(() => {
        // 在健康检查完成后自动发送分析请求
        newMessage.value = route.query.prompt
        sendMessage()
      }, 1500) // 等待健康检查和页面加载完成
    }
  }

  // 检查API健康状态
  checkAppHealth()

  // 添加滚动监听
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.addEventListener('scroll', handleScroll)
    }
    // 添加点击事件监听器，用于隐藏提示词
    document.addEventListener('click', handleClickOutside)
    // 如果有路由参数，自动聚焦输入框
    if (route.query.prompt) {
      const inputElement = document.querySelector('.message-input')
      if (inputElement) {
        inputElement.focus()
      }
    }
  })
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (chatContainer.value) {
    chatContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// 监听路由参数变化，自动填充输入框
watch(
  () => route.query.prompt,
  (newPrompt) => {
    if (newPrompt) {
      newMessage.value = newPrompt
      // 如果需要自动发送消息，取消下面的注释
      // nextTick(() => {
      //   sendMessage()
      // })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="ai-chat-page">
    <!-- 头部页头 -->
    <Header />
    <!-- 主聊天界面 -->
    <div class="chat-container-wrapper">
      <div class="chat-app">
        <!-- 页面加载指示器 -->
        <div v-if="isLoadingApp" class="app-loading">
          <div class="loading-spinner"></div>
          <p>
            {{ ok ? '正在连接服务器...' : '智能问答助手加载失败，请检查网络连接或联系管理员' }}
          </p>
        </div>

        <!-- 异常检测弹窗 -->
        <div v-if="showAlertDialog" class="alert-dialog">
          <div class="alert-content">
            <div class="alert-header">
              <div class="alert-title">
                <span class="warning-icon">⚠️</span>
                <h3>{{ alertContent.title }}</h3>
              </div>
              <span class="close-btn" @click="closeAlertDialog">&times;</span>
            </div>
            <div class="alert-body">
              <div class="alert-section" v-if="alertContent.problems">
                <h4>检测到的异常问题：</h4>
                <div v-html="md.render(alertContent.problems)"></div>
              </div>
              <div class="alert-section">
                <h4>可能的故障预测：</h4>
                <div v-html="md.render(alertContent.predictions)"></div>
              </div>
            </div>
            <div class="alert-footer">
              <button @click="closeAlertDialog" class="alert-btn">我知道了</button>
            </div>
          </div>
        </div>

        <div class="chat-container" ref="chatContainer">
          <!-- 聊天内容 -->
          <div v-for="(message, index) in messages" :key="index">
            <div :class="message.role === 'user' ? 'chat-message-user' : 'chat-message-ai'">
              <div class="message-head-portrait">
                <div v-if="message.role === 'user'" class="avatar">
                  <!-- 用户头像 -->
                  <img src="@/assets/images/用户头像.jpg" alt="用户" />
                </div>
                <div v-else class="avatar">
                  <!-- ai头像 -->
                  <img src="@/assets/images/ai头像.jpg" alt="AI" />
                </div>
              </div>

              <div
                :class="
                  message.role === 'user'
                    ? 'message-content message-user'
                    : 'message-content message-ai'
                "
              >
                <div class="sender-name" :class="{ 'sender-name-user': message.role === 'user' }">
                  {{ message.role === 'user' ? '我' : 'AI助手' }}
                </div>
                <div
                  class="message-bubble"
                  :class="{ 'solution-style': message.type === 'solution' }"
                >
                  <div class="markdown" v-html="md.render(message.content)"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- ai响应 输入中-->
          <div class="typing-indicator" v-if="isTyping">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <!-- 流式响应显示 -->
          <div v-if="isStreaming" class="streaming-message">
            <div class="message-head-portrait">
              <div class="avatar">
                <img src="@/assets/images/ai头像.jpg" alt="AI" />
              </div>
            </div>

            <div class="message-content message-ai">
              <div class="sender-name">AI助手</div>
              <div
                class="message-bubble"
                :class="{ 'solution-style': currentMessageType === 'solution' }"
              >
                <div class="markdown" v-html="md.render(streamingContent)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框和按钮 -->
        <div class="input-container">
          <div class="input-wrapper">
            <!-- 提示词模板 -->
            <div v-if="showPrompts" class="prompt-templates">
              <div
                v-for="(prompt, index) in promptTemplates"
                :key="index"
                class="prompt-item"
                @click="selectPrompt(prompt)"
              >
                {{ prompt }}
              </div>
            </div>

            <!-- 模型选择器 -->
            <div class="model-selector">
              <div class="model-dropdown" v-if="showModelSelect">
                <div
                  v-for="model in models"
                  :key="model.id"
                  class="model-option"
                  :class="{ selected: model.id === selectedModel }"
                  @click="selectModel(model.id)"
                >
                  {{ model.name }}
                </div>
              </div>
            </div>

            <input
              type="text"
              class="message-input"
              v-model="newMessage"
              placeholder="输入消息..."
              @keyup.enter="sendMessage"
              @focus="handleInputFocus"
              :disabled="isLoading"
            />
          </div>
          <button class="send-button" @click="sendMessage" :disabled="isLoading">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-page {
  width: 100%;
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #050c14, #0b1c33);
  overflow: hidden;
  background: url(@/assets/images/53bg.png);
  background-size: 100%;
}

/* 背景元素 */
.bg-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.sphere {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  opacity: 0.6;
}

.sphere-bg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 144, 255, 0.3), rgba(0, 224, 219, 0.1));
  box-shadow: 0 0 60px rgba(0, 224, 219, 0.5);
  animation: pulse 8s infinite alternate;
}

.circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(0, 224, 219, 0.3);
  animation: rotate 30s linear infinite;
}

.circle1 {
  width: 500px;
  height: 500px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-color: rgba(0, 224, 219, 0.2);
}

.circle2 {
  width: 400px;
  height: 400px;
  top: 60%;
  left: 40%;
  transform: translate(-50%, -50%);
  border-color: rgba(0, 144, 255, 0.2);
  animation-duration: 25s;
  animation-direction: reverse;
}

.circle3 {
  width: 200px;
  height: 200px;
  top: 30%;
  left: 60%;
  transform: translate(-50%, -50%);
  border-color: rgba(0, 224, 219, 0.3);
  animation-duration: 20s;
}

.circle4 {
  width: 150px;
  height: 150px;
  top: 70%;
  left: 70%;
  transform: translate(-50%, -50%);
  border-color: rgba(0, 144, 255, 0.3);
  animation-duration: 15s;
}

.circle5 {
  width: 100px;
  height: 100px;
  top: 25%;
  left: 25%;
  transform: translate(-50%, -50%);
  border-color: rgba(0, 224, 219, 0.4);
  animation-duration: 10s;
  animation-direction: reverse;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 聊天容器 */
.chat-container-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 120px);
  padding: 0 20px;
}

.chat-container-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px 0;
}

:deep(.border-title) {
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(0, 224, 219, 0.7);
  letter-spacing: 2px;
  margin-top: 10px;
}

.chat-app {
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-sizing: border-box;
}

.app-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 20, 40, 0.7);
  z-index: 1000;
  border-radius: 8px;
}

.app-loading p {
  margin-top: 16px;
  color: #1affff;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(0, 224, 219, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 224, 219, 0.3);
  border-top-color: #1affff;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 10px;
  background: rgba(0, 20, 40, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(0, 224, 219, 0.3);
  margin-bottom: 15px;
}

.chat-message-user,
.chat-message-ai {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.5s ease forwards;
}

.chat-message-user {
  padding-right: 8px;
  flex-direction: row-reverse;
}

.chat-message-ai {
  padding-left: 8px;
}

.streaming-message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.5s ease forwards;
}

.message-head-portrait {
  flex-shrink: 0;
  margin: 0 10px;
}

.avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0, 224, 219, 0.5);
  object-fit: cover;
}

.message-content {
  max-width: 80%;
}

.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
  padding: 0 6px;
}

.sender-name-user {
  text-align: right;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  overflow: hidden;
}

.message-user .message-bubble {
  background: linear-gradient(90deg, #4e54c8, #8f94fb);
  color: white;
  border-top-right-radius: 5px;
}

.message-ai .message-bubble {
  background: rgba(0, 40, 80, 0.7);
  border: 1px solid rgba(0, 224, 219, 0.4);
  border-top-left-radius: 5px;
  color: #ffffff;
}

/* 解决方案风格：深色面板、编号标题、关键字加粗、条目间距更大 */
.solution-style {
  background: rgba(4, 25, 50, 0.85) !important;
  border: 1px solid rgba(0, 224, 219, 0.5) !important;
  box-shadow: 0 0 20px rgba(0, 224, 219, 0.25);
}

.solution-style :deep(.markdown h2),
.solution-style :deep(.markdown h3) {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(0, 224, 219, 0.6);
  margin: 12px 0 8px;
}

.solution-style :deep(.markdown ul),
.solution-style :deep(.markdown ol) {
  margin: 6px 0 10px;
  padding-left: 22px;
}

.solution-style :deep(.markdown li) {
  margin: 6px 0;
}

.solution-style :deep(.markdown strong),
.solution-style :deep(.markdown b) {
  color: #ffffff;
  font-weight: 800;
}

.input-container {
  padding: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.prompt-templates {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 8px;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
  margin-bottom: 10px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.prompt-item {
  padding: 10px 15px;
  color: #ffffff;
  border-bottom: 1px solid rgba(0, 224, 219, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.prompt-item:last-child {
  border-bottom: none;
}

.prompt-item:hover {
  background: rgba(0, 224, 219, 0.2);
}

.message-input {
  flex: 1;
  height: 44px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 22px;
  font-size: 14px;
  outline: none;
  background: rgba(0, 20, 40, 0.4);
  color: #ffffff;
  transition: all 0.3s;
}

.message-input:focus {
  border-color: #1affff;
  box-shadow: 0 0 10px rgba(0, 224, 219, 0.5);
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.send-button {
  padding: 12px 24px;
  height: 44px;
  background: linear-gradient(90deg, #00a0e9, #1affff);
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(0, 224, 219, 0.4);
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 224, 219, 0.6);
}

.send-button:active {
  transform: translateY(1px);
}

.typing-indicator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 40, 80, 0.7);
  border-radius: 16px;
  border: 1px solid rgba(0, 224, 219, 0.4);
  width: fit-content;
  margin: 0 0 16px 56px;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background: #1affff;
  display: inline-block;
  margin: 0 3px;
  animation: typing 1.5s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条 */
.chat-container::-webkit-scrollbar {
  width: 4px;
}

.chat-container::-webkit-scrollbar-track {
  background: rgba(0, 20, 40, 0.2);
  border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb {
  background: rgba(0, 224, 219, 0.5);
  border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 224, 219, 0.8);
}

/* 弹窗样式 */
.alert-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.alert-content {
  background: rgba(40, 10, 10, 0.95);
  border: 1px solid rgba(255, 50, 50, 0.6);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(255, 50, 50, 0.7);
  animation: zoomIn 0.3s ease;
}

.alert-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 50, 50, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(60, 0, 0, 0.5);
}

.alert-title {
  display: flex;
  align-items: center;
}

.warning-icon {
  font-size: 24px;
  margin-right: 10px;
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.alert-header h3 {
  margin: 0;
  color: #ff5050;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 50, 50, 0.5);
}

.close-btn {
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #1affff;
}

.alert-body {
  padding: 16px 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.alert-section {
  margin-bottom: 16px;
}

.alert-section h4 {
  margin: 0 0 8px;
  color: #ff7777;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 0 5px rgba(255, 50, 50, 0.3);
  display: flex;
  align-items: center;
}

.alert-section h4::before {
  content: '⚠';
  margin-right: 8px;
  font-size: 14px;
}

.alert-section :deep(p) {
  margin: 0 0 8px;
  color: rgba(255, 220, 220, 0.95);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-line;
}

/* 警告文本高亮样式 */
.alert-section :deep(p) strong,
.alert-section :deep(p) b,
.alert-section :deep(li) strong,
.alert-section :deep(li) b {
  color: #ffcc00;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(255, 204, 0, 0.3);
}

/* 弹窗中应用与主界面相同的markdown样式，但颜色更亮 */
.alert-section :deep(.markdown) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  color: rgba(255, 220, 220, 0.95);
}

/* 强调段落文本 */
.alert-section :deep(strong),
.alert-section :deep(b) {
  color: #ffcc00;
  font-weight: bold;
}

/* 标题文字 */
.alert-section :deep(h1),
.alert-section :deep(h2),
.alert-section :deep(h3),
.alert-section :deep(h4),
.alert-section :deep(h5),
.alert-section :deep(h6) {
  color: #ff9999;
  margin: 12px 0 6px;
}

/* 列表项 */
.alert-section :deep(li) {
  margin-bottom: 4px;
  color: rgba(255, 220, 220, 0.95);
}

/* 弹窗底部按钮和边框 */
.alert-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 100, 100, 0.3);
  display: flex;
  justify-content: flex-end;
}

/* 弹窗中的链接样式 */
.alert-section :deep(a) {
  color: #ff9966;
  text-decoration: none;
  border-bottom: 1px dotted rgba(255, 150, 100, 0.5);
}

.alert-section :deep(a:hover) {
  text-decoration: none;
  border-bottom: 1px solid #ff9966;
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Markdown 样式 */
:deep(.markdown) {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 统一 Markdown 文本样式，避免各模板字号不一致 */
:deep(.markdown p) {
  font-size: 14px;
  line-height: 1.6;
  margin: 6px 0;
}

:deep(.markdown h1),
:deep(.markdown h2),
:deep(.markdown h3),
:deep(.markdown h4),
:deep(.markdown h5),
:deep(.markdown h6) {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 6px;
}

:deep(.markdown strong),
:deep(.markdown b) {
  font-weight: 700;
}

:deep(.markdown ul),
:deep(.markdown ol) {
  padding-left: 20px;
  margin: 6px 0;
}

:deep(.markdown li) {
  margin: 2px 0;
}

:deep(.markdown pre) {
  padding: 8px;
  margin: 8px 0;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 224, 219, 0.3);
  font-family: monospace;
  font-size: 13px;
  color: #e6e6e6;
  overflow-x: auto;
}

:deep(.markdown code) {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  padding: 2px 4px;
  font-family: monospace;
  color: #1affff;
}

:deep(.markdown a) {
  color: #1affff;
  text-decoration: none;
  border-bottom: 1px dotted rgba(0, 224, 219, 0.5);
}

:deep(.markdown a:hover) {
  text-decoration: none;
  border-bottom: 1px solid #1affff;
}

@media (max-width: 768px) {
  .chat-container-wrapper {
    padding: 0 10px;
  }

  .message-bubble {
    font-size: 13px;
    padding: 8px 12px;
  }

  :deep(.border-title) {
    font-size: 20px;
  }
}

.alert-section :deep(pre) {
  padding: 8px;
  margin: 8px 0;
  border-radius: 6px;
  background-color: rgba(40, 0, 0, 0.4);
  border: 1px solid rgba(255, 100, 100, 0.3);
  font-family: monospace;
  font-size: 13px;
  color: #ffdddd;
  overflow-x: auto;
}

.alert-section :deep(code) {
  background-color: rgba(60, 0, 0, 0.3);
  border-radius: 3px;
  padding: 2px 4px;
  font-family: monospace;
  color: #f2f2f2;
}

.alert-section :deep(ul),
.alert-section :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

/* 弹窗子标题样式 */
.alert-section h4 {
  margin: 0 0 8px;
  color: #ff7777;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 0 5px rgba(255, 50, 50, 0.3);
  display: flex;
  align-items: center;
}

/* 弹窗中特殊突出的文本，如故障名称 */
.alert-section :deep(em),
.alert-section :deep(i) {
  font-style: italic;
  color: #ffcc99;
}

.alert-btn {
  padding: 8px 16px;
  background: linear-gradient(90deg, #cc0000, #ff3333);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.4);
}

.alert-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 50, 50, 0.6);
}

.alert-body::-webkit-scrollbar {
  width: 4px;
}

.alert-body::-webkit-scrollbar-track {
  background: rgba(60, 0, 0, 0.2);
  border-radius: 3px;
}

.alert-body::-webkit-scrollbar-thumb {
  background: rgba(255, 50, 50, 0.7);
  border-radius: 3px;
}

.alert-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 50, 50, 0.9);
}
</style>
