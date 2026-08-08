# AGENTS.md

本文件适用于仓库根目录及全部子目录。后续 Agent 开始任务前先阅读本文件，并结合 `git status --short --branch` 核实实时状态。

## 项目概况

- 这是 `https://smallfan.top` 的 Hexo 静态博客，主配置为 `_config.yml`，当前主题名为 `oyster`。
- `themes/oyster/` 是当前生效的本地主题，采用 EJS 模板和原生 CSS，已完整纳入本仓库版本控制，并非 Git submodule 或仅通过 npm 安装的外部主题。
- 内容以中文技术文章为主，文章源文件位于 `source/_posts/*.md`，常用 Front Matter 字段为 `title`、`date`、`tags`、`categories`，正文可用 `<!-- more -->` 控制首页摘要分隔。
- Oyster 使用 EJS 模板和原生 CSS；仓库仍保留原 Explorer 主题使用的 Pug、Stylus 依赖。主题内置静态全文搜索，不依赖外部搜索服务。仓库没有正式的测试或 lint 脚本，生产构建是最基本的验证门槛。
- Oyster 的阅读栏上限为 `1040px` 并始终水平居中；代码块由 Hexo/Highlight.js 服务端高亮，块内字号为 `12px`，语法配色适配自 Highlight.js 官方 StackOverflow Light 主题。`themes/oyster/scripts/markdown.js` 扩展脚注语法，`themes/oyster/source/js/markdown-outline.js` 为 H1/H2/H3 及其正文建立递进缩进。`themes/oyster/scripts/math.js` 会为声明了 `katex` 的旧文章兼容 `$$...$$`、`\[...\]` 和行内数学分隔符。

## 关键文件与修改边界

- `_config.yml`：站点元数据、URL、永久链接、渲染、主题选择等 Hexo 主配置。
- `_config.oyster.yml`：当前生效的站点级 Oyster 主题覆盖配置。搜索路径、摘要长度、Footer 年份和自定义资源注入优先改这里。
- `themes/oyster/_config.yml`：Oyster 主题默认值。不要为了单站点配置去改主题默认值；只有修改主题默认行为时才动这里。
- `themes/oyster/layout/`、`themes/oyster/source/`：当前主题的 EJS 页面模板、CSS 与静态资源实现。
- `source/css/custom.css`：为切换回历史主题保留的导航、页脚和深色模式兼容样式；Oyster 的主要样式在主题自身的 `source/css/style.css` 中。
- `source/js/homepage-links.js`：仅首页启用；文章标题与 `Read more…`、站点标题、分页、锚点及特殊协议链接在当前标签页跳转，其余链接保持新标签页打开。
- `source/about/index.md`：关于页面；页面本身不显示标题和日期，入口位于 Footer 的 `About Me` 链接。
- `source/search/index.md`：静态搜索结果页入口。搜索索引由 `themes/oyster/scripts/search-index.js` 在构建时生成，浏览器端匹配与渲染位于 `themes/oyster/source/js/search.js`。
- `scaffolds/`：新建 post、draft、page 时使用的 Front Matter 模板。
- `themes/explorer/`、`_config.explorer.yml` 与 `_config.butterfly.yml`：历史主题及配置，当前 `theme: oyster` 不会加载。除非任务明确要求回退、对照或迁移，否则不要把新功能写到这些文件，也不要假设不同主题配置需要同步。
- `CLAUDE.md`：已有的详细项目说明与历史功能记录。若改变了长期有效的架构或工作流，应同步检查 `AGENTS.md` 与 `CLAUDE.md` 是否需要更新。

## 生成物与工作区保护

- `public/`、`db.json`、`node_modules/`、`.deploy_git/` 都是生成物、缓存或部署工作区，且已被 `.gitignore` 忽略。不要直接编辑或提交它们。
- 修改前先看 `git status` 和相关 diff；现有修改默认属于用户，不覆盖、不回退，也不顺手格式化无关文件。
- 不主动执行发布、推送、提交、改写历史或删除内容。只有用户明确要求时才做这些操作。
- 不要因为本地安装依赖而擅自替换锁文件策略。CI 当前使用 npm，但仓库同时存在已跟踪的 `pnpm-lock.yaml`；先以任务范围和现有工作区状态为准。

## 常用命令

```bash
npm install          # 安装依赖；CI 也使用 npm
npm run server       # 本地预览，默认由 Hexo 启动开发服务器
npm run build        # 生成 public/
npm run clean        # 清理 Hexo 缓存和生成物，仅在需要排除缓存影响时使用
npm run deploy       # 调用 hexo deploy；当前 _config.yml 的 deploy 配置被注释，不是现行线上发布路径
```

GitHub Actions 在 `master` 分支 push 后使用 Node.js 22、`npm install` 和 `npm run build`，再发布 `public/` 到 GitHub Pages。后续依赖或构建改动至少应兼容该环境。

## 推荐工作流

1. 阅读本文件、相关源码和配置，执行 `git status --short --branch`，确认任务边界与用户已有修改。
2. 内容修改放在 `source/`；站点级开关优先改 `_config.oyster.yml`，共享自定义功能改 `source/css` / `source/js`，Oyster 的模板和视觉能力改 `themes/oyster/`。
3. 使用最小范围修改，保留现有中文文风、Front Matter、链接和 `<!-- more -->` 位置，除非任务要求调整。
4. 至少运行 `npm run build`。若变更涉及主题、样式或交互，再启动 `npm run server`，检查首页、文章页、移动端以及明暗主题中的相关行为。
5. 对主题和自定义静态资源，确认构建后存在 `public/css/style.css`、`public/css/custom.css`、`public/js/markdown-outline.js`、`public/js/homepage-links.js`、`public/js/search.js`、`public/search.json`、`public/search/index.html` 和 `public/about/index.html`；不要只确认源文件存在。音乐播放器已经移除，不应再生成 `public/js/music-player.js` 或 `public/music/playlist.json`。
6. 最终说明改了什么、如何验证、是否仍有未验证项，并明确区分本次改动与用户原有工作区修改。

## 当前交接快照

截至 2026-08-08，仓库位于 `master`，跟踪 `origin/master`。页面顶部不显示分类/关于导航，只在右上角提供可展开搜索框；Footer 通过 `About Me |` 链接进入关于页。后续仍须以实时 `git status`、远程分支和构建结果为准。
