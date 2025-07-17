import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置存储引擎
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const roomId = req.params.roomId || req.body.roomId;
      if (!roomId) {
        return cb(new Error('房间ID是必需的'), null);
      }

      // 确保房间目录存在
      const roomDir = path.join(__dirname, '../../uploads/rooms', roomId);
      await fs.ensureDir(roomDir);
      
      cb(null, roomDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // 处理中文文件名编码问题
    let originalName = file.originalname;
    try {
      // 尝试正确解码中文文件名
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {
      // 如果解码失败，使用原始文件名
      originalName = file.originalname;
    }
    
    // 生成唯一文件名，保留原始扩展名
    const uniqueId = uuidv4();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${uniqueId}_${baseName}${ext}`;
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型（可根据需要调整）
  const allowedTypes = [
    'image/',
    'video/',
    'audio/',
    'text/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'application/javascript',
    'application/octet-stream'
  ];

  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// 创建multer实例
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 单文件限制
    files: 100, // 最多100个文件
    fieldSize: 1024 * 1024, // 1MB 字段大小限制
  }
});

// 错误处理中间件
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: '文件大小超过限制（最大50MB）'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: '文件数量超过限制（最多100个）'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `上传错误: ${error.message}`
        });
    }
  }

  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// 临时文件清理中间件
export const cleanupTempFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // 清理临时文件
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('清理临时文件失败:', err);
          });
        }
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

export default { upload, handleUploadError, cleanupTempFiles }; 