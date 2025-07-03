# 源代码目录结构

## 📁 目录说明

### `/build-tools/` - 构建时工具
构建过程中使用的工具和脚本，不会被打包到最终产品中。

- `AssetBuilder.js` - 静态资源构建器（CSS/JS 处理、压缩、哈希）
- `ReportingSystem.js` - 构建报告系统（性能统计、警告收集）

### `/eleventy-plugins/` - Eleventy 插件
Eleventy 构建时使用的插件，扩展静态站点生成功能。

- `EleventyShikiPlugin.js` - 代码语法高亮插件
- `WikilinkPlugin.js` - Obsidian 风格双链处理插件
- `core/` - 插件核心组件
  - `CacheManager.js` - 缓存管理
  - `DuplicateDetector.js` - 重复文件检测
  - `FileSearcher.js` - 文件搜索
  - `LinkProcessor.js` - 链接处理
- `config/` - 插件配置
  - `file-extensions.js` - 支持的文件扩展名

### `/runtime/` - 运行时代码
浏览器中运行的 JavaScript 代码。

- `main.js` - 主入口文件
- `core/` - 核心应用框架
  - `DigitalGarden.js` - 数字花园应用核心
  - `Plugin.js` - 插件基类
- `plugins/` - 前端功能插件
  - `SearchPlugin.js` - 搜索功能
  - `TOCPlugin.js` - 目录生成
  - `UIPlugin.js` - 用户界面交互
  - `PreviewPlugin.js` - 笔记预览
  - `LazyLoadPlugin.js` - 懒加载
  - `ShikiPlugin.js` - 代码高亮

### `/assets/` - 静态资源
- `css/` - 样式文件
  - `main.css` - 主样式文件
  - `custom/` - 用户自定义样式

### Eleventy 模板文件
- `_layouts/` - 页面布局模板
- `_includes/` - 可复用组件
- `_templates/` - 页面模板
- `_data/` - 数据文件

## 🔄 架构原则

### 职责分离
- **构建时** (`build-tools/`, `eleventy-plugins/`)：处理文件转换、优化、生成
- **运行时** (`runtime/`)：处理用户交互、动态功能

### 模块化设计
- 每个插件都是独立模块
- 核心功能与扩展功能分离
- 配置与实现分离

### 易于维护
- 清晰的目录命名
- 功能分组明确
- 依赖关系简单

## 🚀 使用说明

### 添加新的构建工具
在 `/build-tools/` 中创建新文件，然后在 `.eleventy.js` 中引用。

### 添加新的 Eleventy 插件
在 `/eleventy-plugins/` 中创建插件，参考现有插件的结构。

### 添加新的前端功能
在 `/runtime/plugins/` 中创建插件，继承 `Plugin` 基类。

### 修改样式
在 `/assets/css/` 中修改样式，或在 `custom/` 中添加自定义样式。