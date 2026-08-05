# AI 助手

用于图表创建和分析的 AI 驱动功能。

## 概述

AI 助手面板帮助用户：

- 分析现有图表代码
- 从描述生成新图表
- 修复语法错误
- 解释图表结构

## 能力

### 1. 代码分析

分析当前图表并提供：

- 结构分解
- 改进建议
- 复杂度评估
- 最佳实践建议

示例：

```
输入: Mermaid 流程图

分析:
- 5 个节点，4 条边
- 检测到线性流
- 建议：添加决策分支
- 建议：使用子图分组
```

### 2. 代码生成

从自然语言生成图表：

```
输入: "创建用户登录流程"

输出:
graph TD
    A[用户访问登录] --> B{有账户?}
    B -->|是| C[输入凭据]
    B -->|否| D[跳转到注册]
    C --> E{有效?}
    E -->|是| F[仪表板]
    E -->|否| G[错误信息]
    G --> C
```

### 3. 错误修复

尝试修复语法错误：

```
输入:
graph TD
    A-->B
    B-->  （缺少目标）

修复后:
graph TD
    A-->B
    B-->C[结束]
```

### 4. 解释说明

解释图表的作用：

```
输入: 复杂 PlantUML 类图

解释:
- 显示 3 个主类：User、Order、Product
- User 与 Order 是一对多关系
- Order 包含多个 Product
- 实现了 Repository 模式
```

## 架构

### Hook: `useAIAssistant`

```typescript
interface UseAIAssistantOptions {
  apiKey?: string; // AI 服务 API 密钥
  baseUrl?: string; // 自定义端点
  model?: string; // 模型选择
}

interface UseAIAssistantReturn {
  analyze: (code: string, engine: string) => Promise<Analysis>;
  generate: (description: string, engine: string) => Promise<string>;
  fix: (code: string, error: string) => Promise<string>;
  explain: (code: string, engine: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}
```

### 组件: `AIAssistantPanel`

位于 `components/AIAssistant.tsx`：

- 可折叠侧边栏面板
- 聊天式界面
- 每项能力的操作按钮
- 加载状态
- 错误处理

## 配置

### 环境变量

```env
# 可选：默认 AI 服务配置
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4
```

### 客户端设置

用户可以在设置面板中配置：

- 启用/禁用 AI 功能
- API 密钥输入
- 自定义端点 URL
- 模型选择（如支持）

## 安全考虑

### API 密钥存储

- 切勿将 API 密钥提交到仓库
- 存储在环境变量中
- 客户端密钥应受限
- 考虑通过服务器代理

### 服务端代理（推荐）

不直接让浏览器调用 AI API：

```typescript
// app/api/ai/route.ts
export async function POST(request: Request) {
  const { action, code, engine } = await request.json();

  // 服务端调用 AI 服务
  const response = await fetch(process.env.AI_BASE_URL, {
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    // ...
  });

  return NextResponse.json(result);
}
```

优点：

- API 密钥保留在服务端
- 速率限制
- 请求日志
- 响应缓存

## 使用方法

### 打开 AI 助手

1. 在侧边栏标签中查找 AI 图标
2. 点击展开 AI 助手面板
3. 选择所需操作

### 分析代码

1. 编写或粘贴图表代码
2. 点击 AI 面板中的"分析"
3. 查看建议
4. 如需要应用更改

### 生成图表

1. 点击 AI 面板中的"生成"
2. 输入描述（例如"电商订单流程"）
3. 选择目标引擎
4. 将生成的代码复制到编辑器

### 修复错误

1. 如果图表有错误，点击 AI 面板中的"修复"
2. AI 尝试纠正语法
3. 应用前查看修复

## 限制

### 当前约束

- 需要 API 密钥（自带密钥）
- 需要网络连接
- 受 AI 服务速率限制
- 生成的代码可能需要优化

### 已知问题

- 复杂图表可能超出令牌限制
- AI 可能不理解所有引擎语法
- 解释质量参差不齐
- 修复尝试可能引入新问题

## 未来增强

计划改进：

- 本地 AI 模型支持（设备端）
- 更好的上下文感知
- 多轮对话
- 模板库
- 批量操作
- 自定义提示词

## 隐私

- 图表代码发送到 AI 服务
- 查看 AI 提供商的隐私政策
- 敏感数据可选择自建 AI
- 可选择完全禁用 AI
