import JSZip from 'jszip'

// macOS和其他系统的垃圾文件列表
const JUNK_FILES = [
  '.DS_Store',
  '.localized', 
  'Thumbs.db',
  'desktop.ini',
  '.AppleDouble',
  '.LSOverride',
  '._*', // AppleDouble files
  '.DocumentRevisions-V100',
  '.fseventsd',
  '.Spotlight-V100',
  '.TemporaryItems',
  '.Trashes',
  '.VolumeIcon.icns',
  '.com.apple.timemachine.donotpresent',
  '.AppleDB',
  '.AppleDesktop',
  'Network Trash Folder',
  'Temporary Items',
  '.apdisk'
]

/**
 * 检查文件是否为垃圾文件
 */
export function isJunkFile(fileName: string): boolean {
  const name = fileName.toLowerCase()
  
  // 检查精确匹配
  if (JUNK_FILES.some(junk => junk.toLowerCase() === name)) {
    return true
  }
  
  // 检查模式匹配（如 ._* 文件）
  if (name.startsWith('._')) {
    return true
  }
  
  return false
}

/**
 * 过滤文件列表，移除垃圾文件
 */
export function filterJunkFiles(files: File[]): File[] {
  return files.filter(file => {
    // 获取文件名（不包含路径）
    const fileName = file.name.split('/').pop() || file.name
    return !isJunkFile(fileName)
  })
}

/**
 * 将文件夹压缩为ZIP
 * @param folderName 文件夹名称
 * @param files 文件列表
 * @returns ZIP文件的Blob
 */
export async function compressFolderToZip(folderName: string, files: File[]): Promise<{ blob: Blob; originalName: string }> {
  const zip = new JSZip()
  
  // 过滤垃圾文件
  const cleanFiles = filterJunkFiles(files)
  
  if (cleanFiles.length === 0) {
    throw new Error('文件夹中没有有效文件')
  }
  
  // 添加文件到ZIP，保持文件夹结构
  for (const file of cleanFiles) {
    let filePath = file.webkitRelativePath || file.name
    
    // 如果文件路径不包含文件夹前缀，添加它
    if (!filePath.startsWith(folderName + '/')) {
      filePath = folderName + '/' + filePath
    }
    
    // 确保中文文件名正确编码
    const fileBuffer = await file.arrayBuffer()
    zip.file(filePath, fileBuffer)
  }
  
  // 生成ZIP文件
  const blob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })
  
  return {
    blob,
    originalName: folderName
  }
}

/**
 * 获取文件夹中的文件数量（过滤后）
 */
export function getCleanFileCount(files: File[]): number {
  return filterJunkFiles(files).length
}

/**
 * 计算文件夹总大小（过滤后）
 */
export function getCleanFolderSize(files: File[]): number {
  const cleanFiles = filterJunkFiles(files)
  return cleanFiles.reduce((total, file) => total + file.size, 0)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 