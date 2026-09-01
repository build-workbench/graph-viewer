# GraphViewer

<p align="center">
  在浏览器中编辑、预览与分享图表<br/>
  <em>支持 Mermaid、PlantUML、Graphviz、D2 等 16 种语法，开箱即用</em>
</p>

<p align="center">
  <a href="https://build-workbench.github.io/graph-viewer/"><strong>在线演示</strong></a>
  ·
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#支持的引擎">支持的引擎</a>
  ·
  <a href="#部署">部署</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Next.js-15-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg" alt="React">
</p>

---

## 简介

GraphViewer 是一个图表编辑与预览工具，提供统一的编辑器、实时预览和导出能力。

- **16 种图表语法**，同一界面内切换，无需更换工具
- **混合渲染**：常用引擎（Mermaid / Graphviz / Flowchart.js）在浏览器内通过 WASM 本地渲染，隐私且离线可用；其余引擎通过 [Kroki](https://kroki.io) 远程渲染
- **完整工作流**：实时预览、多图表工作区、版本历史、LZ 压缩分享链接、多格式导出（SVG / PNG / PDF / HTML / Markdown）

> 在线演示部署于 GitHub Pages，仅含 3 个本地引擎，用于快速体验。完整能力需通过 Docker 或 Node 服务部署。

---

## 特性

- **多引擎统一体验** — Mermaid、PlantUML、Graphviz、D2、Vega / Vega-Lite、WaveDrom 等 16 个引擎
- **本地优先，远程补充** — 本地 WASM 即时渲染、离线可用；远程 Kroki 覆盖更多语法与导出格式
- **所见即所得** — CodeMirror 编辑、语法高亮、防抖实时预览
- **工作区管理** — 多图表本地持久化、版本快照、导入/导出工作区
- **分享与导出** — URL 压缩分享（约 100 字节）、SVG / PNG（2x/4x）/ PDF / 源码导出
- **可选 AI 辅助** — 自带 Key 直连模型供应商，支持代码分析、生成与修复（默认关闭，不落盘）

---

## 快速开始

### 在线体验

无需安装，直接打开：**https://build-workbench.github.io/graph-viewer/**

### 本地运行

要求：Node.js >= 20，npm >= 10

```bash
git clone https://github.com/build-workbench/graph-viewer.git
cd graph-viewer
npm install
npm run dev
# 打开 http://localhost:3000
```

### 环境变量（可选）

复制 `.env.example` 为 `.env` 后按需修改：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `KROKI_BASE_URL` | Kroki 服务地址 | `https://kroki.io` |
| `KROKI_ALLOW_CLIENT_BASE_URL` | 是否允许客户端指定任意 Kroki 地址（有 SSRF 风险，仅开发环境开启） | `false` |
| `KROKI_CLIENT_BASE_URL_ALLOWLIST` | 允许的客户端 Kroki 地址白名单，逗号分隔 | 为空（仅允许 `KROKI_BASE_URL`） |
| `PORT` | 服务端口 | `3000` |

---

## 支持的引擎

| 引擎 | 渲染方式 | 说明 |
|---|---|---|
| [Mermaid](https://mermaid.js.org/) | 本地 WASM | 流程图、时序图、甘特图、类图等 |
| [Graphviz](https://graphviz.org/) | 本地 WASM | DOT 语言，多布局引擎 |
| [Flowchart.js](https://flowchart.js.org/) | 本地 | 轻量流程图 |
| [PlantUML](https://plantuml.com/) | 远程 Kroki | UML、思维导图、WBS 等 |
| [D2](https://d2lang.com/) | 远程 Kroki | 声明式现代图表 |
| BlockDiag / NwDiag / ActDiag / SeqDiag | 远程 Kroki | 块状图、网络图、活动图、时序图 |
| [Vega](https://vega.github.io/vega/) / [Vega-Lite](https://vega.github.io/vega-lite/) | 远程 Kroki | 声明式数据可视化 |
| [WaveDrom](https://wavedrom.com/) | 远程 Kroki | 数字时序波形 |
| [Nomnoml](https://nomnoml.com/) / [Ditaa](https://ditaa.sourceforge.net/) / [SVGBob](https://github.com/ivanceras/svgbob) / [ERD](https://github.com/BurntSushi/erd) | 远程 Kroki | UML 简绘、ASCII 转图、实体关系图 |

> **两种运行模式**
> - **静态导出（GitHub Pages）**：仅 3 个本地引擎，导出仅 SVG，无需服务端
> - **完整服务（Docker / Node）**：通过 `/api/render` 代理 Kroki，支持全部 16 引擎及 PNG / PDF 导出

---

## 部署

### 模式对比

|  | GitHub Pages（静态） | Docker（完整服务，推荐） |
|---|---|---|
| 引擎数量 | 3 个本地引擎 | 全部 16 个 |
| 导出格式 | SVG | SVG / PNG / PDF / HTML / Markdown |
| 服务依赖 | 无 | Node 服务 + Kroki（可选自建） |
| 适用场景 | 快速体验、个人试用 | 团队使用、生产部署 |

### Docker 部署

```bash
# 使用公共 Kroki
docker compose --profile prod up -d

# 自建 Kroki（数据不出内网，隐私更好）
docker compose --profile prod --profile kroki up -d
```

| Profile | 说明 |
|---|---|
| `prod` | 生产 Web 服务 |
| `kroki` | 自建 Kroki 渲染服务 |
| `dev` | 开发环境（热重载） |

快捷脚本：`ENV=prod ./scripts/deploy.sh`，内置健康检查（`/api/healthz`）。

### 静态部署（GitHub Pages）

```bash
npm run build:static
# 产物在 out/，可直接托管至任意静态服务
```

推送到 `master` 分支时，由 `.github/workflows/pages.yml` 自动构建并发布。

---

## 本地开发

```bash
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 生产构建（含 API 路由）
npm run build:static # 静态导出
npm run start        # 启动生产服务（需先 build）

npm run test         # 单测（vitest）
npm run lint         # ESLint
npm run typecheck    # TypeScript 类型检查
npm run format       # Prettier 格式化
```

---

## 架构

![GraphViewer 架构图](public/architecture-diagram.svg)

> 浅色静态示意图。可交互版本（支持明暗主题、路径高亮与导出）：[在线查看](https://build-workbench.github.io/graph-viewer/architecture.html) 或本地打开 `public/architecture.html`。

**分层简述**

- `app/` — 路由层（Next.js App Router，`editor/`、`api/render`、`api/healthz`）
- `components/` — UI 层（按 `editor/` `preview/` `sidebar/` `ai/` `dialogs/` `landing/` 划分）
- `hooks/` — 状态与副作用（图表状态、渲染分流、实时预览、版本历史、AI）
- `lib/` — 纯逻辑与配置（`diagramConfig.ts` 为引擎唯一事实源，`render.ts` 负责本地/远程分流，`export/` `ai/` `server/` 分别处理导出、AI 与服务端能力）
- `scripts/` — 构建与部署脚本

<details>
<summary>关键文件索引（面向贡献者）</summary>

| 职责 | 文件 |
|---|---|
| 引擎 / 格式 / 分组定义 | `lib/diagramConfig.ts` |
| 静态导出判断 | `lib/runtime.ts` |
| 应用常量 | `lib/config.ts` |
| 图表状态 | `lib/diagramContext.tsx`、`hooks/useDiagramState.ts` |
| 渲染分流 | `hooks/useDiagramRender.ts`、`lib/render.ts` |
| 实时预览 | `hooks/useLivePreview.ts` |
| Kroki 代理 | `app/api/render/route.ts` |
| 缓存 / 限流 | `lib/server/renderCache.ts`、`lib/server/rateLimit.ts` |
| 静态导出构建 | `scripts/build-static-export.mjs`、`next.config.js` |

</details>

---

## 安全说明

- SVG 渲染前经 [DOMPurify](https://github.com/cure53/DOMPurify) 净化，Mermaid 启用严格安全模式
- Kroki 地址做规范化与白名单校验，默认禁止客户端任意指定
- 服务端对输入长度、请求超时、并发去重与速率限制做约束
- AI 功能为可选，API Key 仅存于内存、浏览器直连供应商，不写入 localStorage 或服务端
- 生产环境下发 `X-Frame-Options: DENY` 等安全响应头

---

## 项目状态

本项目已归档，不再主动迭代。现有代码与文档保持可用，可直接使用或 fork 二次开发。如需反馈问题，请提 [Issue](https://github.com/build-workbench/graph-viewer/issues)。

## 许可证

[MIT](LICENSE)

## 致谢

基于 [Mermaid](https://mermaid.js.org/)、[Kroki](https://kroki.io/)、[CodeMirror](https://codemirror.net/)、[Next.js](https://nextjs.org/)、[Graphviz WASM](https://github.com/hpcc-systems/hpcc-js-wasm) 构建，感谢开源社区。
