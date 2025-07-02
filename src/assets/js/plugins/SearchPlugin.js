// ES模块导入
import { Plugin } from '../core/Plugin.js';

/**
 * 搜索功能内部配置 - 用户无需修改
 */
const SEARCH_CONFIG = {
  dataUrl: '/search-data.json',
  minQueryLength: 2,
  maxResults: 10,
  debounceDelay: 300
};

/**
 * 搜索功能插件
 */
class SearchPlugin extends Plugin {
  constructor() {
    super('search');
    this.searchData = [];
    this.isVisible = false;
    this.selectedIndex = -1;
    this.suggestions = [];
  }

  getDefaultConfig() {
    return SEARCH_CONFIG;
  }

  cacheElements() {
    this.elements = {
      container: this.getElement('#searchContainer'),
      overlay: this.getElement('#searchOverlay'),
      resultsContainer: this.getElement('#searchResultsContainer'),
      input: this.getElement('#searchInput'),
      results: this.getElement('#searchResults'),
      suggestions: this.getElement('#searchSuggestions'),
      clear: this.getElement('#searchClear')
    };
  }

  bindEvents() {
    // 创建防抖的搜索函数
    this.debouncedSearch = this.debounce(
      (query) => this.performSearch(query),
      this.config.debounceDelay
    );

    // 点击页面其他地方关闭搜索
    document.addEventListener('click', (e) => {
      if (!this.elements.container?.contains(e.target) && 
          !e.target.classList.contains('search-toggle')) {
        this.hide();
      }
    });

    // 绑定输入事件
    if (this.elements.input) {
      this.elements.input.addEventListener('input', (e) => {
        this.debouncedSearch(e.target.value);
      });
      
      this.elements.input.addEventListener('keydown', (e) => {
        this.handleKeydown(e);
      });
    }

    // 暴露全局方法
    window.searchModule = this;
  }

  show() {
    this.isVisible = true;
    this.elements.container?.classList.add('active');
    this.elements.overlay?.classList.add('active');
    this.elements.input?.focus();
    this.loadData();
    this.eventBus.emit('search:shown');
  }

  hide() {
    this.isVisible = false;
    this.elements.container?.classList.remove('active');
    this.elements.overlay?.classList.remove('active');
    this.elements.resultsContainer?.classList.remove('visible');
    this.clear();
    this.eventBus.emit('search:hidden');
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  clear() {
    if (this.elements.input) this.elements.input.value = '';
    if (this.elements.results) this.elements.results.innerHTML = '';
    if (this.elements.suggestions) this.elements.suggestions.innerHTML = '';
    if (this.elements.resultsContainer) this.elements.resultsContainer.classList.remove('visible');
    if (this.elements.clear) this.elements.clear.classList.remove('visible');
    this.selectedIndex = -1;
    this.suggestions = [];
  }

  async loadData() {
    try {
      if (this.searchData.length === 0) {
        const response = await fetch(this.config.dataUrl);
        const data = await response.json();
        this.searchData = data.notes || [];
        this.eventBus.emit('search:dataLoaded', this.searchData);
      }
    } catch (error) {
      console.warn('Failed to load search data:', error);
      this.eventBus.emit('search:dataError', error);
    }
  }

  performSearch(query) {
    if (!query || query.length < this.config.minQueryLength) {
      this.elements.results.innerHTML = '';
      this.elements.suggestions.innerHTML = '';
      this.elements.resultsContainer?.classList.remove('visible');
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // 搜索并添加权重分数
    const searchResults = this.searchData.map(note => {
      const lowerTitle = (note.displayTitle || note.title).toLowerCase();
      const lowerContent = note.content.toLowerCase();
      
      let score = 0;
      let matchType = '';
      
      // 1. 标题完全匹配 (最高优先级: 100分)
      if (lowerTitle === lowerQuery) {
        score = 100;
        matchType = 'exact-title';
      }
      // 2. 标题开头匹配 (90分)
      else if (lowerTitle.startsWith(lowerQuery)) {
        score = 90;
        matchType = 'title-start';
      }
      // 3. 标题包含匹配 (80分)
      else if (lowerTitle.includes(lowerQuery)) {
        score = 80;
        matchType = 'title-contains';
      }
      // 4. 内容匹配 (60分)
      else if (lowerContent.includes(lowerQuery)) {
        score = 60;
        matchType = 'content';
      }
      
      return score > 0 ? { ...note, score, matchType } : null;
    }).filter(Boolean);

    // 按分数降序排列，分数相同时按标题字母顺序
    const results = searchResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (a.displayTitle || a.title).localeCompare(b.displayTitle || b.title);
    });

    this.displayResults(results, query);
    this.eventBus.emit('search:performed', { query, results });
  }

  displayResults(results, query) {
    if (results.length === 0) {
      this.elements.results.innerHTML = '<div class="search-empty">没有找到相关内容</div>';
      this.elements.resultsContainer?.classList.add('visible');
      return;
    }

    const resultsHTML = results.slice(0, this.config.maxResults).map(note => {
      const displayTitle = note.displayTitle || note.title;
      const highlightedTitle = this.highlightQuery(displayTitle, query);
      const highlightedExcerpt = this.highlightQuery(this.getExcerpt(note.content, query), query);
      
      return `
        <div class="search-result" data-url="${note.url}" role="button" tabindex="0">
          <div class="search-result-title">${highlightedTitle}</div>
          <div class="search-result-excerpt">${highlightedExcerpt}</div>
        </div>
      `;
    }).join('');

    this.elements.results.innerHTML = resultsHTML;
    this.elements.resultsContainer?.classList.add('visible');
    
    // 为每个搜索结果添加点击事件
    this.elements.results.querySelectorAll('.search-result').forEach(item => {
      const url = item.getAttribute('data-url');
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        if (url) {
          window.location.href = url;
        }
      });
      
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (url) {
            window.location.href = url;
          }
        }
      });
      
      item.style.cursor = 'pointer';
    });
  }

  getExcerpt(content, query, maxLength = 150) {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    const queryIndex = lowerContent.indexOf(lowerQuery);
    
    if (queryIndex === -1) {
      return this.truncateText(content, maxLength);
    }
    
    const contextLength = Math.floor((maxLength - query.length) / 2);
    const startIndex = Math.max(0, queryIndex - contextLength);
    const endIndex = Math.min(content.length, queryIndex + query.length + contextLength);
    
    let excerpt = content.substring(startIndex, endIndex);
    
    if (startIndex > 0) {
      excerpt = '...' + excerpt;
    }
    if (endIndex < content.length) {
      excerpt = excerpt + '...';
    }
    
    return excerpt;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  highlightQuery(text, query) {
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  handleKeydown(event) {
    switch (event.key) {
      case 'Escape':
        this.hide();
        break;
      case 'Enter':
        event.preventDefault();
        // TODO: 实现选择第一个结果的逻辑
        break;
    }
  }

  unbindEvents() {
    // 清理全局引用
    if (window.searchModule === this) {
      delete window.searchModule;
    }
  }
}

// ES模块导出
export { SearchPlugin };