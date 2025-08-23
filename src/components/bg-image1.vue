<script setup>

</script>

<template>
  <!-- 背景图片容器 -->
  <div class="bg-container">
    <!-- 插槽 -->
    <slot></slot>
  </div>
</template>

<style scoped>
.bg-container {
  background-image: url('@/assets/images/背景1.png');
  background-size: cover;
  background-position: center;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
}
</style>
