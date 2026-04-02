'use client';

import { useAuth } from '@/lib/auth';
import { appConfig } from '@/lib/config';
import { getSupabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BarChart3, Calculator, TrendingUp, Sparkles,
  Shield, Loader2, LogOut,
} from 'lucide-react';
import UsageTracker from '@/components/UsageTracker';
import MeetingCalc from '@/components/MeetingCalc';
import RevenueProjections from '@/components/RevenueProjections';
import PricingOptimizer from '@/components/PricingOptimizer';

const TABS = [
  { id: 'usage', label: 'Usage Tracker', icon: BarChart3 },
  { id: 'calculator', label: 'Unit Economics', icon: Calculator },
  { id: 'projections', label: 'Revenue Projections', icon: TrendingUp },
  { id: 'pricing', label: 'Pricing Optimizer', icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DashboardPage() {
  const { user, userId, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('usage');

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace('/login');
      return;
    }
    // Check admin status from our own profiles table (not the backend API)
    const supabase = getSupabase();
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data.is_admin);
        }
      });
  }, [userId, authLoading, router]);

  // Loading state
  if (authLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-400" />
          <p className="mt-3 text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-400">
            This dashboard is restricted to admin users.
          </p>
          <button
            onClick={signOut}
            className="mt-4 inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src={appConfig.logoPath}
              alt={appConfig.appName}
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white">{appConfig.appName}</h1>
              <p className="text-[11px] text-gray-500">API Usage, Costs & Revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-gray-500 sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'usage' && <UsageTracker />}
        {activeTab === 'calculator' && <MeetingCalc />}
        {activeTab === 'projections' && <RevenueProjections />}
        {activeTab === 'pricing' && <PricingOptimizer />}
      </main>
    </div>
  );
}
