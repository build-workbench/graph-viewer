'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Globe, Server, ExternalLink, AlertTriangle } from 'lucide-react';

export function StaticExportNotice() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/30 shadow-lg shadow-amber-500/5">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-200/20 blur-2xl" />
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 shadow-sm">
            <Globe className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-amber-900">演示版</h3>
                  <span className="inline-flex items-center gap-1 rounded bg-amber-200/60 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3 w-3" />
                    功能受限
                  </span>
                </div>
                <p className="mt-1 text-sm text-amber-800/80">
                  当前为 GitHub Pages 静态演示版本，仅支持本地渲染的 3 个引擎
                </p>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className="shrink-0 rounded-lg p-1.5 text-amber-400 transition-colors hover:bg-amber-100 hover:text-amber-600"
                aria-label="关闭提示"
                title="关闭提示"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="https://github.com/LessUp/graph-viewer#deployment"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/30"
              >
                <Server className="h-4 w-4" />
                部署完整版
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-amber-600 transition-colors hover:text-amber-800 hover:underline"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
