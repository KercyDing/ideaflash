import File from '../models/File.js';
import Room from '../models/Room.js';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 上传文件
export const uploadFiles = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code, isFolder, originalName } = req.body;

    // 验证房间和匹配码
    const room = await Room.validateAccess(roomId, code);

    // 处理单个文件或多个文件
    let files = [];
    if (req.file) {
      // 单个文件上传
      files = [req.file];
    } else if (req.files && req.files.length > 0) {
      // 多个文件上传
      files = req.files;
    } else {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }

    // 计算总文件大小
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // 检查存储空间
    if (room.current_size + totalSize > room.max_size) {
      // 清理已上传的文件
      for (const file of files) {
        await fs.remove(file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: '存储空间不足'
      });
    }

    const uploadedFiles = [];

    // 处理每个文件
    for (const file of files) {
      try {
        // 处理中文文件名编码
        let displayName = file.originalname;
        if (originalName) {
          // 如果是文件夹，使用原始文件夹名称
          displayName = originalName;
        } else {
          // 确保中文文件名正确显示
          try {
            // 尝试正确解码文件名
            displayName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          } catch (e) {
            // 如果解码失败，使用原始文件名
            displayName = file.originalname;
          }
        }

        const fileData = {
          roomId: roomId,
          originalName: displayName,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          isFolder: isFolder === 'true',
          fileCount: isFolder === 'true' ? 1 : 0  // ZIP文件夹计为1个文件
        };

        const savedFile = await File.create(fileData);
        const fileJson = savedFile.toJSON();
        
        // 确保返回正确的显示名称
        fileJson.name = displayName;
        uploadedFiles.push(fileJson);

      } catch (error) {
        console.error('保存文件失败:', error);
        // 清理失败的文件
        await fs.remove(file.path);
      }
    }

    // 更新房间使用大小
    await room.updateSize(totalSize);

    res.status(201).json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个${isFolder === 'true' ? '文件夹' : '文件'}`,
      data: {
        files: uploadedFiles,
        roomSize: room.current_size + totalSize
      }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    
    // 清理已上传的文件
    const filesToClean = req.file ? [req.file] : (req.files || []);
    for (const file of filesToClean) {
      await fs.remove(file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: error.message || '文件上传失败'
    });
  }
};

// 上传文件夹
export const uploadFolder = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code, folderName } = req.body;

    // 验证房间和匹配码
    const room = await Room.validateAccess(roomId, code);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }

    // 计算总文件大小
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // 检查存储空间
    if (room.current_size + totalSize > room.max_size) {
      // 清理已上传的文件
      for (const file of req.files) {
        await fs.remove(file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: '存储空间不足'
      });
    }

    // 创建文件夹目录
    const folderPath = path.join(__dirname, '../../uploads/rooms', roomId, folderName);
    await fs.ensureDir(folderPath);

    // 移动文件到文件夹目录
    for (const file of req.files) {
      const newPath = path.join(folderPath, file.originalname);
      await fs.move(file.path, newPath);
      file.path = newPath;
    }

    // 创建文件夹记录
    const folderData = {
      roomId: roomId,
      originalName: folderName,
      filePath: folderPath,
      fileSize: totalSize,
      mimeType: 'folder',
      isFolder: true,
      fileCount: req.files.length
    };

    const savedFolder = await File.create(folderData);

    // 更新房间使用大小
    await room.updateSize(totalSize);

    res.status(201).json({
      success: true,
      message: '文件夹上传成功',
      data: {
        folder: savedFolder.toJSON(),
        roomSize: room.current_size + totalSize
      }
    });

  } catch (error) {
    console.error('文件夹上传失败:', error);
    
    // 清理已上传的文件
    if (req.files) {
      for (const file of req.files) {
        await fs.remove(file.path).catch(() => {});
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || '文件夹上传失败'
    });
  }
};

// 获取文件列表
export const getFiles = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.query;

    // 验证房间和匹配码
    await Room.validateAccess(roomId, code);

    const files = await File.findByRoomId(roomId);

    res.json({
      success: true,
      data: {
        files: files.map(file => file.toJSON())
      }
    });

  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '获取文件列表失败'
    });
  }
};

// 下载文件
export const downloadFile = async (req, res) => {
  try {
    const { roomId, fileId } = req.params;
    const { code } = req.query;

    // 验证房间和匹配码
    await Room.validateAccess(roomId, code);

    const file = await File.findById(fileId);

    if (!file || file.room_id !== roomId) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查文件是否存在
    if (!(await file.exists())) {
      return res.status(404).json({
        success: false,
        message: '文件已被删除或移动'
      });
    }

    if (file.is_folder) {
      // 文件夹下载 - 直接返回已压缩的ZIP文件
      const zipName = `${file.original_name}.zip`;
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}"`
      });

      // 直接流式传输ZIP文件
      const fileStream = fs.createReadStream(file.file_path);
      fileStream.pipe(res);

    } else {
      // 单文件下载
      const mimeType = mime.lookup(file.original_name) || 'application/octet-stream';
      
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.original_name)}"`
      });

      const fileStream = fs.createReadStream(file.file_path);
      fileStream.pipe(res);
    }

  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '文件下载失败'
    });
  }
};

// 删除文件
export const deleteFile = async (req, res) => {
  try {
    const { roomId, fileId } = req.params;
    const { code } = req.body;

    // 验证房间和匹配码
    const room = await Room.validateAccess(roomId, code);

    const file = await File.findById(fileId);

    if (!file || file.room_id !== roomId) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 删除文件
    const deleted = await file.delete();

    if (deleted) {
      // 更新房间使用大小
      await room.updateSize(-file.file_size);

      // 检查是否需要清理空的房间文件夹
      const remainingFiles = await File.findByRoomId(roomId);
      if (remainingFiles.length === 0) {
        await File.cleanupEmptyRoomFolder(roomId);
      }

      res.json({
        success: true,
        message: '文件删除成功',
        data: {
          fileId: fileId,
          roomSize: room.current_size - file.file_size
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件删除失败'
      });
    }

  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除文件失败'
    });
  }
}; 