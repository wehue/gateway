import { ref } from 'vue'

export function useCaptcha() {
  // 图形验证码相关
  const captchaCode = ref('')
  const captchaImg = ref('')

  // 生成随机验证码
  const generateCaptcha = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 120
    canvas.height = 40

    // 生成随机验证码
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    captchaCode.value = code.toLowerCase()

    // 绘制背景
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制文字
    ctx.font = 'bold 24px Arial'
    for (let i = 0; i < code.length; i++) {
      ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`
      ctx.fillText(code[i], 20 + i * 25, 30)
    }

    // 绘制干扰线
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    captchaImg.value = canvas.toDataURL('image/png')
  }

  // 验证图形验证码
  const validateCaptcha = (value) => {
    return value.toLowerCase() === captchaCode.value
  }

  return {
    captchaCode,
    captchaImg,
    generateCaptcha,
    validateCaptcha,
  }
}
