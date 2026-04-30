import React, { useEffect, useState } from 'react';
import { testsAPI } from '../services/api';
import { PageLoader, EmptyState } from '../components/ui';
import StudentTestDetail from '../components/ui/StudentTestDetail';
import {
  ClipboardList, Search, TrendingUp, TrendingDown,
  Minus, Award, BookOpen, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const gradeColor = (grade) => {
  const map = {
    'A+': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'A':  'bg-emerald-50  text-emerald-700 border-emerald-200',
    'B+': 'bg-amber-100   text-amber-800   border-amber-200',
    'B':  'bg-amber-50    text-amber-700   border-amber-200',
    'C':  'bg-orange-100  text-orange-800  border-orange-200',
    'D':  'bg-rose-100    text-rose-800    border-rose-200',
    '—':  'bg-ink-100     text-ink-500     border-ink-200',
  };
  return map[grade] || map['—'];
};

const scoreRing = (pct) => {
  if (pct === null) return '#e8e6de';
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#f43f5e';
};

const TrendIcon = ({ scores }) => {
  if (!scores || scores.length < 2) return <Minus size={14} className="text-ink-400" />;
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  if (last > prev) return <TrendingUp size={14} className="text-emerald-500" />;
  if (last < prev) return <TrendingDown size={14} className="text-rose-500" />;
  return <Minus size={14} className="text-ink-400" />;
};

export default function Tests() {
  const [students, setStudents] = useState([]);
  const [classAvgs, setClassAvgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const allClasses = [...new Set(students.map(s => s.class))].sort((a, b) => Number(a) - Number(b));
  const allSubjects = [...new Set(students.flatMap(s => s.subjects))].sort();

  useEffect(() => { fetchData(); }, [filterClass, filterSubject]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClass) params.filterClass = filterClass;
      if (filterSubject) params.filterSubject = filterSubject;
      const res = await testsAPI.getAllSummary(params);
      setStudents(res.data.students);
      setClassAvgs(res.data.classAvgs);
    } catch {
      toast.error('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.school?.toLowerCase().includes(search.toLowerCase())
  );

  const overallAvg = students.filter(s => s.avgScore !== null).length > 0
    ? Math.round(students.filter(s => s.avgScore !== null).reduce((a, s) => a + s.avgScore, 0) / students.filter(s => s.avgScore !== null).length)
    : null;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Test Results</h1>
          <p className="text-sm text-ink-500 mt-0.5">Track and analyse performance of every student</p>
        </div>
        {overallAvg !== null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-ink-900 text-white rounded-xl">
            <Award size={16} className="text-amber-400" />
            <span className="text-sm font-medium">Batch Average: <span className="font-bold text-amber-400">{overallAvg}%</span></span>
          </div>
        )}
      </div>

      {/* Class avg pills */}
      {classAvgs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {classAvgs.sort((a, b) => {
            const an = parseInt(a.class.replace('Class ', ''));
            const bn = parseInt(b.class.replace('Class ', ''));
            return an - bn;
          }).map(c => (
            <div key={c.class} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-ink-100 rounded-xl shadow-paper">
              <BookOpen size={13} className="text-ink-400" />
              <span className="text-xs font-medium text-ink-600">{c.class}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${c.avg >= 75 ? 'bg-emerald-100 text-emerald-700' : c.avg >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                {c.avg}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Search students..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-40" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {allClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select className="input sm:w-44" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Grid */}
      {students.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No test records yet"
            description="Click on any student card to add their first test result."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Search} title="No students match" description="Try adjusting your search or filters." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(student => {
            const radius = 30;
            const circ = 2 * Math.PI * radius;
            const pct = student.avgScore ?? 0;
            const dash = (pct / 100) * circ;

            return (
              <button
                key={student._id}
                onClick={() => setSelectedStudent(student._id)}
                className="card p-5 text-left hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-800 font-display font-bold text-base">
                      {student.studentName.charAt(0)}
                    </span>
                  </div>

                  {/* Score ring */}
                  {student.avgScore !== null ? (
                    <svg width="52" height="52" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r={radius} fill="none" stroke="#e8e6de" strokeWidth="6" />
                      <circle
                        cx="36" cy="36" r={radius} fill="none"
                        stroke={scoreRing(pct)} strokeWidth="6"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 36 36)"
                      />
                      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a1714">
                        {pct}%
                      </text>
                    </svg>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-ink-50 border-2 border-dashed border-ink-200 flex items-center justify-center">
                      <span className="text-xs text-ink-400">No tests</span>
                    </div>
                  )}
                </div>

                {/* Name + class */}
                <div className="mb-3">
                  <div className="font-semibold text-ink-900 group-hover:text-ink-700 transition-colors leading-snug">
                    {student.studentName}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">Class {student.class} · {student.school}</div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge border text-xs font-bold ${gradeColor(student.grade)}`}>
                    {student.grade}
                  </span>
                  <span className="text-xs text-ink-500">{student.totalTests} test{student.totalTests !== 1 ? 's' : ''}</span>
                  <span className="ml-auto">
                    <TrendIcon scores={null} />
                  </span>
                </div>

                {/* Subjects */}
                {student.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {student.subjects.slice(0, 3).map(sub => (
                      <span key={sub} className="text-xs px-2 py-0.5 bg-ink-50 border border-ink-100 rounded-full text-ink-600">
                        {sub}
                      </span>
                    ))}
                    {student.subjects.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-ink-50 border border-ink-100 rounded-full text-ink-400">
                        +{student.subjects.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Latest test */}
                {student.latestTest ? (
                  <div className="pt-3 border-t border-ink-50">
                    <div className="text-xs text-ink-400">Latest · {student.latestTest.testDate}</div>
                    <div className="text-xs font-medium text-ink-700 mt-0.5">
                      {student.latestTest.subject} — <span className={student.latestTest.pct >= 75 ? 'text-emerald-600' : student.latestTest.pct >= 50 ? 'text-amber-600' : 'text-rose-600'}>{student.latestTest.pct}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-ink-50">
                    <div className="text-xs text-ink-400 italic">No tests recorded yet — click to add</div>
                  </div>
                )}

                {/* Click hint */}
                <div className="mt-3 text-xs text-ink-400 group-hover:text-ink-600 transition-colors flex items-center gap-1">
                  <ClipboardList size={11} /> View full report →
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <StudentTestDetail
          studentId={selectedStudent}
          onClose={() => { setSelectedStudent(null); fetchData(); }}
        />
      )}
    </div>
  );
}
