/**
 * 缓存管理器
 * 统一管理WikilinkPlugin的所有缓存
 */
class CacheManager {
  constructor() {
    this.fileSearchCache = new Map();
    this.duplicateWarningsShown = new Set();
    this.noteWarningsShown = new Set();
  }

  /**
   * 清理所有缓存
   */
  clearAll() {
    this.fileSearchCache.clear();
    this.duplicateWarningsShown.clear();
    this.noteWarningsShown.clear();
  }

  /**
   * 文件搜索缓存操作
   */
  getFileSearchCache(key) {
    return this.fileSearchCache.get(key);
  }

  setFileSearchCache(key, value) {
    this.fileSearchCache.set(key, value);
  }

  hasFileSearchCache(key) {
    return this.fileSearchCache.has(key);
  }

  /**
   * 重复警告缓存操作
   */
  hasDuplicateWarning(key) {
    return this.duplicateWarningsShown.has(key);
  }

  addDuplicateWarning(key) {
    this.duplicateWarningsShown.add(key);
  }

  /**
   * 笔记警告缓存操作
   */
  hasNoteWarning(key) {
    return this.noteWarningsShown.has(key);
  }

  addNoteWarning(key) {
    this.noteWarningsShown.add(key);
  }

  /**
   * 清理特定类型的缓存
   */
  clearFileSearchCache() {
    this.fileSearchCache.clear();
  }

  clearWarningCaches() {
    this.duplicateWarningsShown.clear();
    this.noteWarningsShown.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      fileSearchCacheSize: this.fileSearchCache.size,
      duplicateWarningsCount: this.duplicateWarningsShown.size,
      noteWarningsCount: this.noteWarningsShown.size
    };
  }
}

module.exports = CacheManager;