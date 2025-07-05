/**
 * 链接处理器
 * 负责处理wikilink语法和图片嵌入
 */
const { isImageFile } = require('../config/file-extensions');

class LinkProcessor {
  constructor(fileSearcher, options) {
    this.fileSearcher = fileSearcher;
    this.options = options;
  }

  /**
   * 处理所有wikilink格式
   * @param {string} content - 要处理的内容
   * @param {Object} collections - Eleventy集合
   * @returns {string} - 处理后的内容
   */
  processWikilinks(content, collections) {
    if (!content) return content;
    
    // 保护代码块中的内容不被处理
    const codeBlocks = [];
    const inlineCodeBlocks = [];
    let protectedContent = content;
    
    // 匹配HTML代码块 <pre><code>...</code></pre> 和其变体
    protectedContent = protectedContent.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match, offset) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });
    
    // 匹配行内代码 <code>...</code>
    protectedContent = protectedContent.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match, offset) => {
      const placeholder = `__INLINE_CODE_${inlineCodeBlocks.length}__`;
      inlineCodeBlocks.push(match);
      return placeholder;
    });
    
    // 保护markdown原始代码块（以防markdown未处理）
    protectedContent = protectedContent.replace(/```[\s\S]*?```/g, (match, offset) => {
      const placeholder = `__RAW_CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });
    
    // 保护markdown原始行内代码（以防markdown未处理）
    protectedContent = protectedContent.replace(/`[^`\n]+`/g, (match, offset) => {
      const placeholder = `__RAW_INLINE_CODE_${inlineCodeBlocks.length}__`;
      inlineCodeBlocks.push(match);
      return placeholder;
    });

    // 1. 处理图片嵌入 ![[image.png]]
    protectedContent = this.processImageEmbeds(protectedContent);
    
    // 2. 处理普通双方括号链接 [[note title]] 和 [[note title|display text]]
    protectedContent = this.processWikilinkSyntax(protectedContent, collections);
    
    // 恢复代码块内容，并移除其中的text-decoration:underline
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const rawPlaceholder = `__RAW_CODE_BLOCK_${index}__`;
      // 移除代码块中的下划线样式
      const cleanedBlock = block.replace(/text-decoration:underline;?/g, '');
      protectedContent = protectedContent.replace(placeholder, cleanedBlock);
      protectedContent = protectedContent.replace(rawPlaceholder, cleanedBlock);
    });
    
    // 恢复行内代码内容，并移除其中的text-decoration:underline
    inlineCodeBlocks.forEach((block, index) => {
      const placeholder = `__INLINE_CODE_${index}__`;
      const rawPlaceholder = `__RAW_INLINE_CODE_${index}__`;
      // 移除行内代码中的下划线样式
      const cleanedBlock = block.replace(/text-decoration:underline;?/g, '');
      protectedContent = protectedContent.replace(placeholder, cleanedBlock);
      protectedContent = protectedContent.replace(rawPlaceholder, cleanedBlock);
    });
    
    return protectedContent;
  }

  /**
   * 处理图片嵌入 ![[image.png]] 和 ![[image.png|100]] 和 ![[image.png|100x245]] 和 ![[image.png|这是一个文本]]
   * 支持Obsidian风格的图片尺寸语法和自定义alt文本
   */
  processImageEmbeds(content) {
    return content.replace(/!\[\[([^\]]+)\]\]/g, (match, fullContent) => {
      const { fileName, param } = this.parseWikilinkContent(fullContent);
      
      // 先尝试查找文件，无论是否有扩展名
      const foundImagePath = this.fileSearcher.findFile(fileName, this.options.contentDir);
      
      if (foundImagePath) {
        // 检查找到的文件是否为图片
        if (isImageFile(foundImagePath)) {
          return this.createImageTag(foundImagePath, fileName, param);
        }
      }
      
      // 如果文件名本身有图片扩展名，但文件不存在
      if (isImageFile(fileName)) {
        return this.createMissingImagePlaceholder(fileName, param);
      }
      
      // 如果找到的文件不是图片，或者没找到文件且文件名没有图片扩展名
      // 创建一个占位符，保持表格结构不被破坏
      const displayText = param || fileName;
      return `<span class="missing-image">[图片不存在: ${displayText}]</span>`;
    });
  }

  /**
   * 解析Wikilink内容，分离文件名和参数
   * @param {string} content - Wikilink内容，如 "image.png|100" 或 "image.png|alt text"
   * @returns {Object} - 包含fileName和param的对象
   */
  parseWikilinkContent(content) {
    const parts = content.split('|');
    return {
      fileName: parts[0].trim(),
      param: parts[1] ? parts[1].trim() : null
    };
  }

  /**
   * 检测参数类型：尺寸参数还是alt文本
   * @param {string} param - 参数字符串
   * @returns {Object} - 包含类型和值的对象
   */
  detectParameterType(param) {
    if (!param) return { type: 'none', value: null };
    
    // 检查是否为尺寸参数：纯数字或数字x数字格式
    const sizePattern = /^(\d+)(?:x(\d+))?$/;
    const match = param.match(sizePattern);
    
    if (match) {
      const width = match[1];
      const height = match[2];
      const styles = height 
        ? `width: ${width}px; height: ${height}px;`
        : `width: ${width}px;`;
      
      return { type: 'size', value: styles };
    }
    
    // 不是尺寸参数，当作alt文本处理
    return { type: 'alt', value: param };
  }

  /**
   * 解析尺寸参数，支持 100 和 100x245 两种格式
   * @param {string} sizeParam - 尺寸参数，如 "100" 或 "100x245"
   * @returns {string|null} - CSS样式字符串或null
   */
  parseSizeParameter(sizeParam) {
    const result = this.detectParameterType(sizeParam);
    return result.type === 'size' ? result.value : null;
  }

  /**
   * 创建图片标签
   * @param {string} imagePath - 图片路径
   * @param {string} fileName - 原始文件名
   * @param {string} param - 参数（尺寸或alt文本）
   * @returns {string} - HTML图片标签
   */
  createImageTag(imagePath, fileName, param) {
    const fullImagePath = `/${imagePath}`;
    let altText = fileName.replace(/\.[^/.]+$/, ""); // 默认alt为文件名（去扩展名）
    let styleAttr = '';
    
    const paramType = this.detectParameterType(param);
    if (paramType.type === 'size') {
      styleAttr = ` style="${paramType.value}"`;
    } else if (paramType.type === 'alt') {
      altText = paramType.value;
    }
    
    return `<img src="${fullImagePath}" alt="${altText}" class="content-image"${styleAttr}>`;
  }

  /**
   * 创建缺失图片占位符
   * @param {string} fileName - 原始文件名
   * @param {string} param - 参数（尺寸或alt文本）
   * @returns {string} - 缺失图片占位符
   */
  createMissingImagePlaceholder(fileName, param) {
    let altText = fileName.replace(/\.[^/.]+$/, "");
    
    const paramType = this.detectParameterType(param);
    if (paramType.type === 'alt') {
      altText = paramType.value;
    }
    
    return `<span class="missing-image">[图片不存在: ${altText}]</span>`;
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
    const foundFilePath = this.fileSearcher.findFile(fileName, this.options.contentDir);
    if (foundFilePath) {
      const filePath = `/${foundFilePath.replace(/^content\//, "")}`;
      return `<a href="${filePath}" class="file-link" target="_blank">${displayText}</a>`;
    } else {
      // 文件不存在，返回占位符
      return `<span class="missing-file">[文件不存在: ${displayText}]</span>`;
    }
  }

  /**
   * 查找笔记（文件名匹配）（支持大小写不敏感）
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
    
    let targetNote = matchingNotes.length > 0 ? matchingNotes[0] : null;
    
    // 如果通过文件名没找到，尝试通过title匹配（大小写不敏感）
    if (!targetNote) {
      const titleMatches = collections.content.filter(note => 
        note.data && note.data.title && note.data.title.toLowerCase() === lowerNoteTitle
      );
      
      targetNote = titleMatches.length > 0 ? titleMatches[0] : null;
    }
    
    return targetNote;
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

module.exports = LinkProcessor;