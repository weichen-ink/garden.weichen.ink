import { Plugin } from '../core/Plugin.js';

/**
 * Shiki代码高亮插件 - 客户端增强功能
 * 
 * 功能说明：
 * - 代码高亮在构建时已完成，此插件提供交互功能
 * - 一键复制代码功能
 * - 键盘快捷键支持（Ctrl/Cmd + K）
 * - 复制状态反馈
 */

export class ShikiPlugin extends Plugin {
  constructor() {
    super('shiki');
  }

  getDefaultConfig() {
    return {
      showCopyButton: true,
      copyButtonText: '📋',
      copiedText: '✅',
      copyFailedText: '❌',
      feedbackDuration: 2000
    };
  }

  async setup() {
    await super.setup();
    
    this.setupCopyButtons();
    this.setupKeyboardShortcuts();
    this.setupAccessibility();
    
    console.log(`[${this.name}] Client-side enhancements initialized`);
  }

  cacheElements() {
    this.elements = {
      codeBlocks: this.getElements('.code-block-container'),
      copyButtons: this.getElements('.code-copy-btn')
    };
  }

  bindEvents() {
    // 为所有复制按钮添加事件监听器
    this.elements.copyButtons.forEach(button => {
      button.addEventListener('click', this.handleCopyClick.bind(this));
    });

    // 键盘快捷键
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  setupCopyButtons() {
    if (!this.config.showCopyButton) return;

    this.elements.codeBlocks.forEach(container => {
      // 跳过已经有复制按钮的代码块
      if (container.querySelector('.code-copy-btn')) return;

      const button = this.createCopyButton();
      const header = container.querySelector('.code-block-header');
      
      if (header) {
        header.appendChild(button);
      } else {
        // 如果没有header，创建一个
        const newHeader = document.createElement('div');
        newHeader.className = 'code-block-header';
        newHeader.appendChild(button);
        container.insertBefore(newHeader, container.firstChild);
      }
    });

    // 重新缓存复制按钮
    this.elements.copyButtons = this.getElements('.code-copy-btn');
  }

  createCopyButton() {
    const button = document.createElement('button');
    button.className = 'code-copy-btn';
    button.textContent = this.config.copyButtonText;
    button.title = '复制代码';
    button.setAttribute('aria-label', '复制代码到剪贴板');
    return button;
  }

  async handleCopyClick(event) {
    const button = event.target;
    const container = button.closest('.code-block-container');
    
    if (!container) return;

    const codeElement = container.querySelector('.shiki code, pre code');
    if (!codeElement) return;

    try {
      const codeText = this.extractCodeText(codeElement);
      await navigator.clipboard.writeText(codeText);
      this.showCopyFeedback(button, true);
      
      // 触发复制成功事件
      this.eventBus?.emit('shiki:copy-success', { text: codeText });
      
    } catch (error) {
      console.warn('[ShikiPlugin] Failed to copy code:', error);
      this.showCopyFeedback(button, false);
      this.eventBus?.emit('shiki:copy-failed', { error });
    }
  }

  extractCodeText(codeElement) {
    // 克隆元素以避免修改原始DOM
    const clone = codeElement.cloneNode(true);
    
    // 移除可能存在的装饰元素
    const decorativeElements = clone.querySelectorAll('.line-number, .line-numbers-rows');
    decorativeElements.forEach(el => el.remove());
    
    // 获取纯文本，保持原始格式
    return clone.textContent || clone.innerText || '';
  }

  selectText(element) {
    if (window.getSelection && document.createRange) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (document.selection && document.body.createTextRange) {
      // IE 支持
      const range = document.body.createTextRange();
      range.moveToElementText(element);
      range.select();
    }
  }

  showCopyFeedback(button, success, customMessage = null) {
    const originalContent = button.textContent;
    const originalTitle = button.title;
    
    if (success) {
      button.textContent = customMessage || this.config.copiedText;
      button.title = customMessage || '已复制！';
      button.style.color = '#059669';
    } else {
      button.textContent = this.config.copyFailedText;
      button.title = '复制失败';
      button.style.color = '#dc2626';
    }
    
    // 恢复原状
    setTimeout(() => {
      button.textContent = originalContent;
      button.title = originalTitle;
      button.style.color = '';
    }, this.config.feedbackDuration);
  }

  setupKeyboardShortcuts() {
    // 功能已在handleKeydown中实现
  }

  handleKeydown(event) {
    // Ctrl/Cmd + Shift + C 复制聚焦的代码块
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
      const focusedCodeBlock = document.activeElement.closest('.code-block-container');
      if (focusedCodeBlock) {
        const copyButton = focusedCodeBlock.querySelector('.code-copy-btn');
        if (copyButton) {
          copyButton.click();
          event.preventDefault();
        }
      }
    }
  }

  setupAccessibility() {
    // 为代码块添加焦点支持
    this.elements.codeBlocks.forEach(block => {
      if (!block.hasAttribute('tabindex')) {
        block.setAttribute('tabindex', '0');
      }
      
      block.addEventListener('focus', () => {
        block.style.outline = '2px solid var(--color-primary)';
        block.style.outlineOffset = '2px';
      });
      
      block.addEventListener('blur', () => {
        block.style.outline = '';
        block.style.outlineOffset = '';
      });
    });
  }

  unbindEvents() {
    this.elements.copyButtons.forEach(button => {
      button.removeEventListener('click', this.handleCopyClick);
    });
    
    document.removeEventListener('keydown', this.handleKeydown);
  }

  destroy() {
    // 移除添加的复制按钮
    this.elements.copyButtons.forEach(button => {
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    });
    
    super.destroy();
  }
}

export default ShikiPlugin;