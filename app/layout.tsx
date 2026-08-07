import './globals.css';
import type { Metadata, Viewport } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// Dynamic basePath detection / 动态 basePath 检测
function getBasePath() {
  if (process.env.GITHUB_REPOSITORY) {
    const parts = process.env.GITHUB_REPOSITORY.split('/');
    if (parts.length === 2 && parts[1]) {
      return `/${parts[1]}`;
    }
  }
  return isGitHubPages ? '/graph-viewer' : '';
}

const basePath = getBasePath();
const siteUrl = isGitHubPages
  ? `https://vibe-knight.github.io${basePath}/`
  : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000/';
const iconUrl = isGitHubPages ? `${basePath}/favicon.svg` : '/favicon.svg';
const ogImageUrl = isGitHubPages ? `${basePath}/og-image.svg` : '/og-image.svg';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GraphViewer - 现代图表可视化工具',
    template: '%s | GraphViewer',
  },
  description:
    '开箱即用的图表可视化工具，支持 Mermaid、PlantUML、Graphviz、D2 等 16+ 种图表引擎。本地渲染保护隐私，远程渲染支持更多格式。',
  keywords: [
    '图表工具',
    'diagram',
    'mermaid',
    'plantuml',
    'graphviz',
    '可视化',
    '流程图',
    '时序图',
    'UML',
    '架构图',
    'diagram editor',
    'flowchart',
    'visualization tool',
  ],
  authors: [{ name: 'GraphViewer Team' }],
  creator: 'GraphViewer Team',
  publisher: 'GraphViewer',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'GraphViewer - 现代图表可视化工具',
    description:
      '支持 16+ 种图表引擎的一体化图表可视化工具。本地渲染 + 远程渲染混合架构，兼顾性能与功能。',
    url: siteUrl,
    siteName: 'GraphViewer',
    type: 'website',
    locale: 'zh_CN',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'GraphViewer - 图表可视化工具',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GraphViewer - 现代图表可视化工具',
    description: '支持 16+ 种图表引擎的一体化图表可视化工具',
    images: [ogImageUrl],
    creator: '@graphviewer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    },
  }),
  icons: {
    icon: iconUrl,
    apple: iconUrl,
  },
  manifest: isGitHubPages ? `${basePath}/manifest.json` : '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
