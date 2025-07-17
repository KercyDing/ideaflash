#!/bin/bash

# WebShareX Backend 状态检查脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="WebShareX Backend"
PID_FILE="./webshare.pid"
LOG_FILE="./logs/webshare.log"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}       $PROJECT_NAME 状态检查${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查PID文件
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务运行中${NC}"
        echo -e "   PID: $PID"
        
        # 检查端口占用
        PORT_INFO=$(lsof -i :3000 2>/dev/null | grep LISTEN)
        if [ -n "$PORT_INFO" ]; then
            echo -e "   端口: ${GREEN}3000 (已监听)${NC}"
        else
            echo -e "   端口: ${RED}3000 (未监听)${NC}"
        fi
        
        # 检查内存使用
        MEMORY=$(ps -o pid,rss,vsz -p $PID | tail -1 | awk '{print $2, $3}')
        echo -e "   内存: $MEMORY KB"
        
        # 检查运行时间
        START_TIME=$(ps -o lstart -p $PID | tail -1)
        echo -e "   启动: $START_TIME"
        
    else
        echo -e "${RED}❌ PID文件存在但进程不运行${NC}"
        echo -e "   PID: $PID (已停止)"
    fi
else
    echo -e "${YELLOW}⚠️  服务未运行${NC}"
    echo -e "   状态: 已停止"
fi

# 检查数据库连接
echo ""
echo -e "${BLUE}🔍 数据库连接检查...${NC}"
node -e "
import Database from './src/config/database.js';
try {
    await Database.get('SELECT 1');
    console.log('✅ MySQL连接正常');
} catch (error) {
    console.error('❌ MySQL连接失败:', error.message);
}
" 2>/dev/null

# 检查日志文件
echo ""
if [ -f "$LOG_FILE" ]; then
    echo -e "${BLUE}📝 最新日志 (最后10行):${NC}"
    tail -10 "$LOG_FILE"
else
    echo -e "${YELLOW}⚠️  日志文件不存在${NC}"
fi

echo ""
echo -e "${BLUE}📋 快捷命令:${NC}"
echo -e "   启动服务: ./start.sh"
echo -e "   停止服务: ./stop.sh"
echo -e "   管理后台: npm run admin"