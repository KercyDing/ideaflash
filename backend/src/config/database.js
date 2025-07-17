import mysql from 'mysql2/promise';

// MySQL数据库连接配置
export const pool = mysql.createPool({
  host: '8.153.164.22',
  user: 'Kercy',
  password: 'r68iJEyNwGeM8FjG',
  database: 'websharex',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00', // 设置为中国时区
  dateStrings: false   // 返回Date对象而不是字符串
});

// 数据库操作封装
export class Database {
  // 执行写操作（INSERT/UPDATE/DELETE）
  static async run(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result;
  }

  // 查询单条记录
  static async get(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  }

  // 查询多条记录
  static async all(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  // 关闭连接池（一般不需要手动调用）
  static async close() {
    await pool.end();
  }
}

export default Database; 