<template>
  <div class="webshare-app">
    <div class="container">
      <!-- 主要内容区域 -->
      <main class="main-content">
        <!-- 连接状态显示 -->
        <div v-if="!isConnected" class="connection-panel">
          <div class="panel-header">
            <h2>开始文件共享</h2>
            <p>通过匹配码连接设备，安全传输文件</p>
          </div>

          <div class="connection-options">
            <!-- 创建新房间 -->
            <div class="option-card">
              <div class="option-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <h3>创建房间</h3>
              <p>生成匹配码，让其他设备连接</p>
              
              <div class="form-group">
                <label>房间ID (可选)</label>
                <input 
                  v-model="customRoomId" 
                  type="text" 
                  placeholder="留空自动生成，或输入自定义ID"
                  @input="handleCustomIdInput"
                >
                <div v-if="customIdError" class="error-text">{{ customIdError }}</div>
              </div>
              
              <div class="form-group">
                <label>匹配码强度</label>
                <select v-model="codeStrength">
                  <option value="simple">简单 (4位数字)</option>
                  <option value="medium">中等 (6位字母数字)</option>
                  <option value="strong">强力 (8位复杂)</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>有效期</label>
                <select v-model="roomExpiry">
                  <option value="3">3分钟</option>
                  <option value="5">5分钟</option>
                  <option value="10">10分钟</option>
                  <option value="30">30分钟</option>
                  <option value="60">1小时</option>
                  <option value="180">3小时</option>
                  <option value="360">6小时</option>
                  <option value="720">12小时</option>
                  <option value="1440">1天</option>
                </select>
              </div>
              
              <button @click="createRoom" class="action-btn primary" :disabled="!!customIdError">
                创建房间
              </button>
            </div>

            <!-- 加入房间 -->
            <div class="option-card">
              <div class="option-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <h3>加入房间</h3>
              <p>输入房间ID和匹配码连接</p>
              
              <div class="form-group">
                <label>房间ID</label>
                <input 
                  v-model="joinRoomId" 
                  type="text" 
                  placeholder="输入房间ID"
                  @input="handleJoinRoomIdInput"
                  required
                >
              </div>
              
              <div class="form-group">
                <label>匹配码</label>
                <input 
                  v-model="joinCode" 
                  type="text" 
                  placeholder="输入匹配码"
                  @input="handleJoinCodeInput"
                  required
                >
              </div>
              
              <button @click="joinRoom" class="action-btn secondary" :disabled="!joinRoomId || !joinCode">
                加入房间
              </button>
            </div>
          </div>
        </div>

        <!-- 已连接状态 - 文件管理 -->
        <div v-else class="file-manager">
          <!-- 房间信息 -->
          <div class="room-info">
            <div class="room-details-grid">
              <!-- 左侧：房间ID和匹配码 -->
              <div class="room-left-section">
                <div class="room-item">
                  <h3>房间ID</h3>
                  <div class="copy-section">
                    <code class="room-code">{{ currentRoom.id }}</code>
                    <button @click="copyToClipboard(currentRoom.id, '房间ID')" class="copy-btn" title="复制房间ID">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div class="room-item">
                  <h3>匹配码</h3>
                  <div class="copy-section">
                    <code class="room-code">{{ currentRoom.code }}</code>
                    <button @click="copyToClipboard(currentRoom.code, '匹配码')" class="copy-btn" title="复制匹配码">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 右侧：倒计时和状态 -->
              <div class="room-right-section">
                <div class="room-item" v-if="currentRoom.timeRemaining">
                  <h3>房间倒计时</h3>
                  <div class="countdown-display">
                    <div class="time-remaining" :class="{ 'time-warning': currentRoom.timeRemaining === '已过期' || (currentRoom.timeRemaining.includes('秒') && !currentRoom.timeRemaining.includes('分')) }">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="countdown-icon">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span class="countdown-text">{{ currentRoom.timeRemaining }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="room-item">
                  <h3>连接状态</h3>
                  <div class="status-display">
                    <span class="status-online">已连接</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 房间操作 -->
          <div class="room-actions">
            <button @click="leaveRoom" class="leave-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              离开房间
            </button>
          </div>

          <!-- 文件操作区 -->
          <div class="file-operations">
                         <div class="upload-section">
               <h4>上传文件/文件夹</h4>
               <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                   <polyline points="17,8 12,3 7,8"/>
                   <line x1="12" y1="3" x2="12" y2="15"/>
                 </svg>
                 <p>拖拽文件或文件夹到此处，或点击下方按钮</p>
                 <div class="upload-buttons">
                   <input type="file" multiple @change="handleFileSelect" style="display: none;" ref="fileInput">
                   <input type="file" webkitdirectory directory multiple @change="handleFolderSelect" style="display: none;" ref="folderInput">
                   <button @click="fileInput?.click()" class="upload-btn">
                     选择文件
                   </button>
                   <button @click="folderInput?.click()" class="upload-btn folder-btn">
                     选择文件夹
                   </button>
                 </div>
               </div>
             </div>

            <!-- 文件列表 -->
            <div class="file-list">
              <h4>共享文件 ({{ files.length }})</h4>
              
              <div v-if="files.length === 0" class="empty-files">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <p>暂无文件</p>
              </div>

              <div v-else class="files-grid">
                                 <div v-for="file in files" :key="file.id" class="file-item" :class="{ 'folder-item': file.isFolder }">
                   <div class="file-icon" :class="{ 'folder-icon': file.isFolder }">
                     <!-- 文件夹图标 -->
                     <svg v-if="file.isFolder" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                     </svg>
                     <!-- 文件图标 -->
                     <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                       <polyline points="14,2 14,8 20,8"/>
                     </svg>
                   </div>
                   <div class="file-info">
                     <div class="file-name">
                       {{ file.name }}
                       <span v-if="file.isFolder" class="folder-badge">文件夹</span>
                     </div>
                     <div class="file-meta">
                       <span class="file-size">{{ formatFileSize(file.size) }}</span>
                       <span v-if="file.isFolder && file.fileCount" class="file-count">{{ file.fileCount }} 个文件</span>
                       <span class="file-time">{{ formatTime(file.uploadTime) }}</span>
                     </div>
                   </div>
                  <div class="file-actions">
                    <button @click="downloadFile(file)" class="action-btn-small">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button @click="deleteFile(file)" class="action-btn-small delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- 通知消息 -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import WebShareXService, { type Room, type FileItem } from '@/services/webShareXService'
import { 
  compressFolderToZip, 
  filterJunkFiles, 
  getCleanFileCount, 
  getCleanFolderSize,
  formatFileSize as utilFormatFileSize 
} from '@/utils/fileUtils'

const router = useRouter()

// 状态管理
const isConnected = ref(false)
const loading = ref(false)
const loadingMessage = ref('')
const notification = ref<{message: string, type: 'success' | 'error' | 'info'} | null>(null)

// 房间到期检测
const roomExpiryTimer = ref<NodeJS.Timeout | null>(null)
const countdownTimer = ref<NodeJS.Timeout | null>(null)
const isRoomExpired = ref(false)

// 房间相关
const customRoomId = ref('')
const customIdError = ref('')
const codeStrength = ref('medium')
const roomExpiry = ref('60') // 默认1小时
const joinRoomId = ref('')
const joinCode = ref('')

const currentRoom = reactive({
  id: '',
  code: '',
  isCreator: false,
  expiresAt: null as Date | null,
  timeRemaining: ''
})

// 文件管理
const files = ref<FileItem[]>([])
const fileInput = ref<HTMLInputElement>()
const folderInput = ref<HTMLInputElement>()

// 验证自定义ID
const validateCustomId = (): void => {
  if (!customRoomId.value) {
    customIdError.value = ''
    return
  }
  
  const validation = WebShareXService.validateRoomId(customRoomId.value)
  customIdError.value = validation.valid ? '' : validation.error || ''
}

// 处理自定义房间ID输入（去除空格）
const handleCustomIdInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  customRoomId.value = target.value.trim()
  validateCustomId()
}

// 处理加入房间ID输入（去除空格）
const handleJoinRoomIdInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  joinRoomId.value = target.value.trim()
}

// 处理加入房间匹配码输入（去除空格）
const handleJoinCodeInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  joinCode.value = target.value.trim()
}



// 创建房间
const createRoom = async (): Promise<void> => {
  loading.value = true
  loadingMessage.value = '正在创建房间...'
  
  try {
    // 处理空字符串，传递undefined而不是空字符串
    const roomIdToSend = customRoomId.value.trim() || undefined
    const result = await WebShareXService.createRoom(roomIdToSend, codeStrength.value, parseInt(roomExpiry.value))
    
    currentRoom.id = result.room.id
    currentRoom.code = result.room.code
    currentRoom.isCreator = true
    currentRoom.expiresAt = result.room.expiresAt
    isConnected.value = true
    
    // 开始房间到期检测
    startRoomExpiryCheck()
    
    showNotification('房间创建成功！', 'success')
  } catch (error) {
    showNotification((error as Error).message || '创建房间失败，请重试', 'error')
  } finally {
    loading.value = false
  }
}

// 加入房间
const joinRoom = async (): Promise<void> => {
  loading.value = true
  loadingMessage.value = '正在连接房间...'
  
  try {
    const room = await WebShareXService.joinRoom(joinRoomId.value, joinCode.value)
    
    currentRoom.id = room.id
    currentRoom.code = room.code
    currentRoom.isCreator = false
    currentRoom.expiresAt = room.expiresAt
    isConnected.value = true
    
    // 加载房间中的文件
    files.value = await WebShareXService.getFiles(room.id, joinCode.value)
    
    // 开始房间到期检测
    startRoomExpiryCheck()
    
    showNotification('成功加入房间！', 'success')
  } catch (error) {
    showNotification((error as Error).message || '加入房间失败，请检查ID和匹配码', 'error')
  } finally {
    loading.value = false
  }
}

// 离开房间
const leaveRoom = (): void => {
  WebShareXService.leaveRoom(currentRoom.id)
  
  isConnected.value = false
  currentRoom.id = ''
  currentRoom.code = ''
  currentRoom.isCreator = false
  currentRoom.expiresAt = null
  currentRoom.timeRemaining = ''
  files.value = []
  
  // 清空表单
  customRoomId.value = ''
  joinRoomId.value = ''
  joinCode.value = ''
  customIdError.value = ''
  
  // 清理到期检测定时器
  stopRoomExpiryCheck()
  
  showNotification('已离开房间', 'info')
}

// 开始房间到期检测
const startRoomExpiryCheck = (): void => {
  // 每秒更新倒计时显示
  countdownTimer.value = setInterval(() => {
    updateTimeRemaining()
  }, 1000)
  
  // 每30秒检查一次房间状态
  roomExpiryTimer.value = setInterval(async () => {
    try {
      // 检查房间状态
      const roomStatus = await WebShareXService.checkRoomStatus(currentRoom.id)
      if (!roomStatus.active) {
        // 房间已到期，立即处理
        handleRoomExpired()
      }
    } catch (error) {
      console.error('检查房间状态失败:', error)
      // 如果检查失败，可能是房间已不存在，也视为到期
      handleRoomExpired()
    }
  }, 30000) // 30秒检查一次
}

// 更新剩余时间显示
const updateTimeRemaining = (): void => {
  if (!currentRoom.expiresAt) {
    currentRoom.timeRemaining = ''
    return
  }
  
  const now = new Date()
  const expiresAt = new Date(currentRoom.expiresAt)
  const timeDiff = expiresAt.getTime() - now.getTime()
  
  if (timeDiff <= 0) {
    currentRoom.timeRemaining = '已过期'
    // 立即处理房间过期
    handleRoomExpired()
    return
  }
  
  const minutes = Math.floor(timeDiff / (1000 * 60))
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
  
  if (minutes > 0) {
    currentRoom.timeRemaining = `${minutes}分${seconds}秒`
  } else {
    currentRoom.timeRemaining = `${seconds}秒`
  }
}

// 停止房间到期检测
const stopRoomExpiryCheck = (): void => {
  if (roomExpiryTimer.value) {
    clearInterval(roomExpiryTimer.value)
    roomExpiryTimer.value = null
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

// 处理房间到期
const handleRoomExpired = async (): Promise<void> => {
  if (isRoomExpired.value) return // 避免重复处理
  
  isRoomExpired.value = true
  stopRoomExpiryCheck()
  
  // 显示到期提醒
  showNotification('房间已过期，正在清理并返回主界面...', 'info')
  
  try {
    // 删除过期房间
    await WebShareXService.deleteRoom(currentRoom.id)
  } catch (error) {
    console.error('删除过期房间失败:', error)
  }
  
  // 立即返回主界面
  setTimeout(() => {
    isConnected.value = false
    currentRoom.id = ''
    currentRoom.code = ''
    currentRoom.isCreator = false
    currentRoom.expiresAt = null
    currentRoom.timeRemaining = ''
    files.value = []
    isRoomExpired.value = false
    
    // 清空表单
    customRoomId.value = ''
    joinRoomId.value = ''
    joinCode.value = ''
    customIdError.value = ''
    
    showNotification('已返回主界面', 'info')
  }, 500)
}

// 文件处理
const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleFolderSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleDrop = async (event: DragEvent): Promise<void> => {
  event.preventDefault()
  
  if (event.dataTransfer?.items) {
    const allFiles: File[] = []
    
    // 处理拖拽的项目（可能包含文件夹）
    for (const item of Array.from(event.dataTransfer.items)) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          const files = await processEntry(entry)
          allFiles.push(...files)
        }
      }
    }
    
    if (allFiles.length > 0) {
      handleFiles(allFiles)
    }
  } else if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

// 递归处理文件夹条目
const processEntry = async (entry: any): Promise<File[]> => {
  const files: File[] = []
  
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file: File) => {
        // 保留文件夹路径信息
        const newFile = new File([file], entry.fullPath.substring(1), {
          type: file.type,
          lastModified: file.lastModified
        })
        resolve([newFile])
      })
    })
  } else if (entry.isDirectory) {
    const reader = entry.createReader()
    return new Promise((resolve) => {
      reader.readEntries(async (entries: any[]) => {
        for (const subEntry of entries) {
          const subFiles = await processEntry(subEntry)
          files.push(...subFiles)
        }
        resolve(files)
      })
    })
  }
  
  return files
}

const handleFiles = async (fileList: File[]): Promise<void> => {
  loading.value = true
  loadingMessage.value = '正在处理文件...'
  
  try {
    // 检查是否有文件夹结构
    const hasFolder = fileList.some(file => file.webkitRelativePath && file.webkitRelativePath.includes('/'))
    
    if (hasFolder) {
      // 按文件夹分组处理
      const folderGroups = groupFilesByFolder(fileList)
      
      for (const [folderName, folderFiles] of Object.entries(folderGroups)) {
        if (folderName === 'root') {
          // 处理根目录的单独文件，过滤垃圾文件
          const cleanFiles = filterJunkFiles(folderFiles)
          for (const file of cleanFiles) {
            loadingMessage.value = `正在上传文件 ${file.name}...`
            const fileItem = await WebShareXService.uploadFile(currentRoom.id, currentRoom.code, file)
            files.value.push(fileItem)
          }
        } else {
          // 处理文件夹：过滤垃圾文件并压缩
          loadingMessage.value = `正在处理文件夹 ${folderName}...`
          
          const cleanFileCount = getCleanFileCount(folderFiles)
          if (cleanFileCount === 0) {
            showNotification(`文件夹 ${folderName} 中没有有效文件，已跳过`, 'info')
            continue
          }
          
          loadingMessage.value = `正在压缩文件夹 ${folderName} (${cleanFileCount} 个文件)...`
          const { blob: zipBlob } = await compressFolderToZip(folderName, folderFiles)
          
          loadingMessage.value = `正在上传文件夹 ${folderName}...`
          const folderItem = await WebShareXService.uploadFolder(currentRoom.id, currentRoom.code, folderName, zipBlob)
          files.value.push(folderItem)
        }
      }
    } else {
      // 处理单独文件，过滤垃圾文件
      const cleanFiles = filterJunkFiles(fileList)
      for (const file of cleanFiles) {
        loadingMessage.value = `正在上传文件 ${file.name}...`
        const fileItem = await WebShareXService.uploadFile(currentRoom.id, currentRoom.code, file)
        files.value.push(fileItem)
      }
    }
    
    showNotification(`上传完成！`, 'success')
  } catch (error) {
    showNotification((error as Error).message || '文件上传失败', 'error')
  } finally {
    loading.value = false
  }
}

// 按文件夹分组文件
const groupFilesByFolder = (fileList: File[]): Record<string, File[]> => {
  const groups: Record<string, File[]> = {}
  
  for (const file of fileList) {
    const relativePath = file.webkitRelativePath || file.name
    
    if (relativePath.includes('/')) {
      // 获取文件夹名称（第一级目录）
      const folderName = relativePath.split('/')[0]
      if (!groups[folderName]) {
        groups[folderName] = []
      }
      groups[folderName].push(file)
    } else {
      // 根目录文件
      if (!groups['root']) {
        groups['root'] = []
      }
      groups['root'].push(file)
    }
  }
  
  return groups
}

const downloadFile = async (file: FileItem): Promise<void> => {
  try {
    if (file.isFolder) {
      showNotification(`正在打包文件夹 ${file.name}...`, 'info')
    } else {
      showNotification(`正在下载 ${file.name}`, 'info')
    }
    
    const blob = await WebShareXService.downloadFile(currentRoom.id, currentRoom.code, file.id)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // 文件夹下载时添加.zip扩展名
    a.download = file.isFolder ? `${file.name}.zip` : file.name
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    if (file.isFolder) {
      showNotification(`文件夹 ${file.name}.zip 下载完成`, 'success')
    } else {
      showNotification(`${file.name} 下载完成`, 'success')
    }
  } catch (error) {
    showNotification((error as Error).message || '下载失败', 'error')
  }
}

const deleteFile = async (file: FileItem): Promise<void> => {
  try {
    const success = await WebShareXService.deleteFile(currentRoom.id, currentRoom.code, file.id)
    if (success) {
      const index = files.value.findIndex(f => f.id === file.id)
      if (index > -1) {
        files.value.splice(index, 1)
        showNotification(`已删除 ${file.name}`, 'info')
      }
    } else {
      showNotification('删除失败', 'error')
    }
  } catch (error) {
    showNotification((error as Error).message || '删除失败', 'error')
  }
}

// 工具函数
const formatFileSize = (bytes: number): string => {
  return utilFormatFileSize(bytes)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}



const showNotification = (message: string, type: 'success' | 'error' | 'info'): void => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 1000)
}

// 复制到剪贴板
const copyToClipboard = async (text: string, label: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    showNotification(`${label}已复制到剪贴板`, 'success')
  } catch (error) {
    // 降级处理：使用document.execCommand
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showNotification(`${label}已复制到剪贴板`, 'success')
    } catch (fallbackError) {
      showNotification('复制失败，请手动复制', 'error')
      console.error('复制失败:', fallbackError)
    }
  }
}

// 生命周期
onMounted(() => {
  // 初始化WebSocket连接或其他初始化逻辑
})

onUnmounted(() => {
  // 清理资源
  stopRoomExpiryCheck()
})
</script>

<style scoped>
.webshare-app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding: 1rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 主要内容 */
.main-content {
  background: var(--bg-secondary);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

/* 连接面板 */
.panel-header {
  text-align: center;
  margin-bottom: 2rem;
}

.panel-header h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.panel-header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.connection-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.option-card {
  background: var(--bg-primary);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.option-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  border-radius: 1rem;
  color: white;
  margin-bottom: 1rem;
}

.option-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.option-card p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.action-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.action-btn.secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
  transform: translateY(-2px);
}

/* 文件管理器 */
.room-info {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.room-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.room-left-section,
.room-right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .room-details-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.room-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.room-item h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.copy-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.room-code {
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  border: 1px solid var(--border-color);
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 0.5rem;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  line-height: 1;
}

.copy-btn svg {
  flex-shrink: 0;
  color: white;
  stroke: white;
  display: block;
  vertical-align: middle;
}

.copy-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.copy-btn:active {
  transform: translateY(0);
}

.countdown-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-remaining {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981; /* 绿色 */
  background: rgba(16, 185, 129, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid #10b981;
  min-width: 140px;
  justify-content: center;
  transition: all 0.3s ease;
}

.time-remaining:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.countdown-icon {
  flex-shrink: 0;
  animation: tick 1s ease-in-out infinite;
}

.countdown-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.5px;
}

.time-warning {
  color: #ef4444; /* 红色 */
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  animation: pulse 2s ease-in-out infinite;
}

.time-warning:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.time-warning .countdown-icon {
  animation: warning-tick 0.5s ease-in-out infinite;
}



@keyframes tick {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(6deg); }
}

@keyframes warning-tick {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(6deg) scale(1.1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.status-display {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid #10b981;
  justify-content: center;
  min-width: 100px;
}

.status-online {
  color: #10b981;
  font-weight: 700;
  font-size: 1rem;
}

.leave-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  line-height: 1;
}

.leave-btn svg {
  flex-shrink: 0;
  color: white;
  stroke: white;
  display: block;
  vertical-align: middle;
}

.leave-btn:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.file-operations {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.upload-section h4,
.file-list h4 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: var(--bg-primary);
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.05);
}

.upload-area svg {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.upload-area p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.upload-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  min-height: 44px;
  line-height: 1.2;
}

.upload-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.upload-btn.folder-btn {
  background: #8b5cf6;
}

.upload-btn.folder-btn:hover {
  background: #7c3aed;
}

.upload-btn.folder-btn svg {
  color: white;
  stroke: white;
}

.empty-files {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-files svg {
  margin-bottom: 1rem;
}

.files-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.file-item.folder-item {
  border-left: 4px solid #8b5cf6;
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  color: var(--text-secondary);
}

.file-icon.folder-icon {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.folder-badge {
  font-size: 0.75rem;
  background: #8b5cf6;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

.file-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.file-count {
  color: #8b5cf6;
  font-weight: 500;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  line-height: 1;
}

.action-btn-small svg {
  flex-shrink: 0;
  color: currentColor;
  stroke: currentColor;
  display: block;
  vertical-align: middle;
}

.action-btn-small:hover {
  background: var(--primary-color);
  color: white;
}

.action-btn-small:hover svg {
  color: white;
  stroke: white;
}

.action-btn-small.delete:hover {
  background: #ef4444;
}

.action-btn-small.delete:hover svg {
  color: white;
  stroke: white;
}

/* 加载和通知 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  font-size: 1.125rem;
}

.notification {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  z-index: 1001;
  animation: slideDown 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  text-align: center;
}

.notification.success {
  background: rgba(16, 185, 129, 0.9);
}

.notification.error {
  background: rgba(239, 68, 68, 0.9);
}

.notification.info {
  background: rgba(59, 130, 246, 0.9);
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .app-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .connection-options {
    grid-template-columns: 1fr;
  }
  
  .file-operations {
    grid-template-columns: 1fr;
  }
  
  .room-info {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .room-details {
    text-align: center;
  }
  
  .copy-section {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .room-code {
    text-align: center;
  }
  
  .copy-btn {
    align-self: center;
  }
  
  .notification {
    left: 1rem;
    right: 1rem;
    transform: translateX(0);
    max-width: none;
  }
}
</style> 