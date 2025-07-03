/**
 * WikilinkPlugin - 支持Obsidian Wikilink格式的Eleventy插件
 * 
 * 🔗 重构版本 - 模块化架构
 * - 职责分离，代码清晰
 * - 统一缓存管理
 * - 配置外部化
 * - 更好的错误处理
 * 
 * 支持的格式：
 * - [[标题]] - 基本wikilink（大小写不敏感）
 * - [[标题|显示文本]] - 自定义显示文本
 * - [[标题#锚点]] - 链接到标题
 * - ![[图片]] - 嵌入图片（大小写不敏感）
 * - ![[文件]] - 嵌入文件
 * 
 * 🔍 大小写不敏感特性：
 * - [[github]] 和 [[Github]] 会指向同一个文件
 * - [[CRM 模板]] 和 [[crm 模板]] 会被识别为同一个文件
 * - 中英文混用的文件名也支持大小写不敏感匹配
 */

// 导入模块化组件
const CacheManager = require('./core/CacheManager');
const FileSearcher = require('./core/FileSearcher');
const DuplicateDetector = require('./core/DuplicateDetector');
const LinkProcessor = require('./core/LinkProcessor');
const { imageExtensions, fileExtensions } = require('./config/file-extensions');

/**
 * WikilinkPlugin类 - 重构版本
 */
class WikilinkPlugin {
  constructor(options = {}) {
    this.options = {
      // 默认配置
      contentDir: "content",
      imageExtensions,
      fileExtensions,
      ...options
    };

    // 初始化模块化组件
    this.cacheManager = new CacheManager();
    this.fileSearcher = new FileSearcher(this.cacheManager, this.options.fileExtensions);
    this.duplicateDetector = new DuplicateDetector(this.fileSearcher, this.cacheManager, this.options);
    this.linkProcessor = new LinkProcessor(this.fileSearcher, this.options);
  }

  /**
   * Eleventy插件配置函数
   */
  configFunction(eleventyConfig) {
    // 添加wikilink过滤器
    eleventyConfig.addFilter("wikilink", (content, collections) => {
      return this.linkProcessor.processWikilinks(content, collections);
    });
    
    // 重名检测现在由主系统手动触发，避免重复检测
    // 保持安静模式，不输出注册信息
  }
  
  /**
   * 执行全面的重名检测
   */
  performDuplicateCheck() {
    this.duplicateDetector.performDuplicateCheck();
  }

  /**
   * 清理所有缓存
   */
  clearCaches() {
    this.cacheManager.clearAll();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * 搜索文件（对外接口）
   */
  findFile(fileName) {
    return this.fileSearcher.findFile(fileName, this.options.contentDir);
  }

  /**
   * 检查是否为支持的文件类型
   */
  isSupportedFile(fileName) {
    return this.options.fileExtensions.test(fileName);
  }

  /**
   * 检查是否为图片文件
   */
  isImageFile(fileName) {
    return this.options.imageExtensions.test(fileName);
  }
}

/**
 * 向后兼容的全局函数
 * 保持与旧代码的兼容性
 */
let globalPluginInstance = null;

// 简化的警告收集系统（向后兼容）
const getGlobalCollector = () => ({
  addWarning: (source, message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${source}] ${message}`);
    }
  }
});

// 向后兼容的文件搜索函数
function findImagePath(imageName, contentDir = "content") {
  if (!globalPluginInstance) {
    // 创建临时实例
    globalPluginInstance = new WikilinkPlugin({ contentDir });
  }
  return globalPluginInstance.findFile(imageName);
}

// 向后兼容的缓存清理函数
function clearCaches() {
  if (globalPluginInstance) {
    globalPluginInstance.clearCaches();
  }
}

/**
 * 插件导出函数
 */
module.exports = function(eleventyConfig, options = {}) {
  const plugin = new WikilinkPlugin(options);
  globalPluginInstance = plugin; // 保存全局实例
  plugin.configFunction(eleventyConfig);
};

// 导出类和兼容函数
module.exports.WikilinkPlugin = WikilinkPlugin;
module.exports.findImagePath = findImagePath;
module.exports.clearCaches = clearCaches;
module.exports.getGlobalCollector = getGlobalCollector;