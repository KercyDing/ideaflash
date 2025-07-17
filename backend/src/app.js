import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 导入路由
import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/files.js';

// 导入初始化函数
import initDatabase from './config/initDatabase.js';
import autoCleanupService from './services/autoCleanupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ideaflash.cn', 
        'http://ideaflash.cn',
        'https://www.ideaflash.cn',
        'http://localhost:5173', 
        'http://localhost:4173'
      ]
    : true,
  credentials: true
}));

// 压缩中间件
app.use(compression());

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 设置字符编码
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api', limiter);

// 文件上传速率限制（更严格）
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 上传请求更少
  message: {
    success: false,
    message: '上传请求过于频繁，请稍后再试'
  }
});
app.use('/api/files/upload', uploadLimiter);

// 健康检查
app.get('/health', (req, res) => {
  const cleanupStatus = autoCleanupService.getStatus();
  res.json({
    success: true,
    message: 'WebShareX 后端服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    autoCleanup: cleanupStatus
  });
});

// API路由
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);

// 静态文件服务（用于下载）
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    console.log('正在初始化数据库...');
    await initDatabase();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 WebShareX 后端服务已启动`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 API文档: http://localhost:${PORT}/api`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    });

    // 启动自动清理服务
    autoCleanupService.start();

  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在优雅关闭...');
  autoCleanupService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信号，正在优雅关闭...');
  autoCleanupService.stop();
  process.exit(0);
});

// 启动服务器
startServer();

export default app; 