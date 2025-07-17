<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

// 作品类型
type InspirationCategory = 'all' | 'animation' | 'tool' | 'game' | 'visual' | 'experiment'

// 作品数据接口
interface Inspiration {
  id: number
  title: string
  description: string
  category: InspirationCategory
  tags: string[]
  demo: string
  thumbnail: string
  createdAt: string
  difficulty: 'easy' | 'medium' | 'hard'
  likes: number
}

// 作品数据 - 暂时清空，后续填充
const inspirations = ref<Inspiration[]>([])

// 当前选中的分类
const selectedCategory = ref<InspirationCategory>('all')

// 排序方式
const sortBy = ref<'latest' | 'popular'>('latest')

// 分类选项
const categories = [
  { value: 'all', label: '全部', icon: '🎯' },
  { value: 'animation', label: '动画', icon: '✨' },
  { value: 'tool', label: '工具', icon: '🛠️' },
  { value: 'game', label: '游戏', icon: '🎮' },
  { value: 'visual', label: '视觉', icon: '🎨' },
  { value: 'experiment', label: '实验', icon: '🧪' }
]

// 筛选和排序后的作品
const filteredInspirations = computed(() => {
  let filtered = inspirations.value

  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(item => item.category === selectedCategory.value)
  }

  // 排序
  if (sortBy.value === 'latest') {
    filtered = [...filtered].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } else {
    filtered = [...filtered].sort((a, b) => b.likes - a.likes)
  }

  return filtered
})

// 获取难度标签颜色
const getDifficultyColor = (difficulty: string) => {
  const colors = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444'
  }
  return colors[difficulty as keyof typeof colors] || '#6b7280'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}
</script>

<template>
  <div class="inspiration-page">
    <div class="hero-section">
      <div class="container">
        <h1 class="hero-title">
          <span class="gradient-text">创意作品</span>
        </h1>
        <p class="hero-subtitle">探索技术与创意的完美融合</p>
      </div>
    </div>

    <div class="projects-section">
      <div class="container">
        <div class="projects-grid">
          <!-- WebShareX 项目卡片 -->
          <div class="project-card featured">
            <div class="project-image">
              <div class="project-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17,8 12,3 7,8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                  <path d="M3 12h6m6 0h6"/>
                </svg>
              </div>
            </div>
            <div class="project-content">
              <h3 class="project-title">WebShareX</h3>
              <p class="project-description">
                跨平台文件共享系统，通过匹配码实现设备间安全的文件传输
              </p>
              <div class="project-tags">
                <span class="tag">Vue 3</span>
                <span class="tag">TypeScript</span>
                <span class="tag">文件传输</span>
                <span class="tag">实时通信</span>
        </div>
              <div class="project-actions">
                <RouterLink to="/inspiration/websharex" class="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15,3 21,3 21,9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  开始使用
                </RouterLink>
              </div>
            </div>
              </div>

          <!-- 即将推出的项目占位 -->
          <div class="project-card coming-soon">
            <div class="project-image">
              <div class="project-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                  </svg>
              </div>
            </div>
            <div class="project-content">
              <h3 class="project-title">更多项目</h3>
              <p class="project-description">更多精彩的创意项目正在开发中...</p>
              <div class="project-tags">
                <span class="tag">即将推出</span>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inspiration-page {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.hero-section {
  padding: 8rem 0 4rem;
  text-align: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.projects-section {
  padding: 4rem 0;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.project-card {
  background: var(--bg-secondary);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.project-card.featured {
  border: 2px solid var(--primary-color);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.project-card.coming-soon {
  opacity: 0.7;
}

.project-card.coming-soon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
  pointer-events: none;
}

.project-image {
  text-align: center;
  margin-bottom: 1.5rem;
}

.project-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  border-radius: 1rem;
  color: white;
  margin-bottom: 1rem;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.project-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tag {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.project-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-primary);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .project-card {
    padding: 1.5rem;
  }

  .container {
    padding: 0 1rem;
  }
}
</style> 