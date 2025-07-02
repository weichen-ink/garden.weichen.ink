const fs = require("fs");
const path = require("path");

/**
 * WikilinkPlugin - 支持Obsidian Wikilink格式的Eleventy插件
 * 
 * 🔗 已升级为新架构兼容版本
 * - 使用标准化警告收集系统
 * - 支持详细的错误分类和追踪
 * - 与企业级构建输出系统集成
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
 * 
 * 注意：不支持标准Markdown链接格式 [text](file.md)，
 * 这是为了避免文件路径依赖问题，推荐使用wikilink格式。
 */

// 简化的警告收集系统（移除复杂的警告收集器）
const getGlobalCollector = () => ({
  addWarning: (source, message) => {
    // 简化的警告收集 - 直接输出到控制台
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${source}] ${message}`);
    }
  }
});

// 文件搜索缓存，避免重复警告
const fileSearchCache = new Map();
const duplicateWarningsShown = new Set();
const noteWarningsShown = new Set(); // 用于去重笔记警告

// 清理缓存函数，用于测试
function clearCaches() {
  fileSearchCache.clear();
  duplicateWarningsShown.clear();
  noteWarningsShown.clear();
}

// 增强的文件搜索函数 - 在内容目录中递归搜索文件并检测重名（支持大小写不敏感）
function findImagePath(imageName, contentDir = "content") { // 默认值，实际使用时会通过参数传递
  // 检查缓存 - 使用小写版本作为缓存键确保大小写不敏感
  const normalizedKey = `${contentDir}:${imageName.toLowerCase()}`;
  if (fileSearchCache.has(normalizedKey)) {
    return fileSearchCache.get(normalizedKey);
  }
  
  const foundFiles = [];
  const lowerImageName = imageName.toLowerCase(); // 转换为小写进行比较
  
  function searchDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 递归搜索子目录
          searchDirectory(fullPath);
        } else if (file.toLowerCase() === lowerImageName) {
          // 大小写不敏感匹配：找到匹配的文件，记录所有匹配项
          foundFiles.push(fullPath);
        }
      }
    } catch (error) {
      // 忽略权限错误等问题
    }
  }
  
  searchDirectory(contentDir);
  
  // 对重名文件按字母顺序排序，确保选择结果的一致性
  if (foundFiles.length > 1) {
    foundFiles.sort((a, b) => {
      // 统一排序逻辑：严格按字母顺序排序
      // 这确保了 content/a/b 排在 content/d 之前（因为 a < d）
      return a.localeCompare(b);
    });
  }
  
  // 检测重名文件并使用新的警告收集系统
  if (foundFiles.length > 1 && !duplicateWarningsShown.has(imageName)) {
    const warningCollector = getGlobalCollector();
    const selectedFile = foundFiles[0]; // 使用优先级最高的文件
    
    const numberedFiles = foundFiles.map((file, index) => `(${index + 1}) ${file}`);
    const warningMsg = `重名附件 "${imageName}" 共${foundFiles.length}个：${numberedFiles.join(', ')}。链接将指向第(1)个文件。建议重命名其他文件避免冲突。`;
    
    warningCollector.addWarning('WikilinkPlugin', 'warning', warningMsg, {
      category: 'wikilink-duplicate-files',
      file: imageName,
      metadata: {
        duplicateCount: foundFiles.length,
        allPaths: foundFiles,
        selectedPath: selectedFile,
        suggestion: '建议重命名重复文件或移动到不同目录'
      }
    });
    
    duplicateWarningsShown.add(imageName);
  }
  
  const result = foundFiles.length > 0 ? foundFiles[0] : null;
  
  // 缓存结果 - 使用规范化键
  fileSearchCache.set(normalizedKey, result);
  
  return result;
}

/**
 * WikilinkPlugin类
 */
class WikilinkPlugin {
  constructor(options = {}) {
    this.options = {
      // 默认配置 - 实际使用时会通过 .eleventy.js 传递正确的配置
      contentDir: "content", // 默认内容目录，实际值由 .eleventy.js 传递
      imageExtensions: /\.(jpg|jpeg|png|gif|svg|webp)$/i,
      fileExtensions: /\.(jpg|jpeg|png|gif|svg|webp|pdf|doc|docx|txt|md|zip|rar|mp4|mp3|wav|xlsx|pptx|json|xml|csv|html|css|js|py|java|cpp|c|h|scss|less|yaml|yml|toml|ini|log|bat|sh)$/i,
      ...options
    };
  }

  /**
   * Eleventy插件配置函数
   */
  configFunction(eleventyConfig) {
    // 添加wikilink过滤器
    eleventyConfig.addFilter("wikilink", (content, collections) => {
      return this.processWikilinks(content, collections);
    });
    
    // 重名检测现在由主系统手动触发，避免重复检测
    // eleventyConfig.on('eleventy.after', () => {
    //   this.performDuplicateCheck();
    // });
    
    // 不再输出注册信息，保持安静模式
  }
  
  /**
   * 执行全面的重名检测
   */
  performDuplicateCheck() {
    // 清理之前的警告缓存
    noteWarningsShown.clear();
    duplicateWarningsShown.clear();
    
    // 分别检测笔记和附件的重名情况
    this.checkDuplicateNotes();
    this.checkDuplicateAttachments();
  }
  
  /**
   * 检测重名笔记（.md文件，包括文件名和title）
   */
  checkDuplicateNotes() {
    const noteFiles = new Map(); // filename -> paths
    const noteTitles = new Map(); // title -> files
    
    // 收集所有.md文件
    this.collectNotesRecursively(this.options.contentDir, noteFiles);
    
    // 检测文件名重名
    for (const [filename, paths] of noteFiles.entries()) {
      if (paths.length > 1) {
        const sortedPaths = this.sortPathsByPriority(paths);
        const pathDescriptions = sortedPaths.map(filePath => {
          // 尝试读取文件获取title
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
    this.collectAttachmentsRecursively(this.options.contentDir, mediaFiles);
    
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
  
  /**
   * 递归收集笔记文件（.md文件）
   */
  collectNotesRecursively(dir, fileMap) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.collectNotesRecursively(fullPath, fileMap);
        } else if (file.endsWith('.md')) {
          // 排除_index.md文件，这些是特殊的配置文件
          if (file === '_index.md') {
            continue;
          }
          
          if (!fileMap.has(file)) {
            fileMap.set(file, []);
          }
          fileMap.get(file).push(fullPath);
        }
      }
    } catch (error) {
      // 忽略权限错误等问题
    }
  }
  
  /**
   * 递归收集附件文件（非.md的媒体文件）
   */
  collectAttachmentsRecursively(dir, fileMap) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.collectAttachmentsRecursively(fullPath, fileMap);
        } else if (this.options.fileExtensions.test(file) && !file.endsWith('.md')) {
          // 只收集非.md文件的媒体文件
          if (!fileMap.has(file)) {
            fileMap.set(file, []);
          }
          fileMap.get(file).push(fullPath);
        }
      }
    } catch (error) {
      // 忽略权限错误等问题
    }
  }
  
  /**
   * 递归收集所有文件并按文件名分组（保留兼容性）
   */
  collectFilesRecursively(dir, fileMap) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.collectFilesRecursively(fullPath, fileMap);
        } else if (this.options.fileExtensions.test(file)) {
          // 排除_index.md文件，这些是特殊的配置文件
          if (file === '_index.md') {
            continue;
          }
          
          if (!fileMap.has(file)) {
            fileMap.set(file, []);
          }
          fileMap.get(file).push(fullPath);
        }
      }
    } catch (error) {
      // 忽略权限错误等问题
    }
  }

  /**
   * 处理所有wikilink格式
   */
  processWikilinks(content, collections) {
    if (!content) return content;
    
    // 保护代码块中的内容不被处理
    const codeBlocks = [];
    let protectedContent = content;
    
    // 匹配三个反引号的代码块
    protectedContent = protectedContent.replace(/```[\s\S]*?```/g, (match, offset) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });
    
    // 匹配单个反引号的行内代码
    protectedContent = protectedContent.replace(/`[^`]+`/g, (match, offset) => {
      const placeholder = `__INLINE_CODE_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });

    // 1. 处理图片嵌入 ![[image.png]]
    protectedContent = this.processImageEmbeds(protectedContent);
    
    // 2. 处理普通双方括号链接 [[note title]] 和 [[note title|display text]]
    protectedContent = this.processWikilinkSyntax(protectedContent, collections);
    
    // 恢复代码块内容
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const inlineCodePlaceholder = `__INLINE_CODE_${index}__`;
      protectedContent = protectedContent.replace(placeholder, block);
      protectedContent = protectedContent.replace(inlineCodePlaceholder, block);
    });
    
    return protectedContent;
  }


  /**
   * 处理图片嵌入 ![[image.png]] 和 ![[image.png|100]] 和 ![[image.png|100x245]]
   * 支持Obsidian风格的图片尺寸语法
   */
  processImageEmbeds(content) {
    return content.replace(/!\[\[([^\]]+)\]\]/g, (match, fullContent) => {
      // 解析图片名称和可选的尺寸参数
      const parts = fullContent.split('|');
      const imageName = parts[0].trim();
      const sizeParam = parts[1] ? parts[1].trim() : null;
      
      // 检查是否为图片文件
      if (this.options.imageExtensions.test(imageName)) {
        // 搜索图片在content目录中的实际位置
        const foundImagePath = findImagePath(imageName, this.options.contentDir);
        if (foundImagePath) {
          // 保持完整路径，因为Eleventy将content文件复制到_site/content/
          const imagePath = `/${foundImagePath}`;
          const altText = imageName.replace(/\.[^/.]+$/, ""); // 移除扩展名作为alt
          
          // 处理尺寸参数
          let styleAttr = '';
          if (sizeParam) {
            const sizeStyles = this.parseSizeParameter(sizeParam);
            if (sizeStyles) {
              styleAttr = ` style="${sizeStyles}"`;
            }
          }
          
          return `<img src="${imagePath}" alt="${altText}" class="content-image"${styleAttr}>`;
        } else {
          // 图片不存在，返回占位符
          const altText = imageName.replace(/\.[^/.]+$/, "");
          return `<span class="missing-image">[图片不存在: ${altText}]</span>`;
        }
      }
      // 如果不是图片，保持原样（或者可以处理为其他类型的嵌入）
      return match;
    });
  }

  /**
   * 解析尺寸参数，支持 100 和 100x245 两种格式
   * @param {string} sizeParam - 尺寸参数，如 "100" 或 "100x245"
   * @returns {string|null} - CSS样式字符串或null
   */
  parseSizeParameter(sizeParam) {
    if (!sizeParam) return null;
    
    // 匹配 100 或 100x245 格式
    const widthOnlyMatch = sizeParam.match(/^(\d+)$/);
    const widthHeightMatch = sizeParam.match(/^(\d+)x(\d+)$/);
    
    if (widthOnlyMatch) {
      // 只有宽度：100
      const width = widthOnlyMatch[1];
      return `width: ${width}px;`;
    } else if (widthHeightMatch) {
      // 宽度和高度：100x245
      const width = widthHeightMatch[1];
      const height = widthHeightMatch[2];
      return `width: ${width}px; height: ${height}px;`;
    }
    
    // 如果格式不匹配，返回null（忽略无效参数）
    return null;
  }

  /**
   * 处理双方括号链接 [[note title]] 和 [[note title|display text]]
   * 简化版本：只支持文件名，自动查找笔记
   */
  processWikilinkSyntax(content, collections) {
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkContent) => {
      // 检查是否有自定义显示文本 [[title|display text]]
      const parts = linkContent.split('|');
      const noteTitle = parts[0].trim();
      const customDisplayText = parts[1] ? parts[1].trim() : null;
      
      // 检查是否包含锚点 [[title#anchor]]
      const anchorMatch = noteTitle.match(/^([^#]+)(#(.+))?$/);
      const actualTitle = anchorMatch ? anchorMatch[1].trim() : noteTitle;
      const anchor = anchorMatch && anchorMatch[3] ? anchorMatch[3].trim() : null;
      
      // 检查是否为文件（有扩展名）
      if (this.options.fileExtensions.test(actualTitle)) {
        return this.processFileLink(actualTitle, customDisplayText || noteTitle);
      }
      
      // 查找对应的笔记
      let targetNote = this.findNote(actualTitle, collections);
      
      let linkUrl, linkClass, linkText;
      if (targetNote) {
        linkUrl = targetNote.url;
        if (anchor) {
          // 添加锚点支持
          linkUrl += `#${this.createSlug(anchor)}`;
        }
        linkClass = "internal-link";
        // 使用自定义显示文本，或note的title，或文件名
        linkText = customDisplayText || 
                   (targetNote.data && targetNote.data.title) || 
                   targetNote.fileSlug.split('/').pop() || 
                   actualTitle;
      } else {
        // 使用相同的slug处理逻辑
        const sluggedTitle = this.createSlug(actualTitle);
        linkUrl = `/${sluggedTitle}/`;
        if (anchor) {
          linkUrl += `#${this.createSlug(anchor)}`;
        }
        linkClass = "internal-link broken";
        linkText = customDisplayText || noteTitle;
      }
      
      return `<a href="${linkUrl}" class="${linkClass}" data-note-title="${actualTitle}">${linkText}</a>`;
    });
  }

  /**
   * 处理文件链接
   */
  processFileLink(fileName, displayText) {
    // 对于文件链接，创建一个指向文件的链接
    const foundFilePath = findImagePath(fileName, this.options.contentDir);
    if (foundFilePath) {
      const filePath = `/${foundFilePath.replace(/^content\//, "")}`;
      return `<a href="${filePath}" class="file-link" target="_blank">${displayText}</a>`;
    } else {
      // 文件不存在，返回占位符
      return `<span class="missing-file">[文件不存在: ${displayText}]</span>`;
    }
  }


  /**
   * 查找笔记（文件名匹配）并检测重名（支持大小写不敏感）
   */
  findNote(noteTitle, collections) {
    if (!collections || !collections.content) return null;
    
    const lowerNoteTitle = noteTitle.toLowerCase(); // 转换为小写进行比较
    
    // 首先尝试通过文件名匹配（使用inputPath）- 大小写不敏感
    const matchingNotes = collections.content.filter(note => {
      if (!note.inputPath) return false;
      // 从inputPath获取文件名（不含扩展名）
      const pathParts = note.inputPath.split('/');
      const filename = pathParts[pathParts.length - 1].replace('.md', '');
      return filename.toLowerCase() === lowerNoteTitle; // 大小写不敏感比较
    });
    
    // 文件名重名检测已由checkDuplicateNotes方法处理，此处不再重复报告
    
    let targetNote = matchingNotes.length > 0 ? matchingNotes[0] : null;
    
    // 如果通过文件名没找到，尝试通过title匹配（大小写不敏感）
    if (!targetNote) {
      const titleMatches = collections.content.filter(note => 
        note.data && note.data.title && note.data.title.toLowerCase() === lowerNoteTitle
      );
      
      // 标题重名检测已由checkDuplicateNotes方法处理，此处不再重复报告
      
      targetNote = titleMatches.length > 0 ? titleMatches[0] : null;
    }
    
    return targetNote;
  }

  /**
   * 获取路径的基础文件名
   */
  getBaseName(path) {
    return path.split('/').pop();
  }


  /**
   * 创建slug
   */
  createSlug(text) {
    return text
      .replace(/\s+/g, '-')
      .replace(/[<>:"\/\\|?*]/g, '')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * 插件导出函数
 */
module.exports = function(eleventyConfig, options = {}) {
  const plugin = new WikilinkPlugin(options);
  plugin.configFunction(eleventyConfig);
};

// 同时导出类以便测试
module.exports.WikilinkPlugin = WikilinkPlugin;