---
title: ClaudeCode系列（二）：入门一篇通
date: 2025-10-06 02:16:08
tags:
  - ClaudeCode
categories: [VibeCoding, ClaudeCode]
---

# 一、前言

作为 Vibe Coding 领域的重炮手 Claude 大模型母公司 Anthropic，自推出 Claude Code 后便风靡全球。但由于其掺杂一些政治目的导致中国区用户无法直接使用，加上 Claude Code 官方采用命令行程序形式相对复杂，一定程度上限制了很多国内开发者了解它。尽管如此，这也并不影响它成为 Vibe Coding 赛道的一个优等生存在。因此，本文通过去繁从简的思路，希望能帮助集团内开发同学快速上手 Claude Code，并有机会在日常开发中深度使用其辅助编程，在 AI 时代浪潮下，共同寻找未来新的程序设计模式。

<!-- more -->

# 二、准备工作

以下教程以 MacOS 为参考，Windows 及 Linux 请自行查阅官方文档。

## 2.1 安装 Node.js

官网参考：https://nodejs.org/en/download
版本要求：Node.js 18+

```bash
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 22

# Verify the Node.js version:
node -v # Should print "v22.19.0".

# Verify npm version:
npm -v # Should print "10.9.3".
```

## 2.2 安装 ClaudeCode

官网参考：https://claude.com/product/claude-code

```bash
npm install -g @anthropic-ai/claude-code
```

## 2.3 配置与启动

**注意事项**：由于 ClaudeCode 官方禁止中国区（包含港澳台）使用，启动 Claude 前务必使用合法区域全局代理🪜，避免被封号，切记！

由于 ClaudeCode（下面统一简称 CC） 官方 Anthropic 提供两种使用方式（账号相关具体见 [ClaudeCode 系列（一）：付费方案对比](https://smallfan.top/2025/10/06/cc_intro1/)）:

### 方式一：使用 Claude 付费账号

```bash
# 进入到希望使用 ClaudeCode 进行 AI 辅助编程的代码项目目录
cd /Users/smallfan/code/lizhi/bizArch/seal_ios

# 启动 ClaudeCode
claude

# 如果之前已经登录过或使用 API，则可以使用以下命令
# /logout
# /login

# 选择第一项,跳转到官网登录即可
1. Claude account with subscription
```

### 方式二：使用 Anthropic API

```bash
# 进入到希望使用 ClaudeCode 进行 AI 辅助编程的代码项目目录
cd /Users/smallfan/code/lizhi/bizArch/seal_ios

# 终端配置 Anthropic API Key
vi ~/.zshrc

# 在文件末尾增加 key 和 url
export ANTHROPIC_AUTH_TOKEN=sk-xxxxx
export ANTHROPIC_BASE_URL=https://xxxxx

# 启动 ClaudeCode
claude

# 选择第二项, 即使用 API
2. Anthropic Console account
```

完成上面的配置并启动后，即进入 CC 的使用界面。

![CC使用界面](https://blogpic.smallfan.top/claudeCode2/1.png)

# 三、重要命令速成

在 CC 对话框中，输入 `/` 字符即可进入命令模式，CC 内置了多个命令，帮助我们更好的使用。以下将介绍其中几个关键的命令。

更多内容请查阅官方文档：https://docs.claude.com/zh-CN/home

## 3.1 init

> **介绍**
> 首次进入项目目录后，使用 init 命令可以让 CC 把整个目录下所有文件通读一遍，并把学到的关于项目的知识保存到 `CLAUDE.md` 文件里（类似 Cursor Rule）。后续跟 CC 的所有对话，都会带上这个文件作为上下文，这个文件有助于帮助 AI 更快地理解整个项目。

同时，CLAUDE.md 也支持添加自定义内容，例如：

![CLAUDE.md示例](https://blogpic.smallfan.top/claudeCode2/2.png)

## 3.2 compact

> **介绍**
> 在与 CC 进行多轮对话过程中，可以使用 `/compact` 命令来压缩对话的上下文。执行该命令后，CC 会把之前对话的一些无关紧要的内容排除掉，可以有效提高 AI 的专注力并且显著的降低 Token 消耗；更为重要的是， Claude 大模型目前限制 256k 的上下文长度，即使不手动执行该命令，CC 也会在临界状态时自动触发，建议在一段对话结束时，及时手动执行。

下面介绍一种使用技巧，可以在 compact 命令后面带 prompt，告诉 CC 按照你的预期执行压缩，例如：

```
/compact 主要保留关于加载游戏相关请求 token 重试流程相关设计的内容
```

## 3.3 clear

> **介绍**
> 每当要开启一个新任务时候，就应该使用 `/clear` 命令来清除一下对话记录，保持一个干净的上下文，有助于让 AI 更加专注地执行新任务。

## 3.4 think mode

> **介绍**
> Claude 模型提供了四种不同强度的思考模式，即：`think` < `think hard` < `think harder` < `ultrathink`，相应地也会消耗不同量级的 token 数。在开始一些比较困难的推理任务之前，可以加上这些思考提示词，用来加大 AI 的思考长度。

```
ultrathink 帮我详细分析下当前项目的架构设计情况，并输出成 UML 文件
```

## 3.5 plan mode

> **介绍**
> 在对话状态下，连续按两次快捷键 `shift + tab` 即可进入 plan 模式。plan 模式下 CC 将不会修改任何文件和内容，该模式非常适合在任务前期于 CC 进行充分沟通时使用。 Opus 模型本身非常适合用于架构设计和代码理解上，但其消耗的 token 数是 Sonnet 的 5 倍，因此官方也明确建议：在 plan 模式下使用 Opus 模型，在 edit 模式下使用 Sonnet 模型，并在 `/model` 命令下预置了该选项。

![plan mode 运行时状态](https://blogpic.smallfan.top/claudeCode2/3.png)

![预置的模型选择：Plan Mode 下使用 Opus](https://blogpic.smallfan.top/claudeCode2/4.png)

## 3.6 临时命令行模式

> **介绍**
> 在对话框中输入 `!` 字符，即切换到命令行模式，这样可以执行一些临时的命令行命令，而不需要多开一个窗口。使用该模式有一个好处：执行命令的过程和结果，都会被加入到 CC 的对话上下文，AI 可以从对话历史里面看到命令执行全过程，避免 AI 进行一些重复的操作。

```
! pod install --repo-update
```

## 3.7 快速记忆模式

> **介绍**
> 在对话框中输入 `#`，即切换到快速记忆模式，接下来输入的内容被 CC 作为文件的形式记录下来，变成 AI 的长期记忆。记忆存放的位置分 2 种：
>
> - **Project memory**：即为项目级别记忆，内容保存到当前目录的 `CLAUDE.md` 文件中，仅对当前项目生效。
> - **User memory**：即为用户级别记忆，内容保存到用户目录的 `CLAUDE.md` 文件中，对全局所有项目生效。

![快速记忆模式](https://blogpic.smallfan.top/claudeCode2/5.png)

## 3.8 IDE 联动

> **介绍**
> 如果使用 CC 支持的 IDE （如 VSCode、Android Studio）在处于打开当前项目目录时，使用 `/ide` 命令则可以启动联动功能。在使用该命令之前，对应 IDE 需要安装 Claude Code 插件。

以 VSCode 为例，介绍 Claude Code 插件使用过程：

**第一步**：在扩展中搜索 `Claude Code for VS Code` 并完成安装。

![安装Claude Code插件](https://blogpic.smallfan.top/claudeCode2/6.png)

**第二步**：使用 `ide` 命令，选择对应 IDE。

![选择IDE](https://blogpic.smallfan.top/claudeCode2/7.png)

以下是 Claude Code 联动 VSCode 的两个功能：

### 功能一：代码选中识别
在 VSCode 中光标选中的代码，CC 可以快速读取到。

![代码选中识别示例1](https://blogpic.smallfan.top/claudeCode2/8.png)

![代码选中识别示例2](https://blogpic.smallfan.top/claudeCode2/9.png)

### 功能二：AI 代码修改 diff 可视化
当 CC 对代码进行修改后，VSCode 会新开一个窗口用于比对修改前后（类似 git diff），由人工比对通过后，再进行确认执行真正的代码修改操作。

# 四、MCP

关于 MCP 的原理和价值，本文不再介绍。

## 4.1 安装 MCP

这里以安装 Context7 为例，先从官网获取到 MCP 相关参数说明：

```json
{
  "mcpServers": {
    "context7": { // MCP 服务名
      "command": "npx", // 启动命令
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"] // 启动参数
    }
  }
}
```

对应到 Claude Code 的安装命令如下：

### 调用远程服务

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"
```

### 调用本地服务

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

以上安装方式是项目级别的，如果希望是用户级别的，则对应添加 `--scope user` 参数即可：

```bash
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

完成以上步骤后，使用 `mcp` 命令即可查看当前已安装并运行的所有 mcp 服务。

## 4.2 使用 MCP

在 CC 对话框中，直接指定需要使用的 MCP 即可。

![使用MCP示例](https://blogpic.smallfan.top/claudeCode2/10.png)

## 4.3 卸载 MCP

```bash
claude mcp remove context7
```

# 五、权限管理

> **介绍**
> 由于安全性要求，CC 在每次访问目录或文件、修改文件、提交 git 操作、访问 MCP 等都会暂停当前操作并请求用户同意，一定程度上增加了使用的复杂度。因此 CC 提供了 `/permissions` 命令，让用户可以自定义规则来规定哪些允许 CC 直接操作，哪些操作禁止 CC 执行。
>
> - 另外还有一种不推荐使用的方法（yolo 模式）：在启动 CC 时后面拼接 `--dangerously-skip-permissions` 参数，赋予 CC 最高权限，任意操作将无需再申请权限，完整命令如下：`claude --dangerously-skip-permissions`

## 5.1 Allow

顾名思义，就是允许 CC 直接操作的规则列表。添加规则如下：

```bash
# Bash 命令用于执行 bash 操作
# 格式：Bash(xxx:*)
# 其中 xxx 为具体命令
Bash(git add:*)

# WebFetch 命令
# 格式：WebFetch(domain:xxx)
# 其中 xxx 为具体域名
WebFetch(domain:github.com)

# mcp 命令
# 格式：mcp__xxx
# 其中 xxx 为已经安装的 MCP 服务名称
mcp__lark-mcp
```

![权限配置示例](https://blogpic.smallfan.top/claudeCode2/11.png)

## 5.2 Ask

如果希望每次执行前都询问是否同意的命令，则可以在 Ask 列表中添加，添加格式与 Allow 相同。

## 5.3 Deny

如果不希望被 CC 执行的命令，则可以在 Deny 列表中添加，添加格式与 Allow 相同。

## 5.4 Workspace

当希望 CC 在生成代码后，能无需授权直接自动修改到对应项目中时，则可以在 Workspace 中添加该项目目录地址。

![Workspace配置](https://blogpic.smallfan.top/claudeCode2/12.png)

# 六、Commands

> **介绍**
> 除了前面介绍的诸多强大的内置命令外，CC 也支持用户自定义命令，用 `/` 字符快速调用。自定义命令同样支持 项目级别 和 用户级别。
>
> - **用户级别命令位置**：`~/.claude/commands/`
> - **项目级别命令位置**：`.claude/commands/`

创建 2 个自定义命令 commit 和 cr，分别用于让 AI 分析暂存区内容并撰写标准 message 完成 git 提交和 diff 当前分支并执行代码 review：

![自定义命令](https://blogpic.smallfan.top/claudeCode2/13.png)

## 6.1 例子一

```markdown
# commit.md

分析当前git暂存区所有内容，采用 https://github.com/streamich/git-cz 插件所使用的提交规范编写 commit message，创建一个 commit
```

![commit命令示例](https://blogpic.smallfan.top/claudeCode2/14.png)

## 6.2 例子二

```markdown
# cr.md

对比当前分支与develop分支的差异，并提出你的review意见。
```

![cr命令示例](https://blogpic.smallfan.top/claudeCode2/15.png)

# 七、Hooks

> **介绍**
> Hook 可以让 CC 在工作过程中的某个特定节点，执行某些特定操作。Hook 同样支持 项目级别 和 用户级别。使用 `/hook` 命令即可进行对应配置。
>
> - **用户级别 Hook 配置文件位置**：`.claude/settings.json`
> - **项目级别 Hook 配置文件位置**：`~/.claude/settings.json` 或 `~/.claude/settings.local.json`（优先级更高）

![Hooks配置](https://blogpic.smallfan.top/claudeCode2/16.png)

## hook event 说明

- **PreToolUse**：在对应操作发生前执行，如修改代码前执行 `git stash push` 暂存当前所有变更
- **PostToolUse**：在对应操作发生后执行，如修改代码后执行 `swiftformat .` 对修改内容进行代码格式进行检查
- **Notification**：在通知发送的时候执行，如 CC 反馈后执行 `compact` 命令对上下文进行压缩
- **UserPromptSubmit**：在用户提交提示词时执行，如提交后执行自定义命令对提示词背景进行固定内容补充
- **SessionStart**：在一个新的会话开始时执行，如新会话创建后，自动填入预设的自定义提示词内容等

## hook matcher 说明

- **Read**：内容读取
- **Write|Edit|MultiEdit**：内容修改
- **WebFetch|WebSearch**：网络内容请求

除此之外，还支持 hook 安装的 mcp 服务等，更多玩法参考：https://docs.claude.com/en/docs/claude-code/hooks#hook-execution-details

```json
{
  "permissions": {
    "allow": [],
    "deny": [],
    "ask": []
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "swiftformat ."
          }
        ]
      }
    ]
  }
}
```

# 八、SubAgents

> **介绍**
> CC 利用 SubAgents 可以在后台开启多个子任务并行执行，加快任务的执行效率。每个 Sub Agent 都专注于一个小功能，可以提高结果的可预测性。正确使用 SubAgents 拆解复杂任务，可以提高任务的成功率。用 `/agents` 命令快速创建。SubAgents同样支持 项目级别 和 用户级别。
>
> - **用户级别命令位置**：`~/.claude/agents/`
> - **项目级别命令位置**：`.claude/agents/`

![SubAgents配置](https://blogpic.smallfan.top/claudeCode2/17.png)

## 8.1 例子

**创建 Agent 1**

![创建Agent 1](https://blogpic.smallfan.top/claudeCode2/18.png)

**创建 Agent 2**

![创建Agent 2](https://blogpic.smallfan.top/claudeCode2/19.png)

**提示词调用**

![提示词调用](https://blogpic.smallfan.top/claudeCode2/20.png)

# 九、历史对话管理

> **介绍**
> CC 支持恢复到指定的历史对话，现有的管理方式主要分为 3 种，分别是：
> - `/resume` 命令
> - `ccundo`
> - `Claudia`

## 9.1 resume 命令

直接在对话框中输入 `/resume` 命令即可进入历史话题选择，选中对应历史话题后双击两次 Esc 键，即可进入跳转到具体某一句消息前面进行对话。

![resume命令使用](https://blogpic.smallfan.top/claudeCode2/21.png)

**注意**：`/resume` 命令仅支持回退对话内容，不支持回退代码。如需回退代码请参考 `ccundo`。

## 9.2 ccundo

如果需要回退对话内容的同时回退代码，则可以采用开源项目 ccundo [Github 链接] 的方案。

![ccundo工具](https://blogpic.smallfan.top/claudeCode2/22.png)

## 9.3 Claudia

考虑到很多人本身对命令行缺乏经验（恐惧心理），我也找到了一个提供 GUI 界面的 CC 会话管理工具 Claudia [Github 链接]。该工具需要自行编译烧制，想偷懒的可以到 [这里] 下载。

## 9.4 export

> **介绍**
> CC 支持使用 `/export` 命令导出当前所有会话内容，场景运用于以下几个场景：
> - 保存到文件，用于在其他设备环境下继续任务
> - 复制到其他 AI 模型上，进行多模型交叉验证

![export命令](https://blogpic.smallfan.top/claudeCode2/23.png)
