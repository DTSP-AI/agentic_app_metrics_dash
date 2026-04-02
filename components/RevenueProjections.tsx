'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Activity, Zap } from 'lucide-react';
import { ChartTooltip, StatCard, SliderInput } from './dashboard-ui';

export default function RevenueProjections() {
  const [startUsers, setStartUsers] = useState(5);
  const [growthRate, setGrowthRate] = useState(10);
  const [licensePrice, setLicensePrice] = useState(99);
  const [avgMeetings, setAvgMeetings] = useState(10);
  const [costPerMeeting, setCostPerMeeting] = useState(0.05);
  const [infraOverhead, setInfraOverhead] = useState(20);
  const [seatsPerUser, setSeatsPerUser] = useState(2);
  const [seatPrice, setSeatPrice] = useState(25);

  const projection = useMemo(() => {
    const months: any[] = [];
    for (let m = 1; m <= 60; m++) {
      const users = Math.ceil(startUsers * Math.pow(1 + growthRate / 100, m / 12));
      const totalSeats = users * seatsPerUser;
      const gross = users * licensePrice + (totalSeats - users) * seatPrice;
      const llmCost = users * avgMeetings * costPerMeeting;
      const infra = llmCost * (infraOverhead / 100);
      const totalCost = llmCost + infra;
      const net = gross - totalCost;
      months.push({
        month: m,
        label: `M${m}`,
        users,
        seats: totalSeats,
        gross: +gross.toFixed(2),
        llm_cost: +llmCost.toFixed(2),
        infra: +infra.toFixed(2),
        total_cost: +totalCost.toFixed(2),
        net: +net.toFixed(2),
        margin: gross > 0 ? +((net / gross) * 100).toFixed(1) : 0,
      });
    }
    return months;
  }, [startUsers, growthRate, licensePrice, avgMeetings, costPerMeeting, infraOverhead, seatsPerUser, seatPrice]);

  const yearly = useMemo(() => {
    return [1, 2, 3, 4, 5].map((year) => {
      const yearMonths = projection.slice((year - 1) * 12, year * 12);
      const lastMonth = yearMonths[yearMonths.length - 1];
      return {
        year: `Year ${year}`,
        users: lastMonth.users,
        seats: lastMonth.seats,
        gross: yearMonths.reduce((s: number, m: any) => s + m.gross, 0),
        llm_cost: yearMonths.reduce((s: number, m: any) => s + m.llm_cost, 0),
        infra: yearMonths.reduce((s: number, m: any) => s + m.infra, 0),
        total_cost: yearMonths.reduce((s: number, m: any) => s + m.total_cost, 0),
        net: yearMonths.reduce((s: number, m: any) => s + m.net, 0),
        margin: lastMonth.margin,
      };
    });
  }, [projection]);

  const breakEvenMonth = projection.findIndex((m) => m.net > 0) + 1;
  const cumulative = projection.reduce((s, m) => s + m.net, 0);
  const year5 = yearly[4];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Break-Even Month" value={breakEvenMonth > 0 ? `Month ${breakEvenMonth}` : 'Month 1'} icon={TrendingUp} color="green" />
        <StatCard label="Year 5 ARR" value={`$${year5.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} color="blue" />
        <StatCard label="Year 5 Net" value={`$${year5.net.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Activity} color="purple" />
        <StatCard label="5yr Cumulative" value={`$${cumulative.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Zap} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 lg:sticky lg:top-4">
          <h3 className="mb-5 text-sm font-semibold text-gray-200">Projection Variables</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Starting Users</label>
              <input
                type="number" min={1} max={1000} value={startUsers}
                onChange={(e) => setStartUsers(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <SliderInput label="Monthly Growth Rate" value={growthRate} onChange={setGrowthRate} min={0} max={30} suffix="%" />
            <SliderInput label="License Price / User" value={licensePrice} onChange={setLicensePrice} min={19} max={499} prefix="$" />
            <SliderInput label="Seats per User" value={seatsPerUser} onChange={setSeatsPerUser} min={1} max={10} />
            <SliderInput label="Seat Price" value={seatPrice} onChange={setSeatPrice} min={0} max={99} prefix="$" />
            <SliderInput label="Avg Runs / User" value={avgMeetings} onChange={setAvgMeetings} min={1} max={50} />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">LLM Cost / Run ($)</label>
              <input
                type="number" min={0} max={5} step={0.001} value={costPerMeeting}
                onChange={(e) => setCostPerMeeting(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <SliderInput label="Infra Overhead" value={infraOverhead} onChange={setInfraOverhead} min={5} max={50} suffix="%" />
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* 60-Month Chart */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">60-Month Revenue Projection</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={projection.filter((_, i) => i % 3 === 0)}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="gross" name="Gross Revenue" fill="url(#grossGrad)" stroke="#4ade80" strokeWidth={2} />
                <Area type="monotone" dataKey="total_cost" name="Total Cost" fill="url(#costGrad2)" stroke="#f87171" strokeWidth={2} />
                <Area type="monotone" dataKey="net" name="Net Revenue" fill="none" stroke="#3b82f6" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Yearly Bar Chart */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">Annual Summary</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={yearly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="gross" name="Gross" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_cost" name="Cost" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">Year-by-Year Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="pb-2 pr-3">Year</th>
                    <th className="pb-2 pr-3 text-right">Users</th>
                    <th className="pb-2 pr-3 text-right">Seats</th>
                    <th className="pb-2 pr-3 text-right">Gross Rev</th>
                    <th className="pb-2 pr-3 text-right">LLM Cost</th>
                    <th className="pb-2 pr-3 text-right">Infra</th>
                    <th className="pb-2 pr-3 text-right">Net Rev</th>
                    <th className="pb-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {yearly.map((y) => (
                    <tr key={y.year} className="border-b border-gray-800/50 text-gray-300">
                      <td className="py-2 pr-3 font-medium text-white">{y.year}</td>
                      <td className="py-2 pr-3 text-right">{y.users.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right">{y.seats.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right text-green-400">${y.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 pr-3 text-right text-red-400">${y.llm_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 pr-3 text-right text-red-400">${y.infra.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 pr-3 text-right text-blue-400">${y.net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 text-right font-medium">{y.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
