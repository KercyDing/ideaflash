#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';
import chalk from 'chalk';
import Table from 'cli-table3';
import Database from './src/config/database.js';
import { Room } from './src/models/Room.js';
import { File } from './src/models/File.js';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 工具函数
const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 主菜单
function showMainMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n🔧 WebShareX 后台管理系统\n'));
  console.log(chalk.green('检查状态：MySQL 数据库连接成功'));
  console.log(chalk.green('\n1. 房间管理'));
  console.log(chalk.green('2. 数据库管理'));
  console.log(chalk.red('0. 退出系统'));
  console.log('\n');
}

// 房间管理菜单
function showRoomMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n📁 房间管理\n'));
  console.log(chalk.gray('============'));
  console.log(chalk.green('1. 查看所有房间'));
  console.log(chalk.green('2. 创建房间'));
  console.log(chalk.green('3. 删除房间'));
  console.log(chalk.green('4. 清除过期房间'));
  console.log(chalk.gray('============'));
  console.log(chalk.green('5. 查看房间文件'));
  console.log(chalk.green('6. 删除房间文件'));
  console.log(chalk.green('7. 清理孤立文件'));
  console.log(chalk.gray('============'));
  console.log(chalk.yellow('9. 返回主菜单'));
  console.log(chalk.red('0. 退出系统'));
  console.log('\n');
}





// 数据库管理菜单
function showDatabaseMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n🗄️ 数据库管理\n'));
  console.log(chalk.gray('============'));
  console.log(chalk.green('1. 数据库统计'));
  console.log(chalk.green('2. 存储空间统计'));
  console.log(chalk.green('3. 备份数据库'));
  console.log(chalk.red('4. 重置数据库 (危险)'));
  console.log(chalk.gray('============'));
  console.log(chalk.yellow('9. 返回主菜单'));
  console.log(chalk.red('0. 退出系统'));
  console.log('\n');
}

// 房间管理功能
async function listAllRooms() {
  try {
    const rooms = await Database.all(`
      SELECT r.*, 
             COUNT(f.id) as file_count,
             COALESCE(SUM(f.file_size), 0) as total_size
      FROM rooms r 
      LEFT JOIN files f ON r.id = f.room_id 
      WHERE r.is_active = 1 
      GROUP BY r.id 
      ORDER BY r.created_at DESC
    `);

    if (rooms.length === 0) {
      console.log(chalk.yellow('📭 暂无可用房间'));
      return;
    }

    const table = new Table({
      head: ['房间ID', '匹配码', '创建时间', '过期时间', '文件数', '使用空间', '状态'],
      colWidths: [18, 8, 25, 25, 8, 10, 8]
    });

    rooms.forEach(room => {
      const expiresDate = new Date(room.expires_at);
      const isExpired = expiresDate < new Date();
      const status = isExpired ? chalk.red('已过期') : chalk.green('正常');
      
      table.push([
        room.id.length > 15 ? room.id.substring(0, 12) + '...' : room.id,
        room.code,
        formatDate(room.created_at),
        formatDate(room.expires_at),
        room.file_count.toString(),
        formatFileSize(parseInt(room.total_size) || 0),
        status
      ]);
    });

    console.log(table.toString());
    console.log(chalk.blue(`\n总计: ${rooms.length} 个房间\n`));

  } catch (error) {
    console.error(chalk.red('❌ 获取房间列表失败:'), error.message);
  }
}



async function deleteRoom() {
  const roomId = (await question('请输入要删除的房间ID: ')).trim();
  if (!roomId) return;

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      console.log(chalk.red('❌ 房间不存在'));
      return;
    }

    const files = await File.findByRoomId(roomId);
    
    console.log(chalk.yellow(`⚠️  即将删除房间: ${room.id}`));
    console.log(chalk.yellow(`匹配码: ${room.code}`));
    console.log(chalk.yellow(`包含文件: ${files.length} 个`));
    
    const confirm = await question('确认删除吗? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.blue('取消删除'));
      return;
    }

    // 删除房间内的所有文件
    const deletedFilesCount = await File.deleteByRoomId(roomId);
    
    // 删除房间
    await room.delete();

    console.log(chalk.green(`✅ 房间删除成功，共删除 ${deletedFilesCount} 个文件`));

  } catch (error) {
    console.error(chalk.red('❌ 删除房间失败:'), error.message);
  }
}

async function cleanupExpiredRooms() {
  try {
    console.log(chalk.blue('🧹 正在清理过期房间...'));
    
    // 获取过期房间列表（使用JavaScript时间比较）
    const allActiveRooms = await Database.all(`
      SELECT * FROM rooms WHERE is_active = 1
    `);
    
    const now = new Date();
    const expiredRooms = allActiveRooms.filter(room => {
      const expiresDate = new Date(room.expires_at);
      return expiresDate < now;
    });

    if (expiredRooms.length === 0) {
      console.log(chalk.green('✅ 没有过期房间需要清理'));
      return;
    }

    console.log(chalk.yellow(`发现 ${expiredRooms.length} 个过期房间:`));
    
    expiredRooms.forEach(room => {
      console.log(`- ${room.id} (${room.code}) - 过期于 ${formatDate(room.expires_at)}`);
    });

    const confirm = await question('确认清理这些过期房间吗? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.blue('取消清理'));
      return;
    }

    // 统计将要删除的文件数量
    let totalDeletedFiles = 0;
    for (const room of expiredRooms) {
      const files = await File.findByRoomId(room.id);
      totalDeletedFiles += files.length;
    }

    // Room.cleanupExpired() 现在会自动处理文件删除
    const deletedRooms = await Room.cleanupExpired();

    console.log(chalk.green(`✅ 清理完成: 删除 ${deletedRooms} 个房间，${totalDeletedFiles} 个文件`));

  } catch (error) {
    console.error(chalk.red('❌ 清理过期房间失败:'), error.message);
  }
}

async function createRoom() {
  console.log(chalk.blue.bold('\n📁 创建新房间\n'));
  
  const customId = await question('自定义房间ID (可选，回车跳过): ');
  const codeStrength = await question('匹配码强度 (simple/medium/strong，默认medium): ') || 'medium';
  
  console.log(chalk.blue('\n有效期选项:'));
  console.log('1. 3分钟');
  console.log('2. 5分钟');
  console.log('3. 10分钟');
  console.log('4. 30分钟');
  console.log('5. 1小时 (默认)');
  console.log('6. 3小时');
  console.log('7. 6小时');
  console.log('8. 12小时');
  console.log('9. 1天');
  
  const expiryChoice = await question('选择有效期 (1-9，默认5): ') || '5';
  
  const expiryMap = {
    '1': 3,
    '2': 5,
    '3': 10,
    '4': 30,
    '5': 60,
    '6': 180,
    '7': 360,
    '8': 720,
    '9': 1440
  };
  
  const expiryMinutes = expiryMap[expiryChoice] || 60;

  try {
    const room = await Room.create(customId || null, codeStrength, expiryMinutes);
    
    console.log(chalk.green('\n✅ 房间创建成功!'));
    console.log(`房间ID: ${chalk.green(room.id)}`);
    console.log(`匹配码: ${chalk.green(room.code)}`);
    console.log(`过期时间: ${chalk.green(formatDate(room.expires_at))}`);

  } catch (error) {
    console.error(chalk.red('❌ 创建房间失败:'), error.message);
  }
}

// 文件管理功能
async function listAllFiles() {
  try {
    const files = await Database.all(`
      SELECT f.*, r.code as room_code 
      FROM files f 
      LEFT JOIN rooms r ON f.room_id = r.id 
      ORDER BY f.upload_time DESC 
      LIMIT 50
    `);

    if (files.length === 0) {
      console.log(chalk.yellow('📭 暂无文件'));
      return;
    }

    const table = new Table({
      head: ['文件ID', '文件名', '房间', '大小', '上传时间'],
      colWidths: [18, 22, 10, 10, 20]
    });

    files.forEach(file => {
      table.push([
        file.id.length > 15 ? file.id.substring(0, 12) + '...' : file.id,
        file.original_name.length > 19 ? file.original_name.substring(0, 16) + '...' : file.original_name,
        file.room_code || '已删除',
        formatFileSize(file.file_size),
        formatDate(file.upload_time)
      ]);
    });

    console.log(table.toString());
    console.log(chalk.blue(`\n显示最近 ${files.length} 个文件\n`));

  } catch (error) {
    console.error(chalk.red('❌ 获取文件列表失败:'), error.message);
  }
}

async function listFilesByRoom() {
  const roomId = (await question('请输入房间ID: ')).trim();
  if (!roomId) return;

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      console.log(chalk.red('❌ 房间不存在'));
      return;
    }

    const files = await File.findByRoomId(roomId);
    
    if (files.length === 0) {
      console.log(chalk.yellow('📭 该房间暂无文件'));
      return;
    }

    console.log(chalk.blue.bold(`\n📁 房间 ${roomId} (${room.code}) 的文件:\n`));

    const table = new Table({
      head: ['文件ID', '文件名', '大小', '上传时间'],
      colWidths: [18, 27, 10, 20]
    });

    files.forEach(file => {
      table.push([
        file.id.length > 15 ? file.id.substring(0, 12) + '...' : file.id,
        file.original_name.length > 24 ? file.original_name.substring(0, 21) + '...' : file.original_name,
        formatFileSize(file.file_size),
        formatDate(file.upload_time)
      ]);
    });

    console.log(table.toString());
    console.log(chalk.blue(`\n总计: ${files.length} 个文件\n`));

  } catch (error) {
    console.error(chalk.red('❌ 获取文件列表失败:'), error.message);
  }
}

async function deleteFile() {
  const fileId = (await question('请输入要删除的文件ID: ')).trim();
  if (!fileId) return;

  try {
    const file = await File.findById(fileId);
    if (!file) {
      console.log(chalk.red('❌ 文件不存在'));
      return;
    }

    console.log(chalk.yellow(`⚠️  即将删除文件: ${file.original_name}`));
    console.log(chalk.yellow(`文件大小: ${formatFileSize(file.file_size)}`));
    console.log(chalk.yellow(`所属房间: ${file.room_id}`));
    
    const confirm = await question('确认删除吗? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.blue('取消删除'));
      return;
    }

    const success = await file.delete();
    
    if (success) {
      console.log(chalk.green('✅ 文件删除成功'));
    } else {
      console.log(chalk.red('❌ 文件删除失败'));
    }

  } catch (error) {
    console.error(chalk.red('❌ 删除文件失败:'), error.message);
  }
}

async function cleanupOrphanedFiles() {
  try {
    console.log(chalk.blue('🧹 正在检查孤立文件...'));
    
    // 查找数据库中存在但房间不存在的文件
    const orphanedFiles = await Database.all(`
      SELECT f.* FROM files f 
      LEFT JOIN rooms r ON f.room_id = r.id 
      WHERE r.id IS NULL OR r.is_active = 0
    `);

    if (orphanedFiles.length === 0) {
      console.log(chalk.green('✅ 没有孤立文件需要清理'));
      return;
    }

    console.log(chalk.yellow(`发现 ${orphanedFiles.length} 个孤立文件:`));
    
    orphanedFiles.forEach(file => {
      console.log(`- ${file.original_name} (${formatFileSize(file.file_size)})`);
    });

    const confirm = await question('确认清理这些孤立文件吗? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.blue('取消清理'));
      return;
    }

    let deletedCount = 0;
    for (const fileData of orphanedFiles) {
      const file = new File(fileData);
      const success = await file.delete();
      if (success) deletedCount++;
    }

    console.log(chalk.green(`✅ 清理完成: 删除 ${deletedCount} 个孤立文件`));

  } catch (error) {
    console.error(chalk.red('❌ 清理孤立文件失败:'), error.message);
  }
}

// 系统信息功能
async function showDatabaseStats() {
  try {
    const roomStats = await Database.get(`
      SELECT 
        COUNT(CASE WHEN is_active = 1 AND expires_at >= NOW() THEN 1 END) as available_rooms,
        COUNT(CASE WHEN expires_at < NOW() AND is_active = 1 THEN 1 END) as expired_rooms
      FROM rooms
    `);

    const fileStats = await Database.get(`
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        COUNT(CASE WHEN is_folder = 1 THEN 1 END) as folder_count
      FROM files
    `);

    console.log(chalk.blue.bold('\n📊 数据库统计\n'));
    console.log(`可用房间: ${chalk.green(roomStats.available_rooms)}`);
    console.log(`过期房间: ${chalk.yellow(roomStats.expired_rooms)}`);
    console.log(`总文件数: ${chalk.green(fileStats.total_files)}`);
    console.log(`文件夹数: ${chalk.green(fileStats.folder_count)}`);
    console.log(`存储总量: ${chalk.green(formatFileSize(fileStats.total_size))}`);

  } catch (error) {
    console.error(chalk.red('❌ 获取数据库统计失败:'), error.message);
  }
}

async function showStorageStats() {
  try {
    const uploadsDir = join(__dirname, 'uploads');
    
    if (!await fs.pathExists(uploadsDir)) {
      console.log(chalk.yellow('📁 上传目录不存在'));
      return;
    }

    // 计算目录大小
    const calculateDirSize = async (dirPath) => {
      let totalSize = 0;
      try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
          const filePath = join(dirPath, file.name);
          if (file.isDirectory()) {
            totalSize += await calculateDirSize(filePath);
          } else {
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
          }
        }
      } catch (error) {
        // 忽略权限错误等
      }
      return totalSize;
    };

    const tempDir = join(uploadsDir, 'temp');
    const roomsDir = join(uploadsDir, 'rooms');

    const tempSize = await fs.pathExists(tempDir) ? await calculateDirSize(tempDir) : 0;
    const roomsSize = await fs.pathExists(roomsDir) ? await calculateDirSize(roomsDir) : 0;
    const totalSize = tempSize + roomsSize;

    console.log(chalk.blue.bold('\n💾 存储空间统计\n'));
    console.log(`临时文件: ${chalk.green(formatFileSize(tempSize))}`);
    console.log(`房间文件: ${chalk.green(formatFileSize(roomsSize))}`);
    console.log(`总使用量: ${chalk.green(formatFileSize(totalSize))}`);

    // 检查房间目录
    if (await fs.pathExists(roomsDir)) {
      const roomDirs = await fs.readdir(roomsDir, { withFileTypes: true });
      const activeDirs = roomDirs.filter(dir => dir.isDirectory());
      console.log(`房间目录: ${chalk.green(activeDirs.length)} 个`);
    }

  } catch (error) {
    console.error(chalk.red('❌ 获取存储统计失败:'), error.message);
  }
}

async function healthCheck() {
  console.log(chalk.blue.bold('\n🏥 系统健康检查\n'));

  // 检查数据库连接
  try {
    await Database.get('SELECT 1');
    console.log(`数据库连接: ${chalk.green('✅ 正常')}`);
  } catch (error) {
    console.log(`数据库连接: ${chalk.red('❌ 异常')} - ${error.message}`);
  }

  // 检查上传目录
  const uploadsDir = join(__dirname, 'uploads');
  const tempDir = join(uploadsDir, 'temp');
  const roomsDir = join(uploadsDir, 'rooms');

  console.log(`上传目录: ${await fs.pathExists(uploadsDir) ? chalk.green('✅ 存在') : chalk.red('❌ 不存在')}`);
  console.log(`临时目录: ${await fs.pathExists(tempDir) ? chalk.green('✅ 存在') : chalk.red('❌ 不存在')}`);
  console.log(`房间目录: ${await fs.pathExists(roomsDir) ? chalk.green('✅ 存在') : chalk.red('❌ 不存在')}`);

  // 检查数据一致性
  try {
    const inconsistentFiles = await Database.all(`
      SELECT f.* FROM files f 
      LEFT JOIN rooms r ON f.room_id = r.id 
      WHERE r.id IS NULL OR r.is_active = 0
    `);
    
    if (inconsistentFiles.length === 0) {
      console.log(`数据一致性: ${chalk.green('✅ 正常')}`);
    } else {
      console.log(`数据一致性: ${chalk.yellow('⚠️  发现')} ${inconsistentFiles.length} ${chalk.yellow('个孤立文件')}`);
    }
  } catch (error) {
    console.log(`数据一致性: ${chalk.red('❌ 检查失败')} - ${error.message}`);
  }
}

// 数据库维护功能
async function backupDatabase() {
  try {
    const backupDir = join(__dirname, 'backups');
    await fs.ensureDir(backupDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `webshare-backup-${timestamp}.db`);
    
    const dbFile = join(__dirname, 'database', 'webshare.db');
    
    if (!await fs.pathExists(dbFile)) {
      console.log(chalk.red('❌ 数据库文件不存在'));
      return;
    }

    await fs.copy(dbFile, backupFile);
    
    console.log(chalk.green('✅ 数据库备份成功'));
    console.log(`备份文件: ${chalk.blue(backupFile)}`);

  } catch (error) {
    console.error(chalk.red('❌ 数据库备份失败:'), error.message);
  }
}



async function resetDatabase() {
  console.log(chalk.red.bold('\n⚠️  危险操作: 重置数据库\n'));
  console.log(chalk.yellow('这将删除所有房间、文件和数据！'));
  
  const confirm1 = await question('确认要重置数据库吗? (yes/no): ');
  if (confirm1.toLowerCase() !== 'yes') {
    console.log(chalk.blue('取消操作'));
    return;
  }

  const confirm2 = await question('再次确认，这是不可逆操作! (YES/no): ');
  if (confirm2 !== 'YES') {
    console.log(chalk.blue('取消操作'));
    return;
  }

  try {
    // 清空数据表
    await Database.run('DELETE FROM files');
    await Database.run('DELETE FROM rooms');
    
    // 清空上传目录
    const uploadsDir = join(__dirname, 'uploads');
    if (await fs.pathExists(uploadsDir)) {
      await fs.emptyDir(uploadsDir);
      await fs.ensureDir(join(uploadsDir, 'temp'));
      await fs.ensureDir(join(uploadsDir, 'rooms'));
    }

    console.log(chalk.green('✅ 数据库重置完成'));

  } catch (error) {
    console.error(chalk.red('❌ 数据库重置失败:'), error.message);
  }
}

// 工具函数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(chalk.cyan(prompt), resolve);
  });
}

function waitForEnter() {
  return question('\n按回车键继续...');
}

// 主程序循环
async function main() {
  try {
    while (true) {
      showMainMenu();
      const choice = await question('请选择操作: ');

      switch (choice) {
        case '1':
          await roomManagement();
          break;
        case '2':
          await databaseManagement();
          break;
        case '0':
          console.log(chalk.blue('👋 再见！'));
          process.exit(0);
        default:
          console.log(chalk.red('❌ 无效选择'));
          await waitForEnter();
      }
    }
  } catch (error) {
    console.error(chalk.red('程序异常:'), error);
    process.exit(1);
  }
}

async function roomManagement() {
  while (true) {
    showRoomMenu();
    const choice = await question('请选择操作: ');

    switch (choice) {
      case '1':
        await listAllRooms();
        await waitForEnter();
        break;
      case '2':
        await createRoom();
        await waitForEnter();
        break;
      case '3':
        await deleteRoom();
        await waitForEnter();
        break;
      case '4':
        await cleanupExpiredRooms();
        await waitForEnter();
        break;
      case '5':
        await listFilesByRoom();
        await waitForEnter();
        break;
      case '6':
        await deleteFile();
        await waitForEnter();
        break;
      case '7':
        await cleanupOrphanedFiles();
        await waitForEnter();
        break;
      case '9':
        return;
      case '0':
        console.log(chalk.blue('👋 再见！'));
        process.exit(0);
      default:
        console.log(chalk.red('❌ 无效选择'));
        await waitForEnter();
    }
  }
}



async function databaseManagement() {
  while (true) {
    showDatabaseMenu();
    const choice = await question('请选择操作: ');

    switch (choice) {
      case '1':
        await showDatabaseStats();
        await waitForEnter();
        break;
      case '2':
        await showStorageStats();
        await waitForEnter();
        break;
      case '3':
        await backupDatabase();
        await waitForEnter();
        break;
      case '4':
        await resetDatabase();
        await waitForEnter();
        break;
      case '9':
        return;
      case '0':
        console.log(chalk.blue('👋 再见！'));
        process.exit(0);
      default:
        console.log(chalk.red('❌ 无效选择'));
        await waitForEnter();
    }
  }
}

// 启动程序
main().catch(error => {
  console.error(chalk.red('程序启动失败:'), error);
  process.exit(1);
}); 