import Database from './database.js';
import fs from 'fs-extra';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保上传目录存在
const uploadsDir = join(__dirname, '../../uploads');
await fs.ensureDir(join(uploadsDir, 'rooms'));

async function initDatabase() {
  try {
    console.log('开始初始化MySQL数据库表...');

    // 创建房间表
    await Database.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        max_size BIGINT DEFAULT 104857600,
        current_size BIGINT DEFAULT 0,
        is_active TINYINT DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 创建文件表
    await Database.run(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(64) PRIMARY KEY,
        room_id VARCHAR(64) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(512) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(128),
        is_folder TINYINT DEFAULT 0,
        file_count INT DEFAULT 0,
        upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 创建索引（如已存在则忽略报错）
    try { await Database.run(`CREATE INDEX idx_rooms_code ON rooms(code);`); } catch (e) {}
    try { await Database.run(`CREATE INDEX idx_rooms_expires ON rooms(expires_at);`); } catch (e) {}
    try { await Database.run(`CREATE INDEX idx_files_room ON files(room_id);`); } catch (e) {}

    console.log('MySQL数据库表初始化完成！');
  } catch (error) {
    console.error('MySQL数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  await initDatabase();
  process.exit(0);
}

export default initDatabase; 