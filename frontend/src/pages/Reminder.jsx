import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Mail, 
  Repeat, 
  Edit3, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Filter,
  Check,
  Send
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '../utils/swal';

export default function Reminder({ onAlertsChanged }) {
  const [reminders, setReminders] = useState([]);
  const [summary, setSummary] = useState({ total: 0, overdue: 0, due_today: 0, upcoming_7d: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [timeBucketFilter, setTimeBucketFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'system',
    priority: 'medium',
    due_date: '',
    reminder_before_days: 3,
    assigned_to: '',
    assigned_email: '',
    send_email_notification: 1,
    is_recurring: 0,
    recurrence_cycle: 'monthly'
  });

  const getApiUrl = (endpoint) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanPath = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return `${origin}${cleanPath}api/${endpoint}`;
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (timeBucketFilter !== 'all') params.append('time_bucket', timeBucketFilter);

      const res = await axios.get(`${getApiUrl('reminders')}?${params.toString()}`);
      if (res.data?.status === 'success') {
        setReminders(res.data.data || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Ralat memuatkan peringatan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    if (onAlertsChanged) {
      onAlertsChanged();
    }
  }, [categoryFilter, priorityFilter, timeBucketFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReminders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openAddModal = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    // Format YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n) => String(n).padStart(2, '0');
    const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;

    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'system',
      priority: 'medium',
      due_date: defaultDate,
      reminder_before_days: 3,
      assigned_to: '',
      assigned_email: '',
      send_email_notification: 1,
      is_recurring: 0,
      recurrence_cycle: 'monthly'
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    let dateVal = '';
    if (item.due_date) {
      const d = new Date(item.due_date.replace(' ', 'T'));
      const pad = (n) => String(n).padStart(2, '0');
      dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setFormData({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'general',
      priority: item.priority || 'medium',
      due_date: dateVal,
      reminder_before_days: item.reminder_before_days || 3,
      assigned_to: item.assigned_to || '',
      assigned_email: item.assigned_email || '',
      send_email_notification: Number(item.send_email_notification) ? 1 : 0,
      is_recurring: Number(item.is_recurring) ? 1 : 0,
      recurrence_cycle: item.recurrence_cycle || 'monthly'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.due_date) {
      showError('Sila lengkapkan tajuk dan tarikh matang tugasan.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await axios.put(getApiUrl(`reminders/${editingId}`), formData);
        showSuccess('Peringatan berjaya dikemaskini.');
      } else {
        await axios.post(getApiUrl('reminders'), formData);
        showSuccess('Peringatan baharu berjaya dicipta.');
      }
      setShowModal(false);
      fetchReminders();
      if (onAlertsChanged) onAlertsChanged();
    } catch (err) {
      console.error('Ralat simpan peringatan:', err);
      showError(err.response?.data?.messages?.error || 'Gagal menyimpan rekod peringatan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      const res = await axios.post(getApiUrl(`reminders/${item.id}/toggle-complete`));
      if (res.data?.status === 'success') {
        showSuccess(res.data.message || 'Status tugasan berjaya dikemaskini.');
        fetchReminders();
        if (onAlertsChanged) onAlertsChanged();
      }
    } catch (err) {
      showError('Gagal mengemaskini status selesai.');
    }
  };

  const handleSendEmail = async (item) => {
    if (!item.assigned_email) {
      showError('Tiada alamat emel ditetapkan untuk tugasan ini. Sila klik kemaskini untuk masukkan emel.');
      return;
    }

    setSendingEmailId(item.id);
    try {
      const res = await axios.post(getApiUrl(`reminders/${item.id}/send-email`));
      if (res.data?.status === 'success') {
        showSuccess(res.data.message || 'Emel peringatan telah diproses.');
        fetchReminders();
      }
    } catch (err) {
      showError(err.response?.data?.messages?.error || 'Ralat semasa menghantar notifikasi emel.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Padam Peringatan Ini?',
      'Rekod tugasan dan peringatan ini akan dipadam daripada sistem secara kekal.'
    );
    if (!confirmed) return;

    try {
      await axios.delete(getApiUrl(`reminders/${id}`));
      showSuccess('Peringatan berjaya dipadam.');
      fetchReminders();
      if (onAlertsChanged) onAlertsChanged();
    } catch (err) {
      showError('Gagal memadam peringatan.');
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return d.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return dateStr;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)' }}>● KRITIKAL</span>;
      case 'high':
        return <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.35)' }}>● TINGGI</span>;
      case 'medium':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)' }}>● SEDERHANA</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' }}>● RENDAH</span>;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'system': return 'Sistem & Pelayan';
      case 'procurement': return 'Perolehan & Dokumen';
      case 'issue': return 'Isu & Troubleshooting';
      case 'staff_admin': return 'Rutin Harian / Staf';
      default: return 'Umum';
    }
  };

  return (
    <div style={{ padding: '1.5rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Header Modul Reminder ── */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(99,102,241,0.12))', border: '1px solid rgba(244,63,94,0.25)' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(244,63,94,0.18)', color: '#fda4af', padding: '0.25rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem', border: '1px solid rgba(244,63,94,0.3)' }}>
            <Bell size={13} style={{ color: '#fb7185' }} /> IKNOW KNOWLEDGE HUB • PUSAT PERINGATAN OPERASI
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.5px', color: '#f8fafc' }}>
            Reminder & Pengurusan Tugasan
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Pantau tarikh matang, jadual penyelenggaraan berkala, dan notifikasi emel bagi sebarang tugasan sistem.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={openAddModal}
          style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.4)', padding: '0.75rem 1.4rem' }}
        >
          <Plus size={18} /> Tambah Reminder
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* 1. Overdue */}
        <div 
          className="glass-card" 
          onClick={() => setTimeBucketFilter(timeBucketFilter === 'overdue' ? 'all' : 'overdue')}
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer',
            border: timeBucketFilter === 'overdue' ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.25)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(15, 23, 42, 0.5))' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>Melepasi Tempoh</span>
            <AlertTriangle size={17} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>{summary.overdue}</div>
          <div style={{ fontSize: '0.74rem', color: '#fca5a5' }}>Perlu tindakan segera</div>
        </div>

        {/* 2. Due Today & Tomorrow */}
        <div 
          className="glass-card" 
          onClick={() => setTimeBucketFilter(timeBucketFilter === 'due_today' ? 'all' : 'due_today')}
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer',
            border: timeBucketFilter === 'due_today' ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.25)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.5))' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>Hari Ini / Esok</span>
            <Clock size={17} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>{summary.due_today}</div>
          <div style={{ fontSize: '0.74rem', color: '#fde68a' }}>Baki dalam 48 jam</div>
        </div>

        {/* 3. Upcoming 7 Days */}
        <div 
          className="glass-card" 
          onClick={() => setTimeBucketFilter(timeBucketFilter === 'upcoming_7d' ? 'all' : 'upcoming_7d')}
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer',
            border: timeBucketFilter === 'upcoming_7d' ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.25)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(15, 23, 42, 0.5))' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase' }}>Dalam 7 Hari</span>
            <Calendar size={17} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>{summary.upcoming_7d}</div>
          <div style={{ fontSize: '0.74rem', color: '#bae6fd' }}>Jadual minggu semasa</div>
        </div>

        {/* 4. Completed */}
        <div 
          className="glass-card" 
          onClick={() => setTimeBucketFilter(timeBucketFilter === 'completed' ? 'all' : 'completed')}
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer',
            border: timeBucketFilter === 'completed' ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.25)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.5))' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Telah Selesai</span>
            <CheckCircle2 size={17} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>{summary.completed}</div>
          <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>Rekod tugasan selesai</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="glass-panel" style={{ padding: '1.1rem 1.5rem', marginBottom: '1.75rem', display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari tajuk peringatan, pegawai, emel, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem', paddingRight: '1rem', paddingTop: '0.55rem', paddingBottom: '0.55rem', fontSize: '0.88rem' }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: '170px' }}>
          <select 
            className="form-select" 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ paddingTop: '0.55rem', paddingBottom: '0.55rem', fontSize: '0.85rem' }}
          >
            <option value="all">📁 Semua Kategori</option>
            <option value="system">🖥️ Sistem & Pelayan</option>
            <option value="procurement">📑 Perolehan & Dokumen</option>
            <option value="issue">🔧 Isu & Troubleshooting</option>
            <option value="staff_admin">👥 Rutin Harian / Staf</option>
            <option value="general">📌 Umum</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ minWidth: '150px' }}>
          <select 
            className="form-select" 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ paddingTop: '0.55rem', paddingBottom: '0.55rem', fontSize: '0.85rem' }}
          >
            <option value="all">⚡ Semua Keutamaan</option>
            <option value="critical">🔴 Kritikal</option>
            <option value="high">🟠 Tinggi</option>
            <option value="medium">🟡 Sederhana</option>
            <option value="low">🟢 Rendah</option>
          </select>
        </div>

        {/* Reset filter button if any active */}
        {(timeBucketFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || search) && (
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setTimeBucketFilter('all');
              setCategoryFilter('all');
              setPriorityFilter('all');
              setSearch('');
            }}
            style={{ fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {/* ── Reminders List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="spin-animation" style={{ display: 'inline-block', marginBottom: '0.75rem', fontSize: '1.5rem' }}>⏳</div>
          <div>Memuatkan senarai peringatan...</div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Bell size={42} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '0.85rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#e2e8f0', marginBottom: '0.4rem' }}>Tiada Peringatan Dijumpai</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
            {search || categoryFilter !== 'all' || timeBucketFilter !== 'all' 
              ? 'Tiada rekod menepati kriteria tapisan anda. Cuba ubah kata kunci atau set semula penapis.'
              : 'Belum ada sebarang peringatan didaftarkan. Cipta peringatan pertama anda sekarang.'}
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Tambah Reminder Sekarang
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reminders.map((item) => {
            const isCompleted = item.status === 'completed';
            const isOverdue = item.time_badge_type === 'overdue';
            const isUrgent = item.time_badge_type === 'urgent';

            return (
              <div 
                key={item.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.35rem 1.6rem',
                  opacity: isCompleted ? 0.72 : 1,
                  borderLeft: isOverdue 
                    ? '4px solid #ef4444' 
                    : isUrgent 
                      ? '4px solid #f59e0b' 
                      : isCompleted 
                        ? '4px solid #10b981' 
                        : '4px solid #6366f1',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Top Meta Line: Badges & Countdown */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {getPriorityBadge(item.priority)}
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      📁 {getCategoryLabel(item.category)}
                    </span>
                    {Number(item.is_recurring) === 1 && (
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Repeat size={12} /> {item.recurrence_cycle ? item.recurrence_cycle.toUpperCase() : 'BERULANG'}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Time Countdown Badge */}
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.22rem 0.65rem',
                    borderRadius: '999px',
                    background: isOverdue ? 'rgba(239, 68, 68, 0.2)' : isUrgent ? 'rgba(245, 158, 11, 0.2)' : isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: isOverdue ? '#f87171' : isUrgent ? '#fbbf24' : isCompleted ? '#34d399' : '#7dd3fc',
                    border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : isUrgent ? 'rgba(245,158,11,0.4)' : isCompleted ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.3)'}`
                  }}>
                    {isOverdue && '🚨 '}
                    {isUrgent && '⏳ '}
                    {item.time_badge}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 700, 
                  margin: '0 0 0.45rem 0', 
                  color: isCompleted ? '#94a3b8' : '#f8fafc',
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {item.description}
                  </p>
                )}

                {/* Meta Details Strip */}
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1.1rem', background: 'rgba(15, 23, 42, 0.55)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    📅 <strong>Tarikh Matang:</strong> <span style={{ color: '#38bdf8' }}>{formatDueDate(item.due_date)}</span>
                  </div>
                  {item.assigned_to && (
                    <div>
                      👤 <strong>Pegawai:</strong> {item.assigned_to}
                    </div>
                  )}
                  {item.assigned_email && (
                    <div>
                      ✉️ <strong>Emel:</strong> {item.assigned_email}
                      {item.last_email_sent_at && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '0.35rem' }}>
                          (Dihantar: {formatDueDate(item.last_email_sent_at)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {/* Left: Complete Toggle Button */}
                  <button 
                    className="btn" 
                    onClick={() => handleToggleComplete(item)}
                    style={{
                      background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: isCompleted ? '#34d399' : '#a5b4fc',
                      border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
                      fontSize: '0.82rem',
                      padding: '0.4rem 0.85rem'
                    }}
                  >
                    {isCompleted ? <RotateCcw size={14} /> : <Check size={14} />}
                    {isCompleted ? 'Tandakan Belum Siap' : 'Tandakan Selesai'}
                  </button>

                  {/* Right: Email, Edit, Delete */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* On-Demand Send Email */}
                    {item.assigned_email && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleSendEmail(item)}
                        disabled={sendingEmailId === item.id}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}
                        title="Hantar peringatan emel serta-merta kepada pegawai"
                      >
                        <Mail size={14} className={sendingEmailId === item.id ? 'spin' : ''} />
                        {sendingEmailId === item.id ? 'Menghantar...' : 'Hantar Emel'}
                      </button>
                    )}

                    <button 
                      className="btn btn-secondary" 
                      onClick={() => openEditModal(item)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      title="Kemaskini tugasan"
                    >
                      <Edit3 size={14} /> Kemaskini
                    </button>

                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(item.id)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                      title="Padam tugasan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Add / Edit Reminder ── */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} style={{ color: '#f43f5e' }} />
                {editingId ? 'Kemaskini Peringatan' : 'Cipta Peringatan Baharu'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tajuk */}
              <div className="form-group">
                <label className="form-label">Tajuk Peringatan / Tugasan <span style={{ color: '#f43f5e' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: Renew Sijil SSL Portal Hospital / Patching OS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Kategori & Keutamaan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Kategori Tugasan</label>
                  <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="system">🖥️ Sistem & Pelayan</option>
                    <option value="procurement">📑 Perolehan & Dokumen</option>
                    <option value="issue">🔧 Isu & Troubleshooting</option>
                    <option value="staff_admin">👥 Rutin Harian / Staf</option>
                    <option value="general">📌 Umum</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tahap Keutamaan</label>
                  <select 
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="critical">🔴 Kritikal</option>
                    <option value="high">🟠 Tinggi</option>
                    <option value="medium">🟡 Sederhana</option>
                    <option value="low">🟢 Rendah</option>
                  </select>
                </div>
              </div>

              {/* Tarikh & Masa Matang */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tarikh & Masa Matang <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amaran Awal (Hari)</label>
                  <select 
                    className="form-select"
                    value={formData.reminder_before_days}
                    onChange={(e) => setFormData({ ...formData, reminder_before_days: Number(e.target.value) })}
                  >
                    <option value={0}>Pada Hari Kejadian</option>
                    <option value={1}>1 Hari Sebelum</option>
                    <option value={3}>3 Hari Sebelum</option>
                    <option value={7}>7 Hari Sebelum</option>
                    <option value={14}>14 Hari Sebelum</option>
                  </select>
                </div>
              </div>

              {/* Pegawai & Emel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Pegawai Bertugas</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Contoh: En. Malik Manan"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Emel Pegawai (Notifikasi)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Contoh: malikmanan@hosza.my"
                    value={formData.assigned_email}
                    onChange={(e) => setFormData({ ...formData, assigned_email: e.target.value })}
                  />
                </div>
              </div>

              {/* Notifikasi Emel & Kitaran Berulang */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={Boolean(formData.send_email_notification)}
                    onChange={(e) => setFormData({ ...formData, send_email_notification: e.target.checked ? 1 : 0 })}
                  />
                  <span>📧 Notifikasi Emel Aktif</span>
                </label>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#e2e8f0', marginBottom: formData.is_recurring ? '0.5rem' : '0' }}>
                    <input 
                      type="checkbox" 
                      checked={Boolean(formData.is_recurring)}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked ? 1 : 0 })}
                    />
                    <span>🔄 Kitaran Berulang</span>
                  </label>

                  {Boolean(formData.is_recurring) && (
                    <select 
                      className="form-select"
                      value={formData.recurrence_cycle}
                      onChange={(e) => setFormData({ ...formData, recurrence_cycle: e.target.value })}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                    >
                      <option value="daily">Setiap Hari</option>
                      <option value="weekly">Setiap Minggu</option>
                      <option value="monthly">Setiap Bulan</option>
                      <option value="yearly">Setiap Tahun</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Catatan / Arahan */}
              <div className="form-group">
                <label className="form-label">Catatan / Arahan Tindakan</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  placeholder="Masukkan penerangan, arahan pelaksanaan, atau pautan rujukan berkaitan tugasan ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Butang Batal & Simpan */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none' }}
                >
                  {submitting ? 'Sedang Menyimpan...' : editingId ? 'Simpan Kemaskini' : 'Daftar Peringatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
