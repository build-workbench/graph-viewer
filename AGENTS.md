# AGENTS.md — GraphViewer 代理总章

## 项目一句话

GraphViewer 是 Next.js 15 + React 19 构建的多引擎图表编辑器 demo：静态演示版在浏览器本地渲染 Mermaid / Graphviz / Flowchart.js，完整服务版通过 `/api/render` 代理 Kroki 支持 PlantUML、D2、Vega 等 16+ 引擎和 PNG/PDF 导出。

## 代理工作原则

1. **小修可直改**：拼写、链接、测试补强、无行为变化的重构可直接修改，但必须同步受影响测试。
2. **单一事实源**：引擎、格式、展示分组、Kroki 类型和本地渲染能力均来自 `lib/diagramConfig.ts`，业务代码禁止散落 magic string。
3. **静态/完整双模式**：任何渲染、导出或路由改动都必须同时考虑 GitHub Pages 静态演示版和 Docker/Node 完整服务版。
4. **测试保护行为**：修 bug 必须先写失败测试；改 API、hook、导出或配置必须运行相关测试。
5. **不制造维护负担**：不得重新引入 `QWEN.md`、`.windsurf/`、Dependabot 自动分支策略、openspec/ 或泛化 AI 模板目录。

## 关键文件地图

| 责任                   | 文件                                                       |
| ---------------------- | ---------------------------------------------------------- |
| 引擎/格式/展示分组     | `lib/diagramConfig.ts`                                     |
| 示例代码               | `lib/diagramSamples.ts`                                    |
| 模板                   | `lib/diagramTemplates.ts`                                  |
| 图表文档类型           | `lib/types.ts`                                             |
| 本地存储               | `lib/storage.ts`                                           |
| 应用配置               | `lib/config.ts`                                            |
| 图表状态 Context       | `contexts/DiagramContext.tsx`                              |
| 工作区状态             | `hooks/useDiagramState.ts`                                 |
| 实时预览 debounce/取消 | `hooks/useLivePreview.ts`                                  |
| 本地/远程渲染          | `hooks/useDiagramRender.ts`                                |
| 渲染实现               | `lib/render.ts`                                            |
| 错误系统               | `lib/errors.ts`                                            |
| Kroki API route        | `app/api/render/route.ts`                                  |
| API 缓存/限流          | `lib/server/renderCache.ts`, `lib/server/rateLimit.ts`     |
| AI 客户端              | `lib/ai/`                                                  |
| 编辑器 UI              | `components/editor/EditorPanel.tsx`                        |
| 侧边栏 Tab 切换        | `components/sidebar/SidebarTabs.tsx`                       |
| 预览 UI                | `components/preview/PreviewPanel.tsx`                      |
| 导出工具栏             | `components/preview/PreviewToolbar.tsx`                    |
| 落地页（双语共享）     | `components/landing/LandingPage.tsx`, `lib/landingI18n.ts` |
| 静态导出               | `scripts/build-static-export.mjs`, `next.config.js`        |

## 引擎/格式变更 Checklist

任何新增、删除或改名必须同步：

1. `lib/diagramConfig.ts`：类型、labels、categories、Kroki type、本地能力。
2. `lib/diagramSamples.ts`：默认示例。
3. `lib/syntaxHighlight.ts`：CodeMirror 语言映射。
4. `lib/export/index.ts`：导出扩展名和 markdown fence。
5. `hooks/useDiagramRender.ts`：本地/远程分流。
6. `app/api/render/route.ts`：API 白名单。
7. `components/editor/EditorPanel.tsx`：选择器。
8. `components/preview/*`：预览和导出入口。
9. `lib/landingI18n.ts` + `components/landing/LandingPage.tsx`：门户展示能力。
10. 相关测试。

## 安全边界

- Kroki URL 必须规范化并受 allowlist 约束。
- 输入长度、超时、rate limit、inflight 去重不可绕过。
- SVG 进入预览前必须净化。
- API Key 不得写入 localStorage；AI 面板只能浏览器直连供应商。

## 验证命令

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
npm run build:static
```

生产服务器 smoke test 仅在 `npm run build` 后运行：

```bash
npm run test:smoke http://127.0.0.1:3000
```

## Git 与工程策略

- 默认主线为 `master`；不要创建长期维护分支。
- 依赖升级采用人工批量升级，不使用 Dependabot 自动分支。
- worktree 只用于临时隔离；完成后必须移除，不能把会话状态提交进仓库。
- `.omc/`、本地配置、构建产物和工具缓存不得进入提交。

## 输出语言

- 用户交互默认中文。
- UI 文案保持中文（落地页通过 `lib/landingI18n.ts` 提供英文版）。
- 用户文档可按受众使用中文或中英双语；不要混入无项目上下文的 boilerplate。
