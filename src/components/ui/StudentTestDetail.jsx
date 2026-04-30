import React, { useEffect, useState } from 'react';
import { testsAPI } from '../../services/api';
import { Spinner, Badge } from './index';
import {
  X, Plus, Trash2, TrendingUp, TrendingDown,
  Minus, Award, BookOpen, Calendar, Target
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, BarChart, Bar, Cell
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
  'Economics', 'Computer', 'EVS', 'GK', 'Other'];

const gradeLabel = (pct) => {
  if (pct >= 90) return { g: 'A+', color: 'text-emerald-600' };
  if (pct >= 80) return { g: 'A',  color: 'text-emerald-600' };
  if (pct >= 70) return { g: 'B+', color: 'text-amber-600' };
  if (pct >= 60) return { g: 'B',  color: 'text-amber-600' };
  if (pct >= 50) return { g: 'C',  color: 'text-orange-600' };
  return { g: 'D', color: 'text-rose-600' };
};

const barColor = (pct) => pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

const initForm = {
  testDate: new Date().toISOString().split('T')[0],
  subject: '', chapterSyllabus: '',
  marksObtained: '', totalMarks: '', remarks: ''
};

export default function StudentTestDetail({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState('records'); // records | analysis

  useEffect(() => { fetchData(); }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await testsAPI.getStudentTests(studentId);
      setData(res.data);
    } catch {
      toast.error('Failed to load student test data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (Number(form.marksObtained) > Number(form.totalMarks)) {
      toast.error('Marks obtained cannot exceed total marks');
      return;
    }
    setSaving(true);
    try {
      await testsAPI.addResult(studentId, {
        ...form,
        marksObtained: Number(form.marksObtained),
        totalMarks: Number(form.totalMarks)
      });
      toast.success('Test result added!');
      setForm(initForm);
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add result');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (testId) => {
    setDeleting(testId);
    try {
      await testsAPI.deleteResult(studentId, testId);
      toast.success('Test record deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const pct = form.marksObtained && form.totalMarks
    ? Math.round((Number(form.marksObtained) / Number(form.totalMarks)) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-4xl max-h-[95vh] flex flex-col animate-slide-in">

        {/* Header */}
        {loading ? (
          <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between px-6 py-5 border-b border-ink-100 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-800 font-display font-bold text-xl">
                    {data?.student?.studentName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="section-title leading-none">{data?.student?.studentName}</h2>
                  <p className="text-sm text-ink-500 mt-0.5">Class {data?.student?.class} · {data?.student?.school}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-6 mr-8">
                <div className="text-center">
                  <div className="text-xl font-display font-bold text-ink-900">{data?.analytics?.totalTests ?? 0}</div>
                  <div className="text-xs text-ink-500">Tests</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-display font-bold ${data?.analytics?.overallAvg >= 75 ? 'text-emerald-600' : data?.analytics?.overallAvg >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {data?.analytics?.overallAvg ?? '—'}{data?.analytics?.overallAvg != null ? '%' : ''}
                  </div>
                  <div className="text-xs text-ink-500">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-display font-bold text-emerald-600">{data?.analytics?.highestScore ?? '—'}{data?.analytics?.highestScore != null ? '%' : ''}</div>
                  <div className="text-xs text-ink-500">Best</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-display font-bold text-rose-500">{data?.analytics?.lowestScore ?? '—'}{data?.analytics?.lowestScore != null ? '%' : ''}</div>
                  <div className="text-xs text-ink-500">Lowest</div>
                </div>
              </div>

              <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-ink-50 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Tabs + Add button */}
            <div className="flex items-center justify-between px-6 pt-4 pb-0 flex-shrink-0">
              <div className="flex gap-1 bg-ink-100 rounded-xl p-1">
                {['records', 'analysis'].map(tab => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-700'}`}>
                    {tab === 'records' ? '📋 Records' : '📊 Analysis'}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm py-2">
                <Plus size={15} /> Add Test
              </button>
            </div>

            {/* Add Form */}
            {showForm && (
              <div className="mx-6 mt-4 p-4 bg-ink-50 rounded-xl border border-ink-200 flex-shrink-0">
                <form onSubmit={handleAdd} className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="label">Test Date *</label>
                      <input type="date" className="input text-sm" value={form.testDate} onChange={set('testDate')} required />
                    </div>
                    <div>
                      <label className="label">Subject *</label>
                      <select className="input text-sm" value={form.subject} onChange={set('subject')} required>
                        <option value="">Select</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Marks Obtained *</label>
                      <input type="number" className="input text-sm" placeholder="e.g. 42" min="0"
                        value={form.marksObtained} onChange={set('marksObtained')} required />
                    </div>
                    <div>
                      <label className="label">Total Marks *</label>
                      <input type="number" className="input text-sm" placeholder="e.g. 50" min="1"
                        value={form.totalMarks} onChange={set('totalMarks')} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Chapter / Syllabus *</label>
                      <input className="input text-sm" placeholder="e.g. Chapter 3 - Polynomials"
                        value={form.chapterSyllabus} onChange={set('chapterSyllabus')} required />
                    </div>
                    <div>
                      <label className="label">Remarks (optional)</label>
                      <input className="input text-sm" placeholder="e.g. Needs more practice"
                        value={form.remarks} onChange={set('remarks')} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {pct !== null && (
                      <div className={`flex items-center gap-2 text-sm font-semibold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        <Target size={14} />
                        Score: {pct}% — Grade {gradeLabel(pct).g}
                      </div>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <button type="button" className="btn-secondary text-sm py-2" onClick={() => setShowForm(false)}>Cancel</button>
                      <button type="submit" disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2">
                        {saving ? <Spinner size="sm" /> : 'Save Result'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              {/* RECORDS TAB */}
              {activeTab === 'records' && (
                <div>
                  {(!data?.tests || data.tests.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-3">
                        <BookOpen size={24} className="text-ink-400" />
                      </div>
                      <p className="text-ink-600 font-medium">No test records yet</p>
                      <p className="text-sm text-ink-400 mt-1">Click "Add Test" to record the first result</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.tests.map(test => {
                        const p = Math.round((test.marksObtained / test.totalMarks) * 100);
                        const { g, color } = gradeLabel(p);
                        return (
                          <div key={test._id} className="flex items-start gap-4 p-4 bg-ink-50 rounded-xl border border-ink-100 group hover:border-ink-200 transition-all">
                            {/* Score bubble */}
                            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border-2 ${p >= 75 ? 'bg-emerald-50 border-emerald-200' : p >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
                              <span className={`text-lg font-display font-bold ${color}`}>{g}</span>
                              <span className="text-xs text-ink-500">{p}%</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-semibold text-ink-900">{test.subject}</div>
                                  <div className="text-sm text-ink-600 mt-0.5">{test.chapterSyllabus}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-mono font-bold text-ink-900">{test.marksObtained}/{test.totalMarks}</div>
                                  <div className="text-xs text-ink-400 flex items-center gap-1 justify-end mt-0.5">
                                    <Calendar size={11} /> {test.testDate}
                                  </div>
                                </div>
                              </div>
                              {test.remarks && (
                                <div className="mt-2 text-xs text-ink-500 italic bg-white px-2 py-1 rounded-lg border border-ink-100">
                                  💬 {test.remarks}
                                </div>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(test._id)}
                              disabled={deleting === test._id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0"
                            >
                              {deleting === test._id ? <Spinner size="sm" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ANALYSIS TAB */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {(!data?.analytics?.totalTests || data.analytics.totalTests === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-ink-600 font-medium">No data to analyse yet</p>
                      <p className="text-sm text-ink-400 mt-1">Add at least one test result first</p>
                    </div>
                  ) : (
                    <>
                      {/* Score trend line chart */}
                      {data.analytics.trend?.length > 1 && (
                        <div>
                          <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                            <TrendingUp size={15} className="text-emerald-500" /> Score Trend (Last 10 Tests)
                          </h3>
                          <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={data.analytics.trend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e8e6de" />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7d7560' }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7d7560' }} tickFormatter={v => `${v}%`} />
                              <Tooltip formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(l) => `Date: ${l}`} />
                              <Line type="monotone" dataKey="pct" stroke="#1a1714" strokeWidth={2.5}
                                dot={{ fill: '#1a1714', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Subject performance bar chart */}
                      {data.analytics.subjectAnalysis?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                            <BookOpen size={15} className="text-amber-500" /> Subject-wise Average Score
                          </h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.analytics.subjectAnalysis} barCategoryGap="30%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e8e6de" />
                              <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#7d7560' }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7d7560' }} tickFormatter={v => `${v}%`} />
                              <Tooltip formatter={(v, n) => [`${v}%`, n === 'avgPct' ? 'Avg Score' : n]} />
                              <Bar dataKey="avgPct" name="avgPct" radius={[6, 6, 0, 0]}>
                                {data.analytics.subjectAnalysis.map((entry, i) => (
                                  <Cell key={i} fill={barColor(entry.avgPct)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Subject breakdown table */}
                      <div>
                        <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                          <Award size={15} className="text-ink-500" /> Subject Breakdown
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-ink-100">
                          <table className="w-full text-sm">
                            <thead className="bg-ink-50">
                              <tr>
                                {['Subject', 'Tests', 'Avg', 'Best', 'Lowest', 'Status'].map(h => (
                                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-ink-500 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-50">
                              {data.analytics.subjectAnalysis.map(sub => {
                                const { g, color } = gradeLabel(sub.avgPct);
                                return (
                                  <tr key={sub.subject} className="hover:bg-ink-50/50">
                                    <td className="px-4 py-3 font-medium text-ink-900">{sub.subject}</td>
                                    <td className="px-4 py-3 text-ink-600">{sub.tests}</td>
                                    <td className={`px-4 py-3 font-semibold ${color}`}>{sub.avgPct}%</td>
                                    <td className="px-4 py-3 text-emerald-600 font-medium">{sub.best}%</td>
                                    <td className="px-4 py-3 text-rose-500 font-medium">{sub.worst}%</td>
                                    <td className="px-4 py-3">
                                      <span className={`badge border font-bold text-xs ${
                                        sub.avgPct >= 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                        sub.avgPct >= 50 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                        'bg-rose-100 text-rose-800 border-rose-200'
                                      }`}>{g}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Overall stat pills */}
                      <div className="grid grid-cols-3 gap-3 pb-2">
                        {[
                          { label: 'Overall Avg', value: `${data.analytics.overallAvg}%`, color: 'bg-ink-900 text-white' },
                          { label: 'Best Score', value: `${data.analytics.highestScore}%`, color: 'bg-emerald-600 text-white' },
                          { label: 'Lowest Score', value: `${data.analytics.lowestScore}%`, color: 'bg-rose-600 text-white' },
                        ].map(stat => (
                          <div key={stat.label} className={`rounded-xl px-4 py-3 text-center ${stat.color}`}>
                            <div className="text-xl font-display font-bold">{stat.value}</div>
                            <div className="text-xs opacity-80 mt-0.5">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
