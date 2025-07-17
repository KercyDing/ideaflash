#!/bin/bash

# WebShareX 开发环境停止脚本

echo "🛑 停止 WebShareX 开发环境..."

# 清理端口占用函数
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "   停止端口 $port 上的服务..."
        echo $pids | xargs kill -15 2>/dev/null
        sleep 2
        # 如果还有进程，强制杀死
        local remaining_pids=$(lsof -ti :$port 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "   强制停止端口 $port 上的服务..."
            echo $remaining_pids | xargs kill -9 2>/dev/null
        fi
        echo "   端口 $port 已清理"
    else
        echo "   端口 $port 没有运行的服务"
    fi
}

echo "🧹 清理端口占用..."
cleanup_port 3001
cleanup_port 5173
cleanup_port 5174

# 清理可能的Node.js进程
echo "🔍 清理相关进程..."
pkill -f "node src/app.js" 2>/dev/null && echo "   后端进程已停止"
pkill -f "vite" 2>/dev/null && echo "   前端进程已停止"

echo "✅ WebShareX 开发环境已停止" 