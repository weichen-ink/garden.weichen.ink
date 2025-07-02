---
layout: home.njk
title: 首页
description: 欢迎来到我的数字花园
hideSidebar: true
hideTitle: true
permalink: /
---
## 你好 👏

欢迎使用这个现代、优雅的 Eleventy 数字花园主题！这个主题专为知识管理和思维连接而设计，让你的笔记像花园一样自然生长。

这是一个功能完整的数字花园解决方案，无论你是写作爱好者、知识工作者，还是想要构建个人博客的用户，都能在这里找到合适的功能。

## ✨ 主题亮点

### 🧠 智能笔记系统
- **双链笔记**：使用 `[[笔记名]]` 语法轻松连接想法，就像Obsidian一样
- **反向链接**：自动显示哪些笔记链接到了当前页面
- **大小写不敏感**：`[[GitHub]]` 和 `[[github]]` 都能正确链接

### 🎨 美观的界面设计
- **Obsidian Callout**：支持笔记、提示、警告等6种精美信息框，让重要内容更突出
- **卡片视图**：将列表转换为优雅的网格布局，展示书单、项目等
- **响应式设计**：完美适配手机、平板、电脑等各种设备
- **代码高亮**：支持多种编程语言的语法高亮显示

### 🔍 便捷的内容管理
- **全站搜索**：快速找到任何笔记和内容
- **自动分类**：根据标签和分类自动生成页面
- **文件夹管理**：支持任意深度的文件夹结构
- **图片处理**：智能处理图片大小和位置

## 🚀 5分钟上手指南

### 第1步：准备环境
确保你的电脑已安装：
- Node.js 18+ （[下载地址](https://nodejs.org/)）
- 任意代码编辑器（推荐 VS Code）

### 第2步：获取主题
```bash
# 下载主题文件
git clone https://github.com/weichen-ink/digital-garden-eleventy-theme.git
cd digital-garden-eleventy-theme

# 安装依赖
npm install
```

### 第3步：个性化配置
```bash
# 复制配置模板
# 项目包含默认配置文件，如需自定义请复制
cp garden.config.js garden.config.js.backup
# 然后编辑 garden.config.js
```

编辑 `garden.config.js` 文件，修改为你的信息：
```javascript
module.exports = {
  site: {
    title: "我的数字花园",        // 网站标题
    description: "知识的花园",    // 网站描述
    author: "你的名字",          // 作者姓名
    url: "https://yourdomain.com" // 网站地址
  }
};
```

### 第4步：开始写作
在 `content/` 文件夹里创建你的第一篇笔记：

```markdown
---
title: 我的第一篇笔记
tags: [想法, 学习]
---

这是我的数字花园！

我可以通过 [[其他笔记]] 来链接到其他内容。
```

### 第5步：预览效果
```bash
# 启动本地服务器
npm run serve
```

打开 `http://localhost:8080` 就能看到你的数字花园了！

## 📖 完整文档

想要深入了解这个主题的所有功能？查看我们的详细文档：

### 📚 主题文档
访问下面的文章了解完整的使用指南，包括：

- [[快速开始]] - 5分钟上手核心功能
- [[写作指南]] - 掌握高效写作技巧  
- [[双链笔记]] - 学会连接知识和想法
- [[主题配置]] - 个性化你的数字花园
- [[常见问题]] - 快速解决使用问题

## 💡 使用建议

1. **从简单开始**：先创建几篇基础笔记，熟悉双链语法
2. **逐步完善**：慢慢添加标签、分类，构建知识网络
3. **定期整理**：利用反向链接功能发现知识之间的联系
4. **个性化定制**：根据需要调整样式和配置

## 🤝 需要帮助？

- 📚 查看详细文档：点击上方教程链接
- 🐛 遇到问题：[提交Issue](https://github.com/weichen-ink/digital-garden-eleventy-theme/issues)
- 💬 交流讨论：[社区论坛](https://github.com/weichen-ink/digital-garden-eleventy-theme/discussions)

让我们一起打造属于你的知识花园！🌱