/**
 * 文件搜索器
 * 负责在content目录中搜索文件
 */
const fs = require("fs");
const path = require("path");

class FileSearcher {
  constructor(cacheManager, fileExtensions) {
    this.cacheManager = cacheManager;
    this.fileExtensions = fileExtensions;
  }

  /**
   * 在内容目录中递归搜索文件（支持大小写不敏感）
   * @param {string} fileName - 要搜索的文件名
   * @param {string} contentDir - 内容目录路径
   * @returns {string|null} - 找到的文件路径或null
   */
  findFile(fileName, contentDir) {
    // 检查缓存 - 使用小写版本作为缓存键确保大小写不敏感
    const normalizedKey = `${contentDir}:${fileName.toLowerCase()}`;
    if (this.cacheManager.hasFileSearchCache(normalizedKey)) {
      return this.cacheManager.getFileSearchCache(normalizedKey);
    }

    const foundFiles = [];
    const lowerFileName = fileName.toLowerCase();

    const searchDirectory = (dir) => {
      try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            searchDirectory(fullPath);
          } else {
            const fileLower = file.toLowerCase();
            const fileNameWithoutExt = path.parse(file).name.toLowerCase();
            
            // 精确匹配文件名
            if (fileLower === lowerFileName) {
              foundFiles.push(fullPath);
            }
            // 如果查询不包含扩展名，尝试匹配不包含扩展名的文件名
            else if (!path.extname(fileName) && fileNameWithoutExt === lowerFileName) {
              foundFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        // 忽略权限错误等问题
      }
    };

    searchDirectory(contentDir);

    // 对重名文件按字母顺序排序，确保选择结果的一致性
    if (foundFiles.length > 1) {
      foundFiles.sort((a, b) => a.localeCompare(b));
    }

    const result = foundFiles.length > 0 ? foundFiles[0] : null;

    // 缓存结果
    this.cacheManager.setFileSearchCache(normalizedKey, result);

    return result;
  }

  /**
   * 搜索文件并检测重名
   * @param {string} fileName - 要搜索的文件名
   * @param {string} contentDir - 内容目录路径
   * @param {Function} warningCallback - 警告回调函数
   * @returns {string|null} - 找到的文件路径或null
   */
  findFileWithDuplicateCheck(fileName, contentDir, warningCallback) {
    const normalizedKey = `${contentDir}:${fileName.toLowerCase()}`;
    if (this.cacheManager.hasFileSearchCache(normalizedKey)) {
      return this.cacheManager.getFileSearchCache(normalizedKey);
    }

    const foundFiles = [];
    const lowerFileName = fileName.toLowerCase();

    const searchDirectory = (dir) => {
      try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            searchDirectory(fullPath);
          } else {
            const fileLower = file.toLowerCase();
            const fileNameWithoutExt = path.parse(file).name.toLowerCase();
            
            // 精确匹配文件名
            if (fileLower === lowerFileName) {
              foundFiles.push(fullPath);
            }
            // 如果查询不包含扩展名，尝试匹配不包含扩展名的文件名
            else if (!path.extname(fileName) && fileNameWithoutExt === lowerFileName) {
              foundFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        // 忽略权限错误等问题
      }
    };

    searchDirectory(contentDir);

    // 排序确保一致性
    if (foundFiles.length > 1) {
      foundFiles.sort((a, b) => a.localeCompare(b));
    }

    // 检测重名文件
    if (foundFiles.length > 1 && !this.cacheManager.hasDuplicateWarning(fileName)) {
      if (warningCallback) {
        const numberedFiles = foundFiles.map((file, index) => `(${index + 1}) ${file}`);
        const warningMsg = `重名附件 "${fileName}" 共${foundFiles.length}个：${numberedFiles.join(', ')}。链接将指向第(1)个文件。建议重命名其他文件避免冲突。`;
        warningCallback('WikilinkPlugin', warningMsg);
      }
      this.cacheManager.addDuplicateWarning(fileName);
    }

    const result = foundFiles.length > 0 ? foundFiles[0] : null;
    this.cacheManager.setFileSearchCache(normalizedKey, result);

    return result;
  }

  /**
   * 递归收集指定类型的文件
   * @param {string} dir - 搜索目录
   * @param {Function} fileFilter - 文件过滤函数
   * @param {Map} fileMap - 结果映射
   */
  collectFiles(dir, fileFilter, fileMap) {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          this.collectFiles(fullPath, fileFilter, fileMap);
        } else if (fileFilter(file)) {
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
   * 收集笔记文件（.md文件）
   * @param {string} dir - 搜索目录
   * @param {Map} fileMap - 结果映射
   */
  collectNotes(dir, fileMap) {
    this.collectFiles(dir, (file) => file.endsWith('.md'), fileMap);
  }

  /**
   * 收集附件文件（非.md的媒体文件）
   * @param {string} dir - 搜索目录
   * @param {Map} fileMap - 结果映射
   */
  collectAttachments(dir, fileMap) {
    this.collectFiles(
      dir, 
      (file) => this.fileExtensions.test(file) && !file.endsWith('.md'), 
      fileMap
    );
  }

  /**
   * 收集所有支持的文件
   * @param {string} dir - 搜索目录
   * @param {Map} fileMap - 结果映射
   */
  collectAllFiles(dir, fileMap) {
    this.collectFiles(
      dir, 
      (file) => this.fileExtensions.test(file), 
      fileMap
    );
  }
}

module.exports = FileSearcher;