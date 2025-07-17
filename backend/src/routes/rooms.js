import express from 'express';
import {
  createRoom,
  joinRoom,
  getRoomInfo,
  deleteRoom,
  cleanupExpiredRooms,
  checkRoomStatus,
  createRoomValidation,
  joinRoomValidation,
  roomIdValidation
} from '../controllers/roomController.js';

const router = express.Router();

// 创建房间
router.post('/', createRoomValidation, createRoom);

// 加入房间
router.post('/join', joinRoomValidation, joinRoom);

// 获取房间信息
router.get('/:roomId', roomIdValidation, getRoomInfo);

// 检查房间状态
router.get('/:roomId/status', roomIdValidation, checkRoomStatus);

// 删除房间
router.delete('/:roomId', roomIdValidation, deleteRoom);

// 清理过期房间 (管理员接口)
router.post('/cleanup', cleanupExpiredRooms);

export default router; 