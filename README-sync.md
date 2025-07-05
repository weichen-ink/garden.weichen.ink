# Obsidian 多设备同步脚本

这个脚本可以帮你将 Obsidian 仓库中的特定文件夹同步到 Git 仓库，并自动推送到 GitHub。支持多设备配置管理。

## ✨ 特性

- 🖥️ **多设备支持** - 为不同设备（ThinkPad、PC、Mac等）配置不同的路径
- 📁 **文件夹同步** - 将 Obsidian 中的指定文件夹同步到 Git 仓库
- 🚀 **自动推送** - 自动提交更改并推送到 GitHub
- 🎨 **彩色日志** - 清晰的彩色输出，易于查看同步状态
- ⚙️ **灵活配置** - 支持排除特定文件/文件夹
- 🔄 **增量同步** - 使用 rsync 进行高效的增量同步

## 🚀 快速开始

### 1. 设置权限
```bash
chmod +x sync-obsidian.sh
```

### 2. 配置你的设备
```bash
# 编辑脚本，添加你的设备配置
vi sync-obsidian.sh

# 在 "多设备配置区域" 添加类似这样的配置：
configure_my_laptop() {
    DEVICE_NAME="我的笔记本"
    OBSIDIAN_REPO="/path/to/obsidian"
    TARGET_REPO="/path/to/git/repo"
    SYNC_FOLDERS=("发布笔记:content")
    GIT_BRANCH="main"
    COMMIT_PREFIX="📝 [Laptop] 同步笔记: "
}

# 然后在 AVAILABLE_DEVICES 中注册：
# "my_laptop:configure_my_laptop:我的笔记本"
```

### 3. 运行同步
```bash
./sync-obsidian.sh                # 交互式选择设备
./sync-obsidian.sh my_laptop       # 直接指定设备
./sync-obsidian.sh --list          # 查看可用设备
./sync-obsidian.sh --help          # 查看帮助
```

## 📋 设备配置详解

### 配置函数模板

```bash
# 设备名称配置 (替换为你的设备名)
configure_your_device() {
    DEVICE_NAME="你的设备描述"                    # 设备显示名称
    OBSIDIAN_REPO="/path/to/obsidian/vault"      # Obsidian 仓库路径
    TARGET_REPO="/path/to/target/git/repo"       # 目标 Git 仓库路径
    
    # 同步文件夹配置 (源文件夹:目标文件夹)
    SYNC_FOLDERS=(
        "源文件夹1:目标文件夹1"
        "源文件夹2:目标文件夹2"
        # 可以添加更多...
    )
    
    # Git 配置
    GIT_BRANCH="main"                            # Git 分支
    COMMIT_PREFIX="📝 [设备标识] 同步笔记: "      # 提交信息前缀
}
```

### 实际配置示例

#### Windows 系统 (PC)
```bash
configure_pc() {
    DEVICE_NAME="Windows PC"
    OBSIDIAN_REPO="/d/Documents/Obsidian"
    TARGET_REPO="/d/Projects/my-blog"
    
    SYNC_FOLDERS=(
        "发布笔记:content/posts"
        "图片:static/images"
        "草稿:content/drafts"
    )
    
    GIT_BRANCH="main"
    COMMIT_PREFIX="💻 [PC] 同步笔记: "
}
```

#### Linux 系统 (ThinkPad)
```bash
configure_thinkpad() {
    DEVICE_NAME="ThinkPad X1"
    OBSIDIAN_REPO="/home/username/Documents/Obsidian"
    TARGET_REPO="/home/username/Projects/digital-garden"
    
    SYNC_FOLDERS=(
        "发布笔记:content"
        "资源文件:static/assets"
        "模板:templates"
    )
    
    GIT_BRANCH="main"
    COMMIT_PREFIX="🐧 [ThinkPad] 同步笔记: "
}
```

#### macOS 系统 (MacBook)
```bash
configure_macbook() {
    DEVICE_NAME="MacBook Pro"
    OBSIDIAN_REPO="/Users/username/Documents/Obsidian"
    TARGET_REPO="/Users/username/Projects/blog"
    
    SYNC_FOLDERS=(
        "博客文章:content/posts"
        "图片素材:static/images"
        "页面:content/pages"
    )
    
    GIT_BRANCH="main"
    COMMIT_PREFIX="🍎 [Mac] 同步笔记: "
}
```

## 📁 添加新设备的步骤

### 1. 创建配置函数
在脚本的 "多设备配置区域" 添加新的配置函数：

```bash
configure_新设备名() {
    # 按照上面的模板填写配置
}
```

### 2. 注册设备
在 `AVAILABLE_DEVICES` 数组中添加新设备：

```bash
AVAILABLE_DEVICES=(
    "thinkpad:configure_thinkpad:ThinkPad 笔记本"
    "pc:configure_pc:台式机"
    "macbook:configure_macbook:MacBook"
    "新设备id:configure_新设备名:设备描述"  # 添加这一行
)
```

### 3. 测试配置
```bash
./sync-obsidian.sh 新设备id
```

## 📂 同步文件夹配置

### 基本语法
```bash
SYNC_FOLDERS=(
    "源文件夹:目标文件夹"
    "Obsidian中的文件夹:Git仓库中的文件夹"
)
```

### 常用配置示例

#### 博客网站
```bash
SYNC_FOLDERS=(
    "发布文章:content/posts"      # 博客文章
    "页面:content/pages"          # 静态页面
    "图片:static/images"          # 图片资源
    "草稿:content/drafts"         # 草稿文件
)
```

#### 数字花园
```bash
SYNC_FOLDERS=(
    "笔记:content"               # 所有笔记
    "模板:templates"             # 模板文件
    "附件:static/attachments"    # 附件文件
    "配置:config"                # 配置文件
)
```

#### 技术文档站点
```bash
SYNC_FOLDERS=(
    "文档:docs"                  # 文档内容
    "图表:assets/diagrams"       # 图表文件
    "示例:examples"              # 示例代码
)
```

## 🎨 提交信息自定义

### 提交前缀建议
- `📝 [设备] 同步笔记: ` - 通用
- `💻 [PC] 同步笔记: ` - Windows PC
- `🐧 [Linux] 同步笔记: ` - Linux 系统
- `🍎 [Mac] 同步笔记: ` - macOS 系统
- `📱 [Mobile] 同步笔记: ` - 移动设备
- `🏢 [Office] 同步笔记: ` - 办公室
- `🏠 [Home] 同步笔记: ` - 家里

### 示例提交信息
脚本会自动生成如下格式的提交信息：
```
📝 [ThinkPad] 同步笔记: 2024-07-05 14:30:25
💻 [PC] 同步笔记: 2024-07-05 14:30:25
🍎 [Mac] 同步笔记: 2024-07-05 14:30:25
```

## 🚫 排除文件配置

脚本默认排除以下文件和文件夹：
- `.obsidian/` - Obsidian 配置文件夹
- `*.tmp` - 临时文件
- `.DS_Store` - macOS 系统文件
- `Thumbs.db` - Windows 缩略图
- `*.swp`, `*.swo` - Vim 临时文件
- `*~` - 备份文件
- `*.bak` - 备份文件
- `.git/` - Git 仓库文件夹

如需自定义排除规则，可以修改脚本中的 `EXCLUDE_PATTERNS` 数组。

## 📝 基本使用流程

1. **首次运行**：脚本会显示当前配置并要求确认
2. **文件同步**：使用 rsync 进行增量同步
3. **Git操作**：自动添加、提交和推送更改
4. **完成报告**：显示同步摘要和耗时

## 📝 运行效果示例

```bash
$ ./sync-obsidian.sh thinkpad

======================================================================
Obsidian 到 Git 仓库多设备同步脚本
======================================================================
开始时间: 2024-07-05 14:30:25

[INFO] 加载设备配置: ThinkPad X1

======================================================================
当前设备配置
======================================================================
设备名称: ThinkPad X1
Obsidian 仓库: /home/user/Documents/Obsidian
目标仓库: /home/user/Projects/blog
Git 分支: main
提交前缀: 🐧 [ThinkPad] 同步笔记:

同步文件夹：
  发布笔记 -> content
  图片资源 -> static/images
======================================================================

确认使用以上配置进行同步？(y/N): y

[STEP] 检查配置
[STEP] 验证路径
[SUCCESS] 路径验证通过
[STEP] 同步文件夹: 发布笔记 -> content
[INFO] 正在同步文件...
[SUCCESS] 文件夹同步完成: 发布笔记
[SUCCESS] 所有文件夹同步完成
[STEP] 检查 Git 状态
[INFO] 添加文件到 Git 暂存区...
[INFO] 提交更改...
[SUCCESS] Git 提交成功
[STEP] 推送到远程 GitHub 仓库
[INFO] 正在推送到 main 分支...
[SUCCESS] 推送成功

======================================================================
同步完成摘要
======================================================================
设备: ThinkPad X1
开始时间: 2024-07-05 14:30:25
结束时间: 2024-07-05 14:30:45
总耗时: 20 秒
同步的文件夹数量: 2
源仓库: /home/user/Documents/Obsidian
目标仓库: /home/user/Projects/blog
======================================================================

[SUCCESS] 同步流程全部完成！
```

## 🔧 故障排除

### 常见问题

1. **路径不存在**
   - 检查 Obsidian 仓库路径是否正确
   - 检查目标 Git 仓库路径是否正确

2. **权限问题**
   - 确保脚本有执行权限：`chmod +x sync-obsidian.sh`
   - 确保对文件夹有读写权限

3. **Git 推送失败**
   - 检查网络连接
   - 确认 Git 仓库配置正确
   - 验证 GitHub 访问权限

4. **rsync 命令不存在**
   - Windows: 安装 Git Bash 或 WSL
   - macOS: 通常自带，如无可通过 Homebrew 安装
   - Linux: `sudo apt install rsync` 或对应包管理器

### 日志分析
脚本提供详细的彩色日志输出：
- 🔵 `[INFO]` - 信息
- 🟢 `[SUCCESS]` - 成功
- 🟡 `[WARNING]` - 警告
- 🔴 `[ERROR]` - 错误
- 🟣 `[STEP]` - 步骤

## ⚡ 高级功能

### 自动化运行
可以通过 cron (Linux/macOS) 或任务计划程序 (Windows) 设置定时同步：

```bash
# 每小时同步一次 (添加到 crontab)
0 * * * * /path/to/sync-obsidian.sh thinkpad >> /var/log/obsidian-sync.log 2>&1
```

### 多仓库支持
如果需要同步到多个不同的 Git 仓库，可以为每个仓库创建单独的设备配置。

### 条件同步
可以在配置函数中添加条件判断，根据不同情况使用不同的同步策略。

## 📚 使用场景

### 个人博客维护
- **场景**：在多台设备上写博客，需要同步到 GitHub Pages
- **配置**：将 Obsidian 的"博客文章"文件夹同步到博客仓库的 content 目录

### 数字花园管理
- **场景**：构建个人知识网络，使用 Eleventy 或其他静态站点生成器
- **配置**：同步笔记到 content 目录，图片到 static 目录

### 技术文档协作
- **场景**：团队技术文档，需要从个人笔记同步到团队仓库
- **配置**：同步特定的文档文件夹，排除个人笔记

### 课程资料分享
- **场景**：教师或学生分享课程笔记和资料
- **配置**：同步课程笔记和相关资源文件

---

⚠️ **重要提醒**: 首次使用前，建议先备份重要数据，并在测试环境中验证配置的正确性。

**让你的 Obsidian 笔记轻松同步到任何地方！** 📝✨