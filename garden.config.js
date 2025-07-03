module.exports = {
  
  // 网站基本信息
  site: {
    title: "微尘印记 🌿", // 网站标题，显示在浏览器标题栏和页面头部
    logo: "", // 网站Logo路径，留空显示文字标题，填入路径显示logo图片
    description: "欢迎来到我的数字花园，用于连接想法、整理知识", // 网站描述，用于SEO和首页展示
    url: "https://garden.weichen.ink", // 网站URL，用于生成绝对链接和sitemap
    author: "小橙子🍊", // 作者名称，显示在页脚和文章元信息中
    year: 2025, // 版权年份
    language: "zh-CN", // 网站语言，影响HTML lang属性和语义化
    repository: "" // 项目仓库地址（可选）
  },
  
  // 导航菜单配置
  menu: [
    { name: "首页", url: "/" }, // 主页链接
    { name: "标签", url: "/tags/" }, // 标签索引页
    { name: "分类", url: "/categories/" }, // 分类索引页
    { name: "关于", url: "/关于/" }, // 关于页面，可自定义URL
    { name: "联系", url: "/联系/" } // 联系页面，可自定义URL
  ],
  
  // Footer配置
  // 支持markdown格式，留空使用默认样式（显示作者、构建信息和座右铭）
  // 自定义示例: "© 2025 我的名字. 使用 [Eleventy](https://11ty.dev) 构建 ❤️"
  footer: "", // 留空使用默认footer样式
  
  
  // 首页配置
  homepage: {
    // 首页显示的最近文章数量
    recentNotesCount: 5,
    
    // 是否显示"最近创建"部分
    showRecentlyCreated: true,
    
    // 是否显示"最近更新"部分
    showRecentlyUpdated: true,
    
    // 自定义首页文章路径
    // 指定content目录下的文件名，系统会自动拼接完整路径
    // 例如: "欢迎.md" 或 "关于项目.md"，对应 content/欢迎.md
    // 例如："post/测试.md"，对应 content目录下的post文件夹中的测试.md文件。注意：路径前面不要写"/"符号
    customArticlePath: "首页.md" // 对应 content/主题文档示范.md 文件
  },
  
  // 搜索功能配置
  search: {
    enabled: true // 是否启用搜索功能
  },
  
  // 输出格式配置
  outputs: {
    // 站点地图生成
    sitemap: {
      enabled: true // 是否生成sitemap.xml
    }
  },
  
  // 主题自定义配置
  theme: {
    // 是否显示标题前的等级标识（h1, h2等）
    showHeadingMarkers: true,
    
    // 是否显示返回顶部按钮
    showBackToTop: true
  },
  
  // 评论系统配置
  comments: {
    // 是否启用评论系统
    enabled: false,
    
    // 可选：评论系统标题（如果为空则使用默认的"💬 评论"）
    title: "",

    // 自定义评论系统HTML代码
    // 支持任何评论系统：Giscus, Artalk, Twikoo, Utterances, Disqus等
    html: `
      <!-- 在这里添加你的评论系统代码 -->
      <!-- 示例：Giscus (GitHub Discussions) -->
      <script src="https://giscus.app/client.js"
              data-repo="your-username/your-repo"
              data-repo-id="R_kgDOJ..."
              data-category="General"
              data-category-id="DIC_kwDOJ..."
              data-mapping="pathname"
              data-strict="0"
              data-reactions-enabled="1"
              data-emit-metadata="0" 
              data-input-position="bottom"
              data-theme="preferred_color_scheme"
              data-lang="zh-CN"
              crossorigin="anonymous"
              async>
      </script>
    `
  },
  
  // 网站统计配置
  analytics: {
    // 是否启用网站统计
    enabled: true,
    
    // 自定义网站统计HTML代码
    // 支持任何统计系统：Google Analytics, 百度统计, Umami, Plausible, 51LA等
    html: `
      <!-- Google tag (gtag.js) -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XWKPXBBC4D"></script>
      <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-XWKPXBBC4D');
      </script>
    `
  },
  
  // 构建优化配置
  build: {
    // 是否压缩HTML代码（移除注释和多余空白字符）
    minifyHtml: true
  }
};
