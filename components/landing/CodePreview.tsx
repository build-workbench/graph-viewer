'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SAMPLES } from '@/lib/diagramSamples';
import type { LandingLocale } from '@/lib/landingI18n';
import { LANDING_COPY } from '@/lib/landingI18n';

export function CodePreview({ locale }: { locale: LandingLocale }) {
  const copy = LANDING_COPY[locale].codePreview;
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { name: copy.mermaidTab, code: SAMPLES.mermaid },
    { name: copy.graphvizTab, code: SAMPLES.graphviz },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-4 flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1 text-sm text-slate-400">
          <div className="h-4 w-4" />
          graphviewer.app/editor
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            {tabs.map((ex, idx) => (
              <button
                key={ex.name}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === idx
                    ? 'border-b-2 border-sky-500 text-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
          <div className="bg-slate-900 p-4">
            <pre className="overflow-x-auto text-sm leading-relaxed">
              <code className="text-slate-300">{tabs[activeTab]?.code ?? ''}</code>
            </pre>
          </div>
        </div>

        <div className="bg-slate-50 p-8">
          <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white">
            <div className="text-center">
              <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
                <Sparkles className="h-8 w-8 text-sky-500" />
              </div>
              <p className="text-slate-500">{copy.previewArea}</p>
              <Link
                href="/editor/"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                {copy.tryNow} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
