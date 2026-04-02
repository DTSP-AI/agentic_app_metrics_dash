'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Trash2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

export default function MetricsDelete() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting' | 'done'>('idle');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setStep('deleting');
    setError(null);

    try {
      const supabase = getSupabase();

      // Delete in dependency order (children first)
      const tables = ['pricing_snapshots', 'saved_projections', 'dashboard_settings'] as const;

      for (const table of tables) {
        const { error: delError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delError) {
          throw new Error(`Failed to clear ${table}: ${delError.message}`);
        }
      }

      setStep('done');
      setConfirmText('');
    } catch (e: any) {
      setError(e.message || 'Delete failed');
      setStep('confirm');
    }
  };

  const reset = () => {
    setStep('idle');
    setConfirmText('');
    setError(null);
  };

  if (step === 'idle') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-sm font-semibold text-red-300">Danger Zone</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Delete all saved projections, pricing snapshots, and dashboard settings.
            This will not affect usage data on the backend — only locally saved dashboard state.
          </p>
          <button
            onClick={() => setStep('confirm')}
            className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/30 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/50"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Dashboard Data
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <h3 className="text-sm font-semibold text-green-300">Data Deleted</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            All saved projections, pricing snapshots, and dashboard settings have been cleared.
          </p>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h3 className="text-sm font-semibold text-red-300">Confirm Deletion</h3>
        </div>
        <p className="text-sm text-gray-400 mb-2">
          This will permanently delete:
        </p>
        <ul className="text-sm text-gray-400 mb-4 list-disc list-inside space-y-1">
          <li>All saved revenue projections</li>
          <li>All pricing snapshots and AI suggestions</li>
          <li>All dashboard preferences</li>
        </ul>
        <p className="text-sm text-gray-300 mb-4">
          Type <span className="font-mono font-bold text-red-300">DELETE</span> to confirm:
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-48 rounded-lg border border-red-800/50 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
            disabled={step === 'deleting'}
            autoFocus
          />
          <button
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || step === 'deleting'}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {step === 'deleting' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Permanently Delete
          </button>
          <button
            onClick={reset}
            disabled={step === 'deleting'}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
