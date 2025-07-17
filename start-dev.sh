#!/bin/bash

# WebShareX 开发环境启动脚本

echo "🚀 启动 WebShareX 开发环境..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 清理可能占用的端口
echo "🧹 清理端口占用..."
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "   发现端口 $port 被占用，正在清理..."
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
        echo "   端口 $port 已清理"
    fi
}

cleanup_port 3001
cleanup_port 5173
cleanup_port 5174

# 启动后端服务
echo "📡 启动后端服务..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

echo "🗄️ 检查MySQL数据库连接..."
node -e "
import Database from './src/config/database.js';
try {
    await Database.get('SELECT 1');
    console.log('✅ MySQL连接成功');
    process.exit(0);
} catch (error) {
    console.error('❌ MySQL连接失败:', error.message);
    console.error('请检查数据库配置文件: src/config/database.js');
    process.exit(1);
}
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo "🔨 初始化数据库表..."
npm run init-db

echo "🔧 启动后端服务器 (端口 3001)..."
node src/app.js &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 回到项目根目录
cd ..

# 启动前端服务
echo "🎨 启动前端服务..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo "🌐 启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 WebShareX 开发环境启动完成！"
echo ""
echo "📍 服务地址:"
echo "   前端: http://localhost:5173 (或 5174)"
echo "   后端: http://localhost:3001"
echo "   健康检查: http://localhost:3001/health"
echo "   后台管理: npm run admin (在 backend 目录下)"
echo ""
echo "📝 使用说明:"
echo "   1. 访问前端地址查看应用"
echo "   2. 导航到 /inspiration/webShareX 测试文件共享功能"
echo "   3. 按 Ctrl+C 停止所有服务"
echo ""
echo "🔧 技术栈:"
echo "   前端: Vue 3 + TypeScript + Vite"
echo "   后端: Node.js + Express"
echo "   数据库: MySQL + 精确倒计时清理"
echo ""

# 等待用户中断
wait

# 清理进程
echo "🛑 正在停止服务..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null

# 强制清理端口
sleep 2
cleanup_port 3001
cleanup_port 5173
cleanup_port 5174

echo "✅ 服务已停止" 