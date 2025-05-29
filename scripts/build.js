import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

console.log('build.js is running')
const args = process.argv.slice(2)
console.log('传入参数:', args)

const envMap = {
  a: {
    VITE_API_URL: 'https://api.xxx.com',
    VITE_APP_TITLE: '生产222'
  },
  b: {
    VITE_API_URL: 'https://api.test.com',
    VITE_APP_TITLE: '测试123'
  }
}

// 兼容 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 读取环境名
const envKey = args[0]
const envVars = envMap[envKey]

if (!envVars) {
  console.error(`未找到环境变量配置: ${envKey}`)
  process.exit(1)
}

// 生成 .env 文件内容
let envContent = ''
Object.entries(envVars).forEach(([key, value]) => {
  envContent += `${key}=${value}\n`
})

// 写入 .env 文件
const envPath = path.resolve(__dirname, '../.env.temp')
fs.writeFileSync(envPath, envContent)
console.log('.env 文件已生成:', envContent)

// 判断操作系统，选择命令
const isWin = process.platform === 'win32'
const npxCmd = isWin ? 'npx.cmd' : 'npx'

// 调用 vite 打包，指定 mode 为 temp
const vite = spawn(npxCmd, ['vite', 'build', '--mode', 'temp'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit' // 关键：继承主进程的 stdio，实时输出
})

vite.on('close', (code) => {
  if (code !== 0) {
    console.error(`打包进程退出，错误码: ${code}`)
    process.exit(code)
  }
  // 打包成功后的业务逻辑
  try {
    fs.unlinkSync(envPath) // 删除临时环境文件
    console.log('.env.temp 文件已删除')
  } catch (err) {
    console.warn('.env.temp 删除失败:', err.message)
  }
})
