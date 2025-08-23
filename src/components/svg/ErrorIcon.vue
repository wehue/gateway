<script setup>
import { onMounted } from 'vue'
import PlaceIcon1 from './Place-icon1.vue'

// 在挂载后，通过DOM操作修改SVG颜色
onMounted(() => {
  setTimeout(() => {
    const svgPaths = document.querySelectorAll('.error-icon-wrapper svg path');
    svgPaths.forEach(path => {
      // 如果路径包含渐变填充，则替换为红色渐变
      if (path.getAttribute('fill') && path.getAttribute('fill').startsWith('url')) {
        // 不修改渐变引用，但会在后续修改渐变定义
      }
      // 对于纯色填充，直接修改为红色系
      else if (path.getAttribute('fill') &&
              !path.getAttribute('fill').includes('none') &&
              path.getAttribute('fill').includes('rgb')) {
        path.setAttribute('fill', 'rgba(255, 45, 85, 0.9)');
      }
    });

    // 修改停止点颜色
    const stopElements = document.querySelectorAll('.error-icon-wrapper svg stop');
    stopElements.forEach(stop => {
      if (stop.getAttribute('stop-color') === '#1affff') {
        stop.setAttribute('stop-color', '#ff2d55');
      } else if (stop.getAttribute('stop-color') === '#00e0db') {
        stop.setAttribute('stop-color', '#ff5e62');
      } else if (stop.getAttribute('stop-color') === '#082C51') {
        stop.setAttribute('stop-color', '#700010');
      } else if (stop.getAttribute('stop-color') === '#025E81') {
        stop.setAttribute('stop-color', '#9c162e');
      }
    });
  }, 100);
})
</script>

<template>
  <div class="error-icon-wrapper">
    <PlaceIcon1 class="error-icon" />
    <div class="error-glow"></div>
  </div>
</template>

<style scoped>
.error-icon-wrapper {
  position: relative;
  display: inline-block;
}

.error-icon {
  position: relative;
  z-index: 1;
}

/* 添加红色发光效果 */
.error-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 45, 85, 0.6) 0%, rgba(255, 45, 85, 0) 70%);
  border-radius: 50%;
  z-index: 0;
  animation: pulsateError 2s infinite;
}

:deep(.icon-wrapper) {
  filter: drop-shadow(0 0 8px rgba(255, 45, 85, 0.6));
}

:deep(.icon-wrapper:hover) {
  filter: drop-shadow(0 0 12px rgba(255, 45, 85, 0.8));
}

:deep(.triangle-part) {
  animation: errorBounceEffect 1.2s infinite ease-in-out !important;
}

@keyframes pulsateError {
  0%, 100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.3);
  }
}

@keyframes errorBounceEffect {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
    filter: brightness(1.2) saturate(1.2);
  }
}
</style>
