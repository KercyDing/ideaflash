import Room from '../models/Room.js';
import File from '../models/File.js';
import Database from '../config/database.js';
import { body, param, validationResult } from 'express-validator';

// 创建房间
export const createRoom = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    let { customId, codeStrength = 'medium', expiryMinutes = 1440 } = req.body;

    // 处理空字符串，转换为null
    if (customId === '' || customId === undefined) {
      customId = null;
    }

    // 检查自定义ID是否已存在
    if (customId) {
      const existingRoom = await Room.findById(customId);
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: '房间ID已存在'
        });
      }
    }

    const room = await Room.create(customId, codeStrength, expiryMinutes);

    res.status(201).json({
      success: true,
      message: '房间创建成功',
      data: {
        room: room.toJSON(),
        code: room.code
      }
    });

  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建房间失败'
    });
  }
};

// 加入房间
export const joinRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { roomId, code } = req.body;

    const room = await Room.validateAccess(roomId, code);

    res.json({
      success: true,
      message: '成功加入房间',
      data: {
        room: room.toJSON()
      }
    });

  } catch (error) {
    console.error('加入房间失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '加入房间失败'
    });
  }
};

// 获取房间信息
export const getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '需要提供匹配码'
      });
    }

    const room = await Room.validateAccess(roomId, code);

    res.json({
      success: true,
      data: {
        room: room.toJSON()
      }
    });

  } catch (error) {
    console.error('获取房间信息失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '获取房间信息失败'
    });
  }
};

// 删除房间
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.body;

    let room;
    
    // 如果提供了验证码，进行验证
    if (code) {
      room = await Room.validateAccess(roomId, code);
    } else {
      // 没有验证码时，直接查找房间（用于过期房间清理）
      room = await Room.findById(roomId);
      if (!room) {
        // 如果活跃房间不存在，检查是否是不活跃的房间
        const inactiveRoom = await Database.get(
          `SELECT * FROM rooms WHERE id = ? AND is_active = 0`,
          [roomId]
        );
        if (inactiveRoom) {
          room = new Room(inactiveRoom);
        } else {
          throw new Error('房间不存在');
        }
      }
    }

    // 删除房间内的所有文件
    const deletedFilesCount = await File.deleteByRoomId(roomId);

    // 完全删除房间记录
    await Database.run(`DELETE FROM rooms WHERE id = ?`, [roomId]);

    res.json({
      success: true,
      message: '房间删除成功',
      data: {
        deletedFilesCount
      }
    });

  } catch (error) {
    console.error('删除房间失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '删除房间失败'
    });
  }
};

// 清理过期房间
export const cleanupExpiredRooms = async (req, res) => {
  try {
    const deletedCount = await Room.cleanupExpired();

    res.json({
      success: true,
      message: '过期房间清理完成',
      data: {
        deletedCount
      }
    });

  } catch (error) {
    console.error('清理过期房间失败:', error);
    res.status(500).json({
      success: false,
      message: '清理过期房间失败'
    });
  }
};

// 检查房间状态
export const checkRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const now = new Date();

    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.json({
        success: true,
        data: {
          active: false,
          currentTime: now.toISOString()
        }
      });
    }

    // 检查房间是否过期
    const expiresAt = new Date(room.expires_at);
    const isActive = room.is_active && expiresAt > now;

    // 如果房间已过期，立即清理
    if (!isActive && room.is_active) {
      try {
        // 删除房间内的所有文件
        await File.deleteByRoomId(roomId);
        
        // 将房间标记为不活跃
        await room.markAsInactive();
        
        // 触发全局过期房间清理
        await Room.cleanupExpired();
      } catch (cleanupError) {
        console.error('立即清理过期房间失败:', cleanupError);
      }
    }

    res.json({
      success: true,
      data: {
        active: isActive,
        expiresAt: room.expires_at,
        currentTime: now.toISOString()
      }
    });

  } catch (error) {
    console.error('检查房间状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查房间状态失败'
    });
  }
};

// 验证规则
export const createRoomValidation = [
  body('customId')
    .custom((value) => {
      // 如果为空或undefined，则跳过验证
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果有值，则进行验证
      if (value.length < 3 || value.length > 50) {
        throw new Error('房间ID长度必须在3-50字符之间');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        throw new Error('房间ID只能包含字母、数字、下划线和连字符');
      }
      return true;
    }),
  body('codeStrength')
    .optional()
    .isIn(['simple', 'medium', 'strong'])
    .withMessage('匹配码强度必须是 simple、medium 或 strong'),
  body('expiryMinutes')
    .optional()
    .isInt({ min: 3, max: 1440 })
    .withMessage('有效期必须在3分钟到1天(1440分钟)之间')
];

export const joinRoomValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('房间ID不能为空'),
  body('code')
    .notEmpty()
    .withMessage('匹配码不能为空')
];

export const roomIdValidation = [
  param('roomId')
    .notEmpty()
    .withMessage('房间ID不能为空')
]; 