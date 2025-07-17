import Database from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Room {
  constructor(data) {
    this.id = data.id;
    this.code = data.code;
    this.created_at = data.created_at;
    this.expires_at = data.expires_at;
    this.max_size = data.max_size;
    this.current_size = data.current_size;
    this.is_active = data.is_active;
  }

  // 创建新房间
  static async create(customId = null, codeStrength = 'medium', expiryMinutes = 1440) {
    const roomId = customId || this.generateRoomId();
    const code = this.generateCode(codeStrength);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    try {
      // 检查是否存在不活跃的同名房间
      const existingRoom = await Database.get(
        `SELECT * FROM rooms WHERE id = ? AND is_active = 0`,
        [roomId]
      );

      if (existingRoom) {
        // 如果存在不活跃的同名房间，重新激活它
        await Database.run(
          `UPDATE rooms SET code = ?, created_at = ?, expires_at = ?, is_active = 1, current_size = 0 WHERE id = ?`,
          [code, now, expiresAt, roomId]
        );
      } else {
        // 创建新房间
        await Database.run(
          `INSERT INTO rooms (id, code, created_at, expires_at) VALUES (?, ?, ?, ?)`,
          [roomId, code, now, expiresAt]
        );
      }

      const createdRoom = await this.findById(roomId);
      return createdRoom;
    } catch (error) {
      if (error.message.includes('Duplicate entry') && error.message.includes('code')) {
        throw new Error('匹配码已存在，请重试');
      }
      throw error;
    }
  }

  // 根据ID查找房间
  static async findById(id) {
    const row = await Database.get(`SELECT * FROM rooms WHERE id = ? AND is_active = 1`, [id]);
    return row ? new Room(row) : null;
  }

  // 根据匹配码查找房间
  static async findByCode(code) {
    const row = await Database.get(`SELECT * FROM rooms WHERE code = ? AND is_active = 1`, [code]);
    return row ? new Room(row) : null;
  }

  // 验证房间和匹配码
  static async validateAccess(roomId, code) {
    const room = await this.findById(roomId);
    
    if (!room) {
      throw new Error('房间不存在');
    }

    if (room.code !== code) {
      throw new Error('匹配码错误');
    }

    if (new Date(room.expires_at) < new Date()) {
      throw new Error('房间已过期');
    }

    return room;
  }

  // 更新房间使用大小
  async updateSize(sizeChange) {
    const newSize = this.current_size + sizeChange;
    
    if (newSize > this.max_size) {
      throw new Error('存储空间不足');
    }

    await Database.run(
      `UPDATE rooms SET current_size = ? WHERE id = ?`,
      [newSize, this.id]
    );

    this.current_size = newSize;
  }

  // 删除房间
  async delete() {
    await Database.run(`UPDATE rooms SET is_active = 0 WHERE id = ?`, [this.id]);
  }

  // 将房间标记为不活跃
  async markAsInactive() {
    await Database.run(`UPDATE rooms SET is_active = 0 WHERE id = ?`, [this.id]);
    this.is_active = 0;
  }

  // 清理过期房间（保留此方法用于手动清理，但不建议自动调用）
  static async cleanupExpired() {
    console.warn('⚠️  手动调用清理方法，建议使用autoCleanupService');
    
    const allActiveRooms = await Database.all(
      `SELECT id, expires_at FROM rooms WHERE is_active = 1`
    );

    const now = new Date();
    const expiredRoomIds = allActiveRooms
      .filter(room => {
        const expiresAt = new Date(room.expires_at);
        return expiresAt < now;
      })
      .map(room => room.id);

    if (expiredRoomIds.length === 0) {
      return 0;
    }

    // 删除这些房间的所有文件
    const File = (await import('./File.js')).default;
    for (const roomId of expiredRoomIds) {
      await File.deleteByRoomId(roomId);
    }

    // 将房间标记为不活跃
    const placeholders = expiredRoomIds.map(() => '?').join(',');
    const result = await Database.run(
      `UPDATE rooms SET is_active = 0 WHERE id IN (${placeholders})`,
      expiredRoomIds
    );
    
    return result.affectedRows;
  }

  // 生成房间ID
  static generateRoomId() {
    // 生成15位完全随机的房间ID
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 生成匹配码
  static generateCode(strength) {
    switch (strength) {
      case 'simple':
        // 4位数字英文混搭
        const simpleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({length: 4}, () => simpleChars[Math.floor(Math.random() * simpleChars.length)]).join('');
      case 'medium':
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      case 'strong':
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      default:
        return this.generateCode('medium');
    }
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      createdAt: new Date(this.created_at),
      expiresAt: this.expires_at, // expires_at已经是ISO字符串，不需要再转换
      maxSize: this.max_size,
      currentSize: this.current_size
    };
  }
}

export default Room; 