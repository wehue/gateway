<script setup>
import RealTimeIPStatistic from './components/RealTimeIPStatistic.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  startTrafficCapture,
  stopTrafficCapture,
  getTrafficTotalData,
  getTrafficData,
} from '@/api/traffic'

// 获取路由实例
const router = useRouter()

// 出站错误包、入站错误包、 出站流量包、入站流量包
const trafficData = ref({
  inbound: 0,
  outbound: 0,
  inboundError: 0,
  outboundError: 0,
})

// 入站出站总量
const trafficTotalData = ref({
  outboundTotal: 0,
  inboundTotal: 0,
})

//获取入站出站数量包和错误包
const fetchTrafficData = async () => {
  try {
    const res = await getTrafficData()
    console.log('流量数据包', res.data)

    if (res.data.code == 200) {
      const response = res.data.data
      trafficData.value = {
        inbound: response.inboundPackets || 0,
        outbound: response.outboundPackets || 0,
        inboundError: response.inboundErrors || 0,
        outboundError: response.outboundErros || 0,
      }
    }
  } catch (error) {
    console.log('获取失败', error)
  }
}

//获取入站出站总量
const fetchTrafficTotalData = async () => {
  try {
    const res = await getTrafficTotalData()
    console.log('入出站总量包', res)

    if (res.data.code == 200) {
      const response = res.data.data
      trafficTotalData.value = {
        outboundTotal: response.outboundPackets || 0,
        inboundTotal: response.inboundPackets || 0,
      }
    }
  } catch (error) {
    console.log('获取失败', error)
  }
}

onMounted(() => {
  fetchTrafficData()
  fetchTrafficTotalData()
})

// 跳转到文件选择页面
const goToFileSelection = () => {
  router.push('/fileSelection')
}

// 抓取流量状态
const isCapturing = ref(false)

// 抓取流量
const captureTraffic = async () => {
  try {
    if (!isCapturing.value) {
      // 开始抓取流量
      const response = await startTrafficCapture()
      console.log('开始抓取')

      if (response.code === 0 || response.code === 200) {
        isCapturing.value = true
        ElMessage({
          type: 'success',
          message: '开始抓取流量...',
          duration: 2000,
        })
      } else {
        throw new Error(response.msg || response.message || '启动抓取失败')
      }
    } else {
      // 停止抓取流量
      const response = await stopTrafficCapture()
      console.log('停止抓取')

      if (response.code === 0 || response.code === 200) {
        isCapturing.value = false
        ElMessage({
          type: 'success',
          message: '已停止抓取流量',
          duration: 2000,
        })
      } else {
        throw new Error(response.msg || response.message || '停止抓取失败')
      }
    }
  } catch (error) {
    console.error('抓取流量操作失败:', error)
    ElMessage({
      type: 'error',
      message: `操作失败: ${error.message}`,
      duration: 3000,
    })
  }
}
</script>

<template>
  <bg-image3>
    <Header />
    <div class="dashboard-container">
      <!-- 左侧面板 -->
      <div class="panel ip-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>实时IP访问统计</h2>
          </div>
        </div>
        <div class="panel-body">
          <RealTimeIPStatistic />
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>流量数据概览</h2>
          </div>
        </div>
        <div class="panel-body">
          <div class="traffic-stats">
            <div class="row">
              <div class="stat-card inbound">
                <div class="card-info">
                  <div class="info-number">{{ trafficTotalData.inboundTotal }}</div>
                  <div class="info-label">入站总量</div>
                </div>
                <div class="card-icon">
                  <i class="data-icon"></i>
                </div>
              </div>

              <div class="stat-card inbound">
                <div class="card-info">
                  <div class="info-number">{{ trafficData.inbound }}</div>
                  <div class="info-label">入站数据包</div>
                </div>
                <div class="card-icon">
                  <i class="data-icon"></i>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="stat-card outbound">
                <div class="card-info">
                  <div class="info-number">{{ trafficTotalData.outboundTotal }}</div>
                  <div class="info-label">出站总量</div>
                </div>
                <div class="card-icon">
                  <i class="data-icon"></i>
                </div>
              </div>

              <div class="stat-card outbound">
                <div class="card-info">
                  <div class="info-number">{{ trafficData.outbound }}</div>
                  <div class="info-label">出站数据包</div>
                </div>
                <div class="card-icon">
                  <i class="data-icon"></i>
                </div>
              </div>
            </div>
          </div>
          <!-- 错误包统计 -->
          <div class="error-stats">
            <div class="section-header">
              <div class="capture-button-container">
                <button
                  class="capture-button"
                  @click="captureTraffic"
                  :class="{ capturing: isCapturing }"
                >
                  <i :class="isCapturing ? 'stop-icon' : 'capture-icon'"></i>
                  {{ isCapturing ? '暂停抓取' : '抓取流量' }}
                </button>
              </div>
              <div class="section-title">
                <h2>疑似异常流量访问</h2>
              </div>
              <div class="upload-button-container">
                <button class="upload-button" @click="goToFileSelection">
                  <i class="upload-icon"></i>
                  上传流量包分析
                </button>
              </div>
            </div>
            <div class="error-cards">
              <div class="error-card">
                <div class="card-header">
                  <div class="error-icon"><i class="error-icon-inner"></i></div>
                  <div class="error-title">入站异常包</div>
                </div>
                <div class="card-count">{{ trafficData.inboundError }}</div>
                <div class="card-status">
                  <div class="status-indicator">
                    <span class="pulse"></span>
                    <span class="text">实时监控中</span>
                  </div>
                </div>
              </div>

              <div class="error-card">
                <div class="card-header">
                  <div class="error-icon"><i class="error-icon-inner"></i></div>
                  <div class="error-title">出站异常包</div>
                </div>
                <div class="card-count">{{ trafficData.outboundError }}</div>
                <div class="card-status">
                  <div class="status-indicator">
                    <span class="pulse"></span>
                    <span class="text">实时监控中</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </bg-image3>
</template>

<style scoped>
/* 整体布局 */
.dashboard-container {
  display: flex;
  flex-direction: row;
  gap: 0.1vw;
  padding: 1.5vw 0.5vw;
  height: calc(100vh - 9vw);
}

/* 面板通用样式 */
.panel {
  background: rgba(6, 30, 56, 0.5);
  border-radius: 0.5vw;
  overflow: hidden;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
}

.panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  padding: 1.5px;
  background: linear-gradient(135deg, #00f0ff, #0072ff, transparent, #00f0ff);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.panel-header {
  padding: 0.7vw 1.4vw;
  background: rgba(0, 240, 255, 0.1);
  border-bottom: 0.07vw solid rgba(0, 240, 255, 0.3);
}

.panel-title {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
}

.panel-title h2 {
  color: #ffcc00;
  text-align: center;
  font-size: 1.7vw;
  margin: 0.7vw 0;
}

.panel-body {
  padding: 1.4vw;
  flex: 1;
  overflow: visible;
  position: relative;
}

.ip-panel {
  height: 100%;
  margin-right: 0.7vw;
  max-width: 35%;
  min-width: 20vw;
}

.panel:last-child {
  margin-right: 0;
}

.ip-panel .panel-body {
  padding: 10px;
  overflow: hidden;
}

/* 流量统计卡片布局 */
.traffic-stats {
  display: flex;
  flex-direction: row;
  gap: 1.4vw;
}

.traffic-stats .row {
  display: flex;
  flex-direction: row;
  gap: 15vw;
  width: 100%;
  justify-content: center;
}

.stat-card {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 30, 60, 0.4);
  border-radius: 0.7vw;
  padding: 1vw 1.4vw;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0.3vw 1vw rgba(0, 0, 0, 0.2);
  margin-top: 1vw;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card.inbound::before {
  background: linear-gradient(to bottom, #00c6ff, #0072ff);
}

.stat-card.outbound::before {
  background: linear-gradient(to bottom, #00f7ff, #00a3b8);
}

.stat-card .card-info {
  display: flex;
  flex-direction: column;
}

.stat-card .info-number {
  font-size: 1.8vw;
  font-weight: 600;
  color: #e6f7ff;
  margin-bottom: 0.3vw;
}

.stat-card .info-label {
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.7);
}

.stat-card .card-icon {
  width: 3vw;
  height: 3vw;
  border-radius: 0.7vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stat-card.inbound .card-icon {
  background: rgba(0, 114, 255, 0.15);
}

.stat-card.outbound .card-icon {
  background: rgba(0, 247, 255, 0.15);
}

.data-icon {
  width: 2vw;
  height: 2vw;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300f0ff"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 2.707L5.5 9.5v5l6.5 3.793 6.5-3.793v-5L12 5.707z"/></svg>');
  background-size: cover;
  display: block;
}

/* 错误统计 */
.error-stats {
  margin-top: 2vw;
  margin-left: -1.4vw;
  margin-right: -1.4vw;
  background: rgba(6, 30, 56, 0.5);
  border-radius: 0.5vw;
  position: relative;
  overflow: visible;
  width: calc(100% + 2.8vw);
}

.error-stats::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  pointer-events: none; /* 确保不阻止点击事件 */
}

.section-header {
  background: rgba(0, 240, 255, 0.1);
  border-bottom: 0.07vw solid rgba(0, 240, 255, 0.3);
  border-radius: 0.5vw 0.5vw 0 0;
  margin-top: 2.7vw;
  margin-bottom: 1.4vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.4vw;
  position: relative;
  z-index: 5;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  pointer-events: none;
}

.section-title h2 {
  color: #ffcc00;
  text-align: center;
  font-size: 1.7vw;
  margin: 0.7vw 0;
  margin-left: 3vw;
  pointer-events: auto; /* 标题文字可点击 */
}

.capture-button-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  z-index: 10;
  gap: 0.5vw;
}

@keyframes status-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.capture-button {
  background: rgba(255, 69, 0, 0.2);
  border: 0.07vw solid rgba(255, 69, 0, 0.5);
  border-radius: 0.5vw;
  padding: 0.5vw 1vw;
  color: #ff4500;
  font-size: 1vw;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5vw;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
  z-index: 20;
  pointer-events: auto;
}

.capture-button:hover {
  background: rgba(255, 69, 0, 0.3);
  border-color: rgba(255, 69, 0, 0.7);
  transform: translateY(-0.15vw);
}

.capture-button.capturing {
  background: rgba(255, 69, 0, 0.4);
  border-color: rgba(255, 69, 0, 0.8);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.5);
  animation: capturing-pulse 2s infinite;
}

@keyframes capturing-pulse {
  0% {
    box-shadow: 0 0 15px rgba(255, 69, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 69, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 15px rgba(255, 69, 0, 0.5);
  }
}

.capture-icon {
  width: 1.4vw;
  height: 1.4vw;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff4500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>');
  background-size: cover;
  display: block;
}

.stop-icon {
  width: 1.4vw;
  height: 1.4vw;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff4500"><path d="M6 6h12v12H6z"/></svg>');
  background-size: cover;
  display: block;
}

.upload-button-container {
  display: flex;
  justify-content: flex-end;
  position: relative;
  z-index: 10;
}

.upload-button {
  background: rgba(0, 240, 255, 0.2);
  border: 0.07vw solid rgba(0, 240, 255, 0.5);
  border-radius: 0.5vw;
  padding: 0.5vw 1vw;
  color: #00f0ff;
  font-size: 1vw;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5vw;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
  z-index: 20;
  pointer-events: auto;
}

.upload-button:hover {
  background: rgba(0, 240, 255, 0.3);
  border-color: rgba(0, 240, 255, 0.7);
  transform: translateY(-0.15vw);
}

.upload-icon {
  width: 1.4vw;
  height: 1.4vw;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300f0ff"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>');
  background-size: cover;
  display: block;
}

.error-cards {
  display: flex;
  gap: 0.7vw;
  padding: 0.7vw 1.4vw;
  width: 100%;
  justify-content: space-between;
}

.error-card {
  background: rgba(30, 10, 15, 0.5);
  border-radius: 0.7vw;
  padding: 1.4vw;
  position: relative;
  box-shadow: 0 0.3vw 1vw rgba(0, 0, 0, 0.3);
  border: 0.07vw solid rgba(255, 45, 85, 0.3);
  transition: all 0.3s ease;
  flex: 1;
}

.error-card:hover {
  box-shadow: 0 0.4vw 1.4vw rgba(255, 45, 85, 0.2);
  transform: translateY(-0.15vw);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1vw;
}

.error-icon {
  width: 2.7vw;
  height: 2.7vw;
  border-radius: 50%;
  background: rgba(255, 45, 85, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.8vw;
}

.error-icon-inner {
  width: 1.6vw;
  height: 1.6vw;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff2d55"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>');
  background-size: cover;
  display: block;
}

.error-title {
  color: #ff8a95;
  font-size: 1.1vw;
  font-weight: 500;
}

.card-count {
  font-size: 2.3vw;
  font-weight: 700;
  color: #ff2d55;
  text-shadow: 0 0 0.7vw rgba(255, 45, 85, 0.4);
  margin: 0.7vw 0 1vw;
}

.card-status {
  display: flex;
  align-items: center;
  margin-top: 0.7vw;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.pulse {
  width: 0.7vw;
  height: 0.7vw;
  background-color: #ff2d55;
  border-radius: 50%;
  margin-right: 0.7vw;
  position: relative;
}

.pulse::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 45, 85, 0.8);
  border-radius: 50%;
  animation: pulsate 2s ease-out infinite;
}

.status-indicator .text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9vw;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulsate {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

/* 适配不同屏幕大小 */
@media screen and (max-width: 1440px) {
  .dashboard-container {
    grid-template-columns: 40% 1fr;
  }

  .traffic-stats .row {
    flex-direction: column;
    gap: 15px;
  }

  .stat-card .info-number {
    font-size: 22px;
  }

  .error-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .info-number {
    font-size: 22px;
  }
}
</style>
