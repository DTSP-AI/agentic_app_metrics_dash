'use client';

import { useEffect, useMemo, useState } from 'react';
import { getUsageByMeeting } from '@/lib/api';
import {
  BarChart, Bar, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { ChartTooltip, StatCard, SliderInput } from './dashboard-ui';

export default function MeetingCalc() {
  const [meetingData, setMeetingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [pricePerUser, setPricePerUser] = useState(99);
  const [baseMeetings, setBaseMeetings] = useState(10);
  const [overageRate, setOverageRate] = useState(2);
  const [licenseCost, setLicenseCost] = useState(49);
  const [seatCost, setSeatCost] = useState(25);
  const [userCount, setUserCount] = useState(10);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUsageByMeeting(90);
        setMeetingData(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const avgCost = meetingData?.avg_cost_per_meeting ?? 0.05;

  const usageCurve = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const meetings = i + 1;
      const llmCost = meetings * avgCost * 1.3;
      const revenue = licenseCost + seatCost + (meetings <= baseMeetings ? 0 : (meetings - baseMeetings) * overageRate);
      return { meetings, revenue: +revenue.toFixed(2), cost: +llmCost.toFixed(4), margin: +(revenue - llmCost).toFixed(2) };
    });
  }, [avgCost, baseMeetings, overageRate, licenseCost, seatCost]);

  const breakEvenMeeting = usageCurve.find((d) => d.margin < 0)?.meetings;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Avg Cost / Run" value={`$${avgCost.toFixed(4)}`} sub={`${meetingData?.total_meetings ?? 0} runs tracked`} icon={Calculator} color="blue" />
        <StatCard label="Monthly LLM / User" value={`$${(avgCost * baseMeetings * 1.3).toFixed(2)}`} sub={`${baseMeetings} runs x $${avgCost.toFixed(4)}`} icon={DollarSign} color="green" />
        <StatCard label="Gross Margin" value={`${(((pricePerUser - avgCost * baseMeetings * 1.3) / pricePerUser) * 100).toFixed(0)}%`} sub={`At ${baseMeetings} runs/mo`} icon={TrendingUp} color="purple" />
        <StatCard label="Break-Even" value={breakEvenMeeting ? `${breakEvenMeeting} runs` : 'N/A'} sub="Per user / month" icon={AlertTriangle} color="amber" />
      </div>

      {/* Per-Run Cost Chart */}
      {meetingData?.meetings?.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-200">Cost Distribution by Run</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={meetingData.meetings.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="meeting_id" tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v) => v.slice(0, 8)} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total_cost" name="Run Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-User Overhead Calculator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="mb-5 text-sm font-semibold text-gray-200">Per-User Pricing Controls</h3>
          <div className="space-y-5">
            <SliderInput label="Monthly Price / User" value={pricePerUser} onChange={setPricePerUser} min={19} max={499} prefix="$" />
            <SliderInput label="Base Runs Included" value={baseMeetings} onChange={setBaseMeetings} min={1} max={50} />
            <SliderInput label="Overage Rate / Run" value={overageRate} onChange={setOverageRate} min={0} max={20} step={0.5} prefix="$" />
            <SliderInput label="Base License Cost" value={licenseCost} onChange={setLicenseCost} min={0} max={299} prefix="$" />
            <SliderInput label="Additional Seat Cost" value={seatCost} onChange={setSeatCost} min={0} max={99} prefix="$" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Number of Users</label>
              <input
                type="number" min={1} max={10000} value={userCount}
                onChange={(e) => setUserCount(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Revenue vs Cost Chart */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-200">Revenue vs Cost per User</h3>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={usageCurve}>
              <defs>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="meetings" tick={{ fill: '#9ca3af', fontSize: 10 }} label={{ value: 'Runs / Month', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="margin" name="Margin" fill="url(#marginGrad)" stroke="#4ade80" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cost" name="LLM Cost" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
