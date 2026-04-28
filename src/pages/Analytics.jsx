import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { PageLoader, EmptyState } from '../components/ui';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#1a1714', '#f59e0b', '#10b981', '#f43f5e', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-ink-200 rounded-xl px-4 py-3 shadow-float">
      <p className="text-xs font-medium text-ink-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-700 font-medium capitalize">{p.name}:</span>
          <span className="font-semibold text-ink-900">
            {p.name === 'collected' || p.name === 'pending' ? `₹${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsAPI.get();
        setAnalytics(res.data.analytics);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  const a = analytics || {};
  const hasData = (a.totalStudents ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">Analytics</h1>
        <div className="card">
          <EmptyState icon={BarChart3} title="No data yet"
            description="Add students and record attendance & fees to see analytics." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-ink-500 mt-0.5">Visual overview of your tuition center performance</p>
      </div>

      {/* Revenue Trend */}
      <div className="card p-6">
        <h2 className="section-title mb-6">Monthly Fee Collection (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={a.monthlyTrend || []} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e6de" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7d7560' }} />
            <YAxis tick={{ fontSize: 12, fill: '#7d7560' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="collected" name="collected" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pending" name="pending" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row: By Class + By School */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Class */}
        <div className="card p-6">
          <h2 className="section-title mb-6">Students by Class</h2>
          {(a.byClass?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={a.byClass} cx="50%" cy="50%" outerRadius={90}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}>
                  {a.byClass.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By School */}
        <div className="card p-6">
          <h2 className="section-title mb-6">Students by School</h2>
          {(a.bySchool?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={a.bySchool} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e6de" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#7d7560' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#7d7560' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="students" fill="#1a1714" radius={[0, 6, 6, 0]}>
                  {a.bySchool.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance rate table */}
      {(a.attendanceRate?.length ?? 0) > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Student Attendance Rate (Last 30 Days)</h2>
          <div className="space-y-3">
            {[...(a.attendanceRate || [])].sort((x, y) => y.rate - x.rate).map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 text-xs text-ink-400 font-mono text-right flex-shrink-0">{i + 1}</div>
                <div className="w-32 text-sm font-medium text-ink-800 truncate">{s.name}</div>
                <div className="w-16 text-xs text-ink-500 flex-shrink-0">Class {s.class}</div>
                <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${s.rate >= 75 ? 'bg-emerald-500' : s.rate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${s.rate}%` }}
                  />
                </div>
                <div className={`w-12 text-right text-sm font-semibold ${s.rate >= 75 ? 'text-emerald-600' : s.rate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {s.rate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
