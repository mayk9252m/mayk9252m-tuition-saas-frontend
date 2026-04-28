import React, { useEffect, useState } from 'react';
import { studentsAPI, feesAPI } from '../services/api';
import { PageLoader, EmptyState, Badge } from '../components/ui';
import { Wallet, CheckCircle, XCircle, Bell, IndianRupee, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function Fees() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [reminding, setReminding] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getAll();
      setStudents(res.data.students);
    } catch {
      toast.error('Failed to load fees data');
    } finally {
      setLoading(false);
    }
  };

  const toggleFee = async (studentId, month, currentStatus) => {
    const key = `${studentId}-${month}`;
    setUpdating(p => ({ ...p, [key]: true }));
    try {
      const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
      await feesAPI.updateStatus(studentId, month, { status: newStatus });
      setStudents(prev => prev.map(s => {
        if (s._id !== studentId) return s;
        return {
          ...s,
          feesHistory: s.feesHistory.map(f =>
            f.month === month ? { ...f, status: newStatus, paidDate: newStatus === 'paid' ? new Date() : null } : f
          )
        };
      }));
      toast.success(newStatus === 'paid' ? 'Fee marked as paid ✓' : 'Fee marked as unpaid');
    } catch {
      toast.error('Failed to update fee status');
    } finally {
      setUpdating(p => ({ ...p, [key]: false }));
    }
  };

  const sendReminder = async (studentId, studentName) => {
    setReminding(p => ({ ...p, [studentId]: true }));
    try {
      await feesAPI.sendReminder(studentId);
      toast.success(`Reminder sent to ${studentName}'s parent via WhatsApp`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setReminding(p => ({ ...p, [studentId]: false }));
    }
  };

  // Generate months list for selector (last 12 months + next month)
  const monthOptions = [];
  for (let i = -1; i <= 11; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toISOString().slice(0, 7);
    const label = format(new Date(val + '-01'), 'MMMM yyyy');
    monthOptions.push({ val, label });
  }

  // Compute per-student data for the selected month
  const studentsWithFee = students.map(s => {
    const fee = s.feesHistory?.find(f => f.month === selectedMonth);
    return { ...s, currentFee: fee };
  });

  const summary = {
    collected: studentsWithFee.filter(s => s.currentFee?.status === 'paid').reduce((acc, s) => acc + (s.currentFee?.amount ?? 0), 0),
    pending: studentsWithFee.filter(s => !s.currentFee || s.currentFee.status === 'unpaid').reduce((acc, s) => acc + (s.currentFee?.amount ?? s.monthlyFees ?? 0), 0),
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fees Management</h1>
          <p className="text-sm text-ink-500 mt-0.5">Track and manage monthly fee collection</p>
        </div>
        <select className="input sm:w-52" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {monthOptions.map(({ val, label }) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-ink-600">Collected</span>
          </div>
          <div className="text-2xl font-display font-bold text-emerald-700">
            ₹{summary.collected.toLocaleString()}
          </div>
          <div className="text-xs text-ink-400 mt-0.5">
            {studentsWithFee.filter(s => s.currentFee?.status === 'paid').length} students paid
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <XCircle size={18} className="text-amber-600" />
            </div>
            <span className="text-sm font-medium text-ink-600">Pending</span>
          </div>
          <div className="text-2xl font-display font-bold text-amber-700">
            ₹{summary.pending.toLocaleString()}
          </div>
          <div className="text-xs text-ink-400 mt-0.5">
            {studentsWithFee.filter(s => !s.currentFee || s.currentFee.status === 'unpaid').length} students pending
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-ink-100 flex items-center justify-center">
              <IndianRupee size={18} className="text-ink-600" />
            </div>
            <span className="text-sm font-medium text-ink-600">Total Expected</span>
          </div>
          <div className="text-2xl font-display font-bold text-ink-900">
            ₹{(summary.collected + summary.pending).toLocaleString()}
          </div>
          <div className="text-xs text-ink-400 mt-0.5">
            {students.length} total students
          </div>
        </div>
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No students enrolled" description="Add students to track fees." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100">
            <h2 className="section-title">
              {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} — Fee Details
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider hidden sm:table-cell">Class</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider hidden md:table-cell">Paid On</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {studentsWithFee.map(student => {
                  const fee = student.currentFee;
                  const status = fee?.status ?? 'unpaid';
                  const amount = fee?.amount ?? student.monthlyFees;
                  const key = `${student._id}-${selectedMonth}`;
                  const isUpdating = updating[key];
                  const isReminding = reminding[student._id];

                  return (
                    <tr key={student._id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-amber-800 font-semibold text-sm">{student.studentName.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-ink-900 text-sm">{student.studentName}</div>
                            <div className="text-xs text-ink-400">+91 {student.whatsappNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-600 hidden sm:table-cell">Class {student.class}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-semibold text-ink-900">₹{amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={status}>{status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}</Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-500 hidden md:table-cell">
                        {fee?.paidDate ? format(new Date(fee.paidDate), 'd MMM yyyy') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleFee(student._id, selectedMonth, status)}
                            disabled={isUpdating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              status === 'paid'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {isUpdating ? '...' : status === 'paid' ? '✗ Unpaid' : '✓ Paid'}
                          </button>
                          {status === 'unpaid' && (
                            <button
                              onClick={() => sendReminder(student._id, student.studentName)}
                              disabled={isReminding}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-1"
                              title="Send WhatsApp reminder"
                            >
                              {isReminding ? '...' : <Bell size={12} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
