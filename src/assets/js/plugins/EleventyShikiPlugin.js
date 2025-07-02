const { codeToHtml } = require('shiki');

/**
 * Eleventy Shiki Transform Plugin
 * 在构建时处理代码高亮
 * 
 * 配置说明：
 * - 主题：固定使用 github-light 主题
 * - 语言标签：自动显示（当语言不为 text 时）
 * - 复制按钮：默认启用
 */
module.exports = function(eleventyConfig) {
  eleventyConfig.addTransform('shiki-transform', async function(content) {
    // 只处理HTML输出
    if (!this.page.outputPath || !this.page.outputPath.endsWith('.html')) {
      return content;
    }
    
    // 查找所有的代码块
    const codeBlockRegex = /<pre[^>]*><code(?:\s+class="language-([^"]*)")?[^>]*>([\s\S]*?)<\/code><\/pre>/g;
    
    let transformedContent = content;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    // 异步处理所有代码块
    for (const match of matches) {
      const [fullMatch, language = '', codeContent] = match;
      
      // 解码HTML实体
      const decodedContent = codeContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      try {
        // 使用Shiki进行高亮
        const highlighted = await codeToHtml(decodedContent, {
          lang: language || 'text',
          theme: 'github-light'
        });
        
        // 包装高亮后的代码
        const codeMatch = highlighted.match(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/);
        if (codeMatch) {
          const codeContent = codeMatch[1];
          const hasLanguage = language && language !== 'text';
          
          let html = '<div class="code-block-container">';
          
          // 添加头部
          if (hasLanguage) {
            html += '<div class="code-block-header">';
            html += `<span class="code-language">${language.toUpperCase()}</span>`;
            html += '<button class="code-copy-btn" title="复制代码">📋</button>';
            html += '</div>';
          }
          
          // 移除代码块中的下划线样式（由于语法高亮造成的）
          const cleanedCodeContent = codeContent.replace(/text-decoration:underline;?/g, '');
          html += `<pre class="shiki${hasLanguage ? ` language-${language}` : ''}"><code>${cleanedCodeContent}</code></pre>`;
          html += '</div>';
          
          transformedContent = transformedContent.replace(fullMatch, html);
        }
      } catch (error) {
        console.warn(`[Shiki] Failed to highlight ${language} code:`, error.message);
        // 保持原始代码块
      }
    }
    
    return transformedContent;
  });
  
  console.log('[EleventyShikiPlugin] Registered');
};