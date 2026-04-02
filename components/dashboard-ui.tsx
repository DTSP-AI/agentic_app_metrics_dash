'use client';

import { AlertTriangle } from 'lucide-react';

// ── Brand Colors for Charts ──
export const CHART_COLORS = ['#3b82f6', '#4ade80', '#c084fc', '#f87171', '#fbbf24', '#67e8f9'];
export const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-20250514': '#3b82f6',
  'gpt-4o-mini': '#4ade80',
  'text-embedding-3-small': '#c084fc',
};

/** Format a cost value for display. */
export function fmtCost(n: number): string {
  return n < 0.01 ? `$${n.toFixed(6)}` : `$${n.toFixed(4)}`;
}

// ── Custom Chart Tooltip ──
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm shadow-xl">
      <p className="mb-1 font-medium text-gray-200">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}:{' '}
          {typeof entry.value === 'number' && entry.value < 1
            ? `$${entry.value.toFixed(6)}`
            : entry.value?.toLocaleString?.() ?? entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Stat Card ──
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'blue',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  };
  const iconColor: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <Icon className={`h-5 w-5 ${iconColor[color]}`} />
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// ── Slider Input ──
export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix = '',
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400">{label}</label>
        <span className="text-sm font-semibold text-white">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>
          {prefix}
          {min}
          {suffix}
        </span>
        <span>
          {prefix}
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

// ── Warning Banner ──
export function WarningBanner({ warnings }: { warnings: any[] }) {
  if (!warnings?.length) return null;
  return (
    <div className="mb-6 space-y-2">
      {warnings.map((w: any, i: number) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            w.level === 'critical'
              ? 'border-red-800 bg-red-900/30 text-red-300'
              : 'border-yellow-800 bg-yellow-900/30 text-yellow-300'
          }`}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{w.message}</span>
        </div>
      ))}
    </div>
  );
}
