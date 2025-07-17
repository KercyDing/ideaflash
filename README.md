# IdeaFlash 启动与使用说明

## 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

## 2. 启动服务

### 推荐方式：一键启动
```bash
./start-dev.sh
```

### 手动启动
```bash
# 启动后端（端口3001）
cd backend
npm start

# 新开一个终端，启动前端（端口5173）
npm run dev
```

## 3. 访问
- 前端：http://localhost:5173
- 后端API：http://localhost:3001

---

如需停止服务，执行：
```bash
./stop-dev.sh
```
