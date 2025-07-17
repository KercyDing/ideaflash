<script setup lang="ts">
import { ref } from 'vue'




</script>

<template>
  <div class="about-view">
    <!-- IdeaFlash 介绍 -->
    <section class="intro-section">
      <div class="container">
        <div class="intro-content">
          <div class="intro-text">
            <h1 class="intro-title">关于 IdeaFlash</h1>
            <h2 class="intro-name">闪念集，灵感闪现 ✨</h2>
            <p class="intro-description">
              IdeaFlash 是由 Kercy 创建的创意空间，专注于展示各种有趣的技术作品。
            </p>
            
          </div>
        </div>
      </div>
    </section>



    <!-- 技术栈 -->
    <section class="tech-section">
      <div class="container">
        <h2 class="section-title">技术栈</h2>
        <div class="tech-categories">
          <div class="tech-category">
            <h3 class="category-title">编程语言</h3>
            <div class="tech-tags">
              <span class="tech-tag">C/C++</span>
              <span class="tech-tag">Python</span>
              <span class="tech-tag">Java</span>
              <span class="tech-tag">Dart</span>
              <span class="tech-tag">TypeScript</span>
            </div>
          </div>
          <div class="tech-category">
            <h3 class="category-title">前端框架</h3>
            <div class="tech-tags">
              <span class="tech-tag">Vue3</span>
              <span class="tech-tag">Vite</span>
              <span class="tech-tag">Qt6</span>
              <span class="tech-tag">Flutter</span>
              <span class="tech-tag">Electron</span>
            </div>
          </div>

        </div>
      </div>
    </section>


  </div>
</template>

<style scoped>
.about-view {
  min-height: calc(100vh - 80px);
  padding-bottom: 4rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 个人介绍 */
.intro-section {
  padding: 5rem 0;
  background-color: var(--bg-primary);
}

.intro-section .container {
  background-color: var(--bg-secondary);
  border-radius: 1.5rem;
  padding: 3rem;
  border: 1px solid var(--border-color);
}

.intro-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  align-items: center;
}

.intro-title {
  font-size: 1rem;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.intro-name {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.intro-description {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}



/* 通用标题 */
.section-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  border-radius: 2px;
}



/* 技术栈 */
.tech-section {
  padding: 5rem 0;
  background-color: var(--bg-primary);
}

.tech-section .container {
  background-color: var(--bg-secondary);
  border-radius: 1.5rem;
  padding: 3rem;
  border: 1px solid var(--border-color);
}

.tech-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 3rem;
}

.tech-category {
  text-align: center;
}

.category-title {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.tech-tag {
  padding: 0.5rem 1rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  cursor: default;
}

.tech-tag:hover {
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  color: white;
  transform: translateY(-2px);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .intro-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  /* 移除 .intro-image 和 .logo-image 的样式 */
  .intro-section .container,
  .tech-section .container {
    padding: 2rem;
    border-radius: 1rem;
  }

  .tech-categories {
    grid-template-columns: 1fr;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
