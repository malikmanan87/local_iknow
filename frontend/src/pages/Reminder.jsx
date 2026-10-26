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
  Send,
  ChevronLeft,
  ChevronRight
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    setCurrentPage(1);
    fetchReminders();
    if (onAlertsChanged) {
      onAlertsChanged();
    }
  }, [categoryFilter, priorityFilter, timeBucketFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchReminders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openAddModal = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
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
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)', fontSize: '0.7rem', padding: '0.12rem 0.5rem' }}>● KRITIKAL</span>;
      case 'high':
        return <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.35)', fontSize: '0.7rem', padding: '0.12rem 0.5rem' }}>● TINGGI</span>;
      case 'medium':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', fontSize: '0.7rem', padding: '0.12rem 0.5rem' }}>● SEDERHANA</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', fontSize: '0.7rem', padding: '0.12rem 0.5rem' }}>● RENDAH</span>;
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

  // Pagination Math
  const totalItems = reminders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentReminders = reminders.slice(startIndex, endIndex);

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

      {/* ── Reminders List Table ── */}
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
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0, borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.75px'
                }}>
                  <th style={{ padding: '0.85rem 1rem', width: '48px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Tugasan & Perincian</th>
                  <th style={{ padding: '0.85rem 1rem', width: '190px' }}>Tarikh Matang</th>
                  <th style={{ padding: '0.85rem 1rem', width: '120px', textAlign: 'center' }}>Keutamaan</th>
                  <th style={{ padding: '0.85rem 1rem', width: '190px' }}>Pegawai / Emel</th>
                  <th style={{ padding: '0.85rem 1rem', width: '130px', textAlign: 'right' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {currentReminders.map((item) => {
                  const isCompleted = item.status === 'completed';
                  const isOverdue = item.time_badge_type === 'overdue';
                  const isUrgent = item.time_badge_type === 'urgent';

                  return (
                    <tr 
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isOverdue ? 'rgba(239, 68, 68, 0.04)' : isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'transparent',
                        transition: 'background 0.15s ease',
                        opacity: isCompleted ? 0.65 : 1
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = isOverdue ? 'rgba(239, 68, 68, 0.04)' : isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'transparent'}
                    >
                      {/* Checkbox / Complete Toggle */}
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item)}
                          title={isCompleted ? "Tandakan belum siap" : "Tandakan selesai"}
                          style={{
                            background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.2)'}`,
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: isCompleted ? '#34d399' : 'transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Check size={13} style={{ strokeWidth: 3 }} />
                        </button>
                      </td>

                      {/* Tugasan & Perincian */}
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <span style={{ 
                            fontSize: '0.92rem', 
                            fontWeight: 700, 
                            color: isCompleted ? '#94a3b8' : '#f8fafc',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}>
                            {item.title}
                          </span>
                          {Number(item.is_recurring) === 1 && (
                            <span style={{ fontSize: '0.68rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Repeat size={10} /> {item.recurrence_cycle ? item.recurrence_cycle.toUpperCase() : 'BERULANG'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            📁 {getCategoryLabel(item.category)}
                          </span>
                          {item.description && (
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px', opacity: 0.8 }} title={item.description}>
                              • {item.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tarikh Matang & Baki */}
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.2rem' }}>
                          {formatDueDate(item.due_date)}
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.5rem',
                          borderRadius: '999px',
                          display: 'inline-block',
                          background: isOverdue ? 'rgba(239, 68, 68, 0.2)' : isUrgent ? 'rgba(245, 158, 11, 0.2)' : isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: isOverdue ? '#f87171' : isUrgent ? '#fbbf24' : isCompleted ? '#34d399' : '#7dd3fc',
                          border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.35)' : isUrgent ? 'rgba(245,158,11,0.35)' : isCompleted ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)'}`
                        }}>
                          {isOverdue && '🚨 '}{isUrgent && '⏳ '}{item.time_badge}
                        </span>
                      </td>

                      {/* Keutamaan */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        {getPriorityBadge(item.priority)}
                      </td>

                      {/* Pegawai / Emel */}
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                          {item.assigned_to || '-'}
                        </div>
                        {item.assigned_email ? (
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                            <Mail size={11} style={{ color: '#38bdf8' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={item.assigned_email}>
                              {item.assigned_email}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tiada emel</span>
                        )}
                      </td>

                      {/* Tindakan */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          {item.assigned_email && (
                            <button
                              type="button"
                              onClick={() => handleSendEmail(item)}
                              disabled={sendingEmailId === item.id}
                              style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8',
                                padding: '0.32rem 0.55rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Hantar Notifikasi Emel Sekarang"
                            >
                              <Send size={12} className={sendingEmailId === item.id ? 'iknow-spin' : ''} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#e2e8f0',
                              padding: '0.32rem 0.55rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Kemaskini Peringatan"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '0.32rem 0.55rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Padam Peringatan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {reminders.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span>
                  Memaparkan <strong style={{ color: '#f1f5f9' }}>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> daripada <strong style={{ color: '#f1f5f9' }}>{totalItems}</strong> tugasan
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.78rem'
                  }}
                >
                  <option value={5}>5 baris</option>
                  <option value={10}>10 baris</option>
                  <option value={20}>20 baris</option>
                  <option value={50}>50 baris</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', opacity: validCurrentPage <= 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={14} /> Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((page, idx, arr) => {
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span style={{ padding: '0 0.25rem', color: 'var(--text-muted)' }}>...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          style={{
                            background: validCurrentPage === page ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'rgba(255, 255, 255, 0.05)',
                            color: validCurrentPage === page ? '#ffffff' : '#cbd5e1',
                            border: `1px solid ${validCurrentPage === page ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '6px',
                            minWidth: '28px',
                            height: '28px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', opacity: validCurrentPage >= totalPages ? 0.4 : 1 }}
                >
                  Seterusnya <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
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
