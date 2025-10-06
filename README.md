# 风扇叔叔的博客 | Smallfan's Blog

<div align="center">

[![Hexo](https://img.shields.io/badge/Hexo-8.0.0-blue.svg)](https://hexo.io)
[![Butterfly](https://img.shields.io/badge/Theme-Butterfly-brightgreen.svg)](https://github.com/jerryc127/hexo-theme-butterfly)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D14.0.0-green.svg)](https://nodejs.org)

**A modern, feature-rich personal blog powered by Hexo and Butterfly theme**

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 项目简介

这是一个基于 Hexo 8.0.0 和 Butterfly 主题构建的个人技术博客。采用现代化的卡片式设计，支持深色模式、音乐播放器、响应式布局等丰富功能。

🌐 **网站地址**: [https://smallfan.top](https://smallfan.top)

### ✨ 主要特性

#### 核心功能
- 🎨 **现代化设计** - 基于 Butterfly 主题的卡片式响应式布局
- 🌓 **深色模式** - 自动/手动切换深色/浅色主题
- 📱 **移动适配** - 完美支持 PC、平板、手机等多端设备
- 🔍 **本地搜索** - 快速全文搜索文章内容
- 📊 **数学公式** - 支持 LaTeX 数学公式渲染
- 💬 **评论系统** - 支持多种评论插件集成

#### 自定义功能
- 🎵 **主页音乐播放器**
  - 仅在首页显示，不影响其他页面
  - 可拖拽的浮动播放器
  - 支持最小化/展开模式切换
  - 跨标签页播放控制（防止多标签同时播放）
  - 支持远程 CDN 和本地音频文件
  - 自动播放和用户交互触发播放
  - 完整播放控制：播放/暂停、上一曲/下一曲、进度条、音量控制

- 🔗 **智能链接行为**
  - 首页所有链接在新标签页打开
  - 网站标题/Logo 在当前标签页打开（保持音乐播放）
  - 锚点链接保持在当前页面

- 🎨 **自定义样式**
  - 页脚白色背景和黑色文字
  - 自定义 CSS 注入系统

### 🛠 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **Hexo** | 8.0.0 | 静态站点生成器 |
| **Node.js** | ≥14.0.0 | 运行环境 |
| **Butterfly Theme** | Latest | 现代化主题 |
| **Markdown** | - | 文章格式 |
| **Stylus** | 3.0.1 | CSS 预处理器 |
| **Pug** | 3.0.0 | HTML 模板引擎 |

### 🚀 快速开始

#### 环境要求
- Node.js ≥ 14.0.0
- npm 或 yarn

#### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd blog

# 2. 安装依赖
npm install

# 3. 启动本地开发服务器
npm run server
# 访问 http://localhost:4000
```

#### 常用命令

```bash
# 清理缓存和生成的文件
npm run clean

# 生成静态文件
npm run build

# 启动本地服务器（支持热重载）
npm run server

# 部署到远程服务器
npm run deploy

# 创建新文章
hexo new post "文章标题"

# 创建新草稿
hexo new draft "草稿标题"

# 发布草稿
hexo publish "草稿标题"

# 创建新页面
hexo new page "页面名称"
```

### 📁 项目结构

```
blog/
├── _config.yml                 # Hexo 主配置文件
├── _config.butterfly.yml       # Butterfly 主题配置
├── package.json               # 项目依赖
├── scaffolds/                 # 文章模板
├── source/                    # 源文件目录
│   ├── _posts/               # 博客文章（Markdown）
│   ├── images/               # 图片资源
│   ├── css/                  # 自定义样式
│   │   └── custom.css       # 自定义 CSS（播放器、页脚等）
│   ├── js/                   # 自定义脚本
│   │   ├── music-player.js  # 音乐播放器逻辑
│   │   └── homepage-links.js # 首页链接行为
│   └── music/                # 音乐文件
│       └── playlist.json     # 播放列表配置
├── themes/                    # 主题目录
│   └── butterfly/            # Butterfly 主题
└── public/                    # 生成的静态文件（构建后）
```

### ⚙️ 配置说明

#### Hexo 核心配置 (`_config.yml`)
```yaml
# 网站基本信息
title: 风扇叔叔
author: Smallfan
language: zh-CN
url: https://smallfan.top

# 主题配置
theme: butterfly

# 部署配置
deploy:
  type: git
  repo: <repository-url>
  branch: gh-pages
```

#### Butterfly 主题配置 (`_config.butterfly.yml`)
- 外观设置（颜色、布局、字体）
- 功能开关（深色模式、搜索、评论）
- 社交链接和图标
- 代码高亮主题
- 自定义脚本注入

#### 音乐播放器配置 (`source/music/playlist.json`)
```json
{
  "files": [
    "https://cdn.example.com/song1.mp3",
    "local-song.mp3"
  ]
}
```

### 🎵 音乐播放器使用

1. **添加音乐文件**
   - 远程文件：直接在 `playlist.json` 中添加 CDN URL
   - 本地文件：将音频文件放入 `source/music/` 目录

2. **配置播放列表**
   - 编辑 `source/music/playlist.json`
   - 音乐按 JSON 数组顺序播放

3. **播放控制**
   - 拖拽播放器到任意位置
   - 点击最小化/展开按钮切换模式
   - 使用进度条跳转播放位置
   - 调整音量滑块控制音量

### 🌐 部署

#### GitHub Pages

```bash
# 1. 配置 _config.yml 中的 deploy 部分
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git
  branch: gh-pages

# 2. 安装部署插件（已安装）
npm install hexo-deployer-git --save

# 3. 生成并部署
npm run clean
npm run build
npm run deploy
```

#### 其他平台
- **Vercel**: 连接 GitHub 仓库，设置构建命令为 `npm run build`，输出目录为 `public`
- **Netlify**: 同 Vercel 配置
- **VPS**: 使用 rsync 或 scp 将 `public/` 目录上传到服务器

### 🎨 自定义开发

#### 添加自定义 CSS
1. 在 `source/css/custom.css` 中添加样式
2. 在 `_config.butterfly.yml` 的 `inject.head` 中引入

#### 添加自定义 JavaScript
1. 在 `source/js/` 中创建 JS 文件
2. 在 `_config.butterfly.yml` 的 `inject.bottom` 中引入

#### 修改主题
- 建议使用主题配置文件 `_config.butterfly.yml` 而非直接修改主题文件
- 深度定制可修改 `themes/butterfly/` 中的文件

### 📝 内容管理

#### 文章 Front Matter
```yaml
---
title: 文章标题
date: 2024-01-01 12:00:00
tags: [标签1, 标签2]
categories: 分类
cover: /images/cover.jpg
description: 文章描述
---
```

#### 支持的功能
- 代码高亮
- 数学公式（LaTeX）
- 图片灯箱
- 目录（TOC）
- 文章加密
- 评论系统

### 🔧 故障排除

**问题：本地服务器无法启动**
```bash
# 清理缓存并重新启动
npm run clean
npm run server
```

**问题：音乐播放器不显示**
- 检查 `playlist.json` 格式是否正确
- 确认 `music-player.js` 已在 `_config.butterfly.yml` 中注入
- 检查浏览器控制台是否有错误

**问题：构建失败**
```bash
# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 📄 许可证

MIT License

### 🙏 致谢

- [Hexo](https://hexo.io/) - 静态站点生成器
- [Butterfly Theme](https://github.com/jerryc127/hexo-theme-butterfly) - 优秀的 Hexo 主题
- 所有贡献者和开源社区

---

## English

### 📖 Project Overview

A modern personal tech blog built with Hexo 8.0.0 and Butterfly theme, featuring a contemporary card-based design with dark mode, music player, responsive layout, and rich functionality.

🌐 **Website**: [https://smallfan.top](https://smallfan.top)

### ✨ Key Features

#### Core Features
- 🎨 **Modern Design** - Card-based responsive layout with Butterfly theme
- 🌓 **Dark Mode** - Auto/manual dark/light theme switching
- 📱 **Mobile Friendly** - Perfect support for PC, tablet, and mobile devices
- 🔍 **Local Search** - Fast full-text article search
- 📊 **Math Support** - LaTeX math formula rendering
- 💬 **Comment System** - Multiple comment plugin integration

#### Custom Features
- 🎵 **Homepage Music Player**
  - Displays only on homepage
  - Draggable floating player
  - Minimize/expand mode toggle
  - Cross-tab playback control (prevents multi-tab playback)
  - Supports remote CDN and local audio files
  - Auto-play and user interaction triggered playback
  - Full playback controls: play/pause, prev/next, progress bar, volume control

- 🔗 **Smart Link Behavior**
  - All homepage links open in new tabs
  - Site title/logo opens in current tab (preserves music playback)
  - Anchor links stay on current page

- 🎨 **Custom Styling**
  - White footer background with black text
  - Custom CSS injection system

### 🛠 Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| **Hexo** | 8.0.0 | Static site generator |
| **Node.js** | ≥14.0.0 | Runtime environment |
| **Butterfly Theme** | Latest | Modern theme |
| **Markdown** | - | Content format |
| **Stylus** | 3.0.1 | CSS preprocessor |
| **Pug** | 3.0.0 | HTML template engine |

### 🚀 Quick Start

#### Requirements
- Node.js ≥ 14.0.0
- npm or yarn

#### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd blog

# 2. Install dependencies
npm install

# 3. Start local dev server
npm run server
# Visit http://localhost:4000
```

#### Common Commands

```bash
# Clean cache and generated files
npm run clean

# Generate static files
npm run build

# Start local server (with hot reload)
npm run server

# Deploy to remote server
npm run deploy

# Create new post
hexo new post "Post Title"

# Create new draft
hexo new draft "Draft Title"

# Publish draft
hexo publish "draft-title"

# Create new page
hexo new page "page-name"
```

### 📁 Project Structure

```
blog/
├── _config.yml                 # Main Hexo configuration
├── _config.butterfly.yml       # Butterfly theme config
├── package.json               # Project dependencies
├── scaffolds/                 # Post templates
├── source/                    # Source files
│   ├── _posts/               # Blog posts (Markdown)
│   ├── images/               # Image assets
│   ├── css/                  # Custom styles
│   │   └── custom.css       # Custom CSS (player, footer, etc.)
│   ├── js/                   # Custom scripts
│   │   ├── music-player.js  # Music player logic
│   │   └── homepage-links.js # Homepage link behavior
│   └── music/                # Music files
│       └── playlist.json     # Playlist configuration
├── themes/                    # Themes directory
│   └── butterfly/            # Butterfly theme
└── public/                    # Generated static files (after build)
```

### ⚙️ Configuration

#### Hexo Core Config (`_config.yml`)
```yaml
# Site info
title: Smallfan's Blog
author: Smallfan
language: zh-CN
url: https://smallfan.top

# Theme
theme: butterfly

# Deployment
deploy:
  type: git
  repo: <repository-url>
  branch: gh-pages
```

#### Butterfly Theme Config (`_config.butterfly.yml`)
- Appearance settings (colors, layout, fonts)
- Feature toggles (dark mode, search, comments)
- Social links and icons
- Code highlighting themes
- Custom script injection

#### Music Player Config (`source/music/playlist.json`)
```json
{
  "files": [
    "https://cdn.example.com/song1.mp3",
    "local-song.mp3"
  ]
}
```

### 🎵 Music Player Usage

1. **Add Music Files**
   - Remote files: Add CDN URL directly in `playlist.json`
   - Local files: Place audio files in `source/music/` directory

2. **Configure Playlist**
   - Edit `source/music/playlist.json`
   - Music plays in JSON array order

3. **Playback Controls**
   - Drag player to any position
   - Click minimize/expand button to toggle mode
   - Use progress bar to seek playback position
   - Adjust volume slider to control volume

### 🌐 Deployment

#### GitHub Pages

```bash
# 1. Configure deploy section in _config.yml
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git
  branch: gh-pages

# 2. Install deploy plugin (already installed)
npm install hexo-deployer-git --save

# 3. Generate and deploy
npm run clean
npm run build
npm run deploy
```

#### Other Platforms
- **Vercel**: Connect GitHub repo, set build command to `npm run build`, output dir to `public`
- **Netlify**: Same as Vercel config
- **VPS**: Use rsync or scp to upload `public/` directory to server

### 🎨 Custom Development

#### Add Custom CSS
1. Add styles to `source/css/custom.css`
2. Include in `inject.head` of `_config.butterfly.yml`

#### Add Custom JavaScript
1. Create JS file in `source/js/`
2. Include in `inject.bottom` of `_config.butterfly.yml`

#### Modify Theme
- Recommended: Use theme config file `_config.butterfly.yml` instead of modifying theme files directly
- Deep customization: Modify files in `themes/butterfly/`

### 📝 Content Management

#### Post Front Matter
```yaml
---
title: Post Title
date: 2024-01-01 12:00:00
tags: [tag1, tag2]
categories: Category
cover: /images/cover.jpg
description: Post description
---
```

#### Supported Features
- Code highlighting
- Math formulas (LaTeX)
- Image lightbox
- Table of contents (TOC)
- Post encryption
- Comment system

### 🔧 Troubleshooting

**Issue: Local server won't start**
```bash
# Clean cache and restart
npm run clean
npm run server
```

**Issue: Music player not showing**
- Check `playlist.json` format
- Verify `music-player.js` is injected in `_config.butterfly.yml`
- Check browser console for errors

**Issue: Build fails**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 📄 License

MIT License

### 🙏 Acknowledgments

- [Hexo](https://hexo.io/) - Static site generator
- [Butterfly Theme](https://github.com/jerryc127/hexo-theme-butterfly) - Excellent Hexo theme
- All contributors and open source community

---

<div align="center">

**Made with ❤️ by Smallfan**

If you find this project helpful, please consider giving it a ⭐️

</div>
