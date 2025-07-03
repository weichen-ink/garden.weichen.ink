/**
 * 数字花园核心应用程序
 * 采用插件化架构，支持动态加载和配置
 */
class DigitalGarden {
  constructor(config = {}) {
    this.config = config;
    this.plugins = new Map();
    this.isInitialized = false;
    this.eventBus = new EventBus();
  }

  /**
   * 注册插件
   */
  registerPlugin(name, plugin) {
    if (typeof plugin.init !== 'function') {
      throw new Error(`Plugin ${name} must have an init method`);
    }
    
    this.plugins.set(name, {
      instance: plugin,
      enabled: true,
      config: this.config.plugins?.[name] || {}
    });
    
    // 如果应用已初始化，立即初始化插件
    if (this.isInitialized) {
      this.initializePlugin(name);
    }
  }

  /**
   * 启用/禁用插件
   */
  togglePlugin(name, enabled = true) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = enabled;
      if (enabled && this.isInitialized) {
        this.initializePlugin(name);
      } else if (!enabled && plugin.instance.destroy) {
        plugin.instance.destroy();
      }
    }
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // 初始化所有已注册的插件
      for (const [name, plugin] of this.plugins) {
        if (plugin.enabled) {
          await this.initializePlugin(name);
        }
      }
      
      this.isInitialized = true;
      this.eventBus.emit('app:initialized');
      console.log('Digital Garden initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Digital Garden:', error);
      this.eventBus.emit('app:error', error);
    }
  }

  /**
   * 初始化单个插件
   */
  async initializePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    try {
      await plugin.instance.init({
        app: this,
        eventBus: this.eventBus,
        config: plugin.config
      });
      console.log(`Plugin ${name} initialized`);
    } catch (error) {
      console.error(`Failed to initialize plugin ${name}:`, error);
    }
  }

  /**
   * 获取插件实例
   */
  getPlugin(name) {
    const plugin = this.plugins.get(name);
    return plugin?.instance;
  }
}

/**
 * 简单的事件总线
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

// ES模块导出
export { DigitalGarden, EventBus };