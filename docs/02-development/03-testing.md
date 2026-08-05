# 测试指南

GraphViewer 的综合测试策略。

## 测试分层

GraphViewer 有三层测试：

1. **单元/组件测试** - Vitest + Testing Library
2. **API 冒烟测试** - Node.js 脚本
3. **手动回归测试** - 基于浏览器的测试

## 单元和组件测试

### 运行测试

```bash
# 运行所有测试一次
npm run test

# 监听模式用于开发
npm run test:watch

# 运行并生成覆盖率报告
npm run test -- --coverage

# 运行特定测试文件
npm run test -- useDiagramState.test.tsx
```

### 当前测试覆盖

| 模块                    | 测试文件                                     | 覆盖范围      |
| ----------------------- | -------------------------------------------- | ------------- |
| lib/diagramConfig       | `lib/__tests__/diagramConfig.test.ts`        | 引擎/格式验证 |
| hooks/useDiagramState   | `hooks/__tests__/useDiagramState.test.tsx`   | 状态持久化    |
| hooks/useDiagramRender  | `hooks/__tests__/useDiagramRender.test.tsx`  | 渲染逻辑      |
| hooks/useVersionHistory | `hooks/__tests__/useVersionHistory.test.tsx` | 版本管理      |
| components/AppHeader    | `components/__tests__/AppHeader.test.tsx`    | 导入/导出     |
| components/PreviewPanel | `components/__tests__/PreviewPanel.test.tsx` | 预览显示      |
| API /healthz            | `app/api/healthz/route.test.ts`              | 健康检查      |
| API /render             | `app/api/render/route.test.ts`               | 渲染端点      |

### 编写测试

#### 测试 Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDiagramState } from './useDiagramState';

describe('useDiagramState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应将状态保存到 localStorage', () => {
    const { result } = renderHook(() => useDiagramState());

    act(() => {
      result.current.setCode('graph TD; A-->B;');
    });

    const saved = localStorage.getItem('graphviewer:state:v1');
    expect(saved).toContain('graph TD');
  });
});
```

#### 测试组件

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';

describe('EditorPanel', () => {
  it('应渲染引擎选择器', () => {
    render(<EditorPanel engine="mermaid" onEngineChange={vi.fn()} code="" />);

    expect(screen.getByLabelText(/引擎/i)).toBeInTheDocument();
  });

  it('选择引擎时应调用 onEngineChange', () => {
    const onChange = vi.fn();
    render(<EditorPanel engine="mermaid" onEngineChange={onChange} code="" />);

    fireEvent.change(screen.getByLabelText(/引擎/i), {
      target: { value: 'plantuml' }
    });

    expect(onChange).toHaveBeenCalledWith('plantuml');
  });
});
```

#### 测试 API 路由

```typescript
import { POST } from './route';

describe('/api/render', () => {
  it('无效引擎应返回 400', async () => {
    const request = new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ engine: 'invalid', format: 'svg', code: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('相同请求应命中缓存', async () => {
    // 第一个请求
    const req1 = createRequest({ engine: 'mermaid', format: 'svg', code: 'A-->B;' });
    await POST(req1);

    // 第二个相同请求应命中缓存
    const req2 = createRequest({ engine: 'mermaid', format: 'svg', code: 'A-->B;' });
    const response2 = await POST(req2);

    expect(response2.headers.get('X-Cache')).toBe('HIT');
  });
});
```

### Mock 依赖

```typescript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock 剪贴板 API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
    write: vi.fn(),
  },
});

// Mock fetch 用于 API 测试
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ result: 'success' }),
  }),
);
```

## 冒烟测试

### 运行冒烟测试

```bash
# 首先启动开发服务器
npm run dev

# 对 localhost 运行冒烟测试
npm run test:smoke

# 测试特定端点
node scripts/smoke-test.js http://localhost:3000
```

### 冒烟测试覆盖

当前冒烟测试验证：

- `GET /api/healthz` - 健康检查端点
- `POST /api/render` - Mermaid SVG 渲染
- `POST /api/render` - Mermaid PNG 渲染

### 预期输出

```
✅ Health check: 200 OK
✅ Render Mermaid SVG: 200 OK
✅ Render Mermaid PNG: 200 OK

All smoke tests passed!
```

## 集成测试

### Docker Compose 测试

```bash
# 启动完整栈
docker compose --profile prod --profile kroki up -d

# 对容器运行冒烟测试
npm run test:smoke http://localhost:3000

# 清理
docker compose down
```

### 分享链接测试

1. 创建一个图表
2. 点击"分享"按钮
3. 复制生成的 URL
4. 在无痕窗口中打开
5. 验证状态正确恢复

## 手动回归清单

### 渲染测试

- [ ] Mermaid 图表渲染（本地）
- [ ] Graphviz 图表渲染（本地 WASM）
- [ ] PlantUML 图表渲染（远程）
- [ ] D2 图表渲染（远程）
- [ ] 所有其他引擎正确渲染

### 导出测试

- [ ] SVG 导出下载有效文件
- [ ] PNG 2x 导出下载有效图片
- [ ] PNG 4x 导出下载有效图片
- [ ] HTML 导出下载独立页面
- [ ] Markdown 导出下载 .md 文件
- [ ] 复制 PNG 到剪贴板工作正常

### 工作区测试

- [ ] 创建新图表
- [ ] 重命名图表
- [ ] 删除图表
- [ ] 导入工作区 JSON
- [ ] 导出工作区 JSON
- [ ] localStorage 跨刷新持久化

### 设置测试

- [ ] 自定义 Kroki 服务器（允许时）
- [ ] 主题切换
- [ ] 键盘快捷键工作正常

## 持续集成

测试自动运行在：

- main 分支推送
- Pull Request 创建
- 夜间计划运行

### CI 测试矩阵

| 环境          | Node 版本 | 测试套件                   |
| ------------- | --------- | -------------------------- |
| ubuntu-latest | 22.x      | 完整测试套件               |
| CI 工作流     | 22.x      | Lint、类型检查、测试、构建 |

## 调试测试失败

### 常见问题

**测试超时：**

```bash
# 为慢测试增加超时
npm run test -- --testTimeout=10000
```

**环境不匹配：**

```bash
# 清除 Jest/Vitest 缓存
npm run test -- --clearCache
```

**缺少 mock：**

- 检查所有浏览器 API 是否已 mock
- 验证 fetch mock 返回正确的 Response 对象

### 测试工具

项目在 `vitest.setup.ts` 中包含测试工具：

- `jsdom` 环境设置
- 服务端测试的 Mermaid mock
- localStorage mock
- 剪贴板 API mock
