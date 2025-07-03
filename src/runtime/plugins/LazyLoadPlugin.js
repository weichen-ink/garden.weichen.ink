// ES模块导入
import { Plugin } from '../core/Plugin.js';

/**
 * 懒加载插件
 */
class LazyLoadPlugin extends Plugin {
  constructor() {
    super('lazyLoad');
    this.observer = null;
  }

  getDefaultConfig() {
    return {
      rootMargin: '50px',
      selector: 'img[data-src]',
      threshold: 0.1
    };
  }

  bindEvents() {
    this.initializeLazyLoading();
  }

  initializeLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold
    });

    const lazyImages = this.getElements(this.config.selector);
    lazyImages.forEach(img => this.observer.observe(img));
    
    this.eventBus.emit('lazyLoad:initialized', { count: lazyImages.length });
  }

  loadImage(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;

    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      img.src = src;
      img.classList.add('lazy-loaded');
      img.removeAttribute('data-src');
      this.eventBus.emit('lazyLoad:imageLoaded', { img, src });
    };
    
    imageLoader.onerror = () => {
      img.classList.add('lazy-error');
      console.warn('图片加载失败:', src);
      this.eventBus.emit('lazyLoad:imageError', { img, src });
    };
    
    imageLoader.src = src;
  }

  loadAllImages() {
    const lazyImages = this.getElements(this.config.selector);
    lazyImages.forEach(img => this.loadImage(img));
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    super.destroy();
  }
}

// ES模块导出
export { LazyLoadPlugin };