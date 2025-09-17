<script setup>
import { useUserStore } from '@/stores'
import { ref, onMounted, onUnmounted } from 'vue'
import ChinaMap from '@/views/Layout/component/chinaMap.vue'
import { getGatewayInfo as fetchGatewayInfoApi } from '@/api/device'
// 获取用户信息
const userStore = useUserStore()

// 网关1、2、3分别的id和初始运行时间
const gateways = ref([
  {
    id: 25,
    initialRuntime: {
      days: 15,
      hours: 8,
      minutes: 32,
      seconds: 45,
    },
  },
  {
    id: 26,
    initialRuntime: {
      days: 23,
      hours: 16,
      minutes: 45,
      seconds: 12,
    },
  },
  {
    id: 27,
    initialRuntime: {
      days: 8,
      hours: 12,
      minutes: 18,
      seconds: 33,
    },
  },
])

// 当前选中的网关索引
const currentGatewayIndex = ref(0)

// 当前选中的网关数据
const currentGateway = ref({
  deviceName: '网关1',
  deviceType: '未知型号',
  operatingSystem: '未知系统',
  ip: '未知IP',
})

// 获取网关信息
const fetchGatewayInfo = async (gatewayId) => {
  try {
    const res = await fetchGatewayInfoApi(gatewayId)
    console.log('网关硬件信息响应:', res)

    if (res && res.data && res.data.code === 200) {
      const gatewayData = res.data.data

      // 仅合并更新基础信息，保留已有的运行时间字段
      currentGateway.value = {
        ...currentGateway.value,
        deviceName: gatewayData.deviceName || `网关${gatewayId}`,
        deviceType: gatewayData.deviceType || '未知型号',
        operatingSystem: gatewayData.operatingSystem || '未知系统',
        ip: gatewayData.ip || '未知IP',
      }
    }
  } catch (error) {
    // 合并默认数据以保证字段存在，同时不覆盖运行时间
    currentGateway.value = {
      ...currentGateway.value,
      deviceName: currentGateway.value.deviceName || `网关${gatewayId}`,
      deviceType: currentGateway.value.deviceType || '未知型号',
      operatingSystem: currentGateway.value.operatingSystem || '未知系统',
      ip: currentGateway.value.ip || '未知IP',
    }
  }
}
// 切换网关
const switchGateway = (index) => {
  currentGatewayIndex.value = index
  // 获取新网关的数据，使用网关对象中的实际ID
  const selectedGateway = gateways.value[index]

  // 设置新网关的初始运行时间
  currentGateway.value.runningDays = selectedGateway.initialRuntime.days
  currentGateway.value.runningHours = selectedGateway.initialRuntime.hours
  currentGateway.value.runningMinutes = selectedGateway.initialRuntime.minutes
  currentGateway.value.runningSeconds = selectedGateway.initialRuntime.seconds

  // 获取网关信息
  fetchGatewayInfo(selectedGateway.id)
}

// 格式化运行时间，确保两位数显示
const formatTime = (num) => {
  const safe = Number.isFinite(num) ? num : 0
  return safe < 10 ? `0${safe}` : safe
}

// 添加打字机效果
const welcomeText = ref('')
const fullText = '欢迎来到智慧网关监控系统'
let index = 0

// 动态数字
const randomNumbers = ref(['0', '1'])
const maxNumbers = 30

// 当组件挂载时
onMounted(() => {
  // 打字机效果
  const timer = setInterval(() => {
    if (index < fullText.length) {
      welcomeText.value += fullText[index]
      index++
    } else {
      clearInterval(timer)
    }
  }, 140)

  // 生成随机数字流
  setInterval(() => {
    if (randomNumbers.value.length < maxNumbers) {
      randomNumbers.value.push(Math.random() > 0.5 ? '0' : '1')
    } else {
      randomNumbers.value.shift()
      randomNumbers.value.push(Math.random() > 0.5 ? '0' : '1')
    }
  }, 200)
})

onMounted(() => {
  // 设置第一个网关的初始运行时间
  const firstGateway = gateways.value[0]
  currentGateway.value.runningDays = firstGateway.initialRuntime.days
  currentGateway.value.runningHours = firstGateway.initialRuntime.hours
  currentGateway.value.runningMinutes = firstGateway.initialRuntime.minutes
  currentGateway.value.runningSeconds = firstGateway.initialRuntime.seconds

  // 获取网关信息 - 使用第一个网关的ID
  fetchGatewayInfo(gateways.value[0].id)

  // 启动运行时间计时器
  const runtimeTimer = setInterval(() => {
    if (currentGateway.value.runningSeconds !== undefined) {
      currentGateway.value.runningSeconds++
      if (currentGateway.value.runningSeconds >= 60) {
        currentGateway.value.runningSeconds = 0
        currentGateway.value.runningMinutes++
        if (currentGateway.value.runningMinutes >= 60) {
          currentGateway.value.runningMinutes = 0
          currentGateway.value.runningHours++
          if (currentGateway.value.runningHours >= 24) {
            currentGateway.value.runningHours = 0
            currentGateway.value.runningDays++
          }
        }
      }
    }
  }, 1000)

  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(runtimeTimer)
  })
})
</script>

<template>
  <bg-image3>
    <!-- 头部页头 -->
    <Header />
    <!-- 主体内容布局 -->
    <div class="dashboard-container">
      <!-- 左侧欢迎区域 -->
      <!-- 背景动态元素 -->
      <div class="tech-background">
        <div class="circle-effect"></div>
      </div>

      <!-- 欢迎信息 -->
      <div class="welcome-container">
        <div class="welcome-content">
          <div class="welcome-title">{{ welcomeText }}<span class="cursor">|</span></div>
          <div class="welcome-subtitle">
            <div class="user-info">
              <div class="user-icon"></div>
              <div class="user-text">
                <span class="username">{{ userStore.username }}</span>
                <span class="role-text">{{ userStore.role }}用户</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 左下角网关信息 -->
      <div class="gateway-info-panel">
        <div class="gateway-header">
          <div class="gateway-title">
            <span class="title-icon"></span>
            <h3>网关基本信息</h3>
          </div>
          <div class="gateway-selector">
            <select
              v-model="currentGatewayIndex"
              @change="switchGateway(currentGatewayIndex)"
              class="gateway-select"
            >
              <option v-for="(gateway, index) in gateways" :key="index" :value="index">
                网关{{ index + 1 }}
              </option>
            </select>
          </div>
        </div>
        <div class="gateway-content">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-label">设备名称</div>
              <div class="info-value">{{ currentGateway.deviceName }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">设备型号</div>
              <div class="info-value">{{ currentGateway.deviceType }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">操作系统</div>
              <div class="info-value">{{ currentGateway.operatingSystem }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">网关地址</div>
              <div class="info-value">{{ currentGateway.ip }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">运行状态</div>
              <div class="info-status normal">
                <span class="status-dot"></span>
                <span>运行中</span>
              </div>
            </div>
          </div>

          <!-- 系统运行时间 -->
          <div class="runtime-container">
            <div class="runtime-header">
              <div class="line-left"></div>
              <span class="runtime-title">系统运行时间</span>
              <div class="line-right"></div>
            </div>
            <div class="runtime-display">
              <div class="time-unit">
                <div class="time-number">{{ formatTime(currentGateway.runningDays) }}</div>
                <div class="time-label">天</div>
              </div>
              <div class="time-separator">:</div>
              <div class="time-unit">
                <div class="time-number">{{ formatTime(currentGateway.runningHours) }}</div>
                <div class="time-label">时</div>
              </div>
              <div class="time-separator">:</div>
              <div class="time-unit">
                <div class="time-number">{{ formatTime(currentGateway.runningMinutes) }}</div>
                <div class="time-label">分</div>
              </div>
              <div class="time-separator">:</div>
              <div class="time-unit">
                <div class="time-number">{{ formatTime(currentGateway.runningSeconds) }}</div>
                <div class="time-label">秒</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧内容区域 -->
      <div class="container">
        <div class="map-wrapper">
          <ChinaMap />
        </div>
      </div>
    </div>
  </bg-image3>
</template>

<style scoped>
.dashboard-container {
  width: 100vw;
  height: 80vh;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  gap: 0;
  padding: 0.5vw;
  overflow: hidden;
}

.left-area {
  width: 30%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.right-area {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
}

.welcome-container {
  width: 65%;
  height: 88%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 10, 30, 0.1);
  position: relative;
  z-index: 2;
  margin-top: -11vw;
}

.welcome-content {
  text-align: center;
  animation: fadeIn 1.5s ease-out;
  background: rgba(0, 15, 40, 0.4);
  padding: 3vw 3.2vw;
  border-radius: 0.5vw;
  box-shadow: 0 0 2vw rgba(0, 224, 219, 0.2);
  border: 0.1vw solid rgba(0, 224, 219, 0.1);
  backdrop-filter: blur(0.3vw);
}

.welcome-title {
  font-size: 2.4vw;
  font-weight: bold;
  letter-spacing: 0.15vw;
  margin-bottom: 1.2vw;
  color: #fff;
  text-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.7);
  position: relative;
  display: inline-block;
}

.welcome-title::after {
  content: '';
  position: absolute;
  bottom: -0.5vw;
  left: 0;
  width: 100%;
  height: 0.08vw;
  background: linear-gradient(90deg, transparent, #00e0db, transparent);
}

.cursor {
  animation: blink 1s infinite;
  color: #00e0db;
}

.welcome-subtitle {
  margin-top: 1.2vw;
  margin-bottom: 0.7vw;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7vw;
}

.user-icon {
  width: 2vw;
  height: 2vw;
  border-radius: 50%;
  background: rgba(0, 224, 219, 0.2);
  border: 0.15vw solid #00e0db;
  position: relative;
}

.user-icon::before {
  content: '';
  position: absolute;
  top: 0.4vw;
  left: 50%;
  transform: translateX(-50%);
  width: 0.8vw;
  height: 0.8vw;
  border-radius: 50%;
  background-color: #00e0db;
}

.user-icon::after {
  content: '';
  position: absolute;
  top: 1.3vw;
  left: 50%;
  transform: translateX(-50%);
  width: 1.2vw;
  height: 0.6vw;
  border-radius: 0.5vw 0.5vw 0 0;
  background-color: #00e0db;
  clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%);
}

.user-text {
  font-size: 1.5vw;
}

.username {
  color: #00e0db;
  font-weight: bold;
  margin: 0 0.2vw;
  text-shadow: 0 0 0.5vw rgba(0, 224, 219, 0.7);
}

.role-text {
  color: #00bfff;
  font-weight: bold;
  margin-right: 0.2vw;
  text-shadow: 0 0 0.5vw rgba(0, 191, 255, 0.7);
}

/* 网关信息面板样式 */
.gateway-info-panel {
  position: absolute;
  bottom: 4vw;
  left: 1vw;
  width: 38.5vw;
  background: rgba(0, 15, 40, 0.5);
  border-radius: 0.7vw;
  border: 0.1vw solid rgba(0, 224, 219, 0.3);
  box-shadow: 0 0 1vw rgba(0, 224, 219, 0.2);
  color: white;
  padding: 1vw;
  z-index: 10;
}

.gateway-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1vw;
}

.gateway-title {
  display: flex;
  align-items: center;
  margin-left: 10vw;
}

.gateway-title h3 {
  color: #1affff;
  font-size: 1.8vw;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 0 0.5vw rgba(0, 224, 219, 0.6);
  letter-spacing: 0.08vw;
  position: relative;
  padding-left: 1vw;
}

.title-icon {
  display: inline-block;
  width: 1.2vw;
  height: 1.2vw;
  border-radius: 50%;
  background: linear-gradient(45deg, #00e0db, #1affff);
  margin-right: 0.7vw;
  box-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.8);
  position: relative;
}

.title-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.5vw;
  height: 0.5vw;
  border-radius: 50%;
  background-color: rgba(0, 15, 40, 0.8);
}

.gateway-selector {
  display: flex;
  gap: 0.7vw;
  position: relative;
}

.gateway-select {
  background: rgba(0, 20, 40, 0.6);
  border: 0.1vw solid rgba(0, 224, 219, 0.3);
  color: #1affff;
  padding: 0.3vw 0.7vw;
  border-radius: 0.3vw;
  font-size: 0.9vw;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231affff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5vw center;
  background-size: 0.8vw;
  padding-right: 2vw;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.03vw;
  box-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.1) inset;
  text-shadow: 0 0 0.3vw rgba(0, 224, 219, 0.5);
  position: relative;
}

.gateway-select:hover {
  background-color: rgba(0, 224, 219, 0.15);
  box-shadow:
    0 0 0.8vw rgba(0, 224, 219, 0.3),
    0 0 1vw rgba(0, 224, 219, 0.2) inset;
  border-color: rgba(0, 224, 219, 0.6);
}

/* 添加自定义下拉列表样式 */
.gateway-select:focus {
  border-color: #1affff;
  box-shadow:
    0 0 0 0.15vw rgba(0, 224, 219, 0.2),
    0 0 1vw rgba(0, 224, 219, 0.4);
}

/* 修改下拉选项的样式 */
.gateway-select option {
  background-color: rgba(0, 15, 40, 0.95) !important;
  color: #1affff !important;
  padding: 0.7vw !important;
  font-size: 0.9vw !important;
  border-bottom: 0.1vw solid rgba(0, 224, 219, 0.2) !important;
}

/* 自定义下拉项高亮样式 */
.gateway-select option:hover,
.gateway-select option:focus,
.gateway-select option:active,
.gateway-select option:checked {
  background-color: rgba(0, 224, 219, 0.25) !important;
  color: #ffffff !important;
}

/* 添加选中项样式 */
.gateway-select option:checked {
  background-color: rgba(0, 224, 219, 0.4) !important;
  font-weight: bold !important;
}

/* 使用全局属性变量 */
:root {
  --select-dropdown-bg: rgba(0, 15, 40, 0.95);
  --select-dropdown-border: 1px solid rgba(0, 224, 219, 0.6);
  --select-dropdown-shadow: 0 0 15px rgba(0, 224, 219, 0.4);
}

.gateway-btn {
  background: rgba(0, 224, 219, 0.1);
  border: 0.1vw solid rgba(0, 224, 219, 0.3);
  color: #1affff;
  padding: 0.3vw 0.7vw;
  border-radius: 0.3vw;
  font-size: 0.9vw;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gateway-btn:hover {
  background: rgba(0, 224, 219, 0.2);
  box-shadow: 0 0 0.5vw rgba(0, 224, 219, 0.4);
}

.gateway-btn.active {
  background: rgba(0, 224, 219, 0.3);
  box-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.5);
  font-weight: bold;
}

.gateway-content {
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  margin-bottom: 0.7vw;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 0.5vw 0.3vw;
  border-bottom: 0.1vw solid rgba(0, 224, 219, 0.2);
  background: rgba(0, 20, 40, 0.3);
  border-radius: 0.3vw;
  justify-content: center;
}

.info-label {
  width: 35%;
  color: #1affff;
  font-size: 1vw;
  position: relative;
  text-align: right;
  padding-right: 2vw;
}

.info-label::before {
  content: '';
  position: absolute;
  left: 33%;
  top: 50%;
  transform: translateY(-50%);
  width: 0.3vw;
  height: 0.3vw;
  background: #1affff;
  border-radius: 50%;
  box-shadow: 0 0 0.3vw #1affff;
}

.info-value {
  width: 50%;
  color: #ffffff;
  font-size: 1vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 2vw;
}

.info-status {
  width: 50%;
  display: flex;
  align-items: center;
  gap: 0.4vw;
  text-align: left;
  padding-left: 2vw;
  font-size: 1vw;
  font-weight: 700;
}

.status-dot {
  width: 0.5vw;
  height: 0.5vw;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.normal .status-dot {
  background-color: #00ff9d;
  box-shadow: 0 0 0.5vw #00ff9d;
}

.normal {
  color: #00ff9d;
}

.runtime-container {
  background: rgba(0, 20, 40, 0.3);
  border-radius: 0.4vw;
  padding: 0.7vw;
  margin-top: -1vw;
  border: 0.1vw solid rgba(0, 224, 219, 0.2);
}

.runtime-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.7vw;
}

.line-left,
.line-right {
  height: 0.08vw;
  flex: 1;
  background: linear-gradient(90deg, rgba(0, 224, 219, 0.8), rgba(0, 224, 219, 0.1));
}

.line-right {
  background: linear-gradient(90deg, rgba(0, 224, 219, 0.1), rgba(0, 224, 219, 0.8));
}

.runtime-title {
  color: #1affff;
  font-size: 1vw;
  margin: 0 0.7vw;
  font-weight: 600;
  letter-spacing: 0.05vw;
}

.runtime-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.3vw;
  padding: 0.7vw 0;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 2vw;
}

.time-number {
  background: rgba(0, 224, 219, 0.15);
  border: 0.1vw solid rgba(0, 224, 219, 0.3);
  border-radius: 0.3vw;
  color: #1affff;
  font-size: 1vw;
  font-weight: bold;
  padding: 0.1vw 0.5vw;
  min-width: 1.5vw;
  text-align: center;
  box-shadow: 0 0 0.5vw rgba(0, 224, 219, 0.2) inset;
}

.time-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7vw;
  margin-top: 0.2vw;
}

.time-separator {
  color: #1affff;
  font-size: 1.1vw;
  font-weight: bold;
  margin-top: -0.5vw;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-1vw);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>

<!-- 添加全局样式以覆盖下拉菜单 -->
<style>
/* 全局样式 - 覆盖下拉菜单的默认样式 */
select option {
  background-color: rgba(0, 15, 40, 0.95) !important;
  color: #1affff !important;
  padding: 0.7vw !important;
  border-bottom: 0.1vw solid rgba(0, 224, 219, 0.2) !important;
}

select option:hover,
select option:checked {
  background-color: rgba(0, 224, 219, 0.4) !important;
  color: white !important;
}

/* 用于浏览器特定的下拉样式调整 */
@supports (-webkit-appearance: none) {
  /* WebKit/Blink 浏览器（Chrome、Safari等） */
  select::-webkit-scrollbar {
    width: 0.5vw;
  }

  select::-webkit-scrollbar-track {
    background: rgba(0, 15, 40, 0.8);
  }

  select::-webkit-scrollbar-thumb {
    background: rgba(0, 224, 219, 0.4);
    border-radius: 0.3vw;
  }

  select::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 224, 219, 0.6);
  }
}

.container {
  width: 98%;
  height: 100%;
  margin-top: 1.5vw;
  box-sizing: border-box;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  border: 0.1vw solid rgba(79, 104, 183, 0.5);
  border-radius: 0.5vw;
  box-shadow: 0 0 1vw rgba(0, 224, 219, 0.2);
  overflow: hidden;
}
</style>
