# WebShareX 阿里云部署指南

## 📋 部署概述

本指南将帮助您将 WebShareX 项目部署到阿里云 Ubuntu 20.04 服务器上，使用 1Panel 面板进行管理。

### 系统要求
- **服务器**: 阿里云 ECS Ubuntu 20.04
- **面板**: 1Panel
- **数据库**: MySQL (已连接阿里云 RDS)
- **Node.js**: 18.x 或更高版本
- **内存**: 至少 1GB RAM
- **存储**: 至少 10GB 可用空间

## 🚀 部署架构

```
阿里云服务器 (Ubuntu 20.04)
├── 1Panel 面板管理
├── Nginx (反向代理)
├── PM2 (进程管理)
├── Node.js 应用
│   ├── 前端 (静态文件): /opt/1panel/www/sites/ideaflash.cn/index/
│   └── 后端 (Express API): /opt/1panel/www/serve/backend/
└── MySQL (远程阿里云 RDS)
```

## 📁 服务器目录结构

```
/opt/1panel/www/
├── sites/
│   └── ideaflash.cn/
│       └── index/              # 前端静态文件 (dist/ 内容)
│           ├── index.html
│           ├── assets/
│           └── ...
└── serve/
    ├── backend/                # 后端应用
    │   ├── src/
    │   ├── node_modules/
    │   ├── logs/
    │   ├── uploads/
    │   └── package.json
    └── ecosystem.config.js     # PM2 配置文件
```

## 📁 部署准备

### 更新系统包

```bash
sudo apt update && sudo apt upgrade -y
```

## 🔧 环境安装

### 1. 安装 Node.js 18.x

```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 3. 安装 pnpm (推荐)

```bash
# 安装 pnpm
sudo npm install -g pnpm

# 验证安装
pnpm --version
```

## 📦 项目部署

### 1. 创建项目目录

```bash
# 创建前端静态文件目录
sudo mkdir -p /opt/1panel/www/sites/ideaflash.cn/index
sudo chown -R $USER:$USER /opt/1panel/www/sites/ideaflash.cn/index

# 创建后端服务目录
sudo mkdir -p /opt/1panel/www/serve
sudo chown -R $USER:$USER /opt/1panel/www/serve
```

### 2. 本地构建前端

```bash
# 在本地项目目录执行
pnpm install && pnpm run build
```

### 3. 上传项目文件

**前端文件部署**：
- 将本地 `dist/` 目录中的所有文件上传到 `/opt/1panel/www/sites/ideaflash.cn/index/`

**后端文件部署**：
- 将整个 `backend/` 文件夹上传到 `/opt/1panel/www/serve/`

### 4. 配置 Vue Router History 模式支持

**在 1Panel 面板中配置 SPA 路由支持**：

1. **网站设置 → 伪静态/重写规则**
2. **添加以下规则**：
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

这样配置后，所有前端路由（如 `/inspiration/websharex`）都能正常直接访问。

### 4. 安装后端依赖

```bash
cd /opt/1panel/www/serve/backend
pnpm install --production
```

## ⚙️ 配置文件设置

### 1. 创建生产环境配置

创建后端环境配置文件：

```bash
cd /opt/1panel/www/serve/backend
nano .env
```

添加以下内容：
```bash
# 生产环境配置
NODE_ENV=production
PORT=3001

# 数据库配置 (使用现有的阿里云 MySQL)
DB_HOST=8.153.164.22
DB_USER=Kercy
DB_PASSWORD=r68iJEyNwGeM8FjG
DB_NAME=websharex
DB_PORT=3306

# 文件上传配置
UPLOAD_DIR=/opt/1panel/www/serve/backend/uploads
MAX_FILE_SIZE=100MB
MAX_FILES_PER_ROOM=50

# 安全配置
CORS_ORIGIN=https://ideaflash.cn
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 2. 更新数据库配置

编辑 `/opt/1panel/www/serve/backend/src/config/database.js`:

```bash
nano /opt/1panel/www/serve/backend/src/config/database.js
```

确保配置正确（当前配置看起来已经正确）。

### 3. 创建日志目录

```bash
mkdir -p /opt/1panel/www/serve/backend/logs
mkdir -p /opt/1panel/www/serve/backend/uploads/rooms
```

## 🔄 PM2 进程管理配置

### 1. 创建 PM2 配置文件

```bash
cd /opt/1panel/www/serve
nano ecosystem.config.js
```

添加以下内容：
```javascript
module.exports = {
  apps: [
    {
      name: 'websharex-backend',
      script: './backend/src/app.js',
      cwd: '/opt/1panel/www/serve',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: './backend/logs/combined.log',
      out_file: './backend/logs/out.log',
      error_file: './backend/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
```

### 2. 启动应用

```bash
cd /opt/1panel/www/serve/backend
pm2 start src/app.js --name websharex-backend --node-args="--experimental-modules"

# 或者使用生态系统配置（修复版本）
cd /opt/1panel/www/serve
nano ecosystem.config.js
```

修正的 PM2 配置：
```javascript
module.exports = {
  apps: [
    {
      name: 'websharex-backend',
      script: 'src/app.js',
      cwd: '/opt/1panel/www/serve/backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
```

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行生成的命令

# 查看应用状态
pm2 status
pm2 logs websharex-backend
```

## 🌐 OpenResty/Nginx 配置（1Panel）

### 1. 通过 1Panel 面板配置

1Panel 使用 OpenResty，配置通过面板界面完成：

#### 方法A：通过 1Panel 面板（推荐）

1. **登录 1Panel 面板**
2. **网站 → 创建网站**
3. **填写网站信息**：
   - 域名：`ideaflash.cn`
   - 别名：`www.ideaflash.cn`
   - 目录：`/opt/1panel/www/sites/ideaflash.cn/index`
   - PHP版本：无需选择
4. **创建完成后，点击"设置"**
5. **选择"反向代理"选项卡**
6. **添加反向代理规则**：
   ```
   名称: api
   代理地址: http://127.0.0.1:3001
   代理目录: /api
   ```

#### 方法B：手动配置 OpenResty

1Panel 的 OpenResty 配置文件通常位于：

```bash
# 找到网站配置文件
ls -la /opt/1panel/www/sites/ideaflash.cn/

# 编辑网站配置（通常在 .conf 文件中）
sudo nano /opt/1panel/www/sites/ideaflash.cn/nginx.conf
```

### 2. OpenResty 配置内容

如果需要手动配置，在网站配置文件中添加：

```nginx
server {
    listen 80;
    server_name ideaflash.cn www.ideaflash.cn;
    
    # 静态文件目录 (前端)
    root /opt/1panel/www/sites/ideaflash.cn/index;
    index index.html index.htm;
    
    # 错误和访问日志
    access_log /opt/1panel/www/sites/ideaflash.cn/log/access.log;
    error_log /opt/1panel/www/sites/ideaflash.cn/log/error.log;
    
    # 前端路由支持 (Vue Router History Mode)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理到后端 (关键配置)
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 处理 OPTIONS 请求 (CORS)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # 文件上传大小限制
        client_max_body_size 100M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 3. 重载配置

通过 1Panel 面板或命令行重载配置：

```bash
# 方法1：通过 1Panel 面板
# 网站设置 → 操作 → 重载配置

# 方法2：命令行（如果有权限）
sudo /opt/1panel/www/server/openresty/nginx/sbin/nginx -t
sudo /opt/1panel/www/server/openresty/nginx/sbin/nginx -s reload

# 方法3：重启 1Panel 服务
sudo systemctl restart 1panel
```

### 4. 验证配置

```bash
# 检查 OpenResty 进程
ps aux | grep nginx

# 检查端口占用
sudo netstat -tlnp | grep :80

# 测试代理是否工作
curl -I http://ideaflash.cn/api/rooms
```

## 🔒 SSL 证书配置 (可选但推荐)

### 1. 通过 1Panel 面板配置 SSL（推荐）

1Panel 提供了便捷的 SSL 证书管理：

1. **登录 1Panel 面板**
2. **网站 → 选择您的网站 → 设置**
3. **HTTPS 选项卡**
4. **选择证书获取方式**：
   - Let's Encrypt（免费，推荐）
   - 上传自定义证书
   - 阿里云证书（如果有）

5. **Let's Encrypt 配置**：
   - 域名：`ideaflash.cn,www.ideaflash.cn`
   - 邮箱：您的邮箱地址
   - 点击"获取"

6. **启用强制 HTTPS**

### 2. 手动配置 SSL（备选方案）

如果需要手动配置：

```bash
# 安装 Certbot
sudo apt install certbot -y

# 获取证书（停机维护模式）
sudo certbot certonly --standalone -d ideaflash.cn -d www.ideaflash.cn

# 证书文件路径
# /etc/letsencrypt/live/ideaflash.cn/fullchain.pem
# /etc/letsencrypt/live/ideaflash.cn/privkey.pem
```

### 3. 自动续期设置

```bash
# 通过 1Panel 自动处理续期，或手动添加 cron
sudo crontab -e
# 添加以下行
0 2 * * * /usr/bin/certbot renew --quiet && /opt/1panel/www/server/openresty/nginx/sbin/nginx -s reload
```

## 🗃️ 数据库初始化

### 1. 运行数据库初始化脚本

```bash
cd /opt/1panel/www/serve/backend
node src/config/initDatabase.js
```

### 2. 验证数据库连接

```bash
# 使用后台管理工具检查
cd /opt/1panel/www/serve/backend
node admin-cli.js
```

## 🔥 防火墙配置

### 1. 配置 UFW 防火墙

```bash
# 启用防火墙
sudo ufw enable

# 允许必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# 查看状态
sudo ufw status
```

### 2. 阿里云安全组设置

在阿里云控制台配置 ECS 安全组：
- 开放端口 80 (HTTP)
- 开放端口 443 (HTTPS)
- 开放端口 22 (SSH)

## 📊 监控和日志

### 1. PM2 监控

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs websharex-backend

# 重启应用
pm2 restart websharex-backend

# 查看详细信息
pm2 show websharex-backend
```

### 2. 系统资源监控

```bash
# 系统负载
htop

# 磁盘使用
df -h

# 内存使用
free -h

# 网络连接
ss -tulpn | grep :3001
```

### 3. 应用健康检查

```bash
# 检查后端状态
curl http://localhost:3001/health

# 检查前端
curl http://localhost/
```

## 🛠️ 常用运维命令

### 应用管理

```bash
# 重启后端应用
pm2 restart websharex-backend

# 查看应用日志
pm2 logs websharex-backend --lines 100

# 重新加载应用 (零停机)
pm2 reload websharex-backend

# 停止应用
pm2 stop websharex-backend

# 删除应用
pm2 delete websharex-backend
```

### 代码更新

```bash
# 本地重新构建前端
pnpm run build

# 上传新的 dist 文件到服务器
# 将 dist/ 目录内容更新到 /opt/1panel/www/sites/ideaflash.cn/index/

# 如果后端有更新，上传 backend 文件夹到 /opt/1panel/www/serve/
# 然后安装新依赖
cd /opt/1panel/www/serve/backend && pnpm install --production

# 重启后端
pm2 restart websharex-backend
```

### 数据库维护

```bash
# 使用管理工具
cd /opt/1panel/www/serve/backend
node admin-cli.js

# 查看房间列表
# 清理过期数据
# 查看系统统计
```

## 🔧 故障排除

### 常见问题

1. **端口占用**
```bash
# 查看端口占用
sudo lsof -i :3001
sudo netstat -tulpn | grep :3001
```

2. **权限问题**
```bash
# 修复文件权限
sudo chown -R $USER:$USER /opt/1panel/www/serve/backend
sudo chown -R $USER:$USER /opt/1panel/www/sites/ideaflash.cn/index
sudo chmod -R 755 /opt/1panel/www/serve/backend
sudo chmod -R 755 /opt/1panel/www/sites/ideaflash.cn/index
```

3. **内存不足**
```bash
# 创建 swap 文件
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

4. **数据库连接问题**
```bash
# 测试数据库连接
cd /opt/1panel/www/serve/backend
node -e "import('./src/config/database.js').then(db => db.pool.execute('SELECT 1').then(console.log).catch(console.error))"
```

### 日志查看

```bash
# PM2 日志
pm2 logs websharex-backend

# 1Panel/OpenResty 日志
sudo tail -f /opt/1panel/www/sites/ideaflash.cn/log/access.log
sudo tail -f /opt/1panel/www/sites/ideaflash.cn/log/error.log

# 系统日志
sudo journalctl -u 1panel -f

# OpenResty 主日志（如果需要）
sudo tail -f /opt/1panel/www/server/openresty/nginx/logs/error.log
```

## 🔧 1Panel 特定故障排除

### 1Panel 相关问题

1. **反向代理不工作**
```bash
# 检查 1Panel 网站状态
sudo systemctl status 1panel

# 重启 1Panel 服务
sudo systemctl restart 1panel

# 检查网站配置
cat /opt/1panel/www/sites/ideaflash.cn/nginx.conf
```

2. **权限问题**
```bash
# 确保 1Panel 用户有正确权限
sudo chown -R 1panel:1panel /opt/1panel/www/sites/ideaflash.cn/
sudo chown -R 1panel:1panel /opt/1panel/www/serve/backend/

# 检查 SELinux（如果启用）
sestatus
sudo setsebool -P httpd_can_network_connect 1
```

3. **端口冲突**
```bash
# 检查 OpenResty 是否正常运行
ps aux | grep nginx
sudo netstat -tlnp | grep :80

# 检查 1Panel 面板端口
sudo netstat -tlnp | grep :8090
```

4. **配置文件语法错误**
```bash
# 通过 1Panel 面板检查配置
# 或者手动测试
sudo /opt/1panel/www/server/openresty/nginx/sbin/nginx -t -c /opt/1panel/www/server/openresty/nginx/conf/nginx.conf
```

## 🚀 1Panel 快速部署步骤

### 简化的 1Panel 部署流程

1. **创建网站**
   - 1Panel 面板 → 网站 → 创建网站
   - 域名：`ideaflash.cn`
   - 目录：`/opt/1panel/www/sites/ideaflash.cn/index`

2. **上传前端文件**
   - 将构建好的 `dist/` 内容上传到网站目录

3. **配置反向代理**
   - 网站设置 → 反向代理
   - 代理地址：`http://127.0.0.1:3001`
   - 代理目录：`/api`

4. **启动后端服务**
   ```bash
   cd /opt/1panel/www/serve/backend
   pm2 start src/app.js --name websharex-backend
   ```

5. **测试连接**
   ```bash
   curl http://ideaflash.cn/api/rooms -X POST
   ```
