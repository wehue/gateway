<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
// import { getCaptcha, login } from '@/api/login.js'！！！！！！！！！！！！！！！！！
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'
import { useCaptcha } from './components/useCaptcha.js'

const router = useRouter()
const userStore = useUserStore()

// 当前选择的身份
const currentRole = ref('管理员')

// 导入验证码功能（待删除）
const { captchaImg, captchaCode, generateCaptcha, validateCaptcha } = useCaptcha()

// ==================== 真实接口验证码处理 ====================
// 如果需要使用真实接口，请取消注释下面的代码，并注释掉上面的 useCaptcha 导入

// 真实验证码相关变量
// const captchaImg = ref('')
// const captchaCode = ref('')

// 真实验证码获取函数
// const generateCaptcha = async () => {
//   try {
//     const result = await getCaptcha()
//
//     if (result.success) {
//       captchaImg.value = result.data.image
//       captchaCode.value = result.data.id
//     } else {
//       ElMessage.error(result.message)
//     }
//   } catch (error) {
//     console.error('获取验证码失败:', error)
//     ElMessage.error('获取验证码失败')
//   }
// }

// 真实验证码验证函数
// const validateCaptcha = (inputCaptcha) => {
//   return inputCaptcha === captchaCode.value
// }

// 表单数据
const loginForm = ref({
  username: '', // 用户名/学号
  password: '', // 密码
  captcha: '', // 图形验证码
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在4到20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度应为4位', trigger: 'blur' },
  ],
}

// 表单ref
const loginFormRef = ref(null)

// ==================== 当前使用的登录处理（假接口）待删除 ====================
// 登录处理
const handleLogin = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (!valid) return

    // 验证码校验
    // if (!validateCaptcha(loginForm.captcha)) {
    //   ElMessage.error('验证码不正确')
    //   generateCaptcha()
    //   loginForm.captcha = ''
    //   return
    // }

    try {
      // 直接模拟登录成功，不调用API
      userStore.setToken('mock-token-' + Date.now())
      userStore.setUserInfo(loginForm.username || '测试用户', currentRole.value)

      // 登录成功后跳转到首页
      router.push('/')
      ElMessage.success('登录成功')
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error('登录失败，请检查账号、密码')
      generateCaptcha()
      loginForm.captcha = ''
    }
  })
}

// ==================== 真实接口登录处理 ====================
// 真实登录处理
// const handleLogin = () => {
//   loginFormRef.value?.validate(async (valid) => {
//     if (!valid) return
//
//     try {
//       // 调用真实登录接口
//       const result = await login(loginForm)
//
//       if (result.success) {
//         // 登录成功处理
//         const { token, userInfo } = result.data
//
//         // 保存token和用户信息
//         userStore.setToken(token)
//         userStore.setUserInfo(userInfo.username || userInfo.name, userInfo.role || currentRole.value)
//
//         // 登录成功后跳转到首页
//         router.push('/')
//         ElMessage.success('登录成功')
//       } else {
//         // 登录失败处理
//         ElMessage.error(result.message)
//         generateCaptcha()
//         loginForm.captcha = ''
//       }
//     } catch (error) {
//       console.error('登录失败:', error)
//       ElMessage.error('登录失败，请稍后再试')
//       generateCaptcha()
//       loginForm.captcha = ''
//     }
//   })
// }

// 退出登录方法
const handleLogout = () => {
  localStorage.removeItem('userRole')
  router.push('/login')
}

// 监听身份切换并清空表单
watch(currentRole, () => {
  // 重置表单数据
  loginForm.username = ''
  loginForm.password = ''
  loginForm.captcha = ''

  // 重置表单校验状态
  loginFormRef.value?.resetFields()

  // 重新获取验证码
  generateCaptcha()
})

// 组件挂载时获取验证码，并检查是否需要显示登录提示
onMounted(() => {
  generateCaptcha()

  // 检查路由参数，如果有showLoginMessage参数，显示登录提示
  if (router.currentRoute.value.params.showLoginMessage) {
    ElMessage.warning('请先登录')
  }
})
</script>

<template>
  <bg-image2>
    <div class="login-container">
      <div class="login-box">
        <h2>智慧网关监测系统</h2>

        <!-- 身份选择 -->
        <div class="role-select">
          <el-radio-group v-model="currentRole" size="large">
            <el-radio-button value="管理员">管理员</el-radio-button>
            <el-radio-button value="超级管理员">超级管理员</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-width="65px"
          class="login-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-container">
              <el-input v-model="loginForm.captcha" placeholder="请输入验证码" />
              <img
                :src="captchaImg"
                class="captcha-img"
                @click="generateCaptcha"
                alt="点击刷新验证码"
              />
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </bg-image2>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 450px;
  padding: 35px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-box h2 {
  text-align: center;
  margin-bottom: 15px;
  color: #0d5eb0;
  font-size: 35px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.role-select {
  text-align: center;
  margin-bottom: 25px;
}

.login-form {
  margin-top: 15px;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  letter-spacing: 2px;
  background: linear-gradient(to right, #0d5eb0, #2b8bda);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: linear-gradient(to right, #0d5eb0, #0d5eb0);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(13, 94, 176, 0.3);
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-img {
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.captcha-img:hover {
  transform: scale(1.05);
}

:deep(.el-input) {
  flex: 1;
}

:deep(.el-input__inner) {
  height: 45px;
  border-radius: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-radio-button__inner) {
  background-color: #f5f7fa;
  color: #666;
  border-color: #dcdfe6;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #0d5eb0;
  border-color: #0d5eb0;
  box-shadow: -1px 0 0 0 #0d5eb0;
}
</style>
