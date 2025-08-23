<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useUserStore } from '../stores/modules/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 获取用户角色
const userRole = computed(() => userStore.role)
const isAdmin = computed(() => {
  console.log('当前用户角色:', userRole.value)
  return userRole.value === '超级管理员'
})

//左侧导航栏标签
const leftLabels = [
  { text: '综合大屏', path: '/' },
  { text: '设备管理', path: '/deviceManagement' },
  { text: '流量详情', path: '/trafficDetail' },
]

//右侧导航栏标签
const rightLabels = computed(() => {
  const baseLabels = [
    { text: 'AI分析', path: '/ai' },
    { text: '共享管理', path: '/sharedManagement' },
    // 所有用户都能看到用户管理，但普通用户点击时会有提示
    { text: '用户管理', path: '/usermanage' },
  ]

  return baseLabels
})

//点击导航栏标签跳转到对应页面
const handleClick = (path) => {
  router.push(path)
}

// 判断当前项是否激活
const isActive = (path) => route.path === path
</script>

<template>
  <div class="header-container">
    <img src="@/assets/images/header.png" alt="" class="header-img" />
    <div class="container-svg">
      <div class="svg-group left">
        <div
          v-for="(item, index) in leftLabels"
          :key="index"
          class="svg-link"
          :class="{ active: isActive(item.path) }"
          @click="handleClick(item.path)"
        >
          <!-- svg图标 -->
          <svg
            class="svg-item"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 132.05 46.28"
            fill="none"
          >
            <g opacity="0.28">
              <path
                d="M25.3424 2.6241L113.674 2.6241L113.674 1.73026L112.672 2.00916L129.591 45.6641L130.593 45.3852L130.593 44.4914L19.8573 44.4914L19.8573 45.3852L20.8594 45.1064L5.71313 6.01138L5.05808 4.60996L4.0771 4.93913L4.0771 5.83297L22.9859 5.83297L26.182 2.27131L25.3424 1.73026L25.3424 2.6241ZM24.8202 0.836426L21.623 4.39808L22.4627 4.93913L22.4627 4.0453L2.52545 4.0453L3.74062 6.64481L4.72054 6.31564L3.71846 6.59444L19.0936 46.279L132.05 46.279L114.438 0.836426L25.3424 0.836426L24.8202 0.836426Z"
                :fill="isActive(item.path) ? '#00BFFF' : '#23FFF9'"
              />
            </g>
            <path
              d="M3.31177 1.23157L3.31177 6.05828L9.00781 6.05828L9.00781 1.23157L3.31177 1.23157ZM7.10913 4.44938L5.21045 4.44938L5.21045 2.84047L7.10913 2.84047L7.10913 4.44938Z"
              fill="#00FFF4"
            />
            <path
              d="M18.9518 5.80503C18.93 5.8322 18.9111 5.86117 18.8952 5.89194C18.8792 5.92271 18.8665 5.95467 18.857 5.98785C18.8475 6.02103 18.8414 6.05476 18.8385 6.08907C18.8363 6.12338 18.8374 6.1576 18.8417 6.19172C18.8461 6.22584 18.8541 6.25922 18.8657 6.29186C18.8766 6.32448 18.8912 6.35573 18.9093 6.38561C18.9268 6.41549 18.9471 6.44342 18.9704 6.4694C18.9943 6.49537 19.0205 6.5189 19.0488 6.53999C19.1055 6.58257 19.1687 6.61302 19.2385 6.63137C19.3083 6.6497 19.3791 6.65452 19.451 6.64581C19.5223 6.63711 19.5895 6.61556 19.6527 6.58114C19.7152 6.54673 19.7686 6.50209 19.8129 6.4472L22.5161 3.09843L71.3857 3.09843C71.4215 3.09843 71.457 3.09507 71.4921 3.08836C71.5272 3.08164 71.5612 3.07171 71.5943 3.05855C71.6273 3.04538 71.6587 3.02925 71.6885 3.01014C71.7183 2.99103 71.7458 2.96931 71.7711 2.945C71.7964 2.92068 71.819 2.89422 71.8389 2.86562C71.8587 2.83703 71.8755 2.80683 71.8892 2.77506C71.9029 2.74328 71.9132 2.71053 71.9202 2.67679C71.9272 2.64306 71.9307 2.609 71.9307 2.5746C71.9307 2.54021 71.9272 2.50614 71.9202 2.47241C71.9132 2.43867 71.9029 2.40592 71.8892 2.37415C71.8755 2.34237 71.8587 2.31218 71.8389 2.28358C71.819 2.25499 71.7964 2.22852 71.7711 2.2042C71.7458 2.17988 71.7183 2.15816 71.6885 2.13906C71.6587 2.11995 71.6273 2.10381 71.5943 2.09065C71.5612 2.07749 71.5272 2.06755 71.4921 2.06084C71.457 2.05413 71.4215 2.05078 71.3857 2.05078L21.982 2.05078L18.9518 5.80503Z"
              fill="#00E0DB"
            />
            <path
              d="M19.54 0.712709L18.7411 0.00012207L16.7987 2.01169L-0.000120163 2.01169L-0.000120163 3.05934L17.274 3.05934L19.54 0.712709Z"
              fill="#00E0DB"
            />
            <!-- 文本内容 样式和文字 -->
            <text
              x="50%"
              y="50%"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="22"
              :fill="isActive(item.path) ? '#00BFFF' : '#FFF'"
              font-weight="bold"
              font-family="Arial, sans-serif"
              style="cursor: pointer; pointer-events: auto"
            >
              {{ item.text }}
            </text>
          </svg>
        </div>
      </div>
      <!-- 右侧导航标签，和左侧同理 -->
      <div class="svg-group right">
        <div
          v-for="(item, index) in rightLabels"
          :key="index"
          class="svg-link"
          :class="{
            active: isActive(item.path),
            disabled: item.path === '/usermanage' && !isAdmin,
          }"
          @click="handleClick(item.path)"
        >
          <svg
            class="svg-item"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 132.05 46.28"
            fill="none"
          >
            <g opacity="0.28">
              <path
                d="M25.3424 2.6241L113.674 2.6241L113.674 1.73026L112.672 2.00916L129.591 45.6641L130.593 45.3852L130.593 44.4914L19.8573 44.4914L19.8573 45.3852L20.8594 45.1064L5.71313 6.01138L5.05808 4.60996L4.0771 4.93913L4.0771 5.83297L22.9859 5.83297L26.182 2.27131L25.3424 1.73026L25.3424 2.6241ZM24.8202 0.836426L21.623 4.39808L22.4627 4.93913L22.4627 4.0453L2.52545 4.0453L3.74062 6.64481L4.72054 6.31564L3.71846 6.59444L19.0936 46.279L132.05 46.279L114.438 0.836426L25.3424 0.836426L24.8202 0.836426Z"
                :fill="isActive(item.path) ? '#00BFFF' : '#23FFF9'"
              />
            </g>
            <path
              d="M3.31177 1.23157L3.31177 6.05828L9.00781 6.05828L9.00781 1.23157L3.31177 1.23157ZM7.10913 4.44938L5.21045 4.44938L5.21045 2.84047L7.10913 2.84047L7.10913 4.44938Z"
              fill="#00FFF4"
            />
            <path
              d="M18.9518 5.80503C18.93 5.8322 18.9111 5.86117 18.8952 5.89194C18.8792 5.92271 18.8665 5.95467 18.857 5.98785C18.8475 6.02103 18.8414 6.05476 18.8385 6.08907C18.8363 6.12338 18.8374 6.1576 18.8417 6.19172C18.8461 6.22584 18.8541 6.25922 18.8657 6.29186C18.8766 6.32448 18.8912 6.35573 18.9093 6.38561C18.9268 6.41549 18.9471 6.44342 18.9704 6.4694C18.9943 6.49537 19.0205 6.5189 19.0488 6.53999C19.1055 6.58257 19.1687 6.61302 19.2385 6.63137C19.3083 6.6497 19.3791 6.65452 19.451 6.64581C19.5223 6.63711 19.5895 6.61556 19.6527 6.58114C19.7152 6.54673 19.7686 6.50209 19.8129 6.4472L22.5161 3.09843L71.3857 3.09843C71.4215 3.09843 71.457 3.09507 71.4921 3.08836C71.5272 3.08164 71.5612 3.07171 71.5943 3.05855C71.6273 3.04538 71.6587 3.02925 71.6885 3.01014C71.7183 2.99103 71.7458 2.96931 71.7711 2.945C71.7964 2.92068 71.819 2.89422 71.8389 2.86562C71.8587 2.83703 71.8755 2.80683 71.8892 2.77506C71.9029 2.74328 71.9132 2.71053 71.9202 2.67679C71.9272 2.64306 71.9307 2.609 71.9307 2.5746C71.9307 2.54021 71.9272 2.50614 71.9202 2.47241C71.9132 2.43867 71.9029 2.40592 71.8892 2.37415C71.8755 2.34237 71.8587 2.31218 71.8389 2.28358C71.819 2.25499 71.7964 2.22852 71.7711 2.2042C71.7458 2.17988 71.7183 2.15816 71.6885 2.13906C71.6587 2.11995 71.6273 2.10381 71.5943 2.09065C71.5612 2.07749 71.5272 2.06755 71.4921 2.06084C71.457 2.05413 71.4215 2.05078 71.3857 2.05078L21.982 2.05078L18.9518 5.80503Z"
              fill="#00E0DB"
            />
            <path
              d="M19.54 0.712709L18.7411 0.00012207L16.7987 2.01169L-0.000120163 2.01169L-0.000120163 3.05934L17.274 3.05934L19.54 0.712709Z"
              fill="#00E0DB"
            />
            <text
              x="50%"
              y="50%"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="22"
              :fill="
                item.path === '/usermanage' && !isAdmin
                  ? '#999'
                  : isActive(item.path)
                    ? '#00BFFF'
                    : '#FFF'
              "
              font-weight="bold"
              font-family="Arial, sans-serif"
            >
              {{ item.text }}
            </text>
            <!-- 锁图标，仅对非管理员的用户管理显示 -->
            <g v-if="item.path === '/usermanage' && !isAdmin">
              <circle cx="105" cy="15" r="8" fill="rgba(0,0,0,0.5)" />
              <path
                d="M103 15h4v3h-4v-3zm1-2v-1a1 1 0 012 0v1"
                stroke="#999"
                stroke-width="1"
                fill="none"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 标题背景样式 */
.header {
  position: relative;
  width: 100%;
  height: auto;
}
.header-container {
  position: relative;
  width: 100%;
  height: auto;
}
.header-img {
  width: 100%;
  display: block;
  position: relative;
  z-index: 1;
  padding-top: 24px;
}
/* 整体容器 */
.container-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  pointer-events: none;
  padding: 0 min(8vw, 80px);
  box-sizing: border-box;
}

/* 8个svg导航组样式 */
.svg-group {
  display: flex;
  flex-direction: row;
  gap: min(2vw, 20px);
  justify-content: center;
  flex: none;
}

/* svg设置可以点击 */
.svg-link {
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  position: relative;
}
.svg-link.active {
  /* 激活项样式，可自定义 */
  transform: scale(1.08);
  filter: drop-shadow(0 0 8px #00bfff);
  z-index: 1;
}

/* 禁用状态样式 */
.svg-link.disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.svg-link.disabled:hover::after {
  content: '权限不足，只有管理员可以访问';
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.svg-link.disabled:hover {
  filter: none;
  transform: none;
}

/* svg图片的大小 */
.svg-item {
  width: 16vw;
  max-width: 120px;
  min-width: 70px;
  height: 45px;
}

.header-title {
  flex: none;
  font-size: 2.2vw;
  font-weight: bold;
  color: #fff;
  pointer-events: auto;
  white-space: nowrap;
}

.svg-group.left {
  flex: 1 1 0;
  justify-content: flex-end;
  align-items: center;
  margin-right: 15vw;
}

.svg-group.right {
  flex: 1 1 0;
  justify-content: flex-start;
  align-items: center;
  margin-left: 15vw;
}

@media (max-width: 900px) {
  .svg-item {
    width: 22vw;
    max-width: 90px;
    min-width: 50px;
    height: 36px;
  }
  .svg-group {
    gap: 1vw;
  }
  .container-svg {
    padding: 0 1vw;
  }
}
</style>
