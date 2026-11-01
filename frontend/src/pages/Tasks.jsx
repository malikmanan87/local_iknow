import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Edit3, 
  Trash2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ListTodo, 
  Layers, 
  CircleDot,
  Bell,
  Send
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '../utils/swal';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingNotiId, setSendingNotiId] = useState(null);

  // Form State (Hanya 4 medan: tajuk tugas, priority, tarikh sasaran, status tugas)
  const [formData, setFormData] = useState({
    title: '',
    priority: 'normal',
    due_date: '',
    status: 'pending',
    notify_email: true
  });

  const getApiUrl = (endpoint) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanPath = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return `${origin}${cleanPath}api/${endpoint}`;
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const res = await axios.get(`${getApiUrl('tasks')}?${params.toString()}`);
      if (res.data?.status === 'success') {
        setTasks(res.data.data || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Ralat memuatkan tugasan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTasks();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAddModal = () => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 3);
    const dateStr = defaultDueDate.toISOString().slice(0, 16);

    setFormData({
      title: '',
      priority: 'normal',
      due_date: dateStr,
      status: 'pending',
      notify_email: true
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (task) => {
    let formattedDue = '';
    if (task.due_date) {
      const d = new Date(task.due_date.replace(' ', 'T'));
      if (!isNaN(d.getTime())) {
        formattedDue = d.toISOString().slice(0, 16);
      }
    }

    setFormData({
      title: task.title || '',
      priority: task.priority === 'urgent' ? 'urgent' : 'normal',
      due_date: formattedDue,
      status: task.status || 'pending',
      notify_email: false
    });
    setEditingId(task.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showError('Sila masukkan tajuk tugasan.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await axios.put(getApiUrl(`tasks/${editingId}`), formData);
        if (formData.notify_email) {
          showSuccess('Tugasan berjaya dikemaskini dan notifikasi telah dihantar ke malikmanan@unisza.edu.my');
        } else {
          showSuccess('Tugasan berjaya dikemaskini.');
        }
      } else {
        const res = await axios.post(getApiUrl('tasks'), formData);
        if (formData.notify_email) {
          showSuccess('Tugasan berjaya ditambah dan notifikasi telah dihantar ke malikmanan@unisza.edu.my');
        } else {
          showSuccess('Tugasan berjaya ditambah.');
        }
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Ralat simpan tugasan:', err);
      showError('Gagal menyimpan maklumat tugasan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await axios.post(getApiUrl(`tasks/${task.id}/toggle-status`), { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Ralat kemaskini status:', err);
      showError('Gagal menukar status tugasan.');
    }
  };

  const handleSendNotification = async (task) => {
    try {
      setSendingNotiId(task.id);
      const res = await axios.post(getApiUrl(`tasks/${task.id}/send-notification`));
      if (res.data?.status === 'success') {
        showSuccess(`Notifikasi bagi "${task.title}" telah dihantar ke malikmanan@unisza.edu.my`);
        fetchTasks();
      } else {
        showError(res.data?.message || 'Gagal menghantar notifikasi emel.');
      }
    } catch (err) {
      console.error('Ralat notifikasi emel:', err);
      showError(err.response?.data?.message || 'Gagal menghantar notifikasi emel ke malikmanan@unisza.edu.my.');
    } finally {
      setSendingNotiId(null);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = await showConfirm(
      `Adakah anda pasti ingin memadam tugasan "${title}"?`,
      'Padam Tugasan',
      'Ya, Padam',
      'Batal'
    );
    if (!confirmed) return;

    try {
      await axios.delete(getApiUrl(`tasks/${id}`));
      showSuccess('Tugasan berjaya dipadam.');
      fetchTasks();
    } catch (err) {
      console.error('Ralat padam tugasan:', err);
      showError('Gagal memadam tugasan.');
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Tiada tarikh';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'urgent':
        return { label: 'Urgent', bg: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '#ef4444' };
      case 'normal':
      default:
        return { label: 'Normal', bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '#f59e0b' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Selesai', bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '#10b981' };
      case 'in_progress':
        return { label: 'Sedang Berjalan', bg: 'rgba(6, 182, 212, 0.18)', color: '#22d3ee', border: '#06b6d4' };
      case 'cancelled':
        return { label: 'Dibatalkan', bg: 'rgba(100, 116, 139, 0.18)', color: '#94a3b8', border: '#64748b' };
      case 'pending':
      default:
        return { label: 'Belum Selesai', bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '#f59e0b' };
    }
  };

  // Pagination calculation
  const totalItems = tasks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentTasks = tasks.slice(startIndex, endIndex);

  return (
    <div>
      {/* 5 KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
        marginTop: '0.5rem'
      }}>
        {/* Total */}
        <div className="glass-panel" style={{ padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Jumlah Tugasan</span>
            <Layers size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.3rem' }}>
            {summary.total}
          </div>
        </div>

        {/* Pending */}
        <div className="glass-panel" style={{ padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.25)', background: 'rgba(245, 158, 11, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>Belum Selesai</span>
            <Clock size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.3rem' }}>
            {summary.pending}
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-panel" style={{ padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.25)', background: 'rgba(6, 182, 212, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#22d3ee', fontWeight: 600, textTransform: 'uppercase' }}>Sedang Berjalan</span>
            <CircleDot size={16} color="#22d3ee" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#22d3ee', marginTop: '0.3rem' }}>
            {summary.in_progress}
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel" style={{ padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(16, 185, 129, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>Selesai</span>
            <CheckCircle2 size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.3rem' }}>
            {summary.completed}
          </div>
        </div>

        {/* Overdue */}
        <div className="glass-panel" style={{ padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>Melepasi Sasaran</span>
            <AlertTriangle size={16} color="#f87171" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', marginTop: '0.3rem' }}>
            {summary.overdue}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Termasuk butang + Tambah Tugasan) */}
      <div className="glass-panel" style={{
        padding: '0.85rem 1rem',
        borderRadius: '14px',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Cari tajuk tugasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        {/* Status, Priority Filters & Add Task Button */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Belum Selesai</option>
            <option value="in_progress">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Priority Filter */}
          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
          >
            <option value="all">Semua Prioriti</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>

          {/* Butang Tambah Tugasan */}
          <button
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              border: 'none',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '9px',
              boxShadow: '0 3px 12px rgba(6, 182, 212, 0.35)',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Tambah Tugasan
          </button>
        </div>
      </div>

      {/* Task List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>⏳</div>
          <div>Memuatkan senarai tugasan...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1.5rem', borderRadius: '16px' }}>
          <ListTodo size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Tiada Tugasan Dijumpai</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Tiada tugasan menepati kriteria carian anda.'
              : 'Belum ada tugasan didaftarkan.'}
          </p>
          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
            <Plus size={16} /> Tambah Tugasan Sekarang
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '45px' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Tajuk Tugasan</th>
                  <th style={{ padding: '0.85rem 1rem', width: '130px' }}>Prioriti</th>
                  <th style={{ padding: '0.85rem 1rem', width: '180px' }}>Tarikh Sasaran</th>
                  <th style={{ padding: '0.85rem 1rem', width: '140px', textAlign: 'right' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {currentTasks.map((t) => {
                  const prioBadge = getPriorityBadge(t.priority);
                  const isDone = t.status === 'completed';
                  const isSendingNoti = sendingNotiId === t.id;

                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isDone ? 'rgba(16, 185, 129, 0.02)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Status Checkbox / Quick Toggle */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: isDone ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.25)',
                            background: isDone ? '#10b981' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'all 0.2s'
                          }}
                          title={isDone ? 'Tandakan belum selesai' : 'Tandakan selesai'}
                        >
                          {isDone && <Check size={16} strokeWidth={3} />}
                        </button>
                      </td>

                      {/* Tajuk Tugasan */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: isDone ? 'var(--text-muted)' : '#f8fafc',
                          textDecoration: isDone ? 'line-through' : 'none'
                        }}>
                          {t.title}
                        </div>
                      </td>

                      {/* Prioriti */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: prioBadge.bg,
                          color: prioBadge.color,
                          border: `1px solid ${prioBadge.border}`
                        }}>
                          {prioBadge.label}
                        </span>
                      </td>

                      {/* Tarikh Sasaran */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: t.is_overdue ? '#f87171' : 'var(--text-muted)' }}>
                          <Calendar size={13} color={t.is_overdue ? '#f87171' : '#94a3b8'} />
                          <span>{formatDateDisplay(t.due_date)}</span>
                        </div>
                        {t.is_overdue && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '0.2rem',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#f87171',
                            background: 'rgba(239, 68, 68, 0.15)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px'
                          }}>
                            OVERDUE
                          </span>
                        )}
                      </td>

                      {/* Tindakan (Bell Noti, Edit, Delete) */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {/* Bell Notification Button to malikmanan@unisza.edu.my */}
                          <button
                            onClick={() => handleSendNotification(t)}
                            disabled={isSendingNoti}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '6px',
                              color: '#fbbf24',
                              borderColor: 'rgba(245, 158, 11, 0.3)',
                              background: 'rgba(245, 158, 11, 0.08)'
                            }}
                            title="Hantar notifikasi emel ke malikmanan@unisza.edu.my"
                          >
                            <Bell size={14} className={isSendingNoti ? 'spin' : ''} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', borderRadius: '6px' }}
                            title="Kemaskini tugasan"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(t.id, t.title)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', color: '#f87171' }}
                            title="Padam tugasan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              Menunjukkan {totalItems === 0 ? 0 : startIndex + 1} hingga {endIndex} daripada {totalItems} rekod
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
              >
                <ChevronLeft size={14} /> Sebelum
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 600, color: '#f8fafc' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
              >
                Seterusnya <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Kemaskini Tugasan */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            background: '#0d1527',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="#06b6d4" />
                {editingId ? 'Kemaskini Tugasan' : 'Tambah Tugasan Baharu'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 1. Tajuk Tugasan */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Tajuk Tugas *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan tajuk tugasan..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* 2. Priority & 3. Status Tugas Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Status Tugas</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Belum Selesai</option>
                    <option value="in_progress">Sedang Berjalan</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* 4. Tarikh Sasaran */}
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Tarikh Sasaran</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              {/* Notifikasi Emel Checkbox (malikmanan@unisza.edu.my) */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <input
                  type="checkbox"
                  id="notify_email"
                  checked={formData.notify_email}
                  onChange={(e) => setFormData({ ...formData, notify_email: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#06b6d4', cursor: 'pointer' }}
                />
                <label htmlFor="notify_email" style={{ fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer', margin: 0, lineHeight: 1.3 }}>
                  <Bell size={13} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px', color: '#fbbf24' }} />
                  Hantar notifikasi ke <strong>malikmanan@unisza.edu.my</strong>
                </label>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
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
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Kemaskini' : 'Tambah Tugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
