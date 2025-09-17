<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCaptcha, login } from '@/api/login.js'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 当前选择的身份
const currentRole = ref('管理员')

// 真实验证码相关变量
const captchaImg = ref('')
const captchaKey = ref('')

// 获取图形验证码
const generateCaptcha = async () => {
  try {
    const result = await getCaptcha()
    console.log(result);

    // 兼容后端返回结构，正确赋值图片和key
    if (result.data && result.data.code === 200 && result.data.data) {
      captchaImg.value = result.data.data.image
      captchaKey.value = result.data.data.key
    } else {
      ElMessage.error(result.data?.message || result.message || '获取验证码失败')
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    ElMessage.error('获取验证码失败')
  }
}

// 真实验证码验证函数
const validateCaptcha = (inputCaptcha) => {
  return inputCaptcha === captchaCode.value
}

// 表单数据
const loginForm = ref({
  username: '', // 用户名/学号
  password: '', // 密码
  captchaCode: '', // 用户输入的验证码
  captchaKey: '', // 验证码key
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在4到20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在4到20个字符', trigger: 'blur' },
  ],
  captchaCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度应为4位', trigger: 'blur' },
  ],
}

// 表单ref
const loginFormRef = ref(null)

// 真实登录处理
const handleLogin = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      loginForm.value.captchaKey = captchaKey.value
      const params = {
        username: loginForm.value.username,
        password: loginForm.value.password,
        captchaKey: loginForm.value.captchaKey,
        captchaCode: loginForm.value.captchaCode,
      }
      const result = await login(params)
      // 兼容后端返回结构
      if (result.data && result.data.code === 200) {
        // 假设 data.data 是 token
        const token = result.data.data
        userStore.setToken(token)
        // 你可以根据需要设置用户信息
        // userStore.setUserInfo(loginForm.value.username, currentRole.value)
        router.push('/')
        ElMessage.success('登录成功')
      } else {
        ElMessage.error(result.data?.message || '登录失败')
        generateCaptcha()
        loginForm.value.captchaCode = ''
      }
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error('登录失败，请稍后再试')
      generateCaptcha()
      loginForm.value.captchaCode = ''
    }
  })
}
// 退出登录方法
const handleLogout = () => {
  localStorage.removeItem('userRole')
  router.push('/login')
}

// 监听身份切换并清空表单
watch(currentRole, () => {
  loginForm.value.username = ''
  loginForm.value.password = ''
  loginForm.value.captchaCode = ''
  loginFormRef.value?.resetFields()
  generateCaptcha()
})

// 组件挂载时获取验证码
onMounted(() => {
  generateCaptcha()
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

          <el-form-item label="验证码" prop="captchaCode">
            <div class="captcha-container">
              <el-input v-model="loginForm.captchaCode" placeholder="请输入验证码" />
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
