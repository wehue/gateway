<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAIWarnsData } from '@/api/device'

// 提取关键词的函数
const extractKeywords = (text) => {
  if (!text || text === '-') return '-'

  // 匹配所有 **关键词**：描述 的格式
  const keywordMatches = text.match(/\*\*(.*?)\*\*/g)
  if (keywordMatches) {
    // 提取所有 **关键词** 中的关键词部分，用逗号分隔
    return keywordMatches.map((match) => match.replace(/\*\*/g, '')).join('、')
  }

  // 如果没有匹配到 **关键词**： 的格式，尝试其他方式
  // 匹配所有冒号前的部分作为关键词
  const colonMatches = text.match(/[^：]+：/g)
  if (colonMatches) {
    // 提取所有冒号前的部分，去掉冒号，用逗号分隔
    return colonMatches.map((match) => match.replace('：', '')).join('、')
  }

  // 如果都没有匹配到，返回原文本（可能是纯关键词）
  return text
}

const fetchAIWarnsData = async () => {
  try {
    const res = await getAIWarnsData()
    console.log('告警历史数据', res)
    const payload = res?.data
    if (payload && payload.code === 200 && Array.isArray(payload.data)) {
      // 将后端字段映射到表格所需字段
      alarmList.value = payload.data.map((item, index) => ({
        id: index + 1,
        alarmTime: item.analysisTime || '',
        alarmData: `${item.dataType || ''}${item.dataValue ? `：${item.dataValue}` : ''}`,
        // 提取异常问题的关键词
        anomalyProblem: extractKeywords(item.anomalyProblem || '-'),
        // 提取预测故障的关键词
        predictedFailure: extractKeywords(item.predictedFailure || '-'),
      }))
    }
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  fetchAIWarnsData()
})

// 告警历史数据
const alarmList = ref([])

// 搜索和筛选相关
const searchKeyword = ref('')
const startDate = ref('')
const endDate = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(5)

// 过滤后的数据
const filteredAlarmList = computed(() => {
  let filtered = alarmList.value

  // 关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      (alarm) =>
        alarm.alarmData.toLowerCase().includes(keyword) ||
        alarm.anomalyProblem.toLowerCase().includes(keyword) ||
        alarm.predictedFailure.toLowerCase().includes(keyword),
    )
  }

  // 日期范围筛选
  if (startDate.value && endDate.value) {
    filtered = filtered.filter((alarm) => {
      const alarmDate = new Date(alarm.alarmTime)
      const start = new Date(startDate.value)
      const end = new Date(endDate.value)
      return alarmDate >= start && alarmDate <= end
    })
  } else if (startDate.value) {
    filtered = filtered.filter((alarm) => {
      const alarmDate = new Date(alarm.alarmTime)
      const start = new Date(startDate.value)
      return alarmDate >= start
    })
  } else if (endDate.value) {
    filtered = filtered.filter((alarm) => {
      const alarmDate = new Date(alarm.alarmTime)
      const end = new Date(endDate.value)
      return alarmDate <= end
    })
  }

  return filtered
})

// 计算总数
const total = computed(() => filteredAlarmList.value.length)

// 计算当前页数据
const paginatedAlarmList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlarmList.value.slice(start, end)
})

// 空行填充函数，确保表格始终有5行
const tableRows = computed(() => {
  const dataRows = paginatedAlarmList.value
  const rowCount = dataRows.length

  // 如果数据不足5条，添加空行占位
  if (rowCount < 5) {
    const emptyRows = Array(5 - rowCount).fill(null)
    return [...dataRows, ...emptyRows]
  }
  return dataRows
})

// 页码切换处理
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
}

// 清除搜索关键词
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}
</script>

<template>
  <bg-image2>
    <Header />
    <div class="alarm-history-container">
      <!-- 搜索和筛选区域 -->
      <div class="search-filter-container">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入关键词搜索..."
            clearable
            @clear="clearSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="date-filter">
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-picker"
          />
          <span class="date-separator">-</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-picker"
          />
        </div>

        <div class="filter-actions">
          <el-button @click="resetFilters" class="reset-btn">重置</el-button>
        </div>
      </div>

      <div class="alarm-table-container">
        <div class="alarm-table">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th width="8%">序号</th>
                  <th width="15%">告警时间</th>
                  <th width="17%">数据信息</th>
                  <th width="25%">AI分析的异常问题</th>
                  <th width="25%">AI预测的故障</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(alarm, index) in tableRows"
                  :key="index"
                  :class="{ 'empty-row': alarm === null }"
                >
                  <template v-if="alarm !== null">
                    <td>{{ alarm.id }}</td>
                    <td>{{ alarm.alarmTime }}</td>
                    <td>{{ alarm.alarmData }}</td>
                    <td>{{ alarm.anomalyProblem }}</td>
                    <td>{{ alarm.predictedFailure }}</td>
                  </template>
                  <template v-else>
                    <td colspan="5"></td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页组件 -->
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
  </bg-image2>
</template>

<style scoped>
.alarm-history-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2vw;
  width: 100%;
  height: calc(100vh - 10vw);
}

.search-filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 98%;
  margin-top: -0.5vw;
  margin-bottom: 1vw;
  padding: 1vw;
  background: rgba(0, 40, 80, 0.7);
  border: 0.07vw solid rgba(0, 224, 219, 0.4);
  border-radius: 0.55vw;
  box-shadow: 0 0 1vw rgba(0, 224, 219, 0.3);
  backdrop-filter: blur(10px);
}

.search-box {
  flex: 1;
  margin-right: 1vw;
}

.search-input {
  width: 100%;
}

:deep(.search-input .el-input__wrapper) {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(0, 224, 219, 0.2);
}

:deep(.search-input .el-input__wrapper:hover) {
  border-color: rgba(0, 224, 219, 0.8);
  box-shadow: 0 0 15px rgba(0, 224, 219, 0.4);
}

:deep(.search-input .el-input__inner) {
  color: #fff;
  font-size: 14px;
}

:deep(.search-input .el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.search-input .el-input__prefix) {
  color: #00e0db;
}

.date-filter {
  display: flex;
  align-items: center;
  margin-right: 1vw;
}

.date-picker {
  width: 12vw;
  margin-right: 0.5vw;
}

:deep(.date-picker .el-input__wrapper) {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(0, 224, 219, 0.2);
}

:deep(.date-picker .el-input__wrapper:hover) {
  border-color: rgba(0, 224, 219, 0.8);
  box-shadow: 0 0 15px rgba(0, 224, 219, 0.4);
}

:deep(.date-picker .el-input__inner) {
  color: #fff;
  font-size: 14px;
}

:deep(.date-picker .el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.date-picker .el-input__suffix) {
  color: #00e0db;
}

.date-separator {
  color: #1affff;
  font-size: 1.3vw;
  margin: 0 0.5vw;
}

.filter-actions {
  margin-left: 1vw;
}

.reset-btn {
  background: rgba(0, 224, 219, 0.2);
  color: #1affff;
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  min-width: 80px;
}

.reset-btn:hover {
  background: rgba(0, 224, 219, 0.4);
  border-color: rgba(0, 224, 219, 0.8);
  box-shadow: 0 0 15px rgba(0, 224, 219, 0.6);
  transform: translateY(-1px);
}

.reset-btn:active {
  transform: translateY(0);
}

.alarm-table-container {
  width: 98%;
  background: rgba(0, 40, 80, 0.7);
  border: 0.07vw solid rgba(0, 224, 219, 0.4);
  border-radius: 0.55vw;
  padding: 0.7vw;
  box-shadow: 0 0 1vw rgba(0, 224, 219, 0.3);
  display: flex;
  flex-direction: column;
}

.alarm-table {
  width: 100%;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  width: 100%;
  overflow: hidden;
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
  padding: 0.8vw 1vw;
  font-weight: 600;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 10;
  background: inherit;
}

tbody {
  height: 450px; /* 固定表格主体高度 */
}

tr {
  height: 3vw; /* 固定每行高度 */
}

td {
  font-size: 1.1vw;
  padding: 0.5vw 0.7vw;
  border-bottom: 1px solid rgba(0, 224, 219, 0.3);
  color: #ffffff;
  text-align: center;
  vertical-align: middle;
  white-space: pre-line;
}

tbody tr:hover:not(.empty-row) {
  background: rgba(0, 224, 219, 0.1);
}

.empty-row td {
  height: 3vw;
  border-bottom: 1px solid rgba(0, 224, 219, 0.1);
}

.risk-high {
  color: #ff4d4d;
  font-weight: 600;
}

.risk-medium {
  color: #ffaa00;
  font-weight: 600;
}

.multi-line {
  white-space: pre-line;
  text-align: left;
}

.detail-btn {
  background: rgba(0, 224, 219, 0.2);
  color: #1affff;
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
}

.detail-btn:hover {
  background: rgba(0, 224, 219, 0.4);
  box-shadow: 0 0 8px rgba(0, 224, 219, 0.6);
}

/* 分页组件自定义样式 */
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
</style>
