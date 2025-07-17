#!/bin/bash

# WebShareX Backend 停止脚本

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

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}       $PROJECT_NAME 停止脚本${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查PID文件是否存在
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  未找到PID文件，服务可能未运行${NC}"
    
    # 尝试查找相关进程
    echo -e "${BLUE}🔍 搜索相关进程...${NC}"
    PROCESSES=$(pgrep -f "node.*src/app.js")
    
    if [ -n "$PROCESSES" ]; then
        echo -e "${YELLOW}发现相关进程:${NC}"
        echo "$PROCESSES"
        read -p "是否强制停止这些进程? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$PROCESSES" | xargs kill -TERM
            sleep 2
            echo "$PROCESSES" | xargs kill -KILL 2>/dev/null
            echo -e "${GREEN}✅ 强制停止完成${NC}"
        fi
    else
        echo -e "${GREEN}✅ 未找到相关进程${NC}"
    fi
    exit 0
fi

# 读取PID
PID=$(cat "$PID_FILE")

# 检查进程是否存在
if ! ps -p $PID > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  进程 $PID 不存在，清理PID文件${NC}"
    rm -f "$PID_FILE"
    exit 0
fi

echo -e "${BLUE}🛑 正在停止服务 (PID: $PID)...${NC}"

# 优雅停止
kill -TERM $PID

# 等待进程结束
WAIT_TIME=0
MAX_WAIT=10

while ps -p $PID > /dev/null 2>&1 && [ $WAIT_TIME -lt $MAX_WAIT ]; do
    echo -e "${YELLOW}⏳ 等待进程结束... ($((WAIT_TIME + 1))/$MAX_WAIT)${NC}"
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
done

# 检查是否成功停止
if ps -p $PID > /dev/null 2>&1; then
    echo -e "${RED}⚠️  优雅停止失败，强制结束进程${NC}"
    kill -KILL $PID
    sleep 1
    
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${RED}❌ 强制停止失败${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ 强制停止成功${NC}"
    fi
else
    echo -e "${GREEN}✅ 服务已优雅停止${NC}"
fi

# 清理PID文件
rm -f "$PID_FILE"

# 显示状态信息
echo ""
echo -e "${BLUE}📋 服务状态:${NC}"
echo -e "   进程状态: ${GREEN}已停止${NC}"
echo -e "   PID文件: ${GREEN}已清理${NC}"

# 显示最后几行日志
if [ -f "$LOG_FILE" ]; then
    echo ""
    echo -e "${BLUE}📝 最后几行日志:${NC}"
    tail -5 "$LOG_FILE"
fi

echo ""
echo -e "${GREEN}🎉 服务停止完成！${NC}"