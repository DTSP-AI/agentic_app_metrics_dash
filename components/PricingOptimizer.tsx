'use client';

import { useMemo, useState } from 'react';
import { getPricingSuggestion } from '@/lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

export default function PricingOptimizer() {
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [avgCost, setAvgCost] = useState(0.05);
  const [avgMeetings, setAvgMeetings] = useState(10);
  const [currentUsers, setCurrentUsers] = useState(5);

  const heatmap = useMemo(() => {
    const prices = [29, 49, 79, 99, 149, 199, 249, 299];
    const usages = [5, 10, 15, 20, 30, 40, 50];
    return prices.map((price) => {
      const row: any = { price: `$${price}` };
      usages.forEach((usage) => {
        const cost = usage * avgCost * 1.3;
        const margin = ((price - cost) / price) * 100;
        row[`${usage}m`] = +margin.toFixed(1);
      });
      return row;
    });
  }, [avgCost]);

  const askClaude = async () => {
    setLoading(true);
    try {
      const result = await getPricingSuggestion(avgCost, avgMeetings, currentUsers);
      if (result.suggestion) {
        try {
          setSuggestion(JSON.parse(result.suggestion));
        } catch {
          setSuggestion({ reasoning: result.suggestion });
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 80) return 'bg-green-900/60 text-green-300';
    if (margin >= 60) return 'bg-green-900/30 text-green-400';
    if (margin >= 40) return 'bg-yellow-900/30 text-yellow-300';
    if (margin >= 20) return 'bg-amber-900/30 text-amber-300';
    if (margin >= 0) return 'bg-red-900/20 text-red-300';
    return 'bg-red-900/50 text-red-200 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <label className="text-xs font-medium text-gray-400">Avg Cost / Run</label>
          <input
            type="number" min={0} max={5} step={0.001} value={avgCost}
            onChange={(e) => setAvgCost(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <label className="text-xs font-medium text-gray-400">Avg Runs / User</label>
          <input
            type="number" min={1} max={100} value={avgMeetings}
            onChange={(e) => setAvgMeetings(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <label className="text-xs font-medium text-gray-400">Current Users</label>
          <input
            type="number" min={1} max={10000} value={currentUsers}
            onChange={(e) => setCurrentUsers(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <button
            onClick={askClaude}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ask Claude
          </button>
        </div>
      </div>

      {/* Margin Heatmap */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-200">
          Margin Heatmap: Price vs Usage (runs/month)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="pb-2 pr-2 text-left">Price</th>
                {[5, 10, 15, 20, 30, 40, 50].map((u) => (
                  <th key={u} className="pb-2 px-2">{u} runs</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row: any) => (
                <tr key={row.price} className="border-b border-gray-800/50">
                  <td className="py-2 pr-2 text-left font-medium text-white">{row.price}</td>
                  {[5, 10, 15, 20, 30, 40, 50].map((u) => (
                    <td key={u} className={`py-2 px-2 rounded ${getMarginColor(row[`${u}m`])}`}>
                      {row[`${u}m`]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claude Suggestion */}
      {suggestion && (
        <div className="space-y-4">
          {suggestion.tiers && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {suggestion.tiers.map((tier: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-xl border p-5 ${
                    i === 1
                      ? 'border-blue-500/50 bg-blue-900/20 ring-1 ring-blue-500/20'
                      : 'border-gray-800 bg-gray-900/50'
                  }`}
                >
                  {i === 1 && (
                    <span className="mb-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Recommended
                    </span>
                  )}
                  <h4 className="text-lg font-bold text-white">{tier.name}</h4>
                  <p className="mt-1 text-3xl font-bold text-white">
                    ${tier.price_per_seat}
                    <span className="text-sm font-normal text-gray-400">/seat/mo</span>
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                    <p>{tier.included_meetings} runs included</p>
                    <p>${tier.overage_rate}/run overage</p>
                    <p className="text-xs text-gray-500">{tier.target}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {suggestion.reasoning && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-200">Claude&apos;s Reasoning</h3>
              <p className="text-sm leading-relaxed text-gray-400">{suggestion.reasoning}</p>
              {suggestion.confidence && (
                <p className="mt-2 text-xs text-gray-500">
                  Confidence: <span className="font-medium text-gray-300">{suggestion.confidence}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
