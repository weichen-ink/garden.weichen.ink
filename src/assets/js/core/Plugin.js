/**
 * 插件基类
 * 所有插件都应该继承此类
 */
class Plugin {
  constructor(name) {
    this.name = name;
    this.app = null;
    this.eventBus = null;
    this.config = {};
    this.elements = {};
  }

  /**
   * 初始化插件
   * 子类必须实现此方法
   */
  async init({ app, eventBus, config }) {
    this.app = app;
    this.eventBus = eventBus;
    this.config = { ...this.getDefaultConfig(), ...config };
    
    await this.setup();
  }

  /**
   * 设置插件
   * 子类可以重写此方法
   */
  async setup() {
    this.cacheElements();
    this.bindEvents();
  }

  /**
   * 缓存DOM元素
   * 子类可以重写此方法
   */
  cacheElements() {
    // 由子类实现
  }

  /**
   * 绑定事件
   * 子类可以重写此方法
   */
  bindEvents() {
    // 由子类实现
  }

  /**
   * 获取默认配置
   * 子类可以重写此方法
   */
  getDefaultConfig() {
    return {};
  }

  /**
   * 销毁插件
   * 子类可以重写此方法进行清理
   */
  destroy() {
    // 移除事件监听器
    this.unbindEvents();
    
    // 清理DOM元素引用
    this.elements = {};
    
    console.log(`Plugin ${this.name} destroyed`);
  }

  /**
   * 解绑事件
   * 子类可以重写此方法
   */
  unbindEvents() {
    // 由子类实现
  }

  /**
   * 工具方法：安全获取DOM元素
   */
  getElement(selector) {
    return document.querySelector(selector);
  }

  /**
   * 工具方法：安全获取多个DOM元素
   */
  getElements(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * 工具方法：防抖
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  /**
   * 工具方法：节流
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// ES模块导出
export { Plugin };