<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getGatewayInfo } from '@/api/device'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getTrafficCount7Day } from '@/api/traffic'
import { getWarnCount7Day } from '@/api/device'

// 路由
const router = useRouter()

// 当前选中的设备ID
const selectedDeviceId = ref('1') // 默认选中ID为1的设备

// 设备数据列表
const deviceList = ref([])

// 通过固定ID集合（示例：25、26、27）获取设备信息
const fetchDevices = async () => {
  try {
    const ids = [25, 26, 27]
    const responses = await Promise.allSettled(ids.map((id) => getGatewayInfo(id)))
    const rows = []
    responses.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const res = result.value
        const data = res?.data?.data || {}
        rows.push({
          id: String(data.id ?? ids[idx]),
          name: data.deviceName ?? `Gateway-${idx + 1}`,
          address: data.ip ?? '',
        })
      }
    })
    deviceList.value = rows

    if (deviceList.value.length === 0) {
      ElMessage({ type: 'warning', message: '暂无设备数据', duration: 2000 })
      return
    }

    // 若当前选中项不存在于新列表，则选中第一项
    if (!deviceList.value.some((d) => d.id === selectedDeviceId.value)) {
      selectedDeviceId.value = deviceList.value[0].id
    }

    // 初始化或更新图表
    initAlarmChart(selectedDeviceId.value)
    initTrafficChart(selectedDeviceId.value)
  } catch (e) {
    ElMessage({ type: 'error', message: '获取设备列表失败', duration: 2000 })
  }
}

// 资源异常统计（7天）由接口实时获取
const alarmHistoryData = ref({ dates: [], error: [] })

// 查看设备详情
const viewDeviceDetails = () => {
  // 跳转到ResourceOverview页面
  router.push({
    name: 'ResourceOverview',
  })

  ElMessage({
    type: 'success',
    message: `正在查看设备详情`,
    duration: 2000,
  })
}

// 查看告警历史详情
const viewAlarmHistory = () => {
  // 跳转到AlarmHistory页面
  router.push({
    name: 'AlarmHistory',
  })

  ElMessage({
    type: 'success',
    message: '查看告警历史详情',
    duration: 2000,
  })
}

// 查看流量异常详情
const viewTrafficAnomaly = () => {
  // 跳转到TrafficDetail页面
  router.push({
    name: 'trafficDetail',
  })

  ElMessage({
    type: 'success',
    message: '查看流量异常详情',
    duration: 2000,
  })
}

// 告警图表相关
let alarmChart = null
let trafficChart = null
let healthChart = null

// 显示图表加载效果
const showChartLoading = () => {
  if (alarmChart) {
    alarmChart.showLoading({
      text: '加载中...',
      color: '#00e0db',
      textColor: '#00e0db',
      maskColor: 'rgba(0, 20, 40, 0.8)',
    })
  }
  if (trafficChart) {
    trafficChart.showLoading({
      text: '加载中...',
      color: '#00e0db',
      textColor: '#00e0db',
      maskColor: 'rgba(0, 20, 40, 0.8)',
    })
  }
}

// 隐藏图表加载效果
const hideChartLoading = () => {
  if (alarmChart) {
    alarmChart.hideLoading()
  }
  if (trafficChart) {
    trafficChart.hideLoading()
  }
}

// 初始化告警历史图表
const initAlarmChart = (deviceId = null) => {
  const chartDom = document.getElementById('alarmHistoryChart')
  if (!chartDom) return

  if (!alarmChart) {
    alarmChart = echarts.init(chartDom)
  }

  // 仅使用接口数据
  const data = alarmHistoryData.value

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params) {
        const p = Array.isArray(params) && params.length ? params[0] : null
        const name = p?.name ?? ''
        const color = p?.color ?? '#ff4d4d'
        const val = Math.round(p?.value ?? 0)
        return `${name}<br/><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${color};margin-right:5px;"></span>异常数量: ${val}次`
      },
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
      axisLabel: {
        color: '#fff',
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: '异常数量',
      nameTextStyle: {
        color: '#fff',
        fontSize: 10,
      },
      // 只显示整数刻度
      minInterval: 1,
      axisLabel: {
        color: '#fff',
        fontSize: 10,
        formatter: function (value) {
          return Math.round(value)
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
    series: [
      {
        type: 'bar',
        emphasis: {
          focus: 'series',
        },
        itemStyle: {
          color: '#ff4d4d',
        },
        data: data.error,
      },
    ],
  }

  alarmChart.setOption(option)
}

// 初始化流量异常图表
const initTrafficChart = (deviceId = null, chartData = null) => {
  const chartDom = document.getElementById('trafficAnomalyChart')
  if (!chartDom) return

  if (!trafficChart) {
    trafficChart = echarts.init(chartDom)
  }

  // 获取设备特定数据或默认数据
  // 现在流量图只使用接口数据；若未传入则显示空
  const data = chartData || { dates: [], normal: [], abnormal: [] }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
      formatter: function (params) {
        let result = `${params[0].name}<br/>`
        params.forEach((item) => {
          let colorSpan = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${item.color};margin-right:5px;"></span>`
          result += `${colorSpan}${item.seriesName}: ${item.value}个<br/>`
        })
        return result
      },
    },
    legend: {
      data: ['正常流量', '疑似异常流量'],
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      bottom: '-5',
      left: 'center',
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
      axisLabel: {
        color: '#fff',
        fontSize: 10,
        interval: 0,
        // 仅显示月-日；若格式不匹配则原样输出
        formatter: function (value) {
          if (!value) return ''
          const v = String(value)
          return v.includes('-') && v.length >= 7 ? v.slice(5) : v
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '异常数量',
      nameTextStyle: {
        color: '#fff',
        fontSize: 10,
      },
      // 只显示整数刻度
      minInterval: 1,
      axisLabel: {
        color: '#fff',
        fontSize: 10,
        formatter: function (value) {
          return Math.round(value)
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
    series: [
      {
        name: '正常流量',
        type: 'line',
        smooth: true,
        stack: 'Total',
        emphasis: {
          focus: 'series',
        },
        lineStyle: {
          color: '#00a7e1',
          width: 2,
        },
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        itemStyle: {
          color: '#00a7e1',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(0, 167, 225, 0.5)',
              },
              {
                offset: 1,
                color: 'rgba(0, 167, 225, 0.1)',
              },
            ],
          },
        },
        data: data.normal,
      },
      {
        name: '疑似异常流量',
        type: 'line',
        smooth: true,
        stack: 'Total',
        emphasis: {
          focus: 'series',
        },
        lineStyle: {
          color: '#ff4d4d',
          width: 2,
        },
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        itemStyle: {
          color: '#ff4d4d',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(255, 77, 77, 0.5)',
              },
              {
                offset: 1,
                color: 'rgba(255, 77, 77, 0.1)',
              },
            ],
          },
        },
        data: data.abnormal,
      },
    ],
  }

  trafficChart.setOption(option)
}

// 从接口加载最近7天流量统计并刷新图表
const loadTrafficChartData = async (deviceId) => {
  try {
    showChartLoading()
    // 接口要求 deviceId 为 query 参数
    const res = await getTrafficCount7Day({ deviceId: Number(deviceId) })
    const list = res?.data?.data?.trafficCounts || []
    console.log('流量异常统计的数据', res.data)

    const dates = list.map((x) => x.date)
    const normal = list.map((x) => x.normalCount)
    const abnormal = list.map((x) => x.abnormalCount)

    initTrafficChart(null, { dates, normal, abnormal })
  } catch (e) {
    ElMessage({ type: 'error', message: '获取最近7天流量统计失败', duration: 2000 })
  } finally {
    hideChartLoading()
  }
}

// 从接口加载最近7天资源异常统计并刷新柱状图
const loadWarnChartData = async (deviceId) => {
  try {
    showChartLoading()
    const res = await getWarnCount7Day({ deviceId: Number(deviceId) })
    console.log('资源异常统计的数据', res.data)

    const list = res?.data?.data?.exceptionCounts || []
    const dates = list.map((x) => x.date)
    const error = list.map((x) => x.exceptionCount)
    alarmHistoryData.value = { dates, error }
    initAlarmChart(deviceId)
  } catch (e) {
    ElMessage({ type: 'error', message: '获取最近7天资源异常统计失败', duration: 2000 })
  } finally {
    hideChartLoading()
  }
}

// 处理行选择
const handleRowClick = (row) => {
  // 更新选中的设备ID
  selectedDeviceId.value = row.id

  // 显示图表加载动画并加载对应网关的流量数据
  showChartLoading()
  // 从接口加载资源异常统计（柱状图）和流量异常统计（折线图）
  loadWarnChartData(row.id)
  loadTrafficChartData(row.id)

  // 显示消息提示（选择设备）
  ElMessage({ type: 'success', message: `已选择设备: ${row.name}`, duration: 1500 })
}

// 获取行样式
const getRowStyle = (row) => {
  if (selectedDeviceId.value === row.id) {
    return {
      backgroundColor: 'rgba(0, 224, 219, 0.15)',
      boxShadow: '0 0 10px rgba(0, 224, 219, 0.5), inset 0 0 8px rgba(0, 224, 219, 0.3)',
      borderLeft: '3px solid #00e0db',
      cursor: 'pointer',
      transform: 'scale(1.01)',
      position: 'relative',
      zIndex: 2,
    }
  }
  return {
    backgroundColor: 'transparent',
    cursor: 'pointer',
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (alarmChart) {
    alarmChart.resize()
  }
  if (trafficChart) {
    trafficChart.resize()
  }
  if (healthChart) {
    healthChart.resize()
  }
}

// 组件挂载时初始化图表
onMounted(() => {
  nextTick(() => {
    // 首次加载从接口获取设备列表
    fetchDevices().then(() => {
      // 加载默认选中设备的7天统计（资源异常 + 流量异常）
      if (selectedDeviceId.value) {
        loadWarnChartData(selectedDeviceId.value)
        loadTrafficChartData(selectedDeviceId.value)
      }
    })
    window.addEventListener('resize', handleResize)
  })
})

// 组件卸载前清除图表实例
onBeforeUnmount(() => {
  if (alarmChart) {
    alarmChart.dispose()
    alarmChart = null
  }
  if (trafficChart) {
    trafficChart.dispose()
    trafficChart = null
  }
  if (healthChart) {
    healthChart.dispose()
    healthChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <bg-image1>
    <!-- 头部页头 -->
    <Header />
    <!-- 主体内容 -->
    <div class="report-management-container">
      <!-- 页面标题 -->
      <div class="page-title-container">
        <div class="title-left-line"></div>
        <h1 class="page-title">网关设备管理中心</h1>
        <div class="title-right-line"></div>
      </div>

      <!-- 上部区域：设备列表 -->
      <div class="cyber-container">
        <div>
          <div v-if="deviceList.length === 0" class="no-data">
            <p>暂无设备</p>
          </div>

          <div v-else>
            <el-table
              :data="deviceList"
              style="width: 100%"
              class="cyber-table"
              stripe
              :highlight-current-row="false"
              :cell-style="{ backgroundColor: 'transparent' }"
              :row-style="getRowStyle"
              @row-click="handleRowClick"
            >
              <el-table-column label="序号" width="200" align="center">
                <template #default="scope">
                  <div :class="{ 'selected-device-row': selectedDeviceId === scope.row.id }">
                    {{ scope.$index + 1 }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="设备名称" width="300" align="center">
                <template #default="scope">
                  <div :class="{ 'selected-device-row': selectedDeviceId === scope.row.id }">
                    {{ scope.row.name }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="address" label="设备地址" min-width="200" align="center">
                <template #default="scope">
                  <div :class="{ 'selected-device-row': selectedDeviceId === scope.row.id }">
                    {{ scope.row.address }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="运行状态" min-width="220" align="center">
                <template #default="scope">
                  <div :class="{ 'selected-device-row': selectedDeviceId === scope.row.id }">
                    <div class="status-indicator">
                      <span class="status-dot status-normal"></span>
                      <span class="status-text status-normal">运行中</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <!-- 统计图表区域 -->
      <div class="charts-row">
        <!-- 左下区域：资源异常统计 -->
        <div :class="['alarm-chart-container', selectedDeviceId ? 'loading' : '']">
          <div class="chart-header">
            <h2 class="chart-title">资源异常统计</h2>
            <div class="view-more-btn" @click="viewAlarmHistory">查看详情</div>
          </div>
          <div id="alarmHistoryChart" class="alarm-chart"></div>
        </div>

        <!-- 中间下方区域：流量异常统计 -->
        <div :class="['traffic-chart-container', selectedDeviceId ? 'loading' : '']">
          <div class="chart-header">
            <h2 class="chart-title">流量异常统计</h2>
            <div class="view-more-btn" @click="viewTrafficAnomaly">查看详情</div>
          </div>
          <div id="trafficAnomalyChart" class="traffic-chart"></div>
        </div>

        <!-- 右下区域：设备健康状态 -->
        <div :class="['health-chart-container', selectedDeviceId ? 'loading' : '']">
          <div class="chart-header">
            <h2 class="chart-title">设备健康状态</h2>
            <div class="view-more-btn" @click="viewDeviceDetails">查看详情</div>
          </div>

          <div class="status-grid">
            <div class="status-box" @click="viewDeviceDetails">
              <div class="status-icon network-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                  />
                  <circle fill="currentColor" cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div class="status-name">网络状态</div>
            </div>

            <div class="status-box" @click="viewDeviceDetails">
              <div class="status-icon io-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <path
                    fill="currentColor"
                    d="M12 2v4m0 12v4m10-10h-4m-12 0h-4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <path
                    fill="currentColor"
                    d="M15 9l2-2m-8 8l-2 2m0-10l2 2m6 6l2 2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
              <div class="status-name">磁盘I/O性能</div>
            </div>

            <div class="status-box" @click="viewDeviceDetails">
              <div class="status-icon storage-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"
                  />
                </svg>
              </div>
              <div class="status-name">存储性能</div>
            </div>

            <div class="status-box" @click="viewDeviceDetails">
              <div class="status-icon memory-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="M6 4h12v1H6zm12 3H6v1h12zm0 3H6v1h12zm0 3H6v1h12zm0 3H6v1h12z"
                  />
                  <path
                    fill="currentColor"
                    d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16z"
                  />
                </svg>
              </div>
              <div class="status-name">内存性能</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </bg-image1>
</template>

<style scoped>
.report-management-container {
  padding: 0.35vw 2vw 0 2vw;
  color: #fff;
  position: relative;
  height: calc(100vh - 9vw);
}

/* 页面标题样式 */
.page-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  margin-top: 1.2vw;
}

.page-title {
  color: #00e0db;
  font-size: 2vw;
  text-align: center;
  text-shadow: 0 0 1vw rgba(0, 224, 219, 0.6);
  margin: 0 1.3vw;
  font-weight: bold;
  letter-spacing: 0.13vw;
  position: relative;
}

.page-title:before,
.page-title:after {
  content: '';
  position: absolute;
  top: 50%;
  width: 0.4vw;
  height: 0.4vw;
  background-color: #00e0db;
  border-radius: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 0.7vw #00e0db;
}

.page-title:before {
  left: -1vw;
}

.page-title:after {
  right: -1vw;
}

.title-left-line,
.title-right-line {
  height: 0.13vw;
  background: linear-gradient(90deg, transparent, #00e0db);
  flex: 1;
  max-width: 20vw;
  position: relative;
}

.title-right-line {
  background: linear-gradient(90deg, #00e0db, transparent);
}

.cyber-container {
  background-color: rgba(0, 20, 40, 0.9);
  border: 0.07vw solid #00a7e1;
  border-radius: 0.35vw;
  box-shadow:
    0 0 1.4vw rgba(0, 167, 225, 0.4),
    inset 0 0 0.7vw rgba(0, 167, 225, 0.2);
  padding: 0.7vw;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1.3vw;
}

/* 图表行容器 */
.charts-row {
  position: absolute;
  bottom: 2vw;
  left: 2vw;
  right: 2vw;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  gap: 1.4vw;
  height: 19vw;
}

/* 告警历史图表样式 */
.alarm-chart-container {
  background-color: rgba(0, 20, 40, 0.9);
  border: 0.07vw solid #00a7e1;
  border-radius: 0.35vw;
  box-shadow:
    0 0 1.4vw rgba(0, 167, 225, 0.4),
    inset 0 0 0.7vw rgba(0, 167, 225, 0.2);
  padding: 0.7vw;
  flex: 1 1 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 流量异常图表样式 */
.traffic-chart-container {
  background-color: rgba(0, 20, 40, 0.9);
  border: 0.07vw solid #00a7e1;
  border-radius: 0.35vw;
  box-shadow:
    0 0 1.4vw rgba(0, 167, 225, 0.4),
    inset 0 0 0.7vw rgba(0, 167, 225, 0.2);
  padding: 0.7vw;
  flex: 1 1 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 设备健康状态图表样式 */
.health-chart-container {
  background-color: rgba(0, 20, 40, 0.9);
  border: 0.07vw solid #00a7e1;
  border-radius: 0.35vw;
  box-shadow:
    0 0 1.4vw rgba(0, 167, 225, 0.4),
    inset 0 0 0.7vw rgba(0, 167, 225, 0.2);
  padding: 0.7vw;
  flex: 1 1 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.health-chart {
  width: 100%;
  height: 120px;
}

.health-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 5px;
}

.health-stat-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 2px 5px;
}

.health-stat-label {
  width: 30%;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.health-stat-value {
  width: 20%;
  font-size: 12px;
  font-weight: bold;
  color: #00e0db;
  text-align: right;
  padding-right: 10px;
}

.health-stat-bar {
  width: 50%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.health-stat-progress {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.chart-header {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  margin-bottom: 0.7vw;
  position: relative;
}

.chart-title {
  font-size: 1.2vw;
  color: #00e0db;
  text-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.5);
  font-weight: bold;
}

.view-more-btn {
  color: #00a7e1;
  cursor: pointer;
  padding: 0.2vw 0.5vw;
  border: 0.07vw solid rgba(0, 224, 219, 0.4);
  border-radius: 0.27vw;
  font-size: 0.8vw;
  background-color: rgba(0, 40, 70, 0.6);
  transition: all 0.3s ease;
  position: absolute;
  right: 0;
}

.view-more-btn:hover {
  color: #00e0db;
  background-color: rgba(0, 40, 70, 0.8);
  box-shadow: 0 0 0.5vw rgba(0, 224, 219, 0.5);
  text-shadow: 0 0 0.3vw rgba(0, 224, 219, 0.5);
}

.alarm-chart,
.traffic-chart {
  flex: 1;
  width: 100%;
  height: calc(100% - 2vw);
}

.no-data {
  text-align: center;
  padding: 2.7vw;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1vw;
}

/* 表格样式 */
:deep(.cyber-table) {
  background-color: transparent;
  color: #fff;
  border-spacing: 0;
}

:deep(.cyber-table th) {
  background-color: rgba(0, 40, 70, 0.8);
  color: #00e0db;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5);
  border-right: 1px solid rgba(0, 224, 219, 0.5);
}

:deep(.cyber-table th:last-child) {
  border-right: none;
}

:deep(.cyber-table tr) {
  background-color: rgba(0, 30, 60, 0.3);
  font-size: 16px;
  height: 65px;
}

:deep(.cyber-table tr:nth-child(2n)) {
  background-color: rgba(0, 40, 70, 0.3);
}

:deep(.cyber-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 5px;
  padding-bottom: 5px;
}

:deep(.cyber-table td:last-child) {
  border-right: none;
}

/* 移除表格点击和悬停时的白色背景 */
:deep(.cyber-table .el-table__row.current-row) {
  background-color: rgba(0, 60, 100, 0.5) !important;
}

:deep(.cyber-table .el-table__row:hover > td.el-table__cell) {
  background-color: rgba(0, 60, 100, 0.5) !important;
}

:deep(.cyber-table .el-table__row.current-row:hover > td.el-table__cell) {
  background-color: rgba(0, 60, 100, 0.5) !important;
}

/* 表格背景保持暗色调 */
:deep(.cyber-table .el-table__inner-wrapper::before) {
  background-color: transparent;
}

:deep(.cyber-table .el-table__header-wrapper) {
  background-color: transparent;
}

:deep(.el-table__header th.el-table__cell) {
  background-color: rgba(0, 40, 70, 0.8) !important;
  color: #00e0db !important;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5) !important;
  font-size: 21px !important;
}

/* 运行状态样式 */
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-text {
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.status-normal {
  background-color: #00ff9d;
  box-shadow: 0 0 8px #00ff9d;
}

.status-text.status-normal {
  color: #00ff9d;
  background-color: transparent;
  box-shadow: none;
}

.health-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  padding: 5px;
  height: calc(100% - 35px);
}

.health-card {
  background-color: rgba(0, 40, 70, 0.6);
  border: 1px solid rgba(0, 167, 225, 0.3);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.health-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00e0db, transparent);
}

.card-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00e0db;
  font-size: 16px;
  opacity: 0.7;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
}

.card-value {
  font-size: 18px;
  font-weight: bold;
  color: #00e0db;
}

.card-subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.card-extra {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
  text-align: right;
}

.card-metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 5px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.metric-value {
  font-size: 12px;
  font-weight: bold;
  color: #00e0db;
}

.card-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.card-indicator.normal {
  background-color: #00ff9d;
  box-shadow: 0 0 8px #00ff9d;
}

.progress-bar {
  height: 4px;
  background-color: rgba(0, 20, 40, 0.6);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.device-status-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  height: calc(100% - 35px);
  padding: 0 5px;
}

.status-item {
  background: rgba(0, 30, 60, 0.4);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  border-left: 2px solid rgba(0, 167, 225, 0.7);
}

.status-item::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, rgba(0, 224, 219, 0.05) 0%, rgba(0, 40, 70, 0) 100%);
  pointer-events: none;
}

.status-header {
  padding: 6px 8px;
  background: rgba(0, 40, 70, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.status-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.normal {
  background-color: rgba(0, 255, 157, 0.2);
  color: #00ff9d;
  border: 1px solid rgba(0, 255, 157, 0.4);
}

.status-badge.warning {
  background-color: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
  border: 1px solid rgba(255, 204, 0, 0.4);
}

.status-badge.error {
  background-color: rgba(255, 77, 77, 0.2);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.4);
}

.status-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5px;
}

.status-value {
  font-size: 20px;
  font-weight: bold;
  color: #00e0db;
  text-shadow: 0 0 10px rgba(0, 224, 219, 0.3);
}

.status-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.status-footer {
  padding: 4px 8px;
  background: rgba(0, 40, 70, 0.4);
}

.status-info {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
}

.status-progress-container {
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: 5px;
  padding: 0 8px;
}

.status-progress {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-right: 5px;
}

.status-progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.status-progress-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.io-content {
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
}

.io-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.io-divider {
  width: 1px;
  height: 80%;
  background: linear-gradient(to bottom, transparent, rgba(0, 224, 219, 0.5), transparent);
}

.io-value {
  font-size: 18px;
  font-weight: bold;
  color: #00e0db;
}

.io-label {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
  text-align: center;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  padding: 10px;
  height: calc(100% - 35px);
}

.status-box {
  background: rgba(0, 40, 70, 0.4);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 167, 225, 0.2);
}

.status-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 224, 219, 0.7), transparent);
}

.status-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 167, 225, 0.2);
  border-color: rgba(0, 224, 219, 0.4);
  background: rgba(0, 50, 80, 0.5);
}

.status-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  position: relative;
}

.status-icon svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 5px rgba(0, 224, 219, 0.7));
}

.status-box:hover .status-icon svg {
  filter: drop-shadow(0 0 8px rgba(0, 224, 219, 1));
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.network-icon {
  color: #00a7e1;
}

.io-icon {
  color: #00e0db;
}

.storage-icon {
  color: #00ccff;
}

.memory-icon {
  color: #00d6e6;
}

.status-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

/* 图表容器加载动画 */
@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 224, 219, 0.6);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 224, 219, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 224, 219, 0);
  }
}

/* 选中行样式动画 */
@keyframes selected-row-glow {
  0% {
    box-shadow: 0 0 5px rgba(0, 224, 219, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(0, 224, 219, 0.7);
  }
  100% {
    box-shadow: 0 0 5px rgba(0, 224, 219, 0.3);
  }
}

/* 图表数据更新动画 */
@keyframes chart-refresh {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.alarm-chart-container.loading,
.traffic-chart-container.loading,
.health-chart-container.loading {
  animation: pulse-border 1.5s infinite;
}

/* 添加点击表格行时的交互效果 */
:deep(.cyber-table tr.selected-row) {
  animation: selected-row-glow 2s infinite;
  background-color: rgba(0, 224, 219, 0.15) !important;
}

/* 选中行的特殊效果 */
.selected-device-row {
  position: relative;
  overflow: hidden;
  z-index: 1;
  color: #00e0db !important;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 224, 219, 0.5);
}

.selected-device-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 224, 219, 0.1),
    transparent 20%,
    transparent 80%,
    rgba(0, 224, 219, 0.1)
  );
  pointer-events: none;
  animation: selected-row-shine 3s infinite;
  background-size: 200% 100%;
}

.selected-device-row::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 224, 219, 0.1) 0%, transparent 70%);
  animation: selected-row-pulse 2s infinite;
  z-index: -1;
}

@keyframes selected-row-shine {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes selected-row-pulse {
  0% {
    opacity: 0.3;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.3;
    transform: scale(0.95);
  }
}
</style>
