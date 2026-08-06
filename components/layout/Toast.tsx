'use client';

import { Check, AlertCircle, Info } from 'lucide-react';
import type { ToastState } from '@/hooks/useToast';

const ICON_MAP = {
  success: Check,
  error: AlertCircle,
  info: Info,
} as const;

const STYLE_MAP = {
  success: 'bg-slate-800 text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-slate-800 text-white',
} as const;

const ICON_STYLE_MAP = {
  success: 'text-emerald-400',
  error: 'text-rose-200',
  info: 'text-sky-400',
} as const;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  const Icon = ICON_MAP[toast.type];

  return (
    <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ${STYLE_MAP[toast.type]}`}
      >
        <Icon className={`h-4 w-4 ${ICON_STYLE_MAP[toast.type]}`} />
        {toast.message}
      </div>
    </div>
  );
}
