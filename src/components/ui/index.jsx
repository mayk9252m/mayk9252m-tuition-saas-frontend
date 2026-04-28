import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 16, md: 24, lg: 40 };
  return (
    <Loader2 size={sizes[size]} className={`animate-spin text-ink-400 ${className}`} />
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size="lg" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-ink-400" />
      </div>
    )}
    <h3 className="font-display font-semibold text-ink-800 text-lg mb-1">{title}</h3>
    {description && <p className="text-sm text-ink-500 mb-6 max-w-xs">{description}</p>}
    {action}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, sub, color = 'ink', trend }) => {
  const colors = {
    ink: { bg: 'bg-ink-100', text: 'text-ink-600', icon: 'text-ink-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'text-rose-600' }
  };
  const c = colors[color];

  return (
    <div className="stat-card animate-slide-in">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-ink-900">{value}</div>
        <div className="text-sm font-medium text-ink-600">{label}</div>
        {sub && <div className="text-xs text-ink-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-float w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-in`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
            <h2 className="section-title">{title}</h2>
            <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors p-1">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-ink-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary" onClick={onClose}>Cancel</button>
      <button className="btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <Spinner size="sm" /> : confirmText}
      </button>
    </div>
  </Modal>
);

export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-ink-100 text-ink-700',
    present: 'bg-emerald-100 text-emerald-800',
    absent: 'bg-rose-100 text-rose-800',
    paid: 'bg-emerald-100 text-emerald-800',
    unpaid: 'bg-amber-100 text-amber-800',
    notmarked: 'bg-ink-100 text-ink-500'
  };
  return (
    <span className={`badge ${variants[variant] || variants.default}`}>{children}</span>
  );
};
