# 开发规范

GraphViewer 的编码标准和最佳实践。

## 代码风格

### TypeScript

- 使用严格模式
- 对象形状优先使用 `interface` 而非 `type`
- 导出函数使用显式返回类型
- 避免使用 `any` - 使用 `unknown` 配合类型守卫

```typescript
// ✅ 正确
interface DiagramState {
  engine: string;
  format: 'svg' | 'png' | 'pdf';
  code: string;
}

function useDiagramState(): DiagramState {
  // ...
}

// ❌ 避免
function useDiagramState(): any {
  // ...
}
```

### React 组件

- 使用函数组件和 hooks
- 保持组件关注单一职责
- 传递给子组件的事件处理器使用 `useCallback`
- 昂贵的计算使用 `useMemo`

```typescript
// ✅ 正确
interface EditorPanelProps {
  engine: string;
  onEngineChange: (engine: string) => void;
}

export function EditorPanel({ engine, onEngineChange }: EditorPanelProps) {
  const handleSelect = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    onEngineChange(e.target.value);
  }, [onEngineChange]);

  return <select value={engine} onChange={handleSelect}>...</select>;
}
```

### Hooks

- 自定义 hooks 以 `use` 为前缀
- Hooks 应具有单一职责
- 返回类型化的对象，而非数组

```typescript
// ✅ 正确
interface UseDiagramStateReturn {
  state: DiagramState;
  setEngine: (engine: string) => void;
  setCode: (code: string) => void;
}

export function useDiagramState(): UseDiagramStateReturn {
  // ...
}
```

## 文件组织

### 命名约定

| 类型  | 命名                  | 示例                  |
| ----- | --------------------- | --------------------- |
| 组件  | 大驼峰                | `EditorPanel.tsx`     |
| Hooks | 小驼峰 + use 前缀     | `useDiagramState.ts`  |
| 工具  | 小驼峰                | `exportUtils.ts`      |
| 类型  | 大驼峰                | `DiagramState.ts`     |
| 常量  | 大写下划线            | `MAX_CODE_LENGTH`     |
| 测试  | 源文件名 + `.test.ts` | `exportUtils.test.ts` |

### 目录结构

```
lib/
├── diagramConfig.ts       # 配置
├── diagramSamples.ts      # 示例数据
├── exportUtils.ts         # 导出工具
└── types.ts               # 共享类型
```

## 测试规范

### 测试文件位置

将测试放在 `__tests__` 目录：

```
lib/
├── __tests__/
│   └── diagramConfig.test.ts
└── diagramConfig.ts
```

### 测试命名

```typescript
// ✅ 正确
describe('useDiagramState', () => {
  describe('状态持久化', () => {
    it('应将状态保存到 localStorage', () => {
      // ...
    });

    it('应从 localStorage 恢复状态', () => {
      // ...
    });
  });
});
```

### 测试模式

```typescript
// Mock 外部依赖
vi.mock('lz-string', () => ({
  compressToEncodedURIComponent: vi.fn(),
  decompressFromEncodedURIComponent: vi.fn(),
}));

// 测试用户交互
render(<Component />);
await userEvent.click(screen.getByRole('button'));
expect(screen.getByText('结果')).toBeInTheDocument();
```

## 错误处理

### 前端

```typescript
// ✅ 使用 try-catch 配合特定错误类型
try {
  await renderDiagram(code);
} catch (error) {
  if (error instanceof RenderError) {
    setError(error.message);
  } else {
    setError('发生意外错误');
    console.error(error);
  }
}
```

### API 路由

```typescript
// ✅ 返回结构化错误响应
return NextResponse.json(
  {
    error: 'KROKI_ERROR',
    message: '图表渲染失败',
    details: error.message,
  },
  { status: 502 },
);
```

## 性能指南

### 避免不必要的渲染

```typescript
// ✅ 使用记忆化
const sortedDiagrams = useMemo(
  () => diagrams.sort((a, b) => b.updatedAt - a.updatedAt),
  [diagrams],
);

// ✅ 记忆化回调 props
const handleRender = useCallback(() => {
  renderDiagram(code);
}, [code, renderDiagram]);
```

### 懒加载

```typescript
// ✅ 懒加载重量级组件
const GraphvizRenderer = dynamic(() => import('./GraphvizRenderer'), { ssr: false });
```

## 文档

### JSDoc 注释

```typescript
/**
 * 使用指定的引擎和格式渲染图表。
 *
 * @param engine - 图表引擎（mermaid、plantuml 等）
 * @param format - 输出格式（svg、png、pdf）
 * @param code - 图表源代码
 * @returns 渲染输出和元数据
 *
 * @example
 * const result = await renderDiagram('mermaid', 'svg', 'graph TD; A-->B;');
 */
export async function renderDiagram(
  engine: string,
  format: Format,
  code: string,
): Promise<RenderResult> {
  // ...
}
```

## 安全最佳实践

1. **清洗用户输入**，渲染 SVG 前
2. **验证文件上传**，用于工作区导入
3. **使用环境变量** 存储敏感配置
4. **在 API 路由中设置安全头**
5. **切勿记录敏感数据**（完整代码内容）

## 代码审查清单

- [ ] TypeScript 无错误编译
- [ ] 所有测试通过
- [ ] 无 `console.log` 语句（使用适当的日志）
- [ ] 错误处理全面
- [ ] 存在无障碍属性（`aria-label` 等）
- [ ] 需要时应用性能优化
- [ ] API 更改时更新文档
