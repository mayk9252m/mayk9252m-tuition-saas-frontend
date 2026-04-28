import React, { useState } from 'react';
import { Modal } from '../ui';
import { studentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SCHOOLS = [
  'Delhi Public School', 'Kendriya Vidyalaya', 'Ryan International School',
  'DAV Public School', 'Army Public School', 'St. Xavier School',
  'Modern School', 'Bal Bharati Public School', 'Other'
];

const initialForm = {
  studentName: '', fatherName: '', motherName: '',
  class: '', school: '', whatsappNumber: '',
  dateOfJoining: '', monthlyFees: ''
};

export default function AddStudentModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [customSchool, setCustomSchool] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        school: form.school === 'Other' ? customSchool : form.school,
        monthlyFees: Number(form.monthlyFees)
      };
      await studentsAPI.create(data);
      toast.success(`${form.studentName} added successfully!`);
      setForm(initialForm);
      setCustomSchool('');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Student" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Student Name *</label>
            <input className="input" placeholder="Full name" value={form.studentName} onChange={set('studentName')} required />
          </div>
          <div>
            <label className="label">Class *</label>
            <select className="input" value={form.class} onChange={set('class')} required>
              <option value="">Select Class</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Father's Name *</label>
            <input className="input" placeholder="Father's full name" value={form.fatherName} onChange={set('fatherName')} required />
          </div>
          <div>
            <label className="label">Mother's Name *</label>
            <input className="input" placeholder="Mother's full name" value={form.motherName} onChange={set('motherName')} required />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">School *</label>
            <select className="input" value={form.school} onChange={set('school')} required>
              <option value="">Select School</option>
              {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {form.school === 'Other' && (
            <div>
              <label className="label">School Name *</label>
              <input className="input" placeholder="Enter school name"
                value={customSchool} onChange={e => setCustomSchool(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">WhatsApp Number *</label>
            <div className="flex">
              <span className="flex items-center px-3 bg-ink-50 border border-r-0 border-ink-200 rounded-l-xl text-sm text-ink-600">+91</span>
              <input className="input rounded-l-none" placeholder="10-digit number"
                value={form.whatsappNumber} onChange={set('whatsappNumber')}
                pattern="[0-9]{10}" maxLength={10} required />
            </div>
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Date of Joining *</label>
            <input type="date" className="input" value={form.dateOfJoining} onChange={set('dateOfJoining')} required />
          </div>
          <div>
            <label className="label">Monthly Fees (₹) *</label>
            <input type="number" className="input" placeholder="e.g. 2000" min="0"
              value={form.monthlyFees} onChange={set('monthlyFees')} required />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Add Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
