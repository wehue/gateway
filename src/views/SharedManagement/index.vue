<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTrafficReports, getResourceReports } from '@/api/fabric'

// 路由
const router = useRouter()

// 切换类型（资源安全报告和流量安全报告）
const activeType = ref('traffic')

// 当前展示的报告列表
const currentReportList = computed(() => {
  return activeType.value === 'traffic' ? trafficReports.value : resourceReports.value
})

// 流量安全报告数据
const trafficReports = ref([])

// 资源安全报告数据
const resourceReports = ref([])

const  fetchReports = async () => {
  try {
    // 获取流量安全报告
    const resTraffic = await getTrafficReports()
    console.log(resTraffic);

    if (resTraffic && resTraffic.data && Array.isArray(resTraffic.data.data)) {
      trafficReports.value = resTraffic.data.data
    }

    // 获取资源安全报告
    const resResource = await getResourceReports()
    console.log(resResource);
    if (resResource && resResource.data && Array.isArray(resResource.data.data)) {
      resourceReports.value = resResource.data.data
    }
  } catch (e) {
    ElMessage.error('报告数据获取失败')
  }
}




// 分页设置
const currentPage = ref(1)
const pageSize = ref(5) // 每页显示5条

// 计算分页后的报告，不足5条时用空行填充
const paginatedReports = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  const reports = currentReportList.value.slice(startIndex, endIndex)
  // 如果数据不足5条，用空行填充
  const emptyRows = []
  for (let i = reports.length; i < pageSize.value; i++) {
    emptyRows.push({
      id: `empty-${i}`,
      isEmpty: true,
      date: '',
      name: '',
      gateway: '',
      fileUrl: '',
    })
  }
  return [...reports, ...emptyRows]
})

// 处理分页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 切换类型时重置分页（el-tabs专用）
const handleTypeChange = () => {
  currentPage.value = 1
}

// 获取行的类名，用于标识空白行
const getRowClassName = ({ row }) => {
  return row.isEmpty ? 'empty-row' : ''
}

// 下载报告
const downloadReport = (report) => {
  // 模拟下载过程
  ElMessage({
    type: 'success',
    message: `正在下载报告: ${report.name || report.reportName}`,
    duration: 2000,
  })

  setTimeout(() => {
    const link = document.createElement('a')
    link.href = report.fileUrl || '#'
    link.setAttribute('download', report.name || report.reportName)
    link.setAttribute('target', '_blank')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, 500)
}


onMounted(() => {
  fetchReports()
})
</script>

<template>
  <bg-image1>
    <!-- 头部页头 -->
    <Header />

    <!-- 主体内容 -->
    <div class="report-management-container">
      <!-- 标题区域 -->
      <div class="page-title-container">
        <div class="title-left-line"></div>
        <h1 class="page-title">共享管理中心</h1>
        <div class="title-right-line"></div>
      </div>
      <!-- 表格边框 -->
      <div class="cyber-container">
        <!-- 切换tab区域 -->
        <el-tabs v-model="activeType" @tab-click="handleTypeChange" class="report-type-tabs" style="margin-bottom:1vw;">
          <el-tab-pane label="流量安全报告" name="traffic"></el-tab-pane>
          <el-tab-pane label="资源安全报告" name="resource"></el-tab-pane>
        </el-tabs>
        <!-- 报告列表 -->
        <div class="report-list">
          <el-table
            :data="paginatedReports"
            style="width: 100%"
            class="cyber-table"
            stripe
            :highlight-current-row="false"
            :cell-style="{ backgroundColor: 'transparent' }"
            :row-style="{ backgroundColor: 'transparent' }"
            :row-class-name="getRowClassName"
          >
            <el-table-column label="序号" width="200" align="center">
              <template #default="scope">
                <span v-if="!scope.row.isEmpty">{{
                  (currentPage - 1) * pageSize + scope.$index + 1
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="时间" width="300" align="center">
              <template #default="scope">
                <span v-if="!scope.row.isEmpty">{{ scope.row.date }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="报告名称" min-width="200" align="center">
              <template #default="scope">
                <span v-if="!scope.row.isEmpty">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="gateway" label="所属网关" min-width="220" align="center">
              <template #default="scope">
                <span v-if="!scope.row.isEmpty">{{ scope.row.gateway }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="scope">
                <div v-if="!scope.row.isEmpty" class="download-btn-container">
                  <a class="download-btn" @click="downloadReport(scope.row)"> 下载查看 </a>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next"
              :total="currentReportList.length"
              @current-change="handleCurrentChange"
              background
            />
          </div>
        </div>
      </div>
    </div>
  </bg-image1>
</template>

<style scoped>
.report-management-container {
  padding: 1.4vw 2.7vw 0 2.7vw;
  color: #fff;
}

/* 页面标题样式 */
.page-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  margin-top: 0.5vw;
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
  padding: 1.4vw;
  margin-top: 1.5vw;
}

.report-list {
  margin-top: 1.4vw;
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
  font-size: 1.1vw;
  height: 4.5vw;
}

:deep(.cyber-table tr:nth-child(2n)) {
  background-color: rgba(0, 40, 70, 0.3);
}

/* 空白行样式 */
:deep(.cyber-table tr.empty-row) {
  background-color: rgba(0, 20, 40, 0.1) !important;
}

:deep(.cyber-table tr.empty-row:hover) {
  background-color: rgba(0, 20, 40, 0.1) !important;
}

:deep(.cyber-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.35vw;
  padding-bottom: 0.35vw;
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

.download-btn-container {
  display: flex;
  justify-content: center;
}

.download-btn {
  color: #00a7e1;
  text-decoration: none;
  padding: 0.35vw 0.7vw;
  border-radius: 0.27vw;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
}

.download-btn:hover {
  color: #00e0db;
  text-shadow: 0 0 5px rgba(0, 224, 219, 0.5);
}

.download-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00e0db, transparent);
  bottom: 0;
  left: 0;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.download-btn:hover::after {
  transform: scaleX(1);
}

/* 分页控件样式 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-right: 1.4vw;
  margin-top: 1.4vw;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) {
  background-color: rgba(0, 30, 60, 0.5);
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: rgba(0, 224, 219, 0.5);
}

:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background-color: rgba(0, 30, 60, 0.5);
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #00e0db;
}

:deep(.el-table__header th.el-table__cell) {
  background-color: rgba(0, 40, 70, 0.8) !important;
  color: #00e0db !important;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5) !important;
  font-size: 21px !important;
}

.report-type-tabs {
  margin-bottom: 1vw;
  /* 可根据需要调整tab样式 */
}

@media (max-width: 900px) {
  .report-management-container {
    padding: 2vw 1vw 0 1vw !important;
  }
  .cyber-container {
    padding: 2vw 1vw !important;
    border-radius: 1vw !important;
  }
  .report-list {
    margin-top: 2vw !important;
  }
  .no-data {
    font-size: 2vw !important;
    padding: 4vw !important;
  }
  :deep(.cyber-table tr) {
    font-size: 2vw !important;
    height: 8vw !important;
  }
  :deep(.cyber-table th) {
    font-size: 2.5vw !important;
    padding: 1vw 0.5vw !important;
  }
  :deep(.cyber-table td) {
    font-size: 2vw !important;
    padding: 1vw 0.5vw !important;
  }
  .download-btn {
    font-size: 2vw !important;
    padding: 1vw 2vw !important;
  }
  .pagination-container {
    padding-right: 0 !important;
    justify-content: center !important;
  }
}
</style>
