import Database from '../config/database.js';
import { Room } from '../models/Room.js';
import { File } from '../models/File.js';

class AutoCleanupService {
  constructor() {
    this.intervalId = null;
    this.timeoutIds = new Map(); // 存储每个房间的倒计时器
    this.isRunning = false;
    this.checkInterval = 5 * 1000; // 每5秒检查一次新房间
  }

  // 启动自动清理服务
  start() {
    if (this.isRunning) {
      console.log('📄 自动清理服务已在运行中');
      return;
    }

    console.log('🚀 启动精确倒计时清理服务...');
    console.log(`⏰ 新房间检查间隔: ${this.checkInterval / 1000}秒`);
    
    this.isRunning = true;
    
    // 立即为现有房间设置倒计时
    this.setupExistingRoomTimers();
    
    // 定期检查新房间
    this.intervalId = setInterval(() => {
      this.checkForNewRooms();
    }, this.checkInterval);
  }

  // 停止自动清理服务
  stop() {
    if (!this.isRunning) {
      console.log('📄 自动清理服务未在运行');
      return;
    }

    console.log('🛑 停止精确倒计时清理服务...');
    
    // 清理检查间隔
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // 清理所有房间倒计时器
    this.timeoutIds.forEach((timeoutId, roomId) => {
      clearTimeout(timeoutId);
      console.log(`⏹️  取消房间 ${roomId} 的倒计时`);
    });
    this.timeoutIds.clear();
    
    this.isRunning = false;
  }

  // 为现有房间设置倒计时器
  async setupExistingRoomTimers() {
    try {
      const allActiveRooms = await Database.all(`
        SELECT id, expires_at FROM rooms WHERE is_active = 1
      `);

      const now = new Date();
      let setupCount = 0;

      for (const room of allActiveRooms) {
        const expiresAt = new Date(room.expires_at);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        if (timeUntilExpiry > 0) {
          this.scheduleRoomDeletion(room.id, timeUntilExpiry);
          setupCount++;
        } else {
          // 已过期的房间立即删除
          console.log(`⚡ 发现已过期房间: ${room.id}，立即删除`);
          await this.deleteRoom(room.id);
        }
      }

      if (setupCount > 0) {
        console.log(`⏲️  为 ${setupCount} 个房间设置了精确倒计时`);
      }

    } catch (error) {
      console.error('❌ 设置现有房间倒计时失败:', error.message);
    }
  }

  // 检查新房间
  async checkForNewRooms() {
    try {
      const allActiveRooms = await Database.all(`
        SELECT id, expires_at FROM rooms WHERE is_active = 1
      `);

      // 找出没有设置倒计时的新房间
      const newRooms = allActiveRooms.filter(room => !this.timeoutIds.has(room.id));

      if (newRooms.length > 0) {
        console.log(`🆕 发现 ${newRooms.length} 个新房间，设置倒计时...`);
        
        const now = new Date();
        for (const room of newRooms) {
          const expiresAt = new Date(room.expires_at);
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();

          if (timeUntilExpiry > 0) {
            this.scheduleRoomDeletion(room.id, timeUntilExpiry);
          } else {
            // 新房间但已过期，立即删除
            console.log(`⚡ 新房间已过期: ${room.id}，立即删除`);
            await this.deleteRoom(room.id);
          }
        }
      }

    } catch (error) {
      console.error('❌ 检查新房间失败:', error.message);
    }
  }

  // 为房间安排删除倒计时
  scheduleRoomDeletion(roomId, delayMs) {
    // 如果已有倒计时，先清除
    if (this.timeoutIds.has(roomId)) {
      clearTimeout(this.timeoutIds.get(roomId));
    }

    const minutes = Math.floor(delayMs / 1000 / 60);
    const seconds = Math.floor((delayMs / 1000) % 60);
    console.log(`⏰ 房间 ${roomId} 将在 ${minutes}分${seconds}秒 后自动删除`);

    // 设置精确倒计时
    const timeoutId = setTimeout(async () => {
      console.log(`⏱️  倒计时结束！删除房间: ${roomId}`);
      await this.deleteRoom(roomId);
      this.timeoutIds.delete(roomId);
    }, delayMs);

    this.timeoutIds.set(roomId, timeoutId);
  }

  // 删除房间和相关文件
  async deleteRoom(roomId) {
    try {
      console.log(`🗑️  开始删除房间: ${roomId}`);
      
      // 删除房间内的所有文件（包括房间文件夹）
      const deletedFilesCount = await File.deleteByRoomId(roomId);

      // 将房间标记为不活跃
      await Database.run(`UPDATE rooms SET is_active = 0 WHERE id = ?`, [roomId]);

      console.log(`✅ 房间 ${roomId} 删除完成，共删除 ${deletedFilesCount} 个文件和房间文件夹`);

    } catch (error) {
      console.error(`❌ 删除房间 ${roomId} 失败:`, error.message);
    }
  }

  // 获取服务状态
  getStatus() {
    const activeTimers = [];
    const now = new Date();
    
    for (const [roomId, timeoutId] of this.timeoutIds) {
      // 注意：这里无法精确获取剩余时间，因为setTimeout不提供这个功能
      // 实际应用中可以存储过期时间来计算剩余时间
      activeTimers.push(roomId);
    }

    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      activeTimers: activeTimers.length,
      roomsWithTimers: activeTimers
    };
  }

  // 手动删除房间的倒计时
  cancelRoomTimer(roomId) {
    if (this.timeoutIds.has(roomId)) {
      clearTimeout(this.timeoutIds.get(roomId));
      this.timeoutIds.delete(roomId);
      console.log(`⏹️  取消房间 ${roomId} 的自动删除倒计时`);
      return true;
    }
    return false;
  }

  // 手动触发房间删除
  async triggerRoomDeletion(roomId) {
    this.cancelRoomTimer(roomId);
    await this.deleteRoom(roomId);
  }

  // 获取房间剩余时间（需要查询数据库）
  async getRoomTimeLeft(roomId) {
    try {
      const room = await Database.get(`SELECT expires_at FROM rooms WHERE id = ? AND is_active = 1`, [roomId]);
      if (!room) return null;
      
      const now = new Date();
      const expiresAt = new Date(room.expires_at);
      const timeLeft = expiresAt.getTime() - now.getTime();
      
      return timeLeft > 0 ? timeLeft : 0;
    } catch (error) {
      console.error(`获取房间 ${roomId} 剩余时间失败:`, error.message);
      return null;
    }
  }
}

// 创建单例实例
const autoCleanupService = new AutoCleanupService();

export default autoCleanupService;