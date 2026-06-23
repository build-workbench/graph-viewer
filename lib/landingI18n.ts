/**
 * 落地页双语字典
 *
 * 抽出 app/page.tsx 与 app/en/page.tsx 的全部文案，消除两页 95% 重复。
 * 图标和 JSX 结构在 components/landing/LandingPage.tsx 共享，本文件只提供文案。
 */

export type LandingLocale = 'zh' | 'en';

export type LandingFeature = {
  title: string;
  description: string;
};

export type LandingDeploymentFeature = {
  text: string;
  available: boolean;
};

export type LandingDeploymentOption = {
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  note: string;
  cta: string;
  features: LandingDeploymentFeature[];
};

export type LandingStaticExportLimit = {
  category: string;
  demo: string;
  full: string;
};

export type LandingCopy = {
  /** 顶部导航 */
  nav: {
    langLinkHref: string;
    langLinkLabel: string;
    tryOnline: string;
    demoBadge: string;
  };
  /** Hero 区 */
  hero: {
    demoBadgeText: string;
    demoBadgeLink: string;
    ossBadge: string;
    h1Line1: string;
    h1Line2: string;
    pPrefix: string;
    pLocal: string;
    pRemote: string;
    tryOnline: string;
    githubRepo: string;
    mitLicense: string;
  };
  /** 代码预览区 */
  codePreview: {
    h2: string;
    p: string;
    mermaidTab: string;
    graphvizTab: string;
    previewArea: string;
    tryNow: string;
  };
  /** 特性区 */
  features: {
    h2: string;
    p: string;
    items: LandingFeature[];
  };
  /** 引擎展示区 */
  engines: {
    h2: string;
    p: string;
    localBadge: string;
    tipPrefix: string;
    tipText: string;
  };
  /** 部署方式区 */
  deployment: {
    h2: string;
    p: string;
    current: string;
    options: LandingDeploymentOption[];
    limitsTitle: string;
    limitsFeatureHeader: string;
    limitsDemoHeader: string;
    limitsFullHeader: string;
    limitsRows: LandingStaticExportLimit[];
    limitsFooterPrefix: string;
    limitsFooterLink: string;
  };
  /** CTA 区 */
  cta: {
    h2: string;
    pDemo: string;
    pFull: string;
    tryDemo: string;
    tryNow: string;
    deployFull: string;
    starGithub: string;
    demoWarn: string;
    demoWarnLink: string;
  };
  /** 页脚 */
  footer: {
    tagline: string;
    product: string;
    tryOnline: string;
    features: string;
    supportedEngines: string;
    resources: string;
    githubRepo: string;
    documentation: string;
    documentationHref: string;
    issueTracker: string;
    technology: string;
    nextjs: string;
    react: string;
    wasmLocal: string;
    copyright: string;
  };
};

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  zh: {
    nav: {
      langLinkHref: '/en/',
      langLinkLabel: 'English',
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
      mermaidTab: 'Mermaid 流程图',
      graphvizTab: 'Graphviz DOT',
      previewArea: '实时预览区域',
      tryNow: '立即体验',
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
      documentationHref: 'https://github.com/LessUp/graph-viewer/blob/master/README.zh-CN.md',
      issueTracker: '问题反馈',
      technology: '技术',
      nextjs: 'Next.js 15',
      react: 'React 19',
      wasmLocal: 'WASM 本地渲染',
      copyright: '© 2024 GraphViewer. Open source under MIT License.',
    },
  },
  en: {
    nav: {
      langLinkHref: '/',
      langLinkLabel: '中文',
      tryOnline: 'Try Online',
      demoBadge: 'Demo',
    },
    hero: {
      demoBadgeText: 'Currently running GitHub Pages Demo',
      demoBadgeLink: 'Learn limitations',
      ossBadge: 'Open Source & Free · Ready to Use',
      h1Line1: 'Modern Diagram Visualization Tool',
      h1Line2: '16+ Engines in One Place',
      pPrefix: 'Supports Mermaid, PlantUML, Graphviz, D2 and other mainstream diagram syntaxes.',
      pLocal: 'Local rendering protects privacy',
      pRemote: 'remote rendering supports more formats',
      tryOnline: 'Try Online',
      githubRepo: 'GitHub Repository',
      mitLicense: 'MIT License',
    },
    codePreview: {
      h2: 'Clean and Intuitive Editing',
      p: 'Real-time preview, syntax highlighting, auto-completion for smoother diagram creation',
      mermaidTab: 'Mermaid Flowchart',
      graphvizTab: 'Graphviz DOT',
      previewArea: 'Live Preview Area',
      tryNow: 'Try Now',
    },
    features: {
      h2: 'Powerful and Flexible Features',
      p: 'Meeting diagram needs of individual developers and enterprise teams',
      items: [
        {
          title: '16+ Diagram Engines',
          description:
            'Support for Mermaid, PlantUML, Graphviz, D2, Vega and other mainstream diagram syntaxes to meet various visualization needs.',
        },
        {
          title: 'Privacy First',
          description:
            'Local WASM rendering engines (Mermaid, Graphviz) run entirely in the browser without uploading data to servers.',
        },
        {
          title: 'Hybrid Rendering',
          description:
            'Local rendering for fast response, remote Kroki service for more formats (PNG/PDF) and engines.',
        },
        {
          title: 'Multi-format Export',
          description:
            'Support for SVG, PNG (2x/4x HD), PDF, HTML, Markdown and other export formats.',
        },
        {
          title: 'Instant Sharing',
          description:
            'Generate short links using LZ-string compression algorithm for easy sharing and embedding in documents.',
        },
        {
          title: 'Multi-diagram Workspace',
          description:
            'Local persistent storage with version history, diagram management and workspace import/export.',
        },
      ],
    },
    engines: {
      h2: 'Supporting 16+ Diagram Engines',
      p: 'From simple flowcharts to complex data visualization, one tool does it all',
      localBadge: 'Local',
      tipPrefix: '💡 Tip:',
      tipText:
        'Engines marked "Local" work fully in the GitHub Pages demo without backend services. Full Docker deployment supports all 16+ engines and PNG/PDF export.',
    },
    deployment: {
      h2: 'Choose Your Deployment Method',
      p: 'From free demo to full production, flexible for all needs',
      current: 'Current',
      options: [
        {
          title: 'GitHub Pages (Demo)',
          subtitle: 'Current Version',
          badge: 'Free Trial',
          description: 'Experience core features at zero cost, no deployment required',
          note: 'Ideal for quick testing and simple diagrams',
          cta: 'Try Now',
          features: [
            { text: 'Mermaid / Graphviz / Flowchart.js', available: true },
            { text: 'Local rendering, privacy secure', available: true },
            { text: 'SVG format only', available: false },
            { text: 'No remote engine support', available: false },
          ],
        },
        {
          title: 'Docker (Full Version)',
          subtitle: 'Recommended',
          badge: 'Full Features',
          description: 'One-click deployment for complete 16+ engine support and advanced features',
          note: 'Ideal for team collaboration and production',
          cta: 'View Deployment Guide',
          features: [
            { text: 'All 16+ diagram engines', available: true },
            { text: 'SVG / PNG / PDF all formats', available: true },
            { text: 'Optional AI assistance', available: true },
            { text: 'Complete data persistence', available: true },
          ],
        },
      ],
      limitsTitle: 'Demo (GitHub Pages) Feature Limitations',
      limitsFeatureHeader: 'Feature',
      limitsDemoHeader: 'Demo (Current)',
      limitsFullHeader: 'Docker Full Version',
      limitsRows: [
        {
          category: 'Supported Engines',
          demo: '3 (Mermaid, Graphviz, Flowchart.js)',
          full: '16+ (including PlantUML, D2, Vega, etc.)',
        },
        {
          category: 'Export Formats',
          demo: 'SVG only',
          full: 'SVG, PNG (2x/4x), PDF, HTML, Markdown',
        },
        {
          category: 'AI Features',
          demo: 'Not supported',
          full: 'Optional, supports code analysis and generation',
        },
        {
          category: 'Deployment',
          demo: 'GitHub Pages static hosting',
          full: 'Docker, Vercel, Netlify, self-hosted servers',
        },
      ],
      limitsFooterPrefix: '💡 Tip:',
      limitsFooterLink: 'deploying the Docker full version',
    },
    cta: {
      h2: 'Ready to Get Started?',
      pDemo:
        'Currently in demo mode with 3 local rendering engines. Deploy the full version to unlock all 16+ engines and advanced features.',
      pFull:
        'No registration required, try it in your browser now. Or deploy your own instance for full features.',
      tryDemo: 'Try in Demo',
      tryNow: 'Try Now',
      deployFull: 'Deploy Full Version',
      starGithub: 'Star on GitHub',
      demoWarn: 'Demo has limited features,',
      demoWarnLink: 'view detailed comparison',
    },
    footer: {
      tagline: 'Modern diagram visualization tool, open source and free, ready to use.',
      product: 'Product',
      tryOnline: 'Try Online',
      features: 'Features',
      supportedEngines: 'Supported Engines',
      resources: 'Resources',
      githubRepo: 'GitHub Repository',
      documentation: 'Documentation',
      documentationHref: 'https://github.com/LessUp/graph-viewer/blob/master/README.md',
      issueTracker: 'Issue Tracker',
      technology: 'Technology',
      nextjs: 'Next.js 15',
      react: 'React 19',
      wasmLocal: 'WASM Local Rendering',
      copyright: '© 2024 GraphViewer. Open source under MIT License.',
    },
  },
};
