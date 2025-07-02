// ES模块导入
import { Plugin } from '../core/Plugin.js';

/**
 * 预览功能插件 - 重构版本
 * 优化性能：内容缓存、防抖处理、减少DOM操作
 */
class PreviewPlugin extends Plugin {
  constructor() {
    super('preview');
    
    // 核心状态
    this.previewPopup = null;
    this.currentLink = null;
    this.isVisible = false;
    
    // 定时器管理
    this.showTimer = null;
    this.hideTimer = null;
    
    // 内容缓存系统
    this.contentCache = new Map();
    
    // 事件处理器 - 绑定this上下文
    // 减少防抖延迟，让响应更灵敏
    this.handleMouseOver = this.debounce(this.onMouseOver.bind(this), 50);
    this.handleMouseOut = this.debounce(this.onMouseOut.bind(this), 50);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    
    // 组件实例
    this.positioner = null;
    this.extractor = null;
  }

  getDefaultConfig() {
    return {
      showDelay: 300,
      hideDelay: 200,
      maxWidth: 480,
      maxHeight: 400,
      smallWidth: 280,
      smallHeight: 80,
      enableCache: true,
      cacheExpiry: 300000 // 5分钟
    };
  }

  async setup() {
    await super.setup();
    
    // 初始化组件
    this.positioner = new PreviewPositioner(this.config);
    this.extractor = new ContentExtractor();
    
    // 如果启用缓存，设置清理定时器
    if (this.config.enableCache) {
      this.setupCacheCleanup();
    }
  }

  cacheElements() {
    this.previewPopup = this.getElement('#note-preview');
    if (!this.previewPopup) {
      console.warn('PreviewPlugin: #note-preview element not found');
    }
  }

  bindEvents() {
    if (!this.previewPopup) return;

    // 使用事件委托，减少事件监听器数量
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);
    
    // 添加全局点击事件（处理关闭预览和反向链接点击）
    document.addEventListener('click', this.handleDocumentClick);
    
    // 预览窗口事件
    this.previewPopup.addEventListener('mouseenter', this.onPreviewEnter.bind(this));
    this.previewPopup.addEventListener('mouseleave', this.onPreviewLeave.bind(this));
    
    // 外部链接处理
    this.initializeExternalLinks();
  }

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 鼠标进入事件处理
  onMouseOver(e) {
    // 忽略预览窗口内的事件
    if (this.previewPopup && this.previewPopup.contains(e.target)) {
      return;
    }

    const targetElement = this.getTargetElement(e.target);
    if (!targetElement) return;

    // 如果是同一个链接，无需重新处理
    if (this.currentLink === targetElement) return;

    this.currentLink = targetElement;
    this.clearTimers();

    // 延迟显示预览
    this.showTimer = setTimeout(() => {
      this.showPreview(targetElement);
    }, this.config.showDelay);
  }

  // 鼠标离开事件处理
  onMouseOut(e) {
    // 忽略预览窗口内的事件
    if (this.previewPopup && this.previewPopup.contains(e.target)) {
      return;
    }

    const targetElement = this.getTargetElement(e.target);
    if (!targetElement) return;

    // 只要鼠标离开了任何链接元素，就启动隐藏计时器
    this.clearTimers();
    this.hideTimer = setTimeout(() => {
      if (!this.isMouseOverPreview()) {
        this.hidePreview();
      }
    }, this.config.hideDelay);
  }

  // 文档点击事件处理 - 处理预览关闭和反向链接点击
  handleDocumentClick(e) {
    // 处理反向链接卡片点击
    const backlinkItem = e.target.closest('.backlink-item');
    if (backlinkItem && backlinkItem.getAttribute('data-url')) {
      e.preventDefault();
      const url = backlinkItem.getAttribute('data-url');
      window.location.href = url;
      return;
    }

    // 如果点击的不是预览窗口或链接元素，立即关闭预览
    if (this.isVisible && 
        !this.previewPopup.contains(e.target) && 
        !this.getTargetElement(e.target)) {
      this.clearTimers();
      this.hidePreview();
    }
  }

  // 预览窗口鼠标进入
  onPreviewEnter() {
    this.clearTimers();
  }

  // 预览窗口鼠标离开
  onPreviewLeave() {
    this.hideTimer = setTimeout(() => {
      this.hidePreview();
    }, this.config.hideDelay);
  }


  // 清理所有定时器
  clearTimers() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  // 获取目标链接元素
  getTargetElement(target) {
    const internalLink = target.closest('.internal-link');
    
    if (internalLink) {
      // 检查是否有有效的链接地址
      if (internalLink.getAttribute('href') || internalLink.getAttribute('data-url')) {
        return internalLink;
      }
    }
    
    return null;
  }

  // 检查鼠标是否在预览窗口上
  isMouseOverPreview() {
    return this.previewPopup && this.previewPopup.matches(':hover');
  }

  // 显示预览
  async showPreview(linkElement) {
    const { noteTitle, linkUrl } = this.extractLinkInfo(linkElement);
    
    // 处理断开的链接
    if (linkElement.classList.contains('broken')) {
      this.displayPreview(this.getBrokenLinkContent(), linkElement, 'small');
      return;
    }

    try {
      // 尝试从缓存获取内容
      const previewContent = await this.getPreviewContent(linkUrl, noteTitle);
      
      if (previewContent && this.currentLink === linkElement) {
        this.displayPreview(previewContent, linkElement);
      }
    } catch (error) {
      console.warn('Failed to load preview:', error);
      if (this.currentLink === linkElement) {
        this.displayPreview(this.getErrorContent(), linkElement, 'small');
      }
    }
  }

  // 提取链接信息 - 优化版本
  extractLinkInfo(linkElement) {
    const noteTitle = linkElement.getAttribute('data-note-title') || 
                     linkElement.querySelector('.backlink-title')?.textContent?.trim() ||
                     linkElement.textContent.trim();
    
    const linkUrl = linkElement.getAttribute('data-url') || linkElement.href;
    
    return { noteTitle, linkUrl };
  }

  // 获取预览内容 - 带缓存
  async getPreviewContent(linkUrl, noteTitle) {
    if (!linkUrl) throw new Error('No URL provided');

    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.contentCache.get(linkUrl);
      if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
        return cached.content;
      }
    }

    // 获取新内容
    const response = await fetch(linkUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const content = this.extractor.extract(doc, linkUrl, noteTitle);
    
    // 缓存内容
    if (this.config.enableCache && content) {
      this.contentCache.set(linkUrl, {
        content,
        timestamp: Date.now()
      });
    }
    
    return content;
  }

  // 显示预览内容
  displayPreview(content, linkElement, size = 'normal') {
    if (!this.previewPopup) return;

    this.previewPopup.innerHTML = content;
    this.positioner.position(this.previewPopup, linkElement, size);
    
    // 使用requestAnimationFrame优化动画
    this.previewPopup.style.display = 'block';
    requestAnimationFrame(() => {
      this.previewPopup.classList.add('visible');
      this.isVisible = true;
    });
  }

  // 隐藏预览
  hidePreview() {
    if (!this.previewPopup || !this.isVisible) return;

    this.previewPopup.classList.remove('visible');
    this.isVisible = false;
    this.currentLink = null;
    
    // 延迟清理DOM，避免闪烁
    setTimeout(() => {
      if (!this.isVisible) {
        this.previewPopup.style.display = 'none';
        this.previewPopup.innerHTML = '';
      }
    }, 200);
  }

  // 断开链接内容
  getBrokenLinkContent() {
    return `
      <div class="preview-container preview-simple">
        <div class="preview-simple-content">
          <p class="preview-broken-message">抱歉，链接不存在 😅</p>
        </div>
      </div>
    `;
  }

  // 错误内容
  getErrorContent() {
    return `
      <div class="preview-container preview-simple">
        <div class="preview-simple-content">
          <p class="preview-error-message">内容加载失败，请点击链接访问</p>
        </div>
      </div>
    `;
  }

  // 初始化外部链接
  initializeExternalLinks() {
    // 使用事件委托，避免遍历所有链接
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (link.hostname !== window.location.hostname) {
          link.classList.add('external-link');
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    });
  }

  // 设置缓存清理
  setupCacheCleanup() {
    // 每30分钟清理一次过期缓存
    setInterval(() => {
      this.cleanupCache();
    }, 1800000);
  }

  // 清理过期缓存
  cleanupCache() {
    const now = Date.now();
    for (const [url, data] of this.contentCache.entries()) {
      if (now - data.timestamp > this.config.cacheExpiry) {
        this.contentCache.delete(url);
      }
    }
  }

  // 清理资源
  unbindEvents() {
    this.clearTimers();
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('mouseout', this.handleMouseOut);
    document.removeEventListener('click', this.handleDocumentClick);
    this.contentCache.clear();
  }
}

/**
 * 预览窗口定位器 - 优化版本
 */
class PreviewPositioner {
  constructor(config) {
    this.config = config;
  }

  position(previewPopup, linkElement, size = 'normal') {
    const rect = linkElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.pageXOffset,
      scrollY: window.pageYOffset
    };
    
    const dimensions = this.calculateDimensions(size, viewport);
    const position = this.calculatePosition(rect, dimensions, viewport);
    
    this.applyStyles(previewPopup, position, dimensions, size);
  }

  calculateDimensions(size, viewport) {
    if (size === 'small') {
      return {
        width: this.config.smallWidth,
        height: this.config.smallHeight
      };
    }
    
    return {
      width: Math.min(this.config.maxWidth, viewport.width * 0.9),
      height: Math.min(this.config.maxHeight, viewport.height * 0.8)
    };
  }

  calculatePosition(rect, dimensions, viewport) {
    const padding = 20;
    const offset = 15;
    
    // 默认右侧显示
    let left = rect.right + viewport.scrollX + offset;
    let top = rect.top + viewport.scrollY + (rect.height - dimensions.height) / 2;
    let position = 'right';
    
    // 检查空间并调整位置
    if (left + dimensions.width > viewport.width - padding) {
      // 右侧空间不足，尝试左侧
      if (rect.left - dimensions.width - offset > padding) {
        left = rect.left + viewport.scrollX - dimensions.width - offset;
        position = 'left';
      } else {
        // 左右都不行，显示在下方
        left = rect.left + viewport.scrollX + (rect.width - dimensions.width) / 2;
        top = rect.bottom + viewport.scrollY + offset;
        position = 'bottom';
      }
    }
    
    // 确保不超出边界
    left = Math.max(padding, Math.min(left, viewport.width - dimensions.width - padding));
    top = Math.max(viewport.scrollY + padding, 
                   Math.min(top, viewport.scrollY + viewport.height - dimensions.height - padding));
    
    return { left, top, position };
  }

  applyStyles(previewPopup, position, dimensions, size) {
    const styles = {
      left: position.left + 'px',
      top: position.top + 'px',
      width: dimensions.width + 'px'
    };

    if (size === 'small') {
      styles.height = dimensions.height + 'px';
      styles.maxHeight = 'none';
    } else {
      styles.height = 'auto';
      styles.maxHeight = dimensions.height + 'px';
    }

    Object.assign(previewPopup.style, styles);
    previewPopup.setAttribute('data-position', position.position);
  }
}

/**
 * 内容提取器 - 优化版本
 */
class ContentExtractor {
  constructor() {
    // 缓存选择器和清理规则
    this.contentSelectors = [
      '.article-content',
      '.home-content', 
      '.main-article .note-content',  // 更精确的选择器放前面
      '.note-content',                // 更宽泛的选择器放后面
      '.main-article',
      '.list-content',
      'main article',
      'main'
    ];

    this.cleanupSelectors = [
      '.direct-link',
      '.back-to-top',
      'script',
      'style',
      '.search-container',
      '.breadcrumb-nav',
      '.site-header',
      '.site-footer'
    ];
  }

  extract(doc, linkUrl, noteTitle) {
    const mainContent = this.findMainContent(doc);
    
    if (!mainContent) {
      throw new Error('No content found');
    }
    
    const contentClone = mainContent.cloneNode(true);
    this.cleanContent(contentClone, linkUrl);
    
    return this.shouldUseFullPreview(mainContent) 
      ? this.buildFullPreview(contentClone)
      : this.buildSimplePreview(contentClone, linkUrl, noteTitle);
  }

  findMainContent(doc) {
    for (const selector of this.contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  shouldUseFullPreview(mainContent) {
    return mainContent && 
           ['article-content', 'home-content'].some(cls => 
             mainContent.classList.contains(cls)
           );
  }

  cleanContent(contentClone, linkUrl) {
    // 批量删除不需要的元素
    this.cleanupSelectors.forEach(selector => {
      contentClone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // 优化链接处理
    contentClone.querySelectorAll('a').forEach(link => {
      link.removeAttribute('onmouseover');
      link.removeAttribute('onmouseout');
      if (link.classList.contains('internal-link')) {
        link.setAttribute('target', '_blank');
      }
    });
    
    // 处理懒加载图片
    contentClone.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
    
    // 优化标题处理
    const noteTitle = contentClone.querySelector('.note-title');
    if (noteTitle) {
      const titleText = noteTitle.textContent.trim();
      noteTitle.innerHTML = `<a href="${linkUrl}" target="_blank" class="preview-title-link">${titleText}</a>`;
    }
  }

  buildFullPreview(contentClone) {
    return `
      <div class="preview-container">
        <div class="preview-content">
          ${contentClone.outerHTML}
        </div>
      </div>
    `;
  }

  buildSimplePreview(contentClone, linkUrl, noteTitle) {
    const articleClasses = contentClone.className || '';
    
    return `
      <div class="preview-container">
        <div class="preview-content">
          <h3 class="preview-title">
            <a href="${linkUrl}" class="preview-title-link">${noteTitle}</a>
          </h3>
          <hr class="preview-divider">
          <div class="article-content ${articleClasses}">
            <div class="note-content">
              ${contentClone.innerHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ES模块导出
export { PreviewPlugin, PreviewPositioner, ContentExtractor };