/**
 * 运行时环境判断（单一事实源）
 *
 * 集中管理静态导出模式判断，消除 process.env.NEXT_PUBLIC_STATIC_EXPORT
 * 散落于各处的 magic string。静态导出模式（GitHub Pages）下禁用远程渲染，
 * 仅保留本地 3 引擎（mermaid / flowchart / graphviz）。
 */

/** 是否为静态导出模式（GitHub Pages 部署） */
export const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

/** 是否启用远程渲染（Kroki 代理），静态导出时为 false */
export const remoteRenderingEnabled = !isStaticExport;
