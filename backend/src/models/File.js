import Database from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class File {
  constructor(data) {
    this.id = data.id;
    this.room_id = data.room_id;
    this.original_name = data.original_name;
    this.stored_name = data.stored_name;
    this.file_path = data.file_path;
    this.file_size = data.file_size;
    this.mime_type = data.mime_type;
    this.is_folder = data.is_folder;
    this.file_count = data.file_count;
    this.upload_time = data.upload_time;
  }

  // 创建新文件记录
  static async create(fileData) {
    const fileId = uuidv4();
    const storedName = `${fileId}_${fileData.originalName}`;
    
    await Database.run(
      `INSERT INTO files (id, room_id, original_name, stored_name, file_path, file_size, mime_type, is_folder, file_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileId,
        fileData.roomId,
        fileData.originalName,
        storedName,
        fileData.filePath,
        fileData.fileSize,
        fileData.mimeType || null,
        fileData.isFolder ? 1 : 0,
        fileData.fileCount || 0
      ]
    );

    return await this.findById(fileId);
  }

  // 根据ID查找文件
  static async findById(id) {
    const row = await Database.get(`SELECT * FROM files WHERE id = ?`, [id]);
    return row ? new File(row) : null;
  }

  // 获取房间内的所有文件
  static async findByRoomId(roomId) {
    const rows = await Database.all(
      `SELECT * FROM files WHERE room_id = ? ORDER BY upload_time DESC`,
      [roomId]
    );
    return rows.map(row => new File(row));
  }

  // 删除文件记录和实际文件
  async delete() {
    try {
      // 删除实际文件
      if (await fs.pathExists(this.file_path)) {
        await fs.remove(this.file_path);
      }

      // 删除数据库记录
      await Database.run(`DELETE FROM files WHERE id = ?`, [this.id]);
      
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  // 删除房间内的所有文件
  static async deleteByRoomId(roomId) {
    const files = await this.findByRoomId(roomId);
    
    for (const file of files) {
      await file.delete();
    }

    // 删除空的房间文件夹
    try {
      const roomDir = path.join(__dirname, '../../uploads/rooms', roomId);
      if (await fs.pathExists(roomDir)) {
        // 检查文件夹是否为空
        const items = await fs.readdir(roomDir);
        if (items.length === 0) {
          await fs.remove(roomDir);
          console.log(`🗂️  已删除空房间文件夹: ${roomId}`);
        } else {
          console.warn(`⚠️  房间文件夹 ${roomId} 不为空，跳过删除`);
        }
      }
    } catch (error) {
      console.error(`删除房间文件夹 ${roomId} 失败:`, error);
    }

    return files.length;
  }

  // 清理空的房间文件夹（工具函数）
  static async cleanupEmptyRoomFolder(roomId) {
    try {
      const roomDir = path.join(__dirname, '../../uploads/rooms', roomId);
      if (await fs.pathExists(roomDir)) {
        const items = await fs.readdir(roomDir);
        if (items.length === 0) {
          await fs.remove(roomDir);
          console.log(`🧹 清理空房间文件夹: ${roomId}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`清理房间文件夹 ${roomId} 失败:`, error);
      return false;
    }
  }

  // 计算房间内文件总大小
  static async getTotalSizeByRoomId(roomId) {
    const result = await Database.get(
      `SELECT SUM(file_size) as total_size FROM files WHERE room_id = ?`,
      [roomId]
    );
    return result?.total_size || 0;
  }

  // 生成下载URL
  getDownloadUrl(baseUrl = '') {
    return `${baseUrl}/api/files/download/${this.room_id}/${this.id}`;
  }

  // 获取文件的完整路径
  getFullPath() {
    return this.file_path;
  }

  // 检查文件是否存在
  async exists() {
    return await fs.pathExists(this.file_path);
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      name: this.original_name,
      size: this.file_size,
      type: this.mime_type,
      uploadTime: new Date(this.upload_time),
      downloadUrl: this.getDownloadUrl(),
      roomId: this.room_id,
      isFolder: Boolean(this.is_folder),
      fileCount: this.file_count
    };
  }

  // 生成存储路径
  static generateStoragePath(roomId, fileName) {
    const uploadsDir = path.join(__dirname, '../../uploads/rooms', roomId);
    return path.join(uploadsDir, fileName);
  }

  // 确保房间目录存在
  static async ensureRoomDirectory(roomId) {
    const roomDir = path.join(__dirname, '../../uploads/rooms', roomId);
    await fs.ensureDir(roomDir);
    return roomDir;
  }
}

export default File;