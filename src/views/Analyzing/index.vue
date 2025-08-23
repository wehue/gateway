<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFileStore } from '@/stores'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const fileStore = useFileStore()

// 获取文件信息
const fileInfo = ref({
  filename: route.query.filename || '未命名文件',
  model: route.query.model || fileStore.selectedModel || 'TransEc-GAN',
})

const animationCompleted = ref(false)
const isAnalysisComplete = ref(false)

// 控制动画计时器
let timer = null
// 动画完成时间设置为4.5秒，与进度条动画时间一致
const ANIMATION_DURATION = 5300

// 效果类型切换
const effectType = ref('scanline')

onMounted(() => {
  // 检查是否有文件
  if (!fileStore.selectedFile && !route.query.filename) {
    ElMessage({
      message: '未选择文件，请先选择要分析的文件',
      type: 'error',
    })
    // 返回文件选择页面
    router.replace('/fileSelection')
    return
  }

  // 动画完成时间设置与进度条一致
  timer = setTimeout(() => {
    animationCompleted.value = true
    isAnalysisComplete.value = true
  }, ANIMATION_DURATION)
})

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<template>
  <div class="analyzing-container">
    <!-- 文件信息显示 -->
    <div class="file-info-overlay">
      <div class="file-info-item">
        <span class="info-label">当前分析:</span>
        <span class="info-value">{{ fileInfo.filename }}</span>
      </div>
      <div class="file-info-item">
        <span class="info-label">使用模型:</span>
        <span class="info-value">TransEc-GAN</span>
      </div>
    </div>

    <!-- 图片容器 -->
    <div class="image-container">
      <img
        src="@/assets/images/analyzing_start.png"
        alt="分析开始"
        class="image start-image"
        :class="{ 'fade-out': animationCompleted }"
        object-position="center center"
      />
      <img
        src="@/assets/images/analyzing_end.jpg"
        alt="分析结束"
        class="image end-image"
        :class="{ 'fade-in': animationCompleted }"
        object-position="center center"
      />
    </div>

    <!-- 科技感特效 - 根据选择的效果类型显示 -->
    <template v-if="effectType === 'scanline'">
      <!-- 科技感扫描线 -->
      <div class="scan-line"></div>
    </template>
    <!-- 科技感粒子效果 -->
    <div class="particles">
      <div v-for="i in 20" :key="i" class="particle"></div>
    </div>

    <!-- 进度条效果 -->
    <div class="progress-bar">
      <div class="progress"></div>
    </div>

    <!-- 闪烁文字 -->
    <div class="loading-text" :class="{ complete: isAnalysisComplete }">
      <span v-if="!isAnalysisComplete">系统分析中...</span>
      <span v-else class="complete-text"
        >分析已完成
        <span class="view-details" @click="router.push('/analyzeResults')">查看详情</span></span
      >
    </div>

    <!-- 数据网格效果 -->
    <div class="data-grid">
      <div
        v-for="i in 10"
        :key="i"
        class="grid-line horizontal"
        :style="`--delay: ${i * 0.2}s`"
      ></div>
      <div
        v-for="i in 10"
        :key="i + 10"
        class="grid-line vertical"
        :style="`--delay: ${i * 0.2}s`"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.analyzing-container {
  width: 100%;
  height: 100vh; /* 修改为视口高度 */
  position: relative;
  overflow: hidden;
  background-color: #000;
  display: block;
  object-position: center center;
}

/* 文件信息覆盖层 */
.file-info-overlay {
  position: absolute;
  top: 1.4vw;
  right: 1.4vw;
  z-index: 10;
  background-color: rgba(0, 20, 40, 0.7);
  border: 0.07vw solid #00a7e1;
  border-radius: 0.35vw;
  padding: 1vw;
  box-shadow: 0 0 1vw rgba(0, 167, 225, 0.5);
}

.file-info-item {
  display: flex;
  align-items: center;
}

.info-label {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 0.7vw;
  font-size: 1.4vw;
}

.info-value {
  color: #00e0db;
  font-weight: bold;
  text-shadow: 0 0 0.35vw rgba(0, 224, 219, 0.5);
  font-size: 1.4vw;
}

/* 图片样式 */
.image-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: block;
}

.image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 1.5s ease-in-out;
  object-position: center center;
}

.start-image {
  opacity: 1;
  z-index: 2;
  object-position: center center;
}

.end-image {
  opacity: 0;
  z-index: 1;
  object-position: center center;
}

.fade-out {
  opacity: 0;
}

.fade-in {
  opacity: 1;
}

/* 扫描线效果 */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to right, transparent, #0ff, transparent);
  z-index: 3;
  animation: scan 3s linear infinite;
  box-shadow: 0 0 15px #0ff;
}

@keyframes scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}

/* 量子化像素效果 */
.pixel-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(20, 1fr);
  pointer-events: none;
}

.pixel-cell {
  background-color: rgba(0, 255, 255, 0.7);
  animation: pixelReveal var(--duration) ease-in-out forwards;
  animation-delay: var(--delay);
  transform: scale(0);
  opacity: 0;
}

@keyframes pixelReveal {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  30% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  70% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 全息投影效果 */
.hologram-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

.hologram-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    rgba(0, 255, 255, 0.05) 2px,
    rgba(0, 255, 255, 0.05) 4px
  );
  animation: hologramMove 10s linear infinite;
}

.hologram-glitch {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent 65%, rgba(0, 255, 255, 0.1) 70%, transparent 75%);
  animation: hologramGlitch 5s linear infinite;
}

@keyframes hologramMove {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100px);
  }
}

@keyframes hologramGlitch {
  0%,
  100% {
    opacity: 0;
  }
  10%,
  15% {
    opacity: 1;
    transform: translate(-5px, 0);
  }
  20%,
  80% {
    opacity: 0;
  }
  85%,
  90% {
    opacity: 1;
    transform: translate(5px, 0);
  }
}

/* 粒子效果 */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 4;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background-color: rgba(0, 255, 255, 0.7);
  border-radius: 50%;
  animation: float 5s linear infinite;
  opacity: 0;
}

@keyframes float {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--tx), var(--ty));
    opacity: 0;
  }
}

/* 每个粒子有随机的位置和动画 */
.particles .particle:nth-child(1) {
  --tx: 150px;
  --ty: 50px;
  animation-delay: 0.2s;
  top: 10%;
  left: 20%;
}
.particles .particle:nth-child(2) {
  --tx: -80px;
  --ty: 120px;
  animation-delay: 0.5s;
  top: 30%;
  left: 80%;
}
.particles .particle:nth-child(3) {
  --tx: 200px;
  --ty: -70px;
  animation-delay: 0.8s;
  top: 70%;
  left: 30%;
}
.particles .particle:nth-child(4) {
  --tx: -120px;
  --ty: -90px;
  animation-delay: 1.1s;
  top: 60%;
  left: 70%;
}
.particles .particle:nth-child(5) {
  --tx: 100px;
  --ty: 150px;
  animation-delay: 1.4s;
  top: 20%;
  left: 40%;
}
.particles .particle:nth-child(6) {
  --tx: -150px;
  --ty: -50px;
  animation-delay: 1.7s;
  top: 80%;
  left: 60%;
}
.particles .particle:nth-child(7) {
  --tx: 70px;
  --ty: -130px;
  animation-delay: 2s;
  top: 90%;
  left: 10%;
}
.particles .particle:nth-child(8) {
  --tx: -90px;
  --ty: 110px;
  animation-delay: 2.3s;
  top: 15%;
  left: 85%;
}
.particles .particle:nth-child(9) {
  --tx: 130px;
  --ty: -60px;
  animation-delay: 2.6s;
  top: 75%;
  left: 25%;
}
.particles .particle:nth-child(10) {
  --tx: -110px;
  --ty: -120px;
  animation-delay: 2.9s;
  top: 45%;
  left: 55%;
}
.particles .particle:nth-child(11) {
  --tx: 90px;
  --ty: 140px;
  animation-delay: 3.2s;
  top: 25%;
  left: 75%;
}
.particles .particle:nth-child(12) {
  --tx: -140px;
  --ty: -40px;
  animation-delay: 3.5s;
  top: 65%;
  left: 15%;
}
.particles .particle:nth-child(13) {
  --tx: 60px;
  --ty: -100px;
  animation-delay: 3.8s;
  top: 85%;
  left: 45%;
}
.particles .particle:nth-child(14) {
  --tx: -70px;
  --ty: 80px;
  animation-delay: 4.1s;
  top: 35%;
  left: 65%;
}
.particles .particle:nth-child(15) {
  --tx: 110px;
  --ty: -80px;
  animation-delay: 4.4s;
  top: 55%;
  left: 35%;
}
.particles .particle:nth-child(16) {
  --tx: -130px;
  --ty: -70px;
  animation-delay: 0.3s;
  top: 40%;
  left: 90%;
}
.particles .particle:nth-child(17) {
  --tx: 80px;
  --ty: 130px;
  animation-delay: 0.6s;
  top: 50%;
  left: 5%;
}
.particles .particle:nth-child(18) {
  --tx: -50px;
  --ty: -150px;
  animation-delay: 0.9s;
  top: 95%;
  left: 50%;
}
.particles .particle:nth-child(19) {
  --tx: 140px;
  --ty: 60px;
  animation-delay: 1.2s;
  top: 5%;
  left: 95%;
}
.particles .particle:nth-child(20) {
  --tx: -100px;
  --ty: 90px;
  animation-delay: 1.5s;
  top: 48%;
  left: 22%;
}

/* 进度条效果 */
.progress-bar {
  position: absolute;
  bottom: 20%;
  left: 20%;
  width: 60%;
  height: 0.4vw;
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 5;
  border-radius: 0.2vw;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(to right, #00a8ff, #00fff0);
  width: 0;
  animation: progress 5.5s cubic-bezier(0.1, 0.5, 0.9, 1) forwards;
  box-shadow: 0 0 0.7vw #00fff0;
}

@keyframes progress {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}

/* 闪烁文字 */
.loading-text {
  position: absolute;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%);
  color: #00fff0;
  font-size: 2vw;
  font-weight: bold;
  text-shadow: 0 0 0.7vw #00fff0;
  z-index: 5;
  animation: blink 1s infinite;
  letter-spacing: 0.13vw;
  transition: all 0.5s ease;
}

.loading-text.complete {
  animation: none;
  color: #fff;
  text-shadow: 0 0 1vw #fff;
}

.complete-text {
  display: inline-block;
  transform: scale(1);
  animation: pulseText 1.5s ease-in-out;
}

.view-details {
  color: #00fff0;
  text-decoration: underline;
  cursor: pointer;
  font-weight: bold;
  margin-left: 0.5vw;
  text-shadow: 0 0 0.7vw #00fff0;
}

@keyframes pulseText {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 数据网格效果 */
.data-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  opacity: 0.3;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background-color: rgba(0, 255, 255, 0.3);
}

.horizontal {
  width: 100%;
  height: 1px;
  left: 0;
  animation: expandHorizontal 3s ease-in-out var(--delay) infinite;
}

.vertical {
  width: 1px;
  height: 100%;
  top: 0;
  animation: expandVertical 3s ease-in-out var(--delay) infinite;
}

@keyframes expandHorizontal {
  0%,
  100% {
    transform: scaleX(0);
    opacity: 0;
  }
  50% {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes expandVertical {
  0%,
  100% {
    transform: scaleY(0);
    opacity: 0;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* 给水平线设置不同的位置 */
.grid-line.horizontal:nth-child(1) {
  top: 10%;
}
.grid-line.horizontal:nth-child(2) {
  top: 20%;
}
.grid-line.horizontal:nth-child(3) {
  top: 30%;
}
.grid-line.horizontal:nth-child(4) {
  top: 40%;
}
.grid-line.horizontal:nth-child(5) {
  top: 50%;
}
.grid-line.horizontal:nth-child(6) {
  top: 60%;
}
.grid-line.horizontal:nth-child(7) {
  top: 70%;
}
.grid-line.horizontal:nth-child(8) {
  top: 80%;
}
.grid-line.horizontal:nth-child(9) {
  top: 90%;
}
.grid-line.horizontal:nth-child(10) {
  top: 95%;
}

/* 给垂直线设置不同的位置 */
.grid-line.vertical:nth-child(11) {
  left: 10%;
}
.grid-line.vertical:nth-child(12) {
  left: 20%;
}
.grid-line.vertical:nth-child(13) {
  left: 30%;
}
.grid-line.vertical:nth-child(14) {
  left: 40%;
}
.grid-line.vertical:nth-child(15) {
  left: 50%;
}
.grid-line.vertical:nth-child(16) {
  left: 60%;
}
.grid-line.vertical:nth-child(17) {
  left: 70%;
}
.grid-line.vertical:nth-child(18) {
  left: 80%;
}
.grid-line.vertical:nth-child(19) {
  left: 90%;
}
.grid-line.vertical:nth-child(20) {
  left: 95%;
}
</style>
