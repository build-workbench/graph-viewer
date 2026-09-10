# 更新日志

GraphViewer —— 在浏览器中编辑、预览与分享多种图示语言的图表工具。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 多引擎图表工作台:Mermaid、PlantUML、Graphviz、D2、Vega / Vega-Lite、WaveDrom 等 16 种语法在同一界面内切换。
- 本地优先的混合渲染:常用引擎(Mermaid / Graphviz / Flowchart.js)经 WASM 在浏览器内渲染、可离线,其余引擎走 Kroki 远程渲染;另提供自定义渲染服务器(可指定 Kroki 地址)。
- 多图表工作区:新建、切换、重命名、删除(带确认弹窗)与本地持久化,以及工作区导入/导出。
- LZ-String 压缩分享链接(约 100 字节)与版本历史快照。
- 多格式导出:SVG / PNG(2x、4x)/ PDF / HTML / Markdown,并配套预览工具栏与图片导出。
- CodeMirror 编辑器操作按钮(复制 / 清空 / 格式化)与语法高亮。
- 可选 AI 助手面板:支持代码分析、智能生成与错误修复,默认关闭且不自带 Key。
- 设置面板、侧边栏标签页与折叠、Toast 提示与智能引擎切换,以及 SVG 缩放拖拽、全屏体验。
- 容器化部署(Docker / docker-compose)与自建 Kroki 部署指南,以及 Graphviz WASM 本地渲染降级方案。
- Vitest 测试体系、渲染/导出回归测试与 Spec-Driven Development 结构(AGENTS.md、CONTRIBUTING.md)。
- 自托管字体、og-image 社交卡,以及由 Archify 生成的矢量架构图与单文件架构页。

### 变更

- 编辑器由原生 textarea 迁移至 CodeMirror,配合防抖实现实时预览。
- 重构渲染与导出层:引入统一错误系统、渲染器策略模式与 StoragePort 接口。
- 存储模块由约 835 行精简到约 90 行,并抽取 AI 模块、封装 RenderCache 与 TTL 缓存。
- 优化渲染管线以减少级联重渲染,并加入请求去重与缓存清理机制。
- 升级 Node.js / React 与其它依赖并适配 Vite 8,同时推进安全加固与类型安全改进。
- 仓库与演示链接先后迁移至 build-workbench 组织,README 与部署配置同步更新。
- 项目进入归档状态,精简架构与目录结构,移除双语架构,README 与 GitHub Pages 落地页仅保留中文。

### 修复

- 修复二进制下载未写入缓存、PNG / PDF 预览失败等渲染与导出缺陷。
- 改进 WASM 错误处理与请求校验,修复搜索参数未包裹 Suspense、路由段配置中的条件表达式等问题。
- 修复 Mermaid 节点标签过长导致 GitHub 渲染报错,以及 og-image 社交卡 URL 双重 basePath。
- 修复状态持久化、分享链接与错误提示相关问题,并处理含 1 个 critical 级别的依赖漏洞。

### 移除

- 移除双语架构、英文文档站点与旧的文档/计划目录。
- 移除多个依赖包的 peer 标记、未使用的依赖与无效代码。
- 项目收尾时大幅删减(含单次净删除约 4 万行),清理过时文件与示例包袱。
