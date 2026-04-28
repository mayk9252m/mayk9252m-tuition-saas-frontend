import React, { useEffect, useState } from 'react';
import { studentsAPI, attendanceAPI } from '../services/api';
import { PageLoader, EmptyState, Badge } from '../components/ui';
import { CalendarCheck, CheckCircle, XCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { buildAttendanceMap(); }, [students, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getAll();
      setStudents(res.data.students);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const buildAttendanceMap = () => {
    const map = {};
    students.forEach(s => {
      const record = s.attendance?.find(a => a.date === selectedDate);
      map[s._id] = record?.status ?? 'not_marked';
    });
    setAttendanceMap(map);
  };

  const markAttendance = async (studentId, status) => {
    setSaving(p => ({ ...p, [studentId]: true }));
    try {
      await attendanceAPI.mark(studentId, { date: selectedDate, status });
      setAttendanceMap(p => ({ ...p, [studentId]: status }));
      toast.success(`Marked ${status}`);
    } catch {
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(p => ({ ...p, [studentId]: false }));
    }
  };

  const markAll = async (status) => {
    const promises = students.map(s => attendanceAPI.mark(s._id, { date: selectedDate, status }));
    try {
      await Promise.all(promises);
      const map = {};
      students.forEach(s => { map[s._id] = status; });
      setAttendanceMap(map);
      toast.success(`All students marked as ${status}`);
    } catch {
      toast.error('Failed to mark all');
    }
  };

  const stats = {
    present: Object.values(attendanceMap).filter(v => v === 'present').length,
    absent: Object.values(attendanceMap).filter(v => v === 'absent').length,
    notMarked: Object.values(attendanceMap).filter(v => v === 'not_marked').length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-ink-500 mt-0.5">Mark daily attendance for your students</p>
        </div>
        <input
          type="date"
          className="input sm:w-48"
          value={selectedDate}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Date banner */}
      <div className="card p-4 bg-ink-900 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-amber-400 text-xs font-medium uppercase tracking-wider">Recording attendance for</div>
            <div className="text-xl font-display font-semibold mt-0.5">
              {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-ink-300">
              <span className="text-emerald-400 font-semibold">{stats.present}</span> present ·
              <span className="text-rose-400 font-semibold ml-1">{stats.absent}</span> absent ·
              <span className="text-ink-400 font-semibold ml-1">{stats.notMarked}</span> pending
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {students.length > 0 && (
        <div className="flex gap-3">
          <button className="btn-success flex items-center gap-2 text-sm" onClick={() => markAll('present')}>
            <CheckCircle size={15} /> Mark All Present
          </button>
          <button className="btn-danger flex items-center gap-2 text-sm" onClick={() => markAll('absent')}>
            <XCircle size={15} /> Mark All Absent
          </button>
        </div>
      )}

      {/* Students list */}
      {students.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No students found" description="Add students first to mark attendance." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Class</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider hidden sm:table-cell">School</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {students.map(student => {
                  const status = attendanceMap[student._id] ?? 'not_marked';
                  const isSaving = saving[student._id];
                  return (
                    <tr key={student._id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-800 font-semibold text-sm">{student.studentName.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-ink-900 text-sm">{student.studentName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-ink-600">Class {student.class}</td>
                      <td className="px-5 py-3.5 text-sm text-ink-600 hidden sm:table-cell max-w-xs truncate">{student.school}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={status === 'not_marked' ? 'notmarked' : status}>
                          {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '— Not Marked'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => markAttendance(student._id, 'present')}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {isSaving ? '...' : 'P'}
                          </button>
                          <button
                            onClick={() => markAttendance(student._id, 'absent')}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              status === 'absent'
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            {isSaving ? '...' : 'A'}
                          </button>
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
