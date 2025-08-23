import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义文件存储store
export const useFileStore = defineStore(
  'file',
  () => {
    // 选中的文件信息
    const selectedFile = ref(null)

    // 选中的AI模型
    const selectedModel = ref('TransFc-GAN')

    // 上传分析结果（后端返回）
    const analysisSummary = ref(null)
    const analysisPredictions = ref([])
    const uploadedFileName = ref('')
    const uploadedFilePath = ref('')

    // 设置文件
    const setFile = (file) => {
      selectedFile.value = file
    }

    // 清除文件
    const clearFile = () => {
      selectedFile.value = null
    }

    // 设置模型
    const setModel = (model) => {
      selectedModel.value = model
    }

    // 保存后端返回的分析结果
    const setAnalysisResult = (result) => {
      analysisSummary.value = result?.analysis || null
      analysisPredictions.value = Array.isArray(result?.predictions) ? result.predictions : []
      uploadedFileName.value = result?.fileName || ''
      uploadedFilePath.value = result?.filePath || ''
    }

    return {
      selectedFile,
      selectedModel,
      analysisSummary,
      analysisPredictions,
      uploadedFileName,
      uploadedFilePath,
      setFile,
      clearFile,
      setModel,
      setAnalysisResult,
    }
  },
  {
    // 持久化存储
    persist: {
      // 保存的数据将存储在localStorage中，键名为'file'
      key: 'file',
      paths: ['selectedModel'], // 只持久化模型选择，文件与分析结果不持久化
    },
  },
)
