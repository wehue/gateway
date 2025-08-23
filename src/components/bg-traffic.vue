<script setup></script>

<template>
  <!-- 背景图片容器 -->
  <div class="bg-container">
    <img src="@/assets/images/traffic_foot.png" alt="" class="footer-image" />
    <!-- 插槽 -->
    <slot></slot>
  </div>
</template>

<style scoped>
.bg-container {
  background-image: url('@/assets/images/traffic_bg.png');
  background-size: cover;
  background-position: center;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
.footer-image {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  min-width: 120%;
  margin-left: -150px;
  height: 500px;
  object-fit: cover;
}
</style>
