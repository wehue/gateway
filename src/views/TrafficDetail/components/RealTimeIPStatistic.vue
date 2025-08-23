<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getTrafficIpData } from '@/api/traffic'

const devices = ref([])
const sourceList = ref([])
const loopIndex = ref(0)
let loopTimer = null
let refreshTimer = null

// 组件挂载后执行
onMounted(async () => {
  await fetchIpList()
  startLoop()
  // 每分钟刷新一次数据源
  refreshTimer = setInterval(fetchIpList, 60000)
})

onBeforeUnmount(() => {
  if (loopTimer) clearInterval(loopTimer)
  if (refreshTimer) clearInterval(refreshTimer)
})

// 拉取后端实时IP访问统计
const fetchIpList = async () => {
  try {
    const res = await getTrafficIpData()
    console.log('实时IP数据', res)

    const list = Array.isArray(res?.data?.data) ? res.data.data : []
    const normalized = list.map((item) => ({
      srcIp: item.hostIp ?? '-',
      srcPort: String(item.hostPort ?? ''),
      address: '-',
      protocol: item.hostProtocol ?? '-',
      type: 'inbound',
    }))
    if (normalized.length > 0) {
      sourceList.value = normalized
      // 如果当前显示列表为空，先填充几条作为初始内容
      if (devices.value.length === 0) {
        for (let i = 0; i < Math.min(10, sourceList.value.length); i++) appendNext()
      }
    }
  } catch (e) {
    // 出错时不中断UI，保持现状
  }
}

// 循环滚动：每1.5秒追加一条，源数据用尽后从头循环
const startLoop = () => {
  if (loopTimer) return
  loopTimer = setInterval(() => {
    appendNext()
  }, 1500)
}

const appendNext = () => {
  if (sourceList.value.length === 0) return
  const src = sourceList.value[loopIndex.value]
  const next = {
    id: (devices.value[devices.value.length - 1]?.id || 0) + 1,
    srcIp: src.srcIp,
    srcPort: src.srcPort,
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    address: src.address,
    protocol: src.protocol,
    type: src.type,
  }
  devices.value.push(next)
  if (devices.value.length > 15) devices.value.shift()
  loopIndex.value = (loopIndex.value + 1) % sourceList.value.length
  // 自动滚动到底部
  const container = document.querySelector('.device-list')
  if (container && typeof container.scrollTo === 'function') {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="device-list">
    <div v-for="device in devices" :key="device.id" class="device-item">
      <div style="display: flex; width: 100%">
        <div
          style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 5%;
            margin-right: 5%;
            font-size: 17px;
            color: #04b4f8;
            font-weight: bold;
            text-align: center;
          "
        >
          {{ device.id }}
        </div>
        <div style="width: 89%">
          <div class="device-header">
            <span class="device-id">IP：{{ device.srcIp }}</span>
            <span class="device-time">时间：{{ device.timestamp }}</span>
            <span class="device-status online"> 正常 </span>
          </div>
          <div style="display: flex; width: 100%">
            <div class="device-port">源端口：{{ device.srcPort }}</div>
            <div class="device-address">协议：{{ device.protocol }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device-list {
  overflow: auto;
  height: 100%;
  box-sizing: border-box;
  width: 100%;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  color: #fff;
  scroll-behavior: smooth;
}

.device-list::-webkit-scrollbar {
  display: none;
}

.device-item {
  border-top: 1px dashed #00f0ff;
  padding: 10px 0;
  font-size: 13px;
}

.device-header {
  display: flex;
  margin-bottom: 5px;
}

.device-id,
.device-port,
.device-time {
  color: #cecece;
}

.device-id {
  width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0; /* flex 子项允许收缩，配合省略号 */
}

.device-port {
  width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-time {
  width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-status {
  width: 10%;
  font-weight: bold;
  text-align: right;
}

.device-status.online {
  color: #24c024;
}

.device-address {
  color: #cecece;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
