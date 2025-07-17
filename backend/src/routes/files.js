import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import {
  uploadFiles,
  uploadFolder,
  getFiles,
  downloadFile,
  deleteFile
} from '../controllers/fileController.js';

const router = express.Router();

// 上传文件（支持单个文件和ZIP文件夹）
router.post('/upload/:roomId', 
  upload.single('file'), 
  handleUploadError, 
  uploadFiles
);

// 上传多个文件
router.post('/upload-multiple/:roomId', 
  upload.array('files', 100), 
  handleUploadError, 
  uploadFiles
);

// 上传文件夹（保留兼容性）
router.post('/upload-folder/:roomId', 
  upload.array('files', 100), 
  handleUploadError, 
  uploadFolder
);

// 获取文件列表
router.get('/:roomId', getFiles);

// 下载文件
router.get('/download/:roomId/:fileId', downloadFile);

// 删除文件
router.delete('/:roomId/:fileId', deleteFile);

export default router; 