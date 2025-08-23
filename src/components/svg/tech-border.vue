<script setup>
// 接收尺寸和位置属性
defineProps({
  width: {
    type: Number,
    default: 800, // 默认宽度，单位为px
  },
  height: {
    type: Number,
    default: 500, // 默认高度，单位为px
  },
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="tech-border-container" :style="{ width: width + 'px', height: height + 'px' }">
    <!-- SVG边框 -->
    <svg
      class="tech-border"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 881.122314453125 551.4189453125"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        fill="url(#linear_fill_border)"
        d="M823.922 288.942L834.232 276.642L834.232 82.0022L815.262 65.9922L815.262 39.2522L799.762 29.1222L406.672 29.1222L391.872 39.2522L150.632 39.2522L139.452 29.1222L64.8323 29.1222L47.1223 42.9622L47.1223 85.4622L71.2823 105.482L71.2823 254.992L47.1223 276.642L47.1223 507.202L64.8323 523.362L799.762 523.362L834.232 491.832L834.232 410.572L823.922 402.862L823.922 288.942"
      ></path>
      <path
        fill-rule="evenodd"
        fill="rgba(0, 183, 255, 0.5)"
        d="M823.922 288.942L834.232 276.642L834.232 82.0022L815.262 65.9922L815.262 39.2522L799.762 29.1222L406.672 29.1222L391.872 39.2522L150.632 39.2522L139.452 29.1222L64.8323 29.1222L47.1223 42.9622L47.1223 85.4622L71.2823 105.482L71.2823 254.992L47.1223 276.642L47.1223 507.202L64.8323 523.362L799.762 523.362L834.232 491.832L834.232 410.572L823.922 402.862L823.922 288.942ZM832.032 411.674L821.722 403.964L821.722 288.142L832.032 275.842L832.032 83.0243L813.062 67.0143L813.062 40.4425L799.107 31.3222L407.353 31.3222L392.553 41.4522L149.784 41.4522L138.604 31.3222L65.59 31.3222L49.3223 44.035L49.3223 84.428L73.4823 104.448L73.4823 255.975L49.3223 277.625L49.3223 506.231L65.6852 521.162L798.908 521.162L832.032 490.863L832.032 411.674Z"
      ></path>
      <path
        d="M20.7942 1.12219L103.679 1.12219L116.094 12.3803L384.069 12.3803L400.506 1.12219L837.135 1.12219L854.359 12.3803L854.359 42.0906L875.429 59.8839L875.429 276.149L863.976 289.823L863.976 416.408L875.429 424.975L875.429 515.259L837.135 550.297L20.7942 550.297L1.12231 532.339L1.12231 276.149L27.9635 252.095L27.9635 85.9697L1.12231 63.7281L1.12231 16.4991L20.7942 1.12219Z"
        stroke="rgba(0, 183, 255, 1)"
        stroke-width="2.244389027431422"
      ></path>
      <path
        stroke="rgba(0, 183, 255, 1)"
        stroke-width="2.244389027431422"
        d="M35.7458 76.2665L15.9575 60.7474L15.9575 24.4953L30.4272 11.5767L95.5409 11.5767L111.418 24.4953L389.98 24.4953L407.031 11.5767"
      ></path>
      <path
        stroke="rgba(0, 183, 255, 1)"
        stroke-width="2.244389027431422"
        d="M833.256 11.5767L843.737 19.1212L843.737 43.9339L863.888 60.4898L863.888 270.015L853.186 285.523L853.186 420.317L865.647 430.712"
      ></path>
      <path
        stroke="rgba(0, 183, 255, 1)"
        stroke-width="2.244389027431422"
        d="M527.965 541.219C521.82 541.219 27.6283 543.123 27.6283 543.123L11.5684 529.115L11.5684 280.146L34.0833 258.977"
      ></path>
      <path
        d="M4.66772 173.944L15.6403 181.528L15.6403 196.698L4.66772 189.114L4.66772 173.944Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M4.66772 151.19L15.6403 158.774L15.6403 173.944L4.66772 166.36L4.66772 151.19Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M4.66772 128.436L15.6403 136.02L15.6403 151.19L4.66772 143.606L4.66772 128.436Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M4.66772 105.681L15.6403 113.265L15.6403 128.436L4.66772 120.852L4.66772 105.681Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M4.66772 82.9272L15.6403 90.5112L15.6403 105.681L4.66772 98.0975L4.66772 82.9272Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M869.306 393.901L880.279 401.485L880.279 416.655L869.306 409.071L869.306 393.901Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M869.306 371.147L880.279 378.731L880.279 393.901L869.306 386.317L869.306 371.147Z"
        fill="#00B7FF"
      ></path>
      <path
        d="M869.306 348.393L880.279 355.977L880.279 371.147L869.306 363.563L869.306 348.393Z"
        fill="#00B7FF"
      ></path>
      <defs>
        <linearGradient
          id="linear_fill_border"
          x1="440.677978515625"
          y1="29.1221923828125"
          x2="440.677978515625"
          y2="523.36181640625"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#0090FF" stop-opacity="0.4" />
          <stop offset="0.4924749756425079" stop-color="#0090FF" stop-opacity="0" />
          <stop offset="1" stop-color="#0090FF" stop-opacity="0.35" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 标题（如果有） -->
    <div v-if="title" class="border-title">{{ title }}</div>

    <!-- 内容插槽 -->
    <div class="content-container">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.tech-border-container {
  position: relative;
  min-width: 200px;
  min-height: 100px;
}

.tech-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.border-title {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: #00b7ff;
  font-size: 18px;
  font-weight: bold;
  z-index: 2;
  text-shadow: 0 0 5px rgba(0, 144, 255, 0.7);
}

.content-container {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  pointer-events: auto;
}
</style>
