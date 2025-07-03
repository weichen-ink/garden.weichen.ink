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
      if (isImageFile(imageName)) {
        // 搜索图片在content目录中的实际位置
        const foundImagePath = this.fileSearcher.findFile(imageName, this.options.contentDir);
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