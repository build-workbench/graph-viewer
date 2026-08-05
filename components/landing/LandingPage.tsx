import Link from 'next/link';
import Image from 'next/image';
import {
  Zap,
  Shield,
  Globe,
  Download,
  Share2,
  Layers,
  Code,
  Sparkles,
  ArrowRight,
  Check,
  Github,
  ExternalLink,
  Server,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import {
  ENGINE_CONFIGS,
  LANDING_ENGINE_CATEGORIES,
  LOCAL_RENDER_ENGINES,
} from '@/lib/diagramConfig';
import { CodePreview } from '@/components/landing/CodePreview';

const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

// 落地页文案（单语：中文）
const COPY = {
  nav: {
    tryOnline: '在线试用',
    demoBadge: '演示版',
  },
  hero: {
    demoBadgeText: '当前为 GitHub Pages 演示版',
    demoBadgeLink: '了解限制',
    ossBadge: '开源免费 · 开箱即用',
    h1Line1: '现代图表可视化工具',
    h1Line2: '16+ 引擎一体化支持',
    pPrefix: '支持 Mermaid、PlantUML、Graphviz、D2 等主流图表语法。',
    pLocal: '本地渲染保护隐私',
    pRemote: '远程渲染支持更多格式',
    tryOnline: '在线试用',
    githubRepo: 'GitHub 仓库',
    mitLicense: 'MIT 开源协议',
  },
  codePreview: {
    h2: '简洁直观的编辑体验',
    p: '实时预览、语法高亮、自动补全，让图表创作更加流畅',
  },
  features: {
    h2: '强大而灵活的功能',
    p: '满足个人开发者和企业团队的各种图表需求',
    items: [
      {
        title: '16+ 图表引擎',
        description:
          '支持 Mermaid、PlantUML、Graphviz、D2、Vega 等主流图表语法，满足各种可视化需求。',
      },
      {
        title: '隐私优先',
        description:
          '本地 WASM 渲染引擎（Mermaid、Graphviz）完全在浏览器中运行，无需上传数据到服务器。',
      },
      {
        title: '混合渲染架构',
        description: '本地渲染快速响应，远程 Kroki 服务支持更多格式（PNG/PDF）和引擎。',
      },
      {
        title: '多格式导出',
        description: '支持 SVG、PNG（2x/4x 高清）、PDF、HTML、Markdown 等多种格式导出。',
      },
      {
        title: '即时分享',
        description: '使用 LZ-string 压缩算法生成短链接，方便分享和嵌入到文档中。',
      },
      {
        title: '多图表工作区',
        description: '本地持久化存储，支持版本历史、图表管理和工作区导入导出。',
      },
    ],
  },
  engines: {
    h2: '支持 16+ 图表引擎',
    p: '从简单的流程图到复杂的数据可视化，一个工具全搞定',
    localBadge: '本地',
    tipPrefix: '💡 提示：',
    tipText:
      '标注"本地"的引擎在 GitHub Pages 演示版中完全可用，无需后端服务。 完整版 Docker 部署支持全部 16+ 引擎和 PNG/PDF 导出。',
  },
  deployment: {
    h2: '选择适合你的部署方式',
    p: '从免费演示到完整生产环境，灵活满足各种需求',
    current: '当前',
    options: [
      {
        title: 'GitHub Pages（演示版）',
        subtitle: '当前版本',
        badge: '免费体验',
        description: '零成本快速体验核心功能，无需部署即可在浏览器中使用',
        note: '适合快速体验和简单图表绘制',
        cta: '立即体验',
        features: [
          { text: 'Mermaid / Graphviz / Flowchart.js', available: true },
          { text: '本地渲染，隐私安全', available: true },
          { text: '仅支持 SVG 格式', available: false },
          { text: '无远程引擎支持', available: false },
        ],
      },
      {
        title: 'Docker（完整版）',
        subtitle: '推荐',
        badge: '完整功能',
        description: '一键部署，获得完整的 16+ 引擎支持和高级功能',
        note: '适合团队协作和生产环境',
        cta: '查看部署指南',
        features: [
          { text: '全部 16+ 图表引擎', available: true },
          { text: 'SVG / PNG / PDF 全格式导出', available: true },
          { text: '可选 AI 辅助功能', available: true },
          { text: '完整的数据持久化', available: true },
        ],
      },
    ],
    limitsTitle: '演示版（GitHub Pages）功能限制说明',
    limitsFeatureHeader: '功能对比',
    limitsDemoHeader: '演示版（当前）',
    limitsFullHeader: 'Docker 完整版',
    limitsRows: [
      {
        category: '支持引擎',
        demo: '3 个（Mermaid, Graphviz, Flowchart.js）',
        full: '16+ 个（包括 PlantUML, D2, Vega 等）',
      },
      {
        category: '导出格式',
        demo: '仅 SVG',
        full: 'SVG, PNG (2x/4x), PDF, HTML, Markdown',
      },
      {
        category: 'AI 功能',
        demo: '不支持',
        full: '可选配置，支持代码分析和生成',
      },
      {
        category: '部署方式',
        demo: 'GitHub Pages 静态托管',
        full: 'Docker, Vercel, Netlify, 自建服务器',
      },
    ],
    limitsFooterPrefix: '💡 提示：',
    limitsFooterLink: '部署 Docker 完整版',
  },
  cta: {
    h2: '准备好开始了吗？',
    pDemo: '当前为演示版，支持 3 个本地渲染引擎。部署完整版可解锁全部 16+ 引擎和高级功能。',
    pFull: '无需注册，立即在浏览器中体验。或者部署自己的实例获得完整功能。',
    tryDemo: '在演示版中试用',
    tryNow: '立即试用',
    deployFull: '部署完整版',
    starGithub: 'Star on GitHub',
    demoWarn: '演示版功能受限，',
    demoWarnLink: '查看详细对比',
  },
  footer: {
    tagline: '现代图表可视化工具，开源免费，开箱即用。',
    product: '产品',
    tryOnline: '在线试用',
    features: '功能特性',
    supportedEngines: '支持引擎',
    resources: '资源',
    githubRepo: 'GitHub 仓库',
    documentation: '使用文档',
    documentationHref: 'https://github.com/LessUp/graph-viewer/blob/master/README.md',
    issueTracker: '问题反馈',
    technology: '技术',
    nextjs: 'Next.js 15',
    react: 'React 19',
    wasmLocal: 'WASM 本地渲染',
    copyright: '© 2024 GraphViewer. Open source under MIT License.',
  },
};

// 特性卡片图标（按索引对应 copy.features.items）
const FEATURE_ICONS = [Zap, Shield, Globe, Download, Share2, Layers];

// 部署方式卡片图标
const DEPLOYMENT_OPTION_ICONS = [Globe, Server];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">GraphViewer</span>
            {isStaticExport && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {COPY.nav.demoBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/LessUp/graph-viewer"
              target="_blank"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
            <Link
              href="/editor/"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800"
            >
              <Zap className="h-4 w-4" />
              {COPY.nav.tryOnline}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[600px] translate-x-1/3 rounded-full bg-indigo-100/50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl text-center">
          {/* Demo Version Badge */}
          {isStaticExport && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm">
              <Globe className="h-4 w-4" />
              <span>{COPY.hero.demoBadgeText}</span>
              <span className="mx-1 text-amber-400">|</span>
              <Link href="#deployment" className="underline hover:text-amber-800">
                {COPY.hero.demoBadgeLink}
              </Link>
            </div>
          )}

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
            <Sparkles className="h-4 w-4" />
            <span>{COPY.hero.ossBadge}</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {COPY.hero.h1Line1}
            <span className="block bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              {COPY.hero.h1Line2}
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
            {COPY.hero.pPrefix}{' '}
            <span className="font-medium text-slate-900">{COPY.hero.pLocal}</span>，
            <span className="font-medium text-slate-900">{COPY.hero.pRemote}</span>。
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/editor/"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl hover:shadow-sky-500/30"
            >
              <Zap className="h-5 w-5" />
              {COPY.hero.tryOnline}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="https://github.com/LessUp/graph-viewer"
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <Github className="h-5 w-5" />
              {COPY.hero.githubRepo}
            </Link>
          </div>

          {/* GitHub Stars Badge */}
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-500">
            <Image
              src="https://img.shields.io/github/stars/LessUp/graph-viewer?style=social"
              alt="GitHub Stars"
              width={100}
              height={24}
              className="h-6 w-auto"
              unoptimized
            />
            <span>·</span>
            <span>{COPY.hero.mitLicense}</span>
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-slate-900">{COPY.codePreview.h2}</h2>
            <p className="text-slate-600">{COPY.codePreview.p}</p>
          </div>

          <CodePreview />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">{COPY.features.h2}</h2>
            <p className="text-lg text-slate-600">{COPY.features.p}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {COPY.features.items.map((feature, idx) => {
              const Icon = FEATURE_ICONS[idx] ?? Sparkles;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-sky-200 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600 transition-colors group-hover:from-sky-100 group-hover:to-indigo-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Engines Showcase */}
      <section id="engines" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">{COPY.engines.h2}</h2>
            <p className="text-lg text-slate-600">{COPY.engines.p}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {LANDING_ENGINE_CATEGORIES.map((category) => (
              <div key={category.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{category.name}</h3>
                <p className="mb-4 text-sm text-slate-500">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.engines.map((engineId) => {
                    const config = ENGINE_CONFIGS[engineId];
                    if (!config) return null;
                    const isLocal = LOCAL_RENDER_ENGINES.includes(engineId);
                    return (
                      <div
                        key={engineId}
                        className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors hover:border-sky-200 hover:bg-sky-50"
                      >
                        <Code className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{config.label}</span>
                        {isLocal && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            {COPY.engines.localBadge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-amber-50 px-6 py-4 text-center text-sm text-amber-800">
            <span className="font-medium">{COPY.engines.tipPrefix}</span> {COPY.engines.tipText}
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section id="deployment" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">{COPY.deployment.h2}</h2>
            <p className="text-lg text-slate-600">{COPY.deployment.p}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {COPY.deployment.options.map((option, optIdx) => {
              const OptionIcon = DEPLOYMENT_OPTION_ICONS[optIdx] ?? Server;
              const isPrimary = optIdx === 1;
              const href = isPrimary
                ? 'https://github.com/LessUp/graph-viewer#deployment'
                : '/editor/';
              return (
                <div
                  key={option.title}
                  className={`relative rounded-2xl border-2 p-8 ${
                    isPrimary
                      ? 'border-sky-500 bg-gradient-to-br from-sky-50/50 to-indigo-50/50'
                      : isStaticExport
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Badge */}
                  {isPrimary ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
                        {option.badge}
                      </span>
                    </div>
                  ) : (
                    isStaticExport && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                          {option.badge}
                        </span>
                      </div>
                    )
                  )}

                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm">
                    <OptionIcon
                      className={`h-7 w-7 ${
                        isPrimary
                          ? 'text-sky-600'
                          : isStaticExport
                            ? 'text-amber-600'
                            : 'text-slate-600'
                      }`}
                    />
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{option.title}</h3>
                    {isStaticExport && !isPrimary && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {COPY.deployment.current}
                      </span>
                    )}
                  </div>
                  <p className="mb-6 text-sm text-slate-500">{option.note}</p>
                  <p className="mb-6 text-slate-600">{option.description}</p>

                  <ul className="mb-8 space-y-3">
                    {option.features.map((feature, featIdx) => (
                      <li key={featIdx} className="flex items-center gap-3 text-sm">
                        {feature.available ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                            <X className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                        <span className={feature.available ? 'text-slate-700' : 'text-slate-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                      isPrimary
                        ? 'bg-sky-600 text-white hover:bg-sky-700'
                        : isStaticExport
                          ? 'border-2 border-amber-300 bg-amber-500 text-white hover:bg-amber-600'
                          : 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {option.cta}
                    {href.startsWith('http') && <ExternalLink className="h-4 w-4" />}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Static Export Limitations Table */}
          {isStaticExport && (
            <div className="mt-12 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
              <div className="border-b border-amber-200 bg-amber-100/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">{COPY.deployment.limitsTitle}</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200/60 bg-amber-50/30">
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">
                        {COPY.deployment.limitsFeatureHeader}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-amber-700">
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {COPY.deployment.limitsDemoHeader}
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-sky-700">
                        <span className="flex items-center gap-1">
                          <Server className="h-4 w-4" />
                          {COPY.deployment.limitsFullHeader}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COPY.deployment.limitsRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-amber-100 last:border-0">
                        <td className="px-6 py-3 font-medium text-slate-700">{row.category}</td>
                        <td className="px-6 py-3 text-amber-700">{row.demo}</td>
                        <td className="px-6 py-3 text-sky-700">{row.full}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-amber-200 bg-amber-100/30 px-6 py-3">
                <p className="text-xs text-amber-800">
                  <span className="font-medium">{COPY.deployment.limitsFooterPrefix}</span>{' '}
                  演示版使用本地 WASM
                  渲染引擎，数据完全在浏览器中处理，保护隐私安全。如需完整功能，建议
                  <Link
                    href="https://github.com/LessUp/graph-viewer#deployment"
                    target="_blank"
                    className="mx-1 font-medium underline hover:text-amber-900"
                  >
                    {COPY.deployment.limitsFooterLink}
                  </Link>
                  。
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{COPY.cta.h2}</h2>
          <p className="mb-8 text-lg text-slate-300">
            {isStaticExport ? COPY.cta.pDemo : COPY.cta.pFull}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/editor/"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 transition-all hover:bg-slate-100"
            >
              <Zap className="h-5 w-5" />
              {isStaticExport ? COPY.cta.tryDemo : COPY.cta.tryNow}
            </Link>
            <Link
              href="https://github.com/LessUp/graph-viewer#deployment"
              target="_blank"
              className={`flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-all ${
                isStaticExport
                  ? 'border-sky-500 bg-sky-600 text-white hover:bg-sky-500'
                  : 'border-slate-600 bg-transparent text-white hover:bg-white/10'
              }`}
            >
              <Server className="h-5 w-5" />
              {isStaticExport ? COPY.cta.deployFull : COPY.cta.starGithub}
            </Link>
          </div>

          {isStaticExport && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span>{COPY.cta.demoWarn}</span>
              <Link href="#deployment" className="font-medium underline hover:text-amber-200">
                {COPY.cta.demoWarnLink}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-900">GraphViewer</span>
              </div>
              <p className="text-sm text-slate-500">{COPY.footer.tagline}</p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">{COPY.footer.product}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/editor/" className="hover:text-sky-600">
                    {COPY.footer.tryOnline}
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-sky-600">
                    {COPY.footer.features}
                  </Link>
                </li>
                <li>
                  <Link href="#engines" className="hover:text-sky-600">
                    {COPY.footer.supportedEngines}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">{COPY.footer.resources}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link
                    href="https://github.com/LessUp/graph-viewer"
                    target="_blank"
                    className="hover:text-sky-600"
                  >
                    {COPY.footer.githubRepo}
                  </Link>
                </li>
                <li>
                  <Link
                    href={COPY.footer.documentationHref}
                    target="_blank"
                    className="hover:text-sky-600"
                  >
                    {COPY.footer.documentation}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/LessUp/graph-viewer/issues"
                    target="_blank"
                    className="hover:text-sky-600"
                  >
                    {COPY.footer.issueTracker}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">{COPY.footer.technology}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <span className="text-slate-400">{COPY.footer.nextjs}</span>
                </li>
                <li>
                  <span className="text-slate-400">{COPY.footer.react}</span>
                </li>
                <li>
                  <span className="text-slate-400">{COPY.footer.wasmLocal}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 sm:flex-row">
            <p>{COPY.footer.copyright}</p>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/LessUp/graph-viewer"
                target="_blank"
                className="hover:text-slate-700"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
