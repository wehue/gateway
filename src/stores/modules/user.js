//引入defineStore方法
import { defineStore } from 'pinia'
import { ref } from 'vue'
//定义store
export const useUserStore = defineStore(
  'gateway', // store的唯一id
  () => {
    //定义状态token  登录 setToken  退出 reomveToken
    const token = ref('')
    // 添加用户名和角色信息
    const username = ref('管理员')
    const role = ref('管理员') // 管理员或超级管理员
    // 验证码相关
    const captcha = ref('')
    const captchaKey = ref('')

    //定义登录方法
    const setToken = (t) => {
      token.value = t // 设置 token
      localStorage.setItem('token', t) // 同步保存到本地存储
    }

    // 设置用户信息
    const setUserInfo = (name, userRole) => {
      username.value = name
      role.value = userRole
    }

    // 设置验证码信息
    const setCaptcha = (captchaImage, key) => {
      captcha.value = captchaImage
      captchaKey.value = key
    }

    //定义退出方法
    const reomveToken = () => {
      token.value = ''
      localStorage.removeItem('token') // 清除本地存储
      // 清空用户信息
      username.value = '管理员'
      role.value = '管理员'
      // 清空验证码
      captcha.value = ''
      captchaKey.value = ''
    }

    //暴露变量和方法
    return {
      token,
      username,
      role,
      captcha,
      captchaKey,
      setToken,
      setUserInfo,
      setCaptcha,
      reomveToken,
    }
  },
  {
    //开启持久化
    persist: true,
  },
)
