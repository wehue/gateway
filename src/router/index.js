import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/modules/user'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: () => import('../views/Layout/index.vue'),
    },
    {
      path: '/deviceManagement',
      name: 'deviceManagement',
      component: () => import('../views/DeviceManagement/index.vue'),
    },
    {
      path: '/resourceOverview',
      name: 'ResourceOverview',
      component: () => import('../views/ResourceOverview/index.vue'),
    },
    {
      path: '/trafficDetail',
      name: 'trafficDetail',
      component: () => import('../views/TrafficDetail/index.vue'),
    },
    {
      path: '/sharedManagement',
      name: 'sharedManagement',
      component: () => import('../views/SharedManagement/index.vue'),
    },
    {
      path: '/fileSelection',
      name: 'fileSelection',
      component: () => import('../views/FileSelection/index.vue'),
    },
    {
      path: '/analyzing',
      name: 'analyzing',
      component: () => import('../views/Analyzing/index.vue'),
    },
    {
      path: '/analyzeResults',
      name: 'analyzeResults',
      component: () => import('../views/AnalyzeResults/index.vue'),
    },
    {
      path: '/alarmHistory',
      name: 'AlarmHistory',
      component: () => import('../views/AlarmHistory/index.vue'),
    },
    {
      path: '/ai',
      name: 'ai',
      component: () => import('../views/AI/index.vue'),
    },
    {
      path: '/usermanage',
      name: 'usermanage',
      component: () => import('../views/UserManage/index.vue'),
      meta: {
        requiresAdmin: true, // 标记需要管理员权限
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login/index.vue'),
    },
  ],
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 获取用户store
  const userStore = useUserStore()

  // 检查是否已登录（通过token判断）
  const isLoggedIn = !!userStore.token

  // 如果用户未登录且访问的不是登录页
  if (!isLoggedIn && to.name !== 'login') {
    ElMessage.warning('请先登录，再进行操作')
    next({ name: 'login' })
    return
  }

  // 如果已登录且要访问登录页，重定向到首页
  if (isLoggedIn && to.name === 'login') {
    next({ path: '/' })
    return
  }

  // 检查路由是否需要管理员权限
  if (to.meta.requiresAdmin) {
    if (userStore.role !== '超级管理员') {
      ElMessage.error('权限不足，只有超级管理员可以访问用户管理')
      next('/') // 重定向到首页
      return
    }
  }

  next()
})

export default router
