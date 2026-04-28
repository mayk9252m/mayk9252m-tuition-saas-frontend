import React, { useEffect, useState } from 'react';
import { studentsAPI } from '../services/api';
import { PageLoader, EmptyState, ConfirmModal, Badge } from '../components/ui';
import AddStudentModal from '../components/ui/AddStudentModal';
import { Users, Plus, Trash2, Phone, School, GraduationCap, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentsAPI.delete(deleteId);
      toast.success('Student removed');
      setDeleteId(null);
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.school.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || s.class === filterClass;
    return matchSearch && matchClass;
  });

  const classes = [...new Set(students.map(s => s.class))].sort((a, b) => Number(a) - Number(b));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-ink-500 mt-0.5">{students.length} enrolled student{students.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Filters */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Search by name or school..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-44" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
      )}

      {/* Content */}
      {students.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Add your first student to get started managing your tuition center."
            action={
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Add First Student
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Search} title="No results found" description="Try adjusting your search or filter." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(student => {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const thisFee = student.feesHistory?.find(f => f.month === currentMonth);
            const feeStatus = thisFee?.status ?? 'unpaid';
            const today = new Date().toISOString().split('T')[0];
            const todayAtt = student.attendance?.find(a => a.date === today);

            return (
              <div key={student._id} className="card p-5 hover:shadow-card transition-shadow duration-200 group">
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-800 font-display font-bold text-lg">
                        {student.studentName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-ink-900">{student.studentName}</div>
                      <div className="text-xs text-ink-500">{student.fatherName} (Father)</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteId(student._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <GraduationCap size={14} className="text-ink-400 flex-shrink-0" />
                    <span>Class {student.class}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <School size={14} className="text-ink-400 flex-shrink-0" />
                    <span className="truncate">{student.school}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Phone size={14} className="text-ink-400 flex-shrink-0" />
                    <span>+91 {student.whatsappNumber}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 pt-3 border-t border-ink-50">
                  <Badge variant={feeStatus}>
                    {feeStatus === 'paid' ? '✓ Fee Paid' : '⏳ Fee Due'}
                  </Badge>
                  {todayAtt && (
                    <Badge variant={todayAtt.status}>
                      {todayAtt.status === 'present' ? '✓ Present' : '✗ Absent'}
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-ink-400 font-mono">₹{student.monthlyFees}/mo</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddStudentModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchStudents} />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Student"
        message="Are you sure you want to remove this student? All their attendance and fee records will be archived."
        confirmText="Remove"
        loading={deleting}
      />
    </div>
  );
}
