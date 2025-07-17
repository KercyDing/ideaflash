<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isVisible = ref(false)







onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

const navigateToInspiration = () => {
  router.push('/inspiration')
}
</script>

<template>
  <div class="home-view">
    <!-- 英雄区域 -->
    <section class="hero" :class="{ visible: isVisible }">
      <!-- 几何图形 -->
      <div class="geometric-shapes">
        <div class="shape triangle"></div>
        <div class="shape square"></div>
        <div class="shape circle"></div>
        <div class="shape hexagon"></div>
        <div class="shape diamond"></div>
        <div class="shape pentagon"></div>
        <div class="shape star"></div>
        <div class="shape rectangle"></div>
        <div class="shape circle-large"></div>
        <div class="shape triangle-large"></div>
      </div>
      
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            欢迎来到 <span class="highlight">IdeaFlash</span>
          </h1>
          <p class="hero-subtitle">
            Kercy的闪念集 - 灵感闪现的地方
          </p>
          <p class="hero-description">
            这里是一个充满创意和想象力的数字空间，汇集了各种有趣的项目、创新的想法和技术实验。探索无限可能，让每一个创意都能闪闪发光。
          </p>
          <div class="hero-actions">
            <button @click="navigateToInspiration" class="btn btn-primary">
              探索作品
            </button>
            <button @click="() => $router.push('/about')" class="btn btn-secondary">
            关于
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="code-window">
            <div class="window-header">
              <span class="window-dot red"></span>
              <span class="window-dot yellow"></span>
              <span class="window-dot green"></span>
            </div>
            <pre class="code-content"><code><span class="keyword">const</span> <span class="variable">ideaFlash</span> = {
  <span class="property">name</span>: <span class="string">'IdeaFlash'</span>,
  <span class="property">creator</span>: <span class="string">'Kercy'</span>,
  <span class="property">mission</span>: [<span class="string">'创新'</span>, <span class="string">'创意'</span>, <span class="string">'分享'</span>],
  <span class="property">isInspiring</span>: <span class="boolean">true</span>
};</code></pre>
          </div>
        </div>
      </div>
    </section>





    <!-- 作者信息 -->
    <section class="author-section">
      <div class="container">
          <div class="author-info">
          <a href="https://github.com/KercyDing" target="_blank" rel="noopener noreferrer" class="github-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
        </div>
      </div>
    </section>


  </div>
</template>

<style scoped>
.home-view {
  min-height: calc(100vh - 80px);
}

/* 英雄区域 */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 2rem;
  background-color: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

/* 添加额外的动画元素 */
.hero::after {
  content: '';
  position: absolute;
  top: 10%;
  left: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 8s ease-in-out infinite;
}

.dark .hero::after {
  background: radial-gradient(circle, rgba(196, 181, 253, 0.15) 0%, transparent 70%);
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1) translateY(0px);
    opacity: 0.6;
  }
  50% { 
    transform: scale(1.2) translateY(-20px);
    opacity: 1;
  }
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  animation: float 15s ease-in-out infinite;
}

.dark .hero::before {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, transparent 70%);
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(60px, -40px) rotate(90deg); }
  50% { transform: translate(-40px, 80px) rotate(180deg); }
  75% { transform: translate(-80px, -60px) rotate(270deg); }
}



/* 几何图形动画 */
.hero .geometric-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.hero .shape {
  position: absolute;
  border: 2px solid;
  opacity: 0.3;
}

/* 基础几何图形 - 更大更明显 */
.hero .triangle {
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 40px solid transparent;
  border-bottom-color: var(--primary-color);
  border-style: solid;
  top: 15%;
  right: 12%;
  animation: rotate-shape 20s linear infinite;
  opacity: 0.4;
}

.hero .square {
  width: 40px;
  height: 40px;
  border: 3px solid #8b5cf6;
  background: transparent;
  top: 65%;
  left: 8%;
  animation: float-square 16s ease-in-out infinite;
  transform-origin: center;
}

.hero .circle {
  width: 50px;
  height: 50px;
  border: 3px solid #06b6d4;
  border-radius: 50%;
  background: transparent;
  top: 35%;
  right: 20%;
  animation: scale-shape 12s ease-in-out infinite;
}

.hero .hexagon {
  width: 40px;
  height: 24px;
  border: 3px solid #f59e0b;
  background: transparent;
  position: relative;
  top: 55%;
  right: 8%;
  animation: float-hexagon 18s ease-in-out infinite;
}

/* 新增几何图形 */
.hero .diamond {
  width: 35px;
  height: 35px;
  border: 3px solid #ef4444;
  background: transparent;
  transform: rotate(45deg);
  top: 20%;
  left: 25%;
  animation: rotate-diamond 14s ease-in-out infinite;
}

.hero .pentagon {
  width: 45px;
  height: 45px;
  border: 3px solid #10b981;
  background: transparent;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  top: 75%;
  right: 30%;
  animation: float-pentagon 22s ease-in-out infinite;
}

.hero .star {
  width: 40px;
  height: 40px;
  border: 3px solid #f59e0b;
  background: transparent;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  top: 25%;
  left: 5%;
  animation: twinkle-star 10s ease-in-out infinite;
}

.hero .rectangle {
  width: 60px;
  height: 30px;
  border: 3px solid #8b5cf6;
  background: transparent;
  top: 45%;
  left: 15%;
  animation: slide-rectangle 18s ease-in-out infinite;
}

.hero .circle-large {
  width: 80px;
  height: 80px;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  background: transparent;
  top: 8%;
  left: 60%;
  animation: breathe-circle 16s ease-in-out infinite;
  opacity: 0.3;
}

.hero .triangle-large {
  width: 0;
  height: 0;
  border-left: 35px solid transparent;
  border-right: 35px solid transparent;
  border-bottom: 60px solid transparent;
  border-bottom-color: #06b6d4;
  top: 70%;
  right: 5%;
  animation: sway-triangle 20s ease-in-out infinite;
  opacity: 0.4;
}

.hero .hexagon:before,
.hero .hexagon:after {
  content: "";
  position: absolute;
  width: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
}

.hero .hexagon:before {
  bottom: 100%;
  border-bottom: 7px solid #f59e0b;
}

.hero .hexagon:after {
  top: 100%;
  border-top: 7px solid #f59e0b;
}

@keyframes rotate-shape {
  0% { transform: rotate(0deg) translateY(0px); }
  50% { transform: rotate(180deg) translateY(-30px); }
  100% { transform: rotate(360deg) translateY(0px); }
}

@keyframes float-square {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.3;
  }
  33% { 
    transform: translate(-40px, -60px) rotate(120deg) scale(1.2);
    opacity: 0.6;
  }
  66% { 
    transform: translate(60px, -30px) rotate(240deg) scale(0.8);
    opacity: 0.4;
  }
}

@keyframes scale-shape {
  0%, 100% { 
    transform: scale(1) translateY(0px);
    opacity: 0.3;
  }
  50% { 
    transform: scale(1.5) translateY(-40px);
    opacity: 0.7;
  }
}

@keyframes float-hexagon {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  25% { 
    transform: translate(-60px, -30px) rotate(60deg);
    opacity: 0.7;
  }
  50% { 
    transform: translate(-30px, -60px) rotate(120deg);
    opacity: 0.6;
  }
  75% { 
    transform: translate(30px, -30px) rotate(180deg);
    opacity: 0.5;
  }
}

/* 新增动画效果 */
@keyframes rotate-diamond {
  0%, 100% { 
    transform: rotate(45deg) scale(1);
    opacity: 0.4;
  }
  50% { 
    transform: rotate(225deg) scale(1.2);
    opacity: 0.7;
  }
}

@keyframes float-pentagon {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  33% { 
    transform: translate(-40px, -50px) rotate(72deg);
    opacity: 0.6;
  }
  66% { 
    transform: translate(60px, -30px) rotate(144deg);
    opacity: 0.5;
  }
}

@keyframes twinkle-star {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    opacity: 0.4;
  }
  25% { 
    transform: scale(1.3) rotate(36deg);
    opacity: 0.8;
  }
  50% { 
    transform: scale(0.8) rotate(72deg);
    opacity: 0.6;
  }
  75% { 
    transform: scale(1.1) rotate(108deg);
    opacity: 0.7;
  }
}

@keyframes slide-rectangle {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  50% { 
    transform: translate(-80px, -40px) rotate(45deg);
    opacity: 0.7;
  }
}

@keyframes breathe-circle {
  0%, 100% { 
    transform: scale(1);
    opacity: 0.3;
  }
  50% { 
    transform: scale(1.4);
    opacity: 0.6;
  }
}

@keyframes sway-triangle {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  25% { 
    transform: translate(-30px, -20px) rotate(30deg);
    opacity: 0.6;
  }
  75% { 
    transform: translate(30px, -20px) rotate(-30deg);
    opacity: 0.5;
  }
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-text {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease;
}

.hero.visible .hero-text {
  opacity: 1;
  transform: translateY(0);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.hero-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--border-color);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* 代码窗口 */
.hero-visual {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease 0.3s;
}

.hero.visible .hero-visual {
  opacity: 1;
  transform: translateY(0);
}

.code-window {
  background-color: #1e293b;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  transform: translateY(0);
}

.code-window:hover {
  transform: translateY(-10px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.dark .code-window {
  background-color: #ffffff;
}

.window-header {
  background-color: #0f172a;
  padding: 0.75rem 1rem;
  display: flex;
  gap: 0.5rem;
}

.dark .window-header {
  background-color: #f1f5f9;
}

.window-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.window-dot.red { background-color: #ef4444; }
.window-dot.yellow { background-color: #f59e0b; }
.window-dot.green { background-color: #10b981; }

.code-content {
  padding: 1.5rem;
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #e2e8f0;
}

.dark .code-content {
  color: #1e293b;
}

.keyword { color: #c084fc; }
.dark .keyword { color: #8b5cf6; }

.variable { color: #60a5fa; }
.dark .variable { color: #3b82f6; }

.property { color: #94a3b8; }
.dark .property { color: #64748b; }

.string { color: #86efac; }
.dark .string { color: #059669; }

.boolean { color: #fbbf24; }
.dark .boolean { color: #d97706; }

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}



/* 作者信息 */
.author-section {
  padding: 1rem 0;
  background-color: var(--bg-primary);
}

.author-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

.github-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--text-primary);
  color: var(--bg-primary);
  text-decoration: none;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.github-icon:hover {
  background-color: var(--primary-color);
  opacity: 1;
  transform: scale(1.1);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .hero-visual {
    display: none;
  }

  /* 移动端几何图形优化 */
  .hero .triangle,
  .hero .hexagon,
  .hero .triangle-large {
    transform: scale(0.6); /* 缩小大型几何图形 */
  }

  .hero .square,
  .hero .circle,
  .hero .diamond,
  .hero .star,
  .hero .rectangle {
    transform: scale(0.7);
  }

  .hero .pentagon {
    transform: scale(0.6);
  }

  .hero .circle-large {
    transform: scale(0.5); /* 大圆形在移动端显著缩小 */
  }

  /* 移动端隐藏部分复杂图形 */
  .hero .pentagon,
  .hero .star,
  .hero .rectangle {
    display: none;
  }

  .github-icon {
    width: 32px;
    height: 32px;
  }
}

/* 暗黑模式下的几何图形优化 */
.dark .hero .triangle,
.dark .hero .triangle-large {
  border-bottom-color: #60a5fa;
  }

.dark .hero .square {
  border-color: #a78bfa;
  }

.dark .hero .circle,
.dark .hero .circle-large {
  border-color: #22d3ee;
  }

.dark .hero .hexagon {
  border-color: #fcd34d;
}

.dark .hero .hexagon:before,
.dark .hero .hexagon:after {
  border-bottom-color: #fcd34d;
  border-top-color: #fcd34d;
}

.dark .hero .diamond {
  border-color: #f87171;
}

.dark .hero .pentagon {
  border-color: #34d399;
  }

.dark .hero .star {
  border-color: #fcd34d;
}

.dark .hero .rectangle {
  border-color: #c084fc;
}
</style>
