// WebShareX 前端服务 - 连接后端API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Room {
  id: string
  code: string
  createdAt: Date
  expiresAt: Date
  maxSize: number
  currentSize: number
}

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadTime: Date
  downloadUrl?: string
  roomId: string
  isFolder: boolean
  fileCount?: number
}

class WebShareXService {
  // 创建房间
  static async createRoom(customId?: string, codeStrength: string = 'medium', expiryMinutes?: number): Promise<{ room: Room; code: string }> {
    try {
      // 构建请求体，只包含有值的字段
      const requestBody: any = { codeStrength }
      if (customId) {
        requestBody.customId = customId
      }
      if (expiryMinutes !== undefined) {
        requestBody.expiryMinutes = expiryMinutes
      }

      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return {
        room: {
          ...data.data.room,
          createdAt: new Date(data.data.room.createdAt),
          expiresAt: new Date(data.data.room.expiresAt)
        },
        code: data.data.code
      };
    } catch (error) {
      console.error('创建房间失败:', error);
      throw error;
    }
  }

  // 加入房间
  static async joinRoom(roomId: string, code: string): Promise<Room> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, code }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return {
        ...data.data.room,
        createdAt: new Date(data.data.room.createdAt),
        expiresAt: new Date(data.data.room.expiresAt)
      };
    } catch (error) {
      console.error('加入房间失败:', error);
      throw error;
    }
  }

  // 获取文件列表
  static async getFiles(roomId: string, code: string): Promise<FileItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${roomId}?code=${encodeURIComponent(code)}`);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data.files.map((file: any) => ({
        ...file,
        uploadTime: new Date(file.uploadTime)
      }));
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  // 上传文件
  static async uploadFile(roomId: string, code: string, file: File): Promise<FileItem> {
    try {
      const formData = new FormData();
      formData.append('file', file); // 使用'file'字段名匹配后端单文件上传
      formData.append('code', code);

      const response = await fetch(`${API_BASE_URL}/files/upload/${roomId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      const uploadedFile = data.data.files[0];
      return {
        ...uploadedFile,
        uploadTime: new Date(uploadedFile.uploadTime)
      };
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  // 上传文件夹（压缩为ZIP）
  static async uploadFolder(roomId: string, code: string, folderName: string, zipBlob: Blob): Promise<FileItem> {
    try {
      const formData = new FormData();
      
      // 创建ZIP文件对象，文件名保持原始文件夹名称
      const zipFile = new File([zipBlob], `${folderName}.zip`, { 
        type: 'application/zip',
        lastModified: Date.now()
      });
      
      formData.append('file', zipFile);
      formData.append('code', code);
      formData.append('isFolder', 'true');
      formData.append('originalName', folderName); // 保存原始文件夹名称

      const response = await fetch(`${API_BASE_URL}/files/upload/${roomId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      const uploadedFile = data.data.files[0];
      return {
        ...uploadedFile,
        uploadTime: new Date(uploadedFile.uploadTime),
        name: folderName, // 确保显示原始文件夹名称
        isFolder: true
      };
    } catch (error) {
      console.error('文件夹上传失败:', error);
      throw error;
    }
  }

  // 删除文件
  static async deleteFile(roomId: string, code: string, fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${roomId}/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  // 下载文件
  static async downloadFile(roomId: string, code: string, fileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/download/${roomId}/${fileId}?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '下载失败');
      }

      return await response.blob();
    } catch (error) {
      console.error('文件下载失败:', error);
      throw error;
    }
  }

  // 离开房间
  static leaveRoom(roomId: string): void {
    // 前端清理操作，如清除本地缓存等
    console.log(`离开房间: ${roomId}`);
  }

  // 删除房间
  static async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return true;
    } catch (error) {
      console.error('删除房间失败:', error);
      throw error;
    }
  }

  // 检查房间状态
  static async checkRoomStatus(roomId: string): Promise<{ active: boolean; expiresAt?: Date }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/status`);
      
      const data = await response.json();
      
      if (!data.success) {
        // 如果房间不存在或其他错误，视为不活跃
        return { active: false };
      }

      return {
        active: data.data.active,
        expiresAt: data.data.expiresAt ? new Date(data.data.expiresAt) : undefined
      };
    } catch (error) {
      console.error('检查房间状态失败:', error);
      // 网络错误等情况，视为房间不活跃
      return { active: false };
    }
  }

  // 验证房间ID
  static validateRoomId(roomId: string): { valid: boolean; error?: string } {
    if (!roomId) {
      return { valid: false, error: '房间ID不能为空' };
    }

    if (roomId.length < 3 || roomId.length > 50) {
      return { valid: false, error: '房间ID长度必须在3-50字符之间' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(roomId)) {
      return { valid: false, error: '房间ID只能包含字母、数字、下划线和连字符' };
    }

    return { valid: true };
  }

  // 验证匹配码
  static validateCode(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: '匹配码不能为空' };
    }

    if (code.length < 4) {
      return { valid: false, error: '匹配码长度不能少于4位' };
    }

    return { valid: true };
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取文件图标
  static getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      pdf: '📄', doc: '📄', docx: '📄', txt: '📄',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
      mp4: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬',
      mp3: '🎵', wav: '🎵', flac: '🎵',
      zip: '📦', rar: '📦', '7z': '📦',
      js: '💻', ts: '💻', html: '💻', css: '💻', json: '💻'
    };
    return iconMap[ext || ''] || '📄';
  }
}

export default WebShareXService
export { WebShareXService } 