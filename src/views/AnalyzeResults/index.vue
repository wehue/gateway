<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFileStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const fileStore = useFileStore()

const deviceList = ref([])

// 协议号到名称的映射
const protocolNameByNumber = (num) => {
  const map = {
    1: 'ICMP',
    2: 'IGMP',
    6: 'TCP',
    17: 'UDP',
    41: 'IPv6',
    47: 'GRE',
    50: 'ESP',
    51: 'AH',
    58: 'ICMPv6',
    88: 'EIGRP',
    89: 'OSPF',
  }
  return map[num] || String(num)
}

// 将后端 predictions 转换为表格行
const normalizePredictions = (predictions) => {
  if (!Array.isArray(predictions)) return []
  return predictions.map((p, index) => ({
    id: index + 1,
    script: p.srcIp ?? p.script ?? '-',
    scrPort: String(p.srcPort ?? p.scrPort ?? ''),
    dstip: p.dstIp ?? p.dstip ?? '-',
    dstPort: String(p.dstPort ?? ''),
    protocol: protocolNameByNumber(Number(p.protocol)),
    packetLengthMean: p.packetLengthMean ?? p.packetLengtMean ?? '-',
    timestamp: String(p.timestamp ?? ''),
    confidence: p.confidence ?? '-',
    label: p.label ?? '-',
  }))
}

onMounted(() => {
  // 来自 store 的数据
  const predictions = fileStore.analysisPredictions
  const list = normalizePredictions(predictions)
  if (list.length > 0) {
    deviceList.value = list
  }
})

// 添加跳转到AI分析的方法
const goToAIAnalysis = (device) => {
  const resultLabel = device.label === 'BENIGN' ? '正常' : `${device.label}攻击`
  router.push({
    path: '/ai',
    query: {
      flowId: device.id,
      srcIp: device.script,
      srcPort: device.scrPort,
      dstIp: device.dstip,
      dstPort: device.dstPort,
      protocol: device.protocol,
      bytes: device.packetLengthMean,
      confidence: device.confidence,
      result: resultLabel,
      // 预填 AI 提示词，基于当前行数据
      prompt: `请基于以下网络流量记录进行分析：\n- 源IP：${device.script}\n- 源端口：${device.scrPort}\n- 目标IP：${device.dstip}\n- 目标端口：${device.dstPort}\n- 协议：${device.protocol}\n- 大小：${device.packetLengthMean + 'byte'}\n- 置信度：${device.confidence}\n- 结果：${resultLabel}\n\n请判断是否存在异常行为及其类型，说明依据，并给出排查与处置建议。`,
    },
  })
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(6)
const total = computed(() => deviceList.value.length)

// 计算当前页数据
const paginatedDeviceList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return deviceList.value.slice(start, end)
})

// 空行填充函数，确保表格始终有6行
const tableRows = computed(() => {
  const dataRows = paginatedDeviceList.value
  const rowCount = dataRows.length

  // 如果数据不足6条，添加空行占位
  if (rowCount < 6) {
    const emptyRows = Array(6 - rowCount).fill(null)
    return [...dataRows, ...emptyRows]
  }

  return dataRows
})

// 页码切换处理
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 获取文件信息
const fileInfo = ref({
  filename: fileStore.selectedFile?.name || route.query.filename || '未命名文件',
  model: fileStore.selectedModel || route.query.model || 'TransEc-GAN',
  analysisTime: new Date().toLocaleString(),
})
</script>

<template>
  <bg-image3>
    <Header />
    <div class="analyze-results-container">
      <!-- 添加文件信息显示 -->

      <div class="results-title">
        <div class="file-info-header">
          <div class="file-info-item">
            <span class="info-label">分析完成结果——分析文件:</span>
            <span class="info-value">{{ fileInfo.filename }}</span>
          </div>
          <div class="file-info-item">
            <span class="info-label">使用模型:</span>
            <span class="info-value">TransEc-GAN</span>
          </div>
          <div class="file-info-item">
            <span class="info-label">分析时间:</span>
            <span class="info-value">{{ fileInfo.analysisTime }}</span>
          </div>
        </div>
      </div>
      <div class="device-table-container">
        <div class="device-table">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>源IP</th>
                  <th>源端口</th>
                  <th>目标IP</th>
                  <th>目标端口</th>
                  <th>协议</th>
                  <th>大小（byte）</th>
                  <th>置信度</th>
                  <th>结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(device, index) in tableRows"
                  :key="index"
                  :class="{ 'empty-row': device === null }"
                >
                  <template v-if="device !== null">
                    <td>{{ device.id }}</td>
                    <td>{{ device.script }}</td>
                    <td>{{ device.scrPort }}</td>
                    <td>{{ device.dstip }}</td>
                    <td>{{ device.dstPort }}</td>
                    <td>{{ device.protocol }}</td>
                    <td>{{ device.packetLengthMean }}</td>
                    <td>{{ device.confidence }}</td>
                    <td>
                      <span
                        :class="['label-chip', device.label === 'BENIGN' ? 'normal' : 'danger']"
                      >
                        {{ device.label === 'BENIGN' ? '正常' : device.label + '攻击' }}
                      </span>
                    </td>
                    <td>
                      <el-button type="danger" size="small" @click="goToAIAnalysis(device)">
                        分析溯源
                      </el-button>
                    </td>
                  </template>
                  <template v-else>
                    <td colspan="10"></td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="el-pagination-wrapper">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="total"
              :current-page="currentPage"
              :page-size="pageSize"
              @current-change="handleCurrentChange"
              class="custom-pagination"
            />
          </div>
        </div>
      </div>
    </div>
  </bg-image3>
</template>

<style scoped>
.analyze-results-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2vw;
  width: 100%;
  height: calc(100vh - 10vw);
}

.results-title {
  font-size: 1.7vw;
  color: #ffffff;
  margin-top: 1.4vw;
  text-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.7);
  font-weight: bold;
}

.device-table-container {
  width: 95%;
  background: rgba(0, 40, 80, 0.7);
  border: 0.07vw solid rgba(0, 224, 219, 0.4);
  border-radius: 0.55vw;
  padding: 1.4vw;
  box-shadow: 0 0 1vw rgba(0, 224, 219, 0.3);
  display: flex;
  flex-direction: column;
}

.device-table-title {
  font-size: 1.7vw;
  color: #ffffff;
  text-align: center;
  border-bottom: 1px solid rgba(0, 224, 219, 0.4);
  padding-bottom: 0.7vw;
}

.device-table {
  width: 100%;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background: rgba(0, 20, 40, 0.6);
}

th {
  font-size: 1.3vw;
  color: #1affff;
  padding: 0.8vw 0.7vw;
  font-weight: 600;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 10;
  background: inherit;
  white-space: nowrap;
}

tbody {
  height: 450px; /* 固定表格主体高度 */
}

tr {
  height: 3vw; /* 固定每行高度 */
}

td {
  font-size: 1vw;
  padding: 0.8vw 0.7vw;
  border-bottom: 1px solid rgba(0, 224, 219, 0.3);
  color: #ffffff;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 标签胶囊样式 */
.label-chip {
  display: inline-block;
  min-width: 48px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.9vw;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.2;
  border: 1px solid transparent;
}

.label-chip.normal {
  color: #00ff9d;
  background: rgba(0, 255, 157, 0.12);
  border-color: rgba(0, 255, 157, 0.35);
  box-shadow: 0 0 6px rgba(0, 255, 157, 0.25);
}

.label-chip.danger {
  color: #ff4d4d;
  background: rgba(255, 77, 77, 0.12);
  border-color: rgba(255, 77, 77, 0.35);
  box-shadow: 0 0 6px rgba(255, 77, 77, 0.25);
}

tbody tr:hover:not(.empty-row) {
  background: rgba(0, 224, 219, 0.1);
}

.empty-row td {
  height: 3vw;
  border-bottom: 1px solid rgba(0, 224, 219, 0.1);
}

/* Element Plus 分页组件自定义样式 */
.el-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.4vw;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-hover-color: #1affff;
  --el-text-color-primary: #ffffff;
  --el-pagination-button-color: #ffffff;
  --el-pagination-button-bg-color: rgba(0, 40, 80, 0.8);
  --el-pagination-button-disabled-color: rgba(255, 255, 255, 0.5);
  --el-pagination-button-disabled-bg-color: rgba(0, 40, 80, 0.4);
}

:deep(.el-pager li) {
  background-color: rgba(0, 40, 80, 0.8) !important;
  color: #ffffff !important;
  border: 1px solid rgba(0, 224, 219, 0.3);
  margin: 0 3px;
}

:deep(.el-pager li.is-active) {
  background-color: rgba(0, 224, 219, 0.5) !important;
  color: #ffffff !important;
  font-weight: bold;
  box-shadow: 0 0 5px rgba(0, 224, 219, 0.8);
}

:deep(.el-pager li:hover:not(.is-active)) {
  color: #1affff !important;
  background-color: rgba(0, 224, 219, 0.2) !important;
}

:deep(.btn-prev),
:deep(.btn-next) {
  background: rgba(0, 40, 80, 0.8) !important;
  color: #1affff !important;
  border: 1px solid rgba(0, 224, 219, 0.3) !important;
}

:deep(.btn-prev:hover:not(:disabled)),
:deep(.btn-next:hover:not(:disabled)) {
  background: rgba(0, 224, 219, 0.2) !important;
}

/* 添加文件信息头部样式 */
.file-info-header {
  display: flex;
  justify-content: space-between;
  gap: 2vw;
  border-radius: 0.35vw;
  padding: 1vw;
}

.file-info-item {
  display: flex;
  align-items: center;
}

.info-label {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 0.7vw;
  font-size: 1.5vw;
}

.info-value {
  color: #00e0db;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 224, 219, 0.5);
  font-size: 1.5vw;
}

/* 添加分析溯源按钮样式 */
:deep(.el-button--danger) {
  background-color: rgba(255, 77, 77, 0.1);
  border-color: rgba(255, 77, 77, 0.5);
  color: #ff4d4d;
}

:deep(.el-button--danger:hover) {
  background-color: rgba(255, 77, 77, 0.2);
  border-color: rgba(255, 77, 77, 0.8);
  box-shadow: 0 0 10px rgba(255, 77, 77, 0.3);
}

/* 保持表格行高一致 */
td .el-button {
  padding: 5px 15px;
  font-size: 12px;
}
</style>
