<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import '@/css/ResourceOverview.css'
import { getRealtimeData, getMemoryPieData, getStoragePieData } from '@/api/device'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
// 引入水球图
import 'echarts-liquidfill'
import { useRouter } from 'vue-router'

// 获取路由实例
const router = useRouter()

// 导航到AI页面的函数
const navigateToAI = (metricLabel, value) => {
  // 规范化度量名：移除可能的“异常分析”等后缀
  let cleanLabel = String(metricLabel || '').trim()
  cleanLabel = cleanLabel.replace(/异常分析$/, '')
  // 去掉可能的“网关中”前缀，后面统一再补
  cleanLabel = cleanLabel.replace(/^网关中/, '')

  // 目标完整提示
  const prompt = `网关中${cleanLabel}为${value}，请分析一下网关可能存在的异常问题然后预测网关可能因为这个异常问题而出现的故障（无需提供解决方案)`

  router.push({
    name: 'ai',
    query: { prompt },
  })
}

// 网络状态数据
const networkInfo = ref({
  // 当前连接数
  currentConnections: 0,
  // 最大连接数
  maxConnections: 0,
  // 网络接口错误包率
  errorRate: 0,
})

// 磁盘I/O性能数据
const diskInfo = ref({
  // 磁盘读取速度
  readSpeed: 0,
  // 磁盘写入速度
  writeSpeed: 0,
  // I/O等待时间
  ioWaitTime: 0,
})

// CPU性能数据
const cpuInfo = ref({
  temperature: 54,
  usage: 0,
})

// 内存性能数据
const memoryInfo = ref({
  usage: 20,
})

// 存储性能数据
const storageInfo = ref({
  usage: 0,
})

// 加载状态
const loading = ref(true)

// 内存图表实例
let memoryChart = null
// 存储图表实例
let storageChart = null
// 初始化内存图表
const initMemoryChart = () => {
  const chartDom = document.getElementById('memoryChart')
  if (!chartDom) {
    console.error('找不到内存图表DOM元素')
    return false
  }

  try {
    console.log('初始化内存图表')
    if (memoryChart) {
      memoryChart.dispose()
    }

    memoryChart = echarts.init(chartDom)

    const option = {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'liquidFill',
          data: [
            (memoryInfo.value.usage || 0) / 100,
            ((memoryInfo.value.usage || 0) - 5) / 100 > 0
              ? ((memoryInfo.value.usage || 0) - 5) / 100
              : 0.01,
            ((memoryInfo.value.usage || 0) - 10) / 100 > 0
              ? ((memoryInfo.value.usage || 0) - 10) / 100
              : 0.005,
          ],
          radius: '65%',
          color: [
            {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(0, 224, 219, 0.9)',
                },
                {
                  offset: 1,
                  color: 'rgba(0, 144, 255, 0.7)',
                },
              ],
            },
            {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(0, 224, 219, 0.6)',
                },
                {
                  offset: 1,
                  color: 'rgba(0, 144, 255, 0.4)',
                },
              ],
            },
            {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(0, 224, 219, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(0, 144, 255, 0.15)',
                },
              ],
            },
          ],
          backgroundStyle: {
            color: 'rgba(0, 40, 70, 0.2)',
            borderWidth: 1,
            borderColor: 'rgba(0, 224, 219, 0.2)',
          },
          outline: {
            show: true,
            borderDistance: 4,
            itemStyle: {
              borderWidth: 2,
              borderColor: 'rgba(0, 224, 219, 0.5)',
              shadowBlur: 24,
              shadowColor: 'rgba(0, 224, 219, 0.5)',
            },
          },
          label: {
            show: false,
          },
          itemStyle: {
            opacity: 0.95,
            shadowBlur: 36,
            shadowColor: 'rgba(0, 224, 219, 0.5)',
          },
          amplitude: 12,
          waveAnimation: true,
          animationDuration: 2000,
          animationDurationUpdate: 1000,
          period: 4000,
          direction: 'right',
          shape: 'circle',
        },
      ],
    }

    memoryChart.setOption(option)
    return true
  } catch (error) {
    console.error('初始化内存图表失败:', error)
    return false
  }
}

// 初始化存储图表
const initStorageChart = () => {
  const chartDom = document.getElementById('storageChart')
  if (!chartDom) {
    console.error('找不到存储图表DOM元素')
    return false
  }

  try {
    console.log('初始化存储图表')
    if (storageChart) {
      storageChart.dispose()
    }

    storageChart = echarts.init(chartDom)

    const option = {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          radius: '65%',
          pointer: {
            show: false,
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: '#f29701',
                  },
                  {
                    offset: 1,
                    color: '#ff5722',
                  },
                ],
              },
              shadowColor: 'rgba(242, 151, 1, 0.7)',
              shadowBlur: 24,
            },
          },
          axisLine: {
            lineStyle: {
              width: 24, // 更粗
              color: [[1, 'rgba(0, 20, 40, 0.3)']],
            },
          },
          splitLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          data: [
            {
              value: storageInfo.value.usage || 0,
              name: '存储占用',
              title: {
                show: false,
              },
              detail: {
                show: false,
              },
            },
          ],
          title: {
            show: false,
          },
          detail: {
            show: false,
          },
          animationDuration: 2000,
        },
      ],
    }

    storageChart.setOption(option)
    return true
  } catch (error) {
    console.error('初始化存储图表失败:', error)
    return false
  }
}

// 更新内存图表数据
const updateMemoryChart = () => {
  if (!memoryChart) {
    console.error('内存图表实例不存在，重新初始化')
    initMemoryChart()
    return
  }

  console.log('更新内存图表数据:', memoryInfo.value.usage)

  try {
    memoryChart.setOption({
      series: [
        {
          data: [
            (memoryInfo.value.usage || 0) / 100,
            ((memoryInfo.value.usage || 0) - 5) / 100 > 0
              ? ((memoryInfo.value.usage || 0) - 5) / 100
              : 0.01,
            ((memoryInfo.value.usage || 0) - 10) / 100 > 0
              ? ((memoryInfo.value.usage || 0) - 10) / 100
              : 0.005,
          ],
        },
      ],
    })
  } catch (error) {
    console.error('更新内存图表失败:', error)
    // 尝试重新初始化
    initMemoryChart()
  }
}

// 更新存储图表数据
const updateStorageChart = () => {
  if (!storageChart) {
    console.error('存储图表实例不存在，重新初始化')
    initStorageChart()
    return
  }

  console.log('更新存储图表数据:', storageInfo.value.usage)

  try {
    storageChart.setOption({
      series: [
        {
          data: [
            {
              value: storageInfo.value.usage || 0,
            },
          ],
        },
      ],
    })
  } catch (error) {
    console.error('更新存储图表失败:', error)
    // 尝试重新初始化
    initStorageChart()
  }
}

let timer = null
const updateData = async () => {
  try {
    if (loading.value && timer) return // 如果正在加载中且不是初始加载，则跳过

    const res = await getRealtimeData()
    console.log('实时数据响应:', res)
    if (res.data.code === 200 && res.data.data) {
      const d = res.data.data
      // 网络状态
      networkInfo.value = {
        currentConnections: d.currentConnections || 0,
        maxConnections: d.maxConnections || 65534,
        errorRate: d.networkError || 0,
      }
      // 磁盘I/O性能
      diskInfo.value = {
        readSpeed:
          typeof d.diskReadSpeed === 'string' ? parseFloat(d.diskReadSpeed) : d.diskReadSpeed || 0,
        writeSpeed:
          typeof d.diskWriteSpeed === 'string'
            ? parseFloat(d.diskWriteSpeed)
            : d.diskWriteSpeed || 0,
        ioWaitTime: typeof d.ioTime === 'string' ? parseFloat(d.ioTime) : d.ioTime || 0.5,
      }
      // CPU性能
      cpuInfo.value = {
        temperature:
          typeof d.cpuTemperature === 'string'
            ? parseFloat(d.cpuTemperature)
            : d.cpuTemperature || 0,
        usage: typeof d.cpuUsage === 'string' ? parseFloat(d.cpuUsage) : d.cpuUsage || 0,
      }

      // 获取内存使用率饼图数据
      await getMemoryData()

      // 获取存储占有率饼图数据
      await getStorageData()

      return true
    } else {
      console.error(`获取实时数据失败: ${res.data.message || '未知错误'}`)
      if (!loading.value) {
        // 只在非加载状态下显示错误消息
        ElMessage.error(`获取实时数据失败: ${res.data.message || '未知错误'}`)
      }
      return false
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    if (!loading.value) {
      // 只在非加载状态下显示错误消息
      if (error.response) {
        ElMessage.error(`请求失败: ${error.response.data.message || '服务器错误'}`)
      } else if (error.request) {
        ElMessage.error('网络连接失败，请检查网络设置')
      } else {
        ElMessage.error(`请求错误: ${error.message}`)
      }
    }
    return false
  }
}

// 获取内存使用率饼图数据
const getMemoryData = async () => {
  try {
    const res = await getMemoryPieData()
    console.log('内存数据响应:', res)
    if (res.data.code === 200) {
      // 内存性能
      let memoryUsage = 0

      if (res.data.data) {
        if (typeof res.data.data === 'string') {
          // 如果直接返回字符串形式的百分比
          memoryUsage = parseFloat(res.data.data.replace('%', ''))
        } else if (typeof res.data.data === 'number') {
          // 如果直接返回数字
          memoryUsage = res.data.data
        } else if (typeof res.data.data === 'object' && res.data.data !== null) {
          // 如果返回对象，尝试获取memoryUsage属性
          if (res.data.data.memoryUsage !== undefined) {
            if (typeof res.data.data.memoryUsage === 'string') {
              memoryUsage = parseFloat(res.data.data.memoryUsage.replace('%', ''))
            } else {
              memoryUsage = Number(res.data.data.memoryUsage)
            }
          }
        }
      }

      memoryInfo.value = {
        usage: isNaN(memoryUsage) ? 0 : memoryUsage,
      }

      // 更新内存图表
      nextTick(() => {
        updateMemoryChart()
      })
      return true
    } else {
      console.error('获取内存饼图数据失败:', res.data.message || '未知错误')
      return false
    }
  } catch (error) {
    console.error('获取内存饼图数据失败:', error)
    return false
  }
}

// 获取存储占有率饼图数据
const getStorageData = async () => {
  try {
    const res = await getStoragePieData()
    console.log('存储数据响应:', res)

    if (res.data.code === 200) {
      // 存储性能
      let storageUsage = 0

      if (res.data.data) {
        if (typeof res.data.data === 'string') {
          // 如果直接返回字符串形式的百分比
          storageUsage = parseFloat(res.data.data.replace('%', ''))
        } else if (typeof res.data.data === 'number') {
          // 如果直接返回数字
          storageUsage = res.data.data
        } else if (typeof res.data.data === 'object' && res.data.data !== null) {
          // 如果返回对象，尝试获取storageUsage属性
          if (res.data.data.storageUsage !== undefined) {
            if (typeof res.data.data.storageUsage === 'string') {
              storageUsage = parseFloat(res.data.data.storageUsage.replace('%', ''))
            } else {
              storageUsage = Number(res.data.data.storageUsage)
            }
          }
        }
      }

      storageInfo.value = {
        usage: isNaN(storageUsage) ? 0 : storageUsage,
      }

      // 更新存储图表
      nextTick(() => {
        updateStorageChart()
      })
      return true
    } else {
      console.error('获取存储饼图数据失败:', res.data.message || '未知错误')
      return false
    }
  } catch (error) {
    console.error('获取存储饼图数据失败:', error)
    return false
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (memoryChart) {
    memoryChart.resize()
  }
  if (storageChart) {
    storageChart.resize()
  }
}

// 组件挂载时启动定时器
onMounted(async () => {
  loading.value = true

  // 立即执行一次数据更新
  try {
    await updateData()
  } catch (error) {
    console.error('初始数据加载失败:', error)
  }

  // 在下一个渲染周期初始化图表
  nextTick(() => {
    initMemoryChart()
    initStorageChart()
    window.addEventListener('resize', handleResize)

    // 每3秒更新一次数据
    timer = setInterval(updateData, 3000)
    loading.value = false
  })
})

// 组件卸载前清除定时器和事件监听
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }

  if (memoryChart) {
    memoryChart.dispose()
    memoryChart = null
  }

  if (storageChart) {
    storageChart.dispose()
    storageChart = null
  }

  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="resource-overview">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 头部页头 -->
    <Header />
    <!-- 左侧边框 -->
    <div class="left-border">
      <TechBorder width="380" height="300" title="网络状态">
        <div class="network-dashboard">
          <div class="network-item">
            <div class="network-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                  fill="#1affff"
                />
                <path
                  d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z"
                  fill="#1affff"
                />
                <circle cx="12" cy="12" r="2" fill="#1affff" />
              </svg>
            </div>
            <div class="network-info">
              <div class="network-header">
                <span class="network-title">当前连接数</span>
                <span
                  class="network-value clickable"
                  @click="navigateToAI('网关中当前连接数', networkInfo.currentConnections)"
                  >{{ networkInfo.currentConnections }}</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      (networkInfo.currentConnections / (networkInfo.maxConnections / 100)) * 100 +
                      '%',
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="network-item">
            <div class="network-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z"
                  fill="#1affff"
                />
                <path d="M7 7H17V9H7V7Z" fill="#1affff" />
                <path d="M7 11H17V13H7V11Z" fill="#1affff" />
                <path d="M7 15H17V17H7V15Z" fill="#1affff" />
              </svg>
            </div>
            <div class="network-info">
              <div class="network-header">
                <span class="network-title">最大接口数</span>
                <span
                  class="network-value clickable"
                  @click="navigateToAI('网关中最大接口数为', networkInfo.maxConnections)"
                  >{{ networkInfo.maxConnections }}</span
                >
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 100%"></div>
              </div>
            </div>
          </div>

          <div class="network-item">
            <div class="network-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                  fill="#1affff"
                />
              </svg>
            </div>
            <div class="network-info">
              <div class="network-header">
                <span class="network-title">网络接口错误包率</span>
                <span
                  class="network-value clickable"
                  @click="
                    navigateToAI(
                      '网络接口错误包率异常分析',
                      (networkInfo.errorRate * 100).toFixed(2) + '%',
                    )
                  "
                  >{{ (networkInfo.errorRate * 100).toFixed(2) }}%</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill error"
                  :style="{ width: networkInfo.errorRate * 100 + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </TechBorder>
    </div>
    <div class="left-border1">
      <TechBorder width="380" height="300" title="磁盘I/O性能">
        <div class="network-dashboard">
          <div class="network-item">
            <div class="network-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 15V19H5V15H19M19 13H5C3.9 13 3 13.9 3 15V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V15C21 13.9 20.1 13 19 13Z"
                  fill="#1affff"
                />
                <path
                  d="M16 5H8V7H16V5M12 2C11.45 2 11 2.45 11 3V7C11 7.55 11.45 8 12 8C12.55 8 13 7.55 13 7V3C13 2.45 12.55 2 12 2Z"
                  fill="#1affff"
                />
              </svg>
            </div>
            <div class="network-info">
              <div class="network-header">
                <span class="network-title">磁盘读取速度</span>
                <span
                  class="network-value clickable"
                  @click="
                    navigateToAI('磁盘读取速度异常分析', diskInfo.readSpeed.toFixed(2) + ' MB/s')
                  "
                  >{{ diskInfo.readSpeed.toFixed(2) }} MB/s</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (diskInfo.readSpeed / 3) * 100 + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="network-item">
            <div class="network-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 13H5C3.9 13 3 13.9 3 15V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V15C21 13.9 20.1 13 19 13Z"
                  fill="#1affff"
                />
                <path
                  d="M12 2C11.45 2 11 2.45 11 3V11H8L12 15L16 11H13V3C13 2.45 12.55 2 12 2Z"
                  fill="#1affff"
                />
              </svg>
            </div>
            <div class="network-info">
              <div class="network-header">
                <span class="network-title">磁盘写入速度</span>
                <span
                  class="network-value clickable"
                  @click="
                    navigateToAI('磁盘写入速度异常分析', diskInfo.writeSpeed.toFixed(2) + ' MB/s')
                  "
                  >{{ diskInfo.writeSpeed.toFixed(2) }} MB/s</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (diskInfo.writeSpeed / 3) * 100 + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="network-item">
            <div class="network-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                  fill="#1affff"
                />
                <path d="M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="#1affff" />
              </svg>
            </div>
            <div class="network-info">
              <div class="network-header">
                <span class="network-title">I/O等待时间</span>
                <span
                  class="network-value clickable"
                  @click="navigateToAI('I/O等待时间异常分析', diskInfo.ioWaitTime + ' ms')"
                  >{{ diskInfo.ioWaitTime }} ms</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :class="{ error: diskInfo.ioWaitTime > 100 }"
                  :style="{ width: (diskInfo.ioWaitTime / 50) * 100 + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </TechBorder>
    </div>
    <!-- 中间主要内容 -->
    <div class="main">
      <div class="total">
        <div class="sphere">
          <div class="sphere-bg"></div>
        </div>
        <div class="cicle3"></div>
        <div class="cicle4"></div>
        <div class="cicle5"></div>
        <div class="cicle6"></div>
        <div class="cicle7"></div>
        <div class="cicle8">
          <span
            class="clickable"
            @click="navigateToAI('CPU温度异常分析', cpuInfo.temperature + '℃')"
            >{{ cpuInfo.temperature }}℃</span
          >
          <p>CPU温度</p>
        </div>
        <div class="cicle9">
          <span class="clickable" @click="navigateToAI('CPU使用率异常分析', cpuInfo.usage + '%')"
            >{{ cpuInfo.usage }}%</span
          >
          <p>CPU使用率</p>
        </div>
        <div class="cicle10">
          <span
            class="clickable"
            @click="navigateToAI('内存使用率异常分析', memoryInfo.usage + '%')"
            >{{ memoryInfo.usage }}%</span
          >
          <p>内存使用率</p>
        </div>
        <div class="cicle11">
          <span
            class="clickable"
            @click="navigateToAI('存储占有率异常分析', storageInfo.usage + '%')"
            >{{ storageInfo.usage }}%</span
          >
          <p>存储占有率</p>
        </div>
      </div>
    </div>
    <!-- 右侧 -->
    <div class="right-border">
      <TechBorder width="380" height="300" title="内存性能">
        <div class="chart-container">
          <div id="memoryChart" class="memory-chart"></div>
          <div class="memory-info">
            <div
              class="memory-value clickable"
              @click="navigateToAI('内存使用率异常分析', memoryInfo.usage + '%')"
            >
              {{ memoryInfo.usage }}%
            </div>
            <div class="memory-label">内存使用率</div>
          </div>
          <div class="usage-stats">
            <div class="usage-item">
              <div class="used-memory">
                <div class="usage-label">已使用</div>
                <div
                  class="usage-value clickable"
                  @click="navigateToAI('内存已使用异常分析', memoryInfo.usage.toFixed(2) + '%')"
                >
                  {{ memoryInfo.usage.toFixed(2) }}%
                </div>
              </div>
              <div class="usage-bar">
                <div class="usage-fill" :style="{ width: memoryInfo.usage + '%' }"></div>
              </div>
            </div>
            <div class="usage-item">
              <div class="used-memory">
                <div class="usage-label">未使用</div>
                <div
                  class="usage-value clickable"
                  @click="
                    navigateToAI('内存未使用异常分析', (100 - memoryInfo.usage).toFixed(2) + '%')
                  "
                >
                  {{ (100 - memoryInfo.usage).toFixed(2) }}%
                </div>
              </div>
              <div class="usage-bar">
                <div
                  class="usage-fill unused"
                  :style="{ width: 100 - memoryInfo.usage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </TechBorder>
    </div>
    <div class="right-border1">
      <TechBorder width="380" height="300" title="存储性能">
        <div class="chart-container">
          <div id="storageChart" class="memory-chart"></div>
          <div class="memory-info">
            <div
              class="memory-value clickable"
              @click="navigateToAI('存储占有率异常分析', storageInfo.usage + '%')"
            >
              {{ storageInfo.usage }}%
            </div>
            <div class="memory-label">存储占有率</div>
          </div>
          <div class="usage-stats">
            <div class="usage-item">
              <div class="used-memory">
                <div class="usage-label">已使用</div>
                <div
                  class="usage-value clickable"
                  @click="navigateToAI('存储已使用异常分析', storageInfo.usage.toFixed(2) + '%')"
                >
                  {{ storageInfo.usage.toFixed(2) }}%
                </div>
              </div>
              <div class="usage-bar">
                <div class="usage-fill storage" :style="{ width: storageInfo.usage + '%' }"></div>
              </div>
            </div>
            <div class="usage-item">
              <div class="used-memory">
                <div class="usage-label">未使用</div>
                <div
                  class="usage-value clickable"
                  @click="
                    navigateToAI('存储未使用异常分析', (100 - storageInfo.usage).toFixed(2) + '%')
                  "
                >
                  {{ (100 - storageInfo.usage).toFixed(2) }}%
                </div>
              </div>
              <div class="usage-bar">
                <div
                  class="usage-fill storage unused"
                  :style="{ width: 100 - storageInfo.usage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </TechBorder>
    </div>
  </div>
</template>

<style scoped>
.resource-overview {
  width: 100%;
  height: 100%;
  position: relative;
}

.left-border {
  position: fixed;
  top: 17vh;
  left: 2vw;
  z-index: 1000;
}

.left-border1 {
  position: fixed;
  top: 57vh;
  left: 2vw;
  z-index: 1000;
}

.right-border {
  position: fixed;
  top: 17vh;
  right: 2vw;
  z-index: 1000;
}
.right-border1 {
  position: fixed;
  top: 57vh;
  right: 2vw;
  z-index: 1000;
}
.main {
  flex: 1;
  position: relative;
}

:deep(.border-title) {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 0 0.7vw rgba(255, 255, 255, 0.7);
  letter-spacing: 0.13vw;
  margin-top: 0.9vh;
}

.network-dashboard {
  padding: 1.1vh 1.2vw;
  display: flex;
  flex-direction: column;
  gap: 0.4vh;
  margin-top: 2vh;
  height: calc(100% - 2.2vh);
  box-sizing: border-box;
}

.network-item {
  margin-top: 0.9vh;
  display: flex;
  align-items: center;
  gap: 0.8vw;
  background: rgba(0, 20, 40, 0.4);
  border-radius: 0.6vw;
  padding: 0.8vw;
  border: 0.08vw solid rgba(0, 224, 219, 0.3);
  transition: all 0.3s ease;
  flex: 1;
  cursor: pointer;
  position: relative;
  z-index: 10;
}

.network-item:hover {
  transform: translateY(-0.15vw);
  box-shadow: 0 0.35vw 1vw rgba(0, 224, 219, 0.4);
  border-color: rgba(0, 224, 219, 0.8);
  background: rgba(0, 40, 80, 0.6);
}

.network-item:hover .network-icon {
  background: rgba(0, 224, 219, 0.3);
  transform: scale(1.1);
}

.network-item:hover .network-value {
  text-shadow: 0 0 1vw rgba(0, 224, 219, 1);
  color: #ffffff;
  font-weight: 700;
}

.network-item:hover .progress-fill::after {
  opacity: 1;
  width: 0.6vw;
}

.network-icon {
  width: 2.2vw;
  height: 2.2vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 224, 219, 0.1);
  border-radius: 0.6vw;
  padding: 0.4vw;
  flex-shrink: 0;
  transition: all 0.3s ease;
  pointer-events: none;
}

.network-icon svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 0.35vw rgba(26, 255, 255, 0.5));
  pointer-events: none;
}

.network-info {
  flex: 1;
  min-width: 0;
}

.network-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4vh;
}

.network-title {
  color: #1affff;
  font-size: 0.9rem;
  letter-spacing: 0.07vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.network-value {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 0 0 0.6vw rgba(0, 224, 219, 0.7);
  margin-left: 0.5vw;
  white-space: nowrap;
}

.progress-bar {
  height: 0.3vw;
  background: rgba(0, 224, 219, 0.1);
  border-radius: 0.13vw;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00e0db, #1affff);
  border-radius: 0.13vw;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0.3vw;
  height: 100%;
  background: #ffffff;
  opacity: 0.8;
  animation: progressGlow 1s infinite;
}

.progress-fill.error {
  background: linear-gradient(90deg, #ff4d4d, #ff8080);
}

@keyframes progressGlow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.7vw;
  box-sizing: border-box;
  margin-top: -1.5vw;
}

.memory-chart {
  width: 18vw;
  height: 24vw;
  animation: fadeIn 1s ease-in-out;
  margin: 0 auto 0 auto;
  display: block;
  position: relative;
}

.memory-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  background: rgba(0, 20, 40, 0.4);
  border-radius: 50%;
  width: 7vw;
  height: 7vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 1.3vw rgba(0, 224, 219, 0.3) inset;
  border: 0.1vw solid rgba(0, 224, 219, 0.3);
  animation: pulse 2s infinite alternate;
}

.used-memory {
  display: flex;
  align-content: center;
  justify-content: flex-start;
}

.memory-value {
  font-family: 'LCdd', sans-serif;
  font-size: 2rem;
  color: #00e0db;
  text-shadow: 0 0 0.8vw rgba(0, 224, 219, 0.8);
  line-height: 1;
}

.memory-label {
  font-size: 0.95rem;
  color: #ffffff;
  margin-top: 0.5vw;
  opacity: 0.85;
}

.usage-stats {
  position: absolute;
  top: 14vw;
  right: 3vw;
  width: 17vw;
  z-index: 10;
}

.usage-item {
  margin-bottom: 0.6vw;
  margin-top: 0.8vw;
}

.usage-label {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.15vw;
}

.usage-value {
  font-size: 0.95rem;
  color: #00e0db;
  font-weight: 600;
  margin-bottom: 0.15vw;
}

.usage-bar {
  height: 0.3vw;
  background: rgba(0, 20, 40, 0.4);
  border-radius: 0.13vw;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #00e0db, #1affff);
  border-radius: 0.13vw;
  transition: width 0.5s ease;
}

.usage-fill.unused {
  background: rgba(0, 224, 219, 0.3);
}

.usage-fill.storage {
  background: linear-gradient(90deg, #f29701, #ff5722);
}

.usage-fill.storage.unused {
  background: rgba(242, 151, 1, 0.3);
}

#storageChart + .memory-info {
  box-shadow: 0 0 1vw rgba(242, 151, 1, 0.3) inset;
  border: 0.07vw solid rgba(242, 151, 1, 0.2);
}

#storageChart + .memory-info .memory-value {
  color: #f29701;
  text-shadow: 0 0 0.7vw rgba(242, 151, 1, 0.7);
}

#storageChart ~ .usage-stats .usage-value {
  color: #f29701;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(0.7vw);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 1vw rgba(0, 224, 219, 0.2) inset;
  }
  100% {
    box-shadow: 0 0 1.3vw rgba(0, 224, 219, 0.5) inset;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 10, 20, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(0.2vw);
}

.loading-spinner {
  width: 4vw;
  height: 4vw;
  border: 0.3vw solid rgba(0, 224, 219, 0.3);
  border-radius: 50%;
  border-top-color: #00e0db;
  animation: spin 1s ease-in-out infinite;
  box-shadow: 0 0 1.3vw rgba(0, 224, 219, 0.5);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.usage-fill.storage.unused {
  background: rgba(242, 151, 1, 0.3);
}

.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.clickable:hover {
  text-shadow: 0 0 1vw #1affff;
  transform: scale(1.05);
}

#storageChart ~ .usage-stats .clickable:hover,
#storageChart + .memory-info .clickable:hover {
  text-shadow: 0 0 1vw #f29701;
}

#storageChart ~ .usage-stats .clickable::after,
#storageChart + .memory-info .clickable::after {
  display: none;
}

#storageChart ~ .usage-stats .network-value.clickable:hover,
#storageChart + .memory-info .network-value.clickable:hover {
  color: #f29701;
}

@media (max-width: 900px) {
  .left-border,
  .left-border1,
  .right-border,
  .right-border1 {
    width: 90vw !important;
    left: 5vw !important;
    right: 5vw !important;
    position: static !important;
    margin: 0 auto 2vw auto !important;
    top: auto !important;
  }
  .main {
    width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .chart-container,
  .memory-chart {
    width: 90vw !important;
    height: 40vw !important;
    min-width: 0 !important;
    min-height: 0 !important;
  }
  .usage-stats {
    width: 80vw !important;
    right: 0 !important;
    top: auto !important;
    position: static !important;
  }
}
</style>
