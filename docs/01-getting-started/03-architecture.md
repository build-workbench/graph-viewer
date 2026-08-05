# 架构概览

理解 GraphViewer 的架构和设计原则。

## 技术栈

| 技术         | 版本 | 用途                     |
| ------------ | ---- | ------------------------ |
| Next.js      | 15   | React 框架（App Router） |
| React        | 19   | UI 库                    |
| TypeScript   | 5.4+ | 类型安全的 JavaScript    |
| Tailwind CSS | 3.4  | 实用优先的样式           |
| Node.js      | 20+  | 运行时环境               |

## 项目结构

```
graph-viewer/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 主页面组件
│   ├── layout.tsx         # 根布局
│   ├── globals.css        # 全局样式
│   └── api/               # API 路由
│       ├── render/        # Kroki 代理（带缓存）
│       └── healthz/       # 健康检查
├── components/            # React 组件
│   ├── EditorPanel.tsx    # 代码编辑器和控制
│   ├── PreviewPanel.tsx   # 图表预览（支持缩放/平移）
│   ├── PreviewToolbar.tsx # 预览控制
│   ├── DiagramList.tsx    # 工作区图表管理
│   └── ...
├── hooks/                 # 自定义 React hooks
│   ├── useDiagramState.ts # 状态管理 + 持久化
│   ├── useDiagramRender.ts # 渲染逻辑
│   ├── useLivePreview.ts  # 防抖预览
│   └── ...
├── lib/                   # 工具模块
│   ├── diagramConfig.ts   # 引擎/格式定义
│   ├── diagramSamples.ts  # 示例代码片段
│   ├── exportUtils.ts     # 导出实现
│   └── types.ts           # TypeScript 类型
├── docs/                  # 文档
├── changelog/             # 版本历史
└── scripts/               # 构建和测试脚本
```

## 数据流

### 渲染流程

```
用户输入（EditorPanel）
    ↓
useDiagramState（状态 + URL + localStorage）
    ↓
useLivePreview（防抖 300ms）
    ↓
useDiagramRender
    ├── 本地渲染（Mermaid/Graphviz WASM）
    └── 远程渲染 → POST /api/render → Kroki
    ↓
PreviewPanel（显示）
```

### 状态持久化

1. **URL 查询参数**: 通过压缩 URL 分享状态
2. **localStorage**: 跨会话持久化工作区
3. **Key**: `graphviewer:state:v1`

## 渲染架构

### 混合渲染

GraphViewer 采用混合方式以获得最佳性能：

#### 本地渲染（客户端）

- **Mermaid**: 直接使用 `mermaid` 库在浏览器中渲染
- **Graphviz**: 使用 `@hpcc-js/wasm` 基于 WebAssembly 渲染
- **优势**: 快速、离线工作、数据不出浏览器

#### 远程渲染（服务端）

- **所有引擎**: 通过 Kroki 服务代理
- **端点**: `/api/render` 带内存缓存
- **优势**: 支持 16+ 引擎、一致的输出

### 渲染决策树

```
请求引擎
    ↓
能否本地渲染？
    ├── 是（Mermaid/Graphviz SVG）
    │   └── 尝试本地 → 成功 → 显示
    │       └── 失败 → 回退到远程
    └── 否
        └── 通过 Kroki 远程渲染
```

## 缓存策略

### 服务端缓存（`/api/render`）

- **类型**: 内存 Map
- **Key**: 请求体的 SHA-256
- **TTL**: 1 小时，定期清理
- **优点**: 减少 Kroki 调用、加快重复渲染

### 客户端持久化

- **localStorage**: 工作区状态（图表、设置）
- **Session Storage**: UI 偏好
- **URL 压缩**: LZ-string 用于可分享链接

## 安全考虑

1. **SVG 清洗**: DOMPurify 在渲染前清洗所有 SVG 内容
2. **Mermaid 安全**: `securityLevel: 'strict'` 防止 XSS
3. **输入验证**: 服务端验证引擎/格式/代码长度
4. **CORS**: API 路由配置正确

## 扩展点

### 添加新引擎

1. 在 `lib/diagramConfig.ts` 中添加: `ENGINE_LIST`、`ENGINE_LABELS`
2. 在 `lib/diagramSamples.ts` 中添加示例
3. 在 `lib/syntaxHighlight.ts` 中更新语法高亮

### 添加导出格式

1. 在 `lib/exportUtils.ts` 中实现
2. 在 `PreviewToolbar.tsx` 中添加按钮
3. 在 `lib/types.ts` 中更新类型定义

## 性能优化

- **防抖预览**: 300ms 延迟减少不必要的渲染
- **懒加载**: WASM 模块按需加载
- **代码分割**: Next.js 自动代码分割
- **AbortController**: 取消过时的渲染请求
