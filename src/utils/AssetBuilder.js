/**
 * 简化的静态资源构建器
 * 灵感来自 Hugo Pipes 和 Gatsby 的简洁设计
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AssetBuilder {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '_site';
    this.verbose = options.verbose || false;
    this.cache = new Map();
  }

  /**
   * 生成文件hash
   */
  generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  }

  /**
   * 确保目录存在
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 读取文件
   */
  readFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * 合并自定义CSS文件
   */
  mergeCustomCSS(mainCSS, customDir) {
    if (!fs.existsSync(customDir)) {
      return mainCSS;
    }

    const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.css'))
      .sort();

    if (customFiles.length === 0) {
      return mainCSS;
    }

    let mergedCSS = mainCSS;
    
    for (const file of customFiles) {
      const filePath = path.join(customDir, file);
      const content = this.readFile(filePath);
      
      // 跳过空文件
      if (content.trim()) {
        mergedCSS += `\n\n/* ==================== ${file} ==================== */\n`;
        mergedCSS += content;
      }
    }

    if (this.verbose) {
      console.log(`📁 Merged ${customFiles.length} custom CSS files`);
    }

    return mergedCSS;
  }

  /**
   * 处理CSS文件
   */
  async processCSS(inputPath, options = {}) {
    const mainCSS = this.readFile(inputPath);
    
    // 合并自定义CSS
    const customDir = options.customDir || 'src/assets/css/custom';
    const finalCSS = this.mergeCustomCSS(mainCSS, customDir);
    
    // 使用LightningCSS压缩
    let processedCSS = finalCSS;
    
    if (options.minify !== false) {
      try {
        const { transform } = require('lightningcss');
        const result = transform({
          code: Buffer.from(finalCSS),
          minify: true,
          targets: {
            chrome: 95 << 16,
            firefox: 90 << 16,
            safari: 14 << 16
          }
        });
        processedCSS = result.code.toString();
      } catch (error) {
        console.warn('LightningCSS not available, skipping minification');
      }
    }

    const hash = this.generateHash(processedCSS);
    const fileName = `main.${hash}.css`;
    const outputPath = path.join(this.outputDir, 'assets/css', fileName);
    
    // 写入文件
    this.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, processedCSS);
    
    // 清理旧文件
    this.cleanupOldFiles(path.dirname(outputPath), /^main\.[a-f0-9]{8}\.css$/, fileName);
    
    const result = {
      url: `/assets/css/${fileName}`,
      fileName,
      size: processedCSS.length,
      hash
    };
    
    this.cache.set('css', result);
    
    if (this.verbose) {
      const sizeKB = (processedCSS.length / 1024).toFixed(1);
      const ratio = ((1 - processedCSS.length / finalCSS.length) * 100).toFixed(1);
      console.log(`✨ CSS processed: ${fileName} (${sizeKB}KB, compressed: ${ratio}%)`);
    }
    
    return result;
  }

  /**
   * 处理JS文件
   */
  async processJS(inputPath, options = {}) {
    const jsContent = this.readFile(inputPath);
    
    // 使用ESBuild压缩
    let processedJS = jsContent;
    
    if (options.minify !== false) {
      try {
        const esbuild = require('esbuild');
        const result = await esbuild.build({
          stdin: {
            contents: jsContent,
            resolveDir: path.dirname(inputPath)
          },
          bundle: true,
          minify: true,
          format: 'esm',
          target: ['es2020'],
          platform: 'browser',
          write: false,
          sourcemap: false
        });
        processedJS = result.outputFiles[0].text;
      } catch (error) {
        console.warn('ESBuild not available, skipping minification');
      }
    }

    const hash = this.generateHash(processedJS);
    const fileName = `main.${hash}.js`;
    const outputPath = path.join(this.outputDir, 'assets/js', fileName);
    
    // 写入文件
    this.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, processedJS);
    
    // 清理旧文件
    this.cleanupOldFiles(path.dirname(outputPath), /^main\.[a-f0-9]{8}\.js$/, fileName);
    
    const result = {
      url: `/assets/js/${fileName}`,
      fileName,
      size: processedJS.length,
      hash
    };
    
    this.cache.set('js', result);
    
    if (this.verbose) {
      const sizeKB = (processedJS.length / 1024).toFixed(1);
      const ratio = ((1 - processedJS.length / jsContent.length) * 100).toFixed(1);
      console.log(`✨ JS processed: ${fileName} (${sizeKB}KB, compressed: ${ratio}%)`);
    }
    
    return result;
  }

  /**
   * 清理旧文件
   */
  cleanupOldFiles(dir, pattern, currentFile) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    const oldFiles = files.filter(file => 
      pattern.test(file) && file !== currentFile
    );
    
    oldFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(dir, file));
      } catch (error) {
        // 忽略删除错误
      }
    });
    
    if (oldFiles.length > 0 && this.verbose) {
      console.log(`🧹 Cleaned up ${oldFiles.length} old files`);
    }
  }

  /**
   * 获取资源URL
   */
  getAssetUrl(assetType) {
    const asset = this.cache.get(assetType);
    return asset ? asset.url : null;
  }

  /**
   * 处理所有资源
   */
  async buildAll() {
    const startTime = Date.now();
    const results = {};
    const assets = [];
    
    try {
      // 处理CSS
      results.css = await this.processCSS('src/assets/css/main.css', {
        customDir: 'src/assets/css/custom'
      });
      
      if (results.css) {
        assets.push({
          fileName: results.css.fileName,
          size: results.css.size,
          processor: 'LightningCSS',
          sources: ['main.css', 'custom/*.css']
        });
      }
      
      // 处理JS
      results.js = await this.processJS('src/assets/js/main.js');
      
      if (results.js) {
        assets.push({
          fileName: results.js.fileName,
          size: results.js.size,
          processor: 'ESBuild',
          sources: ['main.js']
        });
      }
      
      if (this.verbose) {
        console.log('🎉 All assets processed successfully');
      }
      
    } catch (error) {
      console.error('❌ Asset processing failed:', error.message);
      throw error;
    }
    
    // 计算统计信息
    const totalAssets = assets.length;
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    const assetTypes = assets.reduce((types, asset) => {
      const ext = asset.fileName.split('.').pop().split('.')[0]; // 获取真实扩展名
      types[ext] = (types[ext] || 0) + 1;
      return types;
    }, {});
    
    // 检测重复资源（简单示例）
    const duplicates = this.detectDuplicateResources();
    
    return {
      ...results,
      assets,
      totalAssets,
      totalSize,
      assetTypes,
      duplicates,
      buildDuration: Date.now() - startTime
    };
  }

  /**
   * 检测重复资源
   */
  detectDuplicateResources() {
    const duplicates = [];
    
    // 这里可以实现更复杂的重复检测逻辑
    // 目前返回空数组，可以在将来扩展
    
    return duplicates;
  }
}

module.exports = AssetBuilder;