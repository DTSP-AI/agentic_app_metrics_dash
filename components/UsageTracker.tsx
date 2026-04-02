'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getUsageSummary,
  getUsageByModel,
  getUsageByService,
  getUsageDaily,
  getUsageWarnings,
  getUsageLogs,
} from '@/lib/api';
import type { UsageLog } from '@/lib/api';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { DollarSign, Activity, Zap, RefreshCw, Download, Loader2 } from 'lucide-react';
import {
  CHART_COLORS, MODEL_COLORS, ChartTooltip, StatCard, WarningBanner, fmtCost,
} from './dashboard-ui';

export default function UsageTracker() {
  const [summary, setSummary] = useState<any>(null);
  const [byModel, setByModel] = useState<any[]>([]);
  const [byService, setByService] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, svc, d, w, l] = await Promise.all([
        getUsageSummary(),
        getUsageByModel(days),
        getUsageByService(days),
        getUsageDaily(days),
        getUsageWarnings(),
        getUsageLogs({ days, limit: 50 }),
      ]);
      setSummary(s);
      setByModel(m.models);
      setByService(svc.services);
      setDaily(d.daily);
      setWarnings(w.warnings);
      setLogs(l.logs);
      setLogTotal(l.total);
    } catch (e) {
      console.error('Failed to load usage data:', e);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = 'Timestamp,Model,Service,Prompt Tokens,Completion Tokens,Cost USD\n';
    const rows = logs
      .map((l) =>
        `${l.created_at},${l.model},${l.service_name},${l.prompt_tokens},${l.completion_tokens},${l.cost_usd}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-logs-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WarningBanner warnings={warnings} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={fmtCost(summary?.today_cost ?? 0)} sub={`${summary?.today_calls ?? 0} calls`} icon={DollarSign} color="blue" />
        <StatCard label="This Week" value={fmtCost(summary?.week_cost ?? 0)} sub={`${summary?.week_calls ?? 0} calls`} icon={Activity} color="green" />
        <StatCard label="This Month" value={fmtCost(summary?.month_cost ?? 0)} sub={`${summary?.month_calls ?? 0} calls`} icon={Zap} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie: By Model */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-200">Cost by Model</h3>
          {byModel.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byModel} dataKey="cost" nameKey="model" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                  {byModel.map((entry, i) => (
                    <Cell key={i} fill={MODEL_COLORS[entry.model] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={(value: string) => <span className="text-xs text-gray-400">{value.split('-')[0] || value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">No data yet</p>
          )}
        </div>

        {/* Bar: By Service */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-200">Cost by Service</h3>
          {byService.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byService} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `$${v.toFixed(4)}`} />
                <YAxis type="category" dataKey="service" tick={{ fill: '#9ca3af', fontSize: 11 }} width={75} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="cost" name="Cost ($)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">No data yet</p>
          )}
        </div>
      </div>

      {/* Daily Trend */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Daily Cost Trend</h3>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <button onClick={load} className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {daily.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="total_cost" name="Daily Cost" stroke="#3b82f6" fill="url(#costGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-gray-500">No data yet</p>
        )}
      </div>

      {/* Log Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Recent Calls ({logTotal} total)</h3>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors">
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Model</th>
                <th className="pb-2 pr-4">Service</th>
                <th className="pb-2 pr-4 text-right">In Tokens</th>
                <th className="pb-2 pr-4 text-right">Out Tokens</th>
                <th className="pb-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 text-gray-300">
                  <td className="py-2 pr-4 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: (MODEL_COLORS[log.model] || '#6b7280') + '20',
                        color: MODEL_COLORS[log.model] || '#9ca3af',
                      }}
                    >
                      {log.model.split('-').slice(0, 2).join('-')}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{log.service_name}</td>
                  <td className="py-2 pr-4 text-right font-mono">{log.prompt_tokens.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right font-mono">{log.completion_tokens.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono text-green-400">{fmtCost(log.cost_usd)}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No usage data recorded yet. Run a workflow to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
