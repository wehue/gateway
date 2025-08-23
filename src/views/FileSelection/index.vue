<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElUpload, ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useFileStore } from '@/stores'
import { uploadFile } from '@/api/traffic'

// 路由
const router = useRouter()
// 文件存储
const fileStore = useFileStore()

// AI模型选择
const selectedModel = ref(fileStore.selectedModel)

// 是否已选择文件
const fileSelected = ref(false)
const fileList = ref([])

// 文件上传配置
const uploadConfig = reactive({
  action: '',
  autoUpload: false,
  multiple: false,
  limit: 1,
  accept: '.pcap,.cap,.csv',
})

// 文件改变时的处理函数
const handleFileChange = (uploadFile) => {
  fileSelected.value = true
  fileList.value = [uploadFile]
  // 存储文件到store中
  fileStore.setFile(uploadFile.raw)
}

// 文件移除时的处理函数
const handleFileRemove = () => {
  fileSelected.value = false
  fileList.value = []
  // 清除store中的文件
  fileStore.clearFile()
}

// 模型选择时更新store
const selectModel = (model) => {
  selectedModel.value = model
  fileStore.setModel(model)
}

// 执行分析
const startAnalyze = async () => {
  if (!fileSelected.value) {
    ElMessage({
      message: '请先选择要分析的文件',
      type: 'warning',
    })
    return
  }

  // 确保文件信息已保存到store
  if (fileList.value[0] && fileList.value[0].raw) {
    fileStore.setFile(fileList.value[0].raw)
  }

  // 保存当前选择的模型
  fileStore.setModel(selectedModel.value)

  // 先上传文件
  try {
    const file = fileList.value[0].raw
    const resp = await uploadFile(file)
    console.log('发送成功', resp)

    // 规范化后端数据存储到store，供结果页使用
    const payload = resp?.data || {}
    const normalized = {
      analysis: payload.analysis || null,
      predictions: Array.isArray(payload?.analysis?.predictions)
        ? payload.analysis.predictions
        : [],
      fileName: payload.fileName || '',
      filePath: payload.filePath || '',
    }
    fileStore.setAnalysisResult(normalized)

    // 可按需使用 data
  } catch (err) {
    ElMessage({ message: '文件上传失败', type: 'error' })
    return
  }

  // 携带文件名信息跳转到分析页面
  router.push({
    path: '/analyzing',
    query: {
      filename: fileList.value[0]?.name || '未命名文件',
      model: selectedModel.value,
    },
  })
}
</script>

<template>
  <bg-image2>
    <Header />
    <div class="file-selection-container">
      <!-- 科技边框 -->
      <div class="cyber-table-container">
        <div class="cyber-table-content">
          <div class="selection-content">
            <!-- 标题部分 -->
            <div class="main-title">疑似异常流量分析</div>

            <!-- 分区线 -->
            <div class="divider">
              <div class="line"></div>
              <div class="dot"></div>
              <div class="line"></div>
            </div>

            <!-- 选择区域 -->
            <div class="selection-area">
              <!-- AI模型选择 -->
              <div class="selection-section">
                <div class="section-title">AI模型</div>
                <div class="model-options">
                  <div
                    class="model-option"
                    :class="{ active: selectedModel === 'TransEc-GAN' }"
                    @click="selectModel('TransEc-GAN')"
                  >
                    <div class="option-indicator"></div>
                    <div class="option-text">TransEc-GAN模型</div>
                  </div>
                </div>
                <div class="model-description">
                  TransEc-GAN技术通过深度学习算法，能够从复杂的网络流量数据中提取关键特征，模型根据提取到的特征，能够有效地识别出多种网络威胁，（如PortScan、DDoS攻击等）。同时TransEc-GAN具备自适应学习能力，能够随着网络环境的变化和新出现的攻击模式不断优化其识别算法。
                </div>
              </div>

              <!-- 文件上传区域 -->
              <div>
                <el-upload
                  v-bind="uploadConfig"
                  class="upload-area"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                  :file-list="fileList"
                >
                  <template #trigger>
                    <el-button :icon="UploadFilled" class="upload-button" :disabled="fileSelected">
                      选择文件
                    </el-button>
                  </template>
                </el-upload>
              </div>
              <div class="file-info-container">
                <div v-if="fileSelected && fileList[0]" class="file-info">
                  <div class="file-info-item">
                    <span class="file-info-label">文件名:</span>
                    <span class="file-info-value">{{ fileList[0].name }}</span>
                  </div>
                  <div class="file-info-item">
                    <span class="file-info-label">文件大小:</span>
                    <span class="file-info-value"
                      >{{ (fileList[0].size / 1024).toFixed(2) }} KB</span
                    >
                  </div>
                </div>
              </div>
              <!-- 分析按钮 -->
              <div class="analyze-button-container">
                <button class="analyze-button" @click="startAnalyze">开始分析</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </bg-image2>
</template>

<style scoped>
.file-selection-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.4vw;
  padding-bottom: 2.7vw;
}

/* 网络表格风格容器 */
.cyber-table-container {
  width: 100%;
  max-width: 70vw;
  border: 0.07vw solid #00a7e1;
  border-radius: 0.35vw;
  background-color: rgba(0, 20, 40, 0.9);
  box-shadow:
    0 0 1.4vw rgba(0, 167, 225, 0.4),
    inset 0 0 0.7vw rgba(0, 167, 225, 0.2);
  overflow: hidden;
  position: relative;
}

/* 表格顶部发光效果 */
.cyber-table-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0.07vw;
  background: linear-gradient(90deg, transparent, rgba(0, 167, 225, 0.8), transparent);
  box-shadow: 0 0 0.5vw rgba(0, 167, 225, 0.8);
}

/* 表格底部发光效果 */
.cyber-table-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.07vw;
  background: linear-gradient(90deg, transparent, rgba(0, 167, 225, 0.8), transparent);
  box-shadow: 0 0 0.5vw rgba(0, 167, 225, 0.8);
}

/* 表格内容区域 */
.cyber-table-content {
  padding-right: 1.4vw;
  padding-left: 1.4vw;
  padding-bottom: 0.7vw;
  min-height: 13vw;
}

.selection-content {
  width: 100%;
  color: #fff;
}

.main-title {
  font-size: 1.7vw;
  text-align: center;
  margin-top: 1.4vw;
  margin-bottom: 1.4vw;
  color: #00e0db;
  text-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.5);
  font-weight: bold;
}

.divider {
  display: flex;
  align-items: center;
  margin: 0.7vw 0;
}

.line {
  flex: 1;
  height: 0.07vw;
  background: linear-gradient(90deg, transparent, #00e0db 50%, transparent);
}

.dot {
  width: 0.55vw;
  height: 0.55vw;
  background-color: #00e0db;
  border-radius: 50%;
  margin: 0 1vw;
  box-shadow: 0 0 0.35vw #00e0db;
}

.selection-area {
  display: flex;
  flex-direction: column;
  gap: 1vw;
}

.selection-section {
  margin-bottom: 2.7vw;
}

.section-title {
  font-size: 1.5vw;
  margin-bottom: 0.7vw;
  color: #00e0db;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 0.27vw;
  height: 1.2vw;
  background-color: #00e0db;
  margin-right: 0.7vw;
  box-shadow: 0 0 0.35vw #00e0db;
}

.model-options {
  margin-left: 1vw;
}

.model-option {
  display: flex;
  align-items: center;
  margin-bottom: 0.7vw;
  cursor: pointer;
  padding: 0.35vw;
  border-radius: 0.27vw;
  transition: all 0.3s;
}

.model-option:hover {
  background-color: rgba(0, 224, 219, 0.1);
  cursor: pointer;
}

.model-option.active {
  background-color: rgba(0, 224, 219, 0.15);
}

.option-indicator {
  width: 1.1vw;
  height: 1.1vw;
  border: 0.13vw solid #00e0db;
  border-radius: 50%;
  margin-right: 0.7vw;
  position: relative;
}

.active .option-indicator::after {
  content: '';
  position: absolute;
  width: 0.55vw;
  height: 0.55vw;
  background-color: #00e0db;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0.35vw #00e0db;
}
.option-text {
  font-size: 1.1vw;
}
.model-description {
  font-size: 1.1vw;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 1vw;
  margin-top: 0.7vw;
  padding: 0.7vw;
  border-left: 0.13vw solid rgba(0, 224, 219, 0.3);
}

/* 上传区域样式 */
:deep(.upload-area) {
  border: 0.13vw dashed rgba(0, 224, 219, 0.5);
  border-radius: 0.4vw;
  padding: 1.4vw;
  text-align: center;
  transition: all 0.3s;
  background-color: rgba(0, 20, 40, 0.3);
}

:deep(.upload-area:hover) {
  border-color: #00e0db;
  background-color: rgba(0, 20, 40, 0.5);
}

:deep(.el-upload-dragger) {
  background: transparent;
  border: none;
  width: 100%;
}

:deep(.upload-button) {
  background: rgba(0, 224, 219, 0.2);
  border: 1px solid #00e0db;
  color: #fff;
  transition: all 0.3s;
}

:deep(.upload-button:hover) {
  background: rgba(0, 224, 219, 0.4);
  box-shadow: 0 0 8px #00e0db;
}

.analyze-button-container {
  margin-bottom: 0.7vw;
  display: flex;
  justify-content: center;
}

.analyze-button {
  padding: 0.7vw 3.5vw;
  background: linear-gradient(90deg, rgba(0, 144, 255, 0.5), rgba(0, 224, 219, 0.5));
  border: none;
  color: white;
  font-size: 1.3vw;
  cursor: pointer;
  border-radius: 0.27vw;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0.7vw rgba(0, 224, 219, 0.5);
}

.analyze-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.5s;
}

.analyze-button:hover {
  background: linear-gradient(90deg, rgba(0, 144, 255, 0.7), rgba(0, 224, 219, 0.7));
  transform: scale(1.05);
}

.analyze-button:hover::before {
  left: 100%;
}

/* 文件信息样式 */
.file-info-container {
  min-height: 3.5vw;
}

.file-info {
  padding: 0.55vw 1vw;
  border-radius: 0.35vw;
  background: rgba(0, 30, 60, 0.5);
  border: 0.07vw solid rgba(0, 167, 225, 0.3);
  transition: all 0.3s ease;
}

.file-info-item {
  margin-bottom: 0.27vw;
  display: flex;
}

.file-info-item:last-child {
  margin-bottom: 0;
}

.file-info-label {
  color: rgba(255, 255, 255, 0.7);
  width: 5.5vw;
}

.file-info-value {
  color: #00e0db;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1vw;
}
</style>
