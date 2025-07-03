/**
 * 重名文件检测器
 * 负责检测笔记和附件的重名情况
 */
const fs = require("fs");
const path = require("path");

class DuplicateDetector {
  constructor(fileSearcher, cacheManager, options) {
    this.fileSearcher = fileSearcher;
    this.cacheManager = cacheManager;
    this.options = options;
  }

  /**
   * 执行全面的重名检测
   */
  performDuplicateCheck() {
    // 清理之前的警告缓存
    this.cacheManager.clearWarningCaches();
    
    // 分别检测笔记和附件的重名情况
    this.checkDuplicateNotes();
    this.checkDuplicateAttachments();
  }

  /**
   * 检测重名笔记（.md文件，包括文件名和title）
   */
  checkDuplicateNotes() {
    const noteFiles = new Map();
    
    // 收集所有.md文件
    this.fileSearcher.collectNotes(this.options.contentDir, noteFiles);
    
    // 检测文件名重名
    for (const [filename, paths] of noteFiles.entries()) {
      if (paths.length > 1) {
        const sortedPaths = this.sortPathsByPriority(paths);
        const pathDescriptions = sortedPaths.map(filePath => {
          const title = this.extractTitleFromFile(filePath);
          return `${filePath}(标题: ${title})`;
        });
        
        const warningMsg = `重名笔记 "${filename}": ${pathDescriptions.join(', ')}, 使用第一个文件`;
        
        if (global.buildWarningCollector) {
          global.buildWarningCollector.addWarning('WikilinkPlugin', warningMsg);
        }
      }
    }
  }

  /**
   * 检测重名附件（非.md文件的媒体文件）
   */
  checkDuplicateAttachments() {
    const mediaFiles = new Map();
    this.fileSearcher.collectAttachments(this.options.contentDir, mediaFiles);
    
    for (const [filename, paths] of mediaFiles.entries()) {
      if (paths.length > 1) {
        const sortedPaths = this.sortPathsByPriority(paths);
        const warningMsg = `重名附件 "${filename}": ${sortedPaths.join(', ')}, 使用第一个文件`;
        
        if (global.buildWarningCollector) {
          global.buildWarningCollector.addWarning('WikilinkPlugin', warningMsg);
        }
      }
    }
  }

  /**
   * 从文件中提取标题
   * @param {string} filePath - 文件路径
   * @returns {string} - 文件标题
   */
  extractTitleFromFile(filePath) {
    let title = '无标题';
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const titleMatch = frontmatterMatch[1].match(/title:\s*(.+)/);
        if (titleMatch) {
          title = titleMatch[1].trim().replace(/['"]/g, '');
        }
      }
    } catch (error) {
      // 忽略读取错误
    }
    return title;
  }

  /**
   * 按优先级排序路径
   * 优先级规则：
   * 1. content根目录的文件优先
   * 2. 按字母顺序排列（如 /content/a/d.md > /content/d.md）
   */
  sortPathsByPriority(paths) {
    return [...paths].sort((a, b) => {
      // 优先级1：content根目录的文件优先
      const aIsRoot = path.dirname(a) === this.options.contentDir;
      const bIsRoot = path.dirname(b) === this.options.contentDir;
      if (aIsRoot && !bIsRoot) return -1;
      if (!aIsRoot && bIsRoot) return 1;
      
      // 优先级2：直接按字母顺序排列
      // 这样 /content/a/d.md 会排在 /content/d.md 之前
      return a.localeCompare(b);
    });
  }
}

module.exports = DuplicateDetector;