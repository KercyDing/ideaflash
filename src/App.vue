<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useTheme } from './composables/useTheme'

const { isDark, toggleTheme } = useTheme()
const isMenuOpen = ref(false)
const scrolled = ref(false)

const handleScroll = (): void => {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div id="app" :class="{ 'dark': isDark }">
    <!-- 导航栏 -->
    <nav class="navbar" :class="{ 'scrolled': scrolled }">
      <div class="nav-container">
        <RouterLink to="/" class="logo">
          <img src="@/assets/images/logo/logo.svg" alt="IdeaFlash" class="logo-image">
          <div class="logo-text-container">
            <span class="logo-text">IdeaFlash</span>
            <span class="logo-subtitle">闪念集</span>
          </div>
        </RouterLink>

        <!-- 桌面端导航 -->
        <div class="nav-links desktop-nav">
          <RouterLink to="/" class="nav-link">首页</RouterLink>
          <RouterLink to="/inspiration" class="nav-link">作品</RouterLink>
          <RouterLink to="/about" class="nav-link">关于</RouterLink>
          
          <!-- 主题切换按钮 -->
          <button @click="toggleTheme" class="theme-toggle" aria-label="切换主题">
            <!-- 明亮模式时显示月亮图标 -->
            <svg v-if="!isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <!-- 暗黑模式时显示太阳图标 -->
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>
        </div>

        <!-- 移动端菜单按钮 -->
        <button @click="isMenuOpen = !isMenuOpen" class="mobile-menu-btn" aria-label="菜单">
          <span class="hamburger" :class="{ 'active': isMenuOpen }"></span>
        </button>
      </div>

      <!-- 移动端菜单 -->
      <transition name="menu-slide">
        <div v-if="isMenuOpen" class="mobile-menu">
          <RouterLink to="/" class="mobile-link" @click="isMenuOpen = false">首页</RouterLink>
          <RouterLink to="/inspiration" class="mobile-link" @click="isMenuOpen = false">作品</RouterLink>
          <RouterLink to="/about" class="mobile-link" @click="isMenuOpen = false">关于</RouterLink>
        </div>
      </transition>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-container">
        <p>&copy; 2025 IdeaFlash. Created by Kercy.</p>

      </div>
    </footer>
  </div>
</template>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.dark {
  --primary-color: #60a5fa;
  --primary-hover: #3b82f6;
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #374151;
}

#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;
}

/* 导航栏样式 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  z-index: 1000;
  transition: all 0.3s ease;
}

.navbar.scrolled {
  box-shadow: var(--shadow-md);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-image {
  width: 32px;
  height: 32px;
  transition: transform 0.3s ease;
}

.logo:hover .logo-image {
  transform: scale(1.1);
}

.logo-text-container {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: -0.25rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 0.3s;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary-color);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary-color);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.nav-link.router-link-active::after {
  transform: scaleX(1);
}

/* 主题切换按钮 */
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-secondary);
  transition: color 0.3s;
}

.theme-toggle:hover {
  color: var(--primary-color);
}

/* 移动端菜单 */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.hamburger {
  display: block;
  width: 24px;
  height: 2px;
  background-color: var(--text-primary);
  position: relative;
  transition: all 0.3s;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background-color: var(--text-primary);
  transition: all 0.3s;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

.hamburger.active {
  transform: rotate(45deg);
}

.hamburger.active::before {
  top: 0;
  transform: rotate(90deg);
}

.hamburger.active::after {
  top: 0;
  transform: rotate(0);
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
}

.mobile-link {
  display: block;
  padding: 0.75rem 2rem;
  text-decoration: none;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.mobile-link:hover,
.mobile-link.router-link-active {
  color: var(--primary-color);
  background-color: var(--bg-secondary);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  margin-top: 80px;
  min-height: calc(100vh - 160px);
}

/* 页脚 */
.footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 菜单滑动动画 */
.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: all 0.3s ease;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .nav-container {
    padding: 1rem;
  }

  .logo {
    gap: 0.5rem;
  }

  .logo-image {
    width: 28px;
    height: 28px;
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .logo-subtitle {
    font-size: 0.75rem;
  }

  .main-content {
    margin-top: 70px;
  }

  .footer-container {
    padding: 0 1rem;
  }
}
</style>
