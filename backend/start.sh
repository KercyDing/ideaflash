#!/bin/bash

# WebShareX Backend 启动脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="WebShareX Backend"
PID_FILE="./webshare.pid"
LOG_FILE="./logs/webshare.log"

# 创建必要的目录
mkdir -p logs
mkdir -p uploads/temp
mkdir -p uploads/rooms

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}       $PROJECT_NAME 启动脚本${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查是否已经运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  服务已在运行中 (PID: $OLD_PID)${NC}"
        echo -e "${YELLOW}如需重启，请先运行 ./stop.sh${NC}"
        exit 1
    else
        echo -e "${YELLOW}发现旧的PID文件，正在清理...${NC}"
        rm -f "$PID_FILE"
    fi
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装或不在PATH中${NC}"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
fi

# 检查MySQL连接
echo -e "${BLUE}🔍 检查MySQL数据库连接...${NC}"
node -e "
import Database from './src/config/database.js';
try {
    await Database.get('SELECT 1');
    console.log('✅ MySQL连接成功');
    process.exit(0);
} catch (error) {
    console.error('❌ MySQL连接失败:', error.message);
    process.exit(1);
}
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 数据库连接失败，请检查配置${NC}"
    exit 1
fi

# 初始化数据库表
echo -e "${BLUE}🔨 初始化数据库表...${NC}"
npm run init-db
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 数据库初始化失败${NC}"
    exit 1
fi

# 启动服务
echo -e "${BLUE}🚀 启动服务...${NC}"

# 开发模式还是生产模式
if [ "$1" = "dev" ] || [ "$1" = "development" ]; then
    echo -e "${YELLOW}📝 开发模式启动 (使用nodemon)${NC}"
    nohup npm run dev > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    MODE="development"
else
    echo -e "${GREEN}🔧 生产模式启动${NC}"
    nohup npm start > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    MODE="production"
fi

# 保存PID
echo $SERVER_PID > "$PID_FILE"

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 3

# 检查服务是否成功启动
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}   PID: $SERVER_PID${NC}"
    echo -e "${GREEN}   模式: $MODE${NC}"
    echo -e "${GREEN}   日志: $LOG_FILE${NC}"
    echo ""
    echo -e "${BLUE}📋 常用命令:${NC}"
    echo -e "   查看日志: tail -f $LOG_FILE"
    echo -e "   停止服务: ./stop.sh"
    echo -e "   管理后台: npm run admin"
    echo ""
    echo -e "${GREEN}🌐 服务地址: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    rm -f "$PID_FILE"
    echo -e "${RED}请查看日志: $LOG_FILE${NC}"
    exit 1
fi