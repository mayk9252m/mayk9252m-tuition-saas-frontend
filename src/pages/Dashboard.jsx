import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import { StatCard, PageLoader } from '../components/ui';
import { Users, CheckCircle, XCircle, Wallet, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.get();
      setAnalytics(res.data.analytics);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  const a = analytics || {};
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-ink-400 font-medium">{today}</p>
        <h1 className="page-title mt-0.5">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-ink-500 text-sm mt-1">Here's what's happening with your students today.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={a.totalStudents ?? 0}
          sub="Currently enrolled"
          color="ink"
        />
        <StatCard
          icon={CheckCircle}
          label="Present Today"
          value={a.presentToday ?? 0}
          sub={`${a.notMarkedToday ?? 0} not yet marked`}
          color="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Absent Today"
          value={a.absentToday ?? 0}
          sub="Marked absent"
          color="rose"
        />
        <StatCard
          icon={Clock}
          label="Fees Pending"
          value={`₹${(a.totalPending ?? 0).toLocaleString()}`}
          sub="Across all months"
          color="amber"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Wallet}
          label="Fees Collected"
          value={`₹${(a.totalCollected ?? 0).toLocaleString()}`}
          sub="Total received so far"
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Collection Rate"
          value={
            (a.totalCollected + a.totalPending) > 0
              ? `${Math.round((a.totalCollected / (a.totalCollected + a.totalPending)) * 100)}%`
              : '—'
          }
          sub="Fees collected vs total"
          color="ink"
        />
      </div>

      {/* Today's Attendance & Top Attendance Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Bar */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Today's Attendance</h2>
          {(a.totalStudents ?? 0) === 0 ? (
            <p className="text-sm text-ink-400">No students enrolled yet.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Present', count: a.presentToday ?? 0, color: 'bg-emerald-500' },
                { label: 'Absent', count: a.absentToday ?? 0, color: 'bg-rose-400' },
                { label: 'Not Marked', count: a.notMarkedToday ?? 0, color: 'bg-ink-200' },
              ].map(({ label, count, color }) => {
                const pct = a.totalStudents > 0 ? Math.round((count / a.totalStudents) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-ink-700">{label}</span>
                      <span className="text-ink-500">{count} students ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Attendance */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Attendance Rate (30 days)</h2>
          {(!a.attendanceRate || a.attendanceRate.length === 0) ? (
            <p className="text-sm text-ink-400">No attendance data available.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(a.attendanceRate || [])
                .sort((x, y) => y.rate - x.rate)
                .slice(0, 8)
                .map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-ink-600">{s.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-ink-800 truncate">{s.name}</span>
                        <span className={`font-semibold ml-2 ${s.rate >= 75 ? 'text-emerald-600' : s.rate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {s.rate}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.rate >= 75 ? 'bg-emerald-500' : s.rate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Students by Class */}
      {a.byClass && a.byClass.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Students by Class</h2>
          <div className="flex flex-wrap gap-2">
            {a.byClass.sort((x, y) => {
              const xn = parseInt(x.name.replace('Class ', ''));
              const yn = parseInt(y.name.replace('Class ', ''));
              return xn - yn;
            }).map(({ name, value }) => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 bg-ink-50 rounded-xl border border-ink-100">
                <span className="text-sm font-medium text-ink-700">{name}</span>
                <span className="text-xs bg-ink-200 text-ink-700 px-2 py-0.5 rounded-full font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
