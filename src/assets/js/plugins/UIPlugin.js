// ES模块导入
import { Plugin } from '../core/Plugin.js';

/**
 * UI交互插件
 */
class UIPlugin extends Plugin {
  constructor() {
    super('ui');
    this.backToTopButton = null;
    this.scrollHandler = null;
  }

  getDefaultConfig() {
    return {
      backToTopThreshold: 300,
      copySuccessClass: 'copy-success',
      copyErrorClass: 'copy-error',
      copyTimeout: 2000
    };
  }

  cacheElements() {
    this.elements = {
      backToTop: this.getElement('#back-to-top'),
      navList: this.getElement('.nav-list'),
      mobileToggle: this.getElement('.mobile-nav-toggle'),
      sidebar: this.getElement('.sidebar'),
      mainArticle: this.getElement('.main-article')
    };
  }

  bindEvents() {
    this.initializeBackToTop();
    this.initializeMobileNav();
    this.initializeCopyLinks();
    this.initializeSidebarHeightAdjustment();
  }

  initializeBackToTop() {
    if (!this.elements.backToTop) return;

    // 使用节流的滚动处理器
    this.scrollHandler = this.throttle(() => {
      if (window.pageYOffset > this.config.backToTopThreshold) {
        this.elements.backToTop.classList.add('visible');
      } else {
        this.elements.backToTop.classList.remove('visible');
      }
    }, 100);

    window.addEventListener('scroll', this.scrollHandler);
    this.eventBus.emit('ui:backToTopInitialized');
  }

  initializeMobileNav() {
    if (!this.elements.navList) return;
    
    // 点击其他地方关闭移动端菜单
    document.addEventListener('click', (e) => {
      if (this.elements.mobileToggle && 
          !this.elements.mobileToggle.contains(e.target) && 
          !this.elements.navList.contains(e.target)) {
        this.elements.navList.classList.remove('show');
      }
    });
    
    this.eventBus.emit('ui:mobileNavInitialized');
  }

  initializeCopyLinks() {
    const directLinks = this.getElements('.direct-link');
    
    directLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const originalText = link.textContent;
        const fullUrl = window.location.href.split('#')[0] + link.getAttribute('href');
        
        try {
          await this.copyToClipboard(fullUrl);
          this.showCopySuccess(link, originalText);
          this.eventBus.emit('ui:copySuccess', { url: fullUrl });
        } catch (err) {
          this.showCopyError(link, originalText);
          this.eventBus.emit('ui:copyError', { url: fullUrl, error: err });
        }
      });
    });
    
    this.eventBus.emit('ui:copyLinksInitialized', { count: directLinks.length });
  }

  initializeSidebarHeightAdjustment() {
    if (!this.elements.sidebar) return;

    // 初始调整
    this.adjustSidebarHeight();
    
    // 监听窗口大小变化
    this.resizeHandler = this.throttle(() => {
      this.adjustSidebarHeight();
    }, 200);
    
    window.addEventListener('resize', this.resizeHandler);
    
    // 监听DOM内容变化（例如反向链接的加载）
    if ('ResizeObserver' in window) {
      this.sidebarObserver = new ResizeObserver(() => {
        this.adjustSidebarHeight();
      });
      this.sidebarObserver.observe(this.elements.sidebar);
    }
    
    this.eventBus.emit('ui:sidebarHeightInitialized');
  }

  adjustSidebarHeight() {
    if (!this.elements.sidebar || !this.elements.mainArticle) return;
    
    // 获取主文章高度
    const articleHeight = this.elements.mainArticle.offsetHeight;
    
    // 获取侧边栏内容高度
    const sidebarContent = this.elements.sidebar.scrollHeight;
    
    // 获取视口高度
    const viewportHeight = window.innerHeight;
    
    // 计算可用高度（考虑顶部间距）
    const availableHeight = viewportHeight - 48; // var(--space-6) 约等于 24px * 2
    
    // 移除所有现有的高度相关类
    this.elements.sidebar.classList.remove('expanded', 'has-long-content');
    
    // 根据内容长度和文章高度决定侧边栏高度策略
    if (sidebarContent > availableHeight * 0.8) {
      // 侧边栏内容较多时，使用较大的最大高度
      this.elements.sidebar.classList.add('has-long-content');
    } else if (articleHeight > viewportHeight && sidebarContent > availableHeight * 0.6) {
      // 文章较长且侧边栏内容中等时，扩展侧边栏
      this.elements.sidebar.classList.add('expanded');
    }
    
    // 对于非常长的文章，确保侧边栏可以充分利用空间
    if (articleHeight > viewportHeight * 1.5) {
      this.elements.sidebar.classList.add('expanded');
    }
  }

  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // 兼容方案
      return this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }

  showCopySuccess(link, originalText) {
    const checkmark = this.getCJKCheckmark();
    
    link.textContent = checkmark;
    link.style.color = '#22c55e';
    link.classList.add(this.config.copySuccessClass);
    
    setTimeout(() => {
      link.textContent = originalText;
      link.style.color = '';
      link.classList.remove(this.config.copySuccessClass);
    }, this.config.copyTimeout);
  }

  showCopyError(link, originalText) {
    link.textContent = '✗';
    link.style.color = '#ef4444';
    link.classList.add(this.config.copyErrorClass);
    
    setTimeout(() => {
      link.textContent = originalText;
      link.style.color = '';
      link.classList.remove(this.config.copyErrorClass);
    }, this.config.copyTimeout);
  }

  getCJKCheckmark() {
    const lang = document.documentElement.lang || navigator.language || 'en';
    
    if (lang.startsWith('zh') || lang.startsWith('ja') || lang.startsWith('ko')) {
      return '✓';
    }
    
    return '✓';
  }

  // 公开方法，供全局函数调用
  toggleMobileNav() {
    if (this.elements.navList) {
      this.elements.navList.classList.toggle('show');
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 公开方法，供其他插件或外部代码调用
  refreshSidebarHeight() {
    this.adjustSidebarHeight();
  }

  unbindEvents() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    if (this.sidebarObserver) {
      this.sidebarObserver.disconnect();
      this.sidebarObserver = null;
    }
  }
}

// ES模块导出
export { UIPlugin };