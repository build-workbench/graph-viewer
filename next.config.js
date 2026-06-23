/** @type {import('next').NextConfig} */

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const isLighthouseCI = process.env.LHCI === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// GitHub Pages 动态 basePath：从 GITHUB_REPOSITORY 检测仓库名
let gitHubPagesRepoName = 'graph-viewer';
if (process.env.GITHUB_REPOSITORY) {
  const parts = process.env.GITHUB_REPOSITORY.split('/');
  if (parts.length === 2 && parts[1]) {
    gitHubPagesRepoName = parts[1];
  }
}
const gitHubPagesBasePath = `/${gitHubPagesRepoName}`;

const isStaticExport = isGitHubPages || isLighthouseCI;

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,

  env: {
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? 'true' : 'false',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  output: isStaticExport ? 'export' : 'standalone',
  distDir: isStaticExport ? 'out' : '.next',

  ...(isGitHubPages && {
    basePath: gitHubPagesBasePath,
    assetPrefix: `${gitHubPagesBasePath}/`,
    trailingSlash: true,
    images: { unoptimized: true, remotePatterns: [] },
  }),

  ...(isLighthouseCI && {
    trailingSlash: true,
    images: { unoptimized: true, remotePatterns: [] },
  }),

  experimental: {
    // Next.js 15 自动按需导入这些库的子模块，替代手写 splitChunks
    optimizePackageImports: ['lucide-react', '@codemirror', 'mermaid'],
    optimizeCss: isProduction,
  },

  compiler: {
    removeConsole: isProduction ? { exclude: ['error', 'warn'] } : false,
    reactRemoveProperties: isProduction,
  },

  webpack: (config, { dev, isServer }) => {
    // 某些 npm 包需要 Node 内置模块的浏览器 fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },

  async headers() {
    if (isGitHubPages) return [];
    return [
      {
        source: '/:all*(js|css|svg|png|jpg|jpeg|gif|webp|woff|woff2)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
