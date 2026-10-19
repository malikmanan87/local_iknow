import React, { useState, useEffect } from 'react';
import { 
  Server, 
  PlusCircle, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Activity, 
  Copy, 
  Check, 
  Wifi, 
  WifiOff, 
  Clock, 
  MapPin, 
  Info 
} from 'lucide-react';
import axios from 'axios';
import { showSuccess, showError, showConfirm } from '../utils/swal';

export default function ServerManager() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pingingId, setPingingId] = useState(null);
  const [pingingAll, setPingingAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: '',
    service_type: 'Klinikal',
    location: 'Bilik Server Utama',
    description: ''
  });

  const getApiUrl = (endpoint) => {
    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    return `${origin}${path}api/${endpoint}`;
  };

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getApiUrl('servers'));
      if (res.data && res.data.data) {
        setServers(res.data.data);
      }
    } catch (err) {
      console.error('Ralat memuatkan pelayan:', err);
      showError('Gagal memuatkan senarai pelayan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handlePingSingle = async (id, e) => {
    if (e) e.stopPropagation();
    setPingingId(id);
    try {
      const res = await axios.post(getApiUrl(`servers/ping/${id}`));
      if (res.data && res.data.data) {
        setServers(prev => prev.map(s => s.id === id ? res.data.data : s));
        const s = res.data.data;
        if (s.status === 'online') {
          showSuccess(`${s.name} respons positif (${s.latency_ms} ms)!`, 'Sambungan Lancar');
        } else {
          showError(`Tiada sambungan ke ${s.name} (${s.ip_address})!`, 'Pelayan Terputus');
        }
      }
    } catch (err) {
      console.error('Ralat ping pelayan:', err);
      showError('Gagal menguji sambungan ke pelayan.');
    } finally {
      setPingingId(null);
    }
  };

  const handlePingAll = async () => {
    setPingingAll(true);
    try {
      const res = await axios.get(getApiUrl('servers/ping-all'));
      if (res.data && res.data.data) {
        setServers(res.data.data);
        showSuccess(`Ujian sambungan selesai. (${res.data.online_count} Online, ${res.data.offline_count} Offline)`, 'Semakan Lengkap');
      }
    } catch (err) {
      console.error('Ralat ping semua pelayan:', err);
      showError('Gagal menguji sambungan semua pelayan.');
    } finally {
      setPingingAll(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingServer(null);
    setFormData({
      name: '',
      ip_address: '',
      port: '',
      service_type: 'Klinikal / Sistem Hospital',
      location: 'Bilik Server Utama',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (server, e) => {
    if (e) e.stopPropagation();
    setEditingServer(server);
    setFormData({
      name: server.name || '',
      ip_address: server.ip_address || '',
      port: server.port || '',
      service_type: server.service_type || 'General',
      location: server.location || '',
      description: server.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.ip_address.trim()) {
      showError('Sila lengkapkan Nama Pelayan dan Alamat IP.');
      return;
    }

    try {
      if (editingServer) {
        const res = await axios.put(getApiUrl(`servers/${editingServer.id}`), formData);
        showSuccess('Maklumat pelayan berjaya dikemaskini.');
      } else {
        const res = await axios.post(getApiUrl('servers'), formData);
        showSuccess('Pelayan baharu berjaya didaftarkan.');
      }
      setShowModal(false);
      fetchServers();
    } catch (err) {
      console.error('Ralat menyimpan pelayan:', err);
      showError(err.response?.data?.messages?.error || 'Gagal menyimpan pelayan.');
    }
  };

  const handleDelete = async (server, e) => {
    if (e) e.stopPropagation();
    const confirmed = await showConfirm(
      'Padam Pelayan',
      `Adakah anda pasti mahu memadam pemantauan untuk "${server.name}" (${server.ip_address})?`
    );

    if (confirmed) {
      try {
        await axios.delete(getApiUrl(`servers/${server.id}`));
        showSuccess('Pelayan berjaya dipadam.');
        fetchServers();
      } catch (err) {
        console.error('Ralat memadam pelayan:', err);
        showError('Gagal memadam pelayan.');
      }
    }
  };

  const handleCopyIp = (id, ip, port, e) => {
    if (e) e.stopPropagation();
    const full = port ? `${ip}:${port}` : ip;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const onlineCount = servers.filter(s => s.status === 'online').length;
  const offlineCount = servers.filter(s => s.status !== 'online').length;

  return (
    <div style={{ padding: '1.25rem 0' }}>
      {/* Page Header (No glass-panel banner) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.75rem', 
        flexWrap: 'wrap', 
        gap: '1rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              padding: '0.4rem', 
              borderRadius: '10px', 
              background: 'rgba(56, 189, 248, 0.15)', 
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <Server size={22} />
            </span>
            Pengurusan Pelayan & Alamat IP
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
            Daftar, uji sambungan talian (ping/port), dan pantau kesihatan pelayan hospital (RIS, PACS, LIS, HL7, DB EMR).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status summary pills */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem' }}>
            <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              {onlineCount} Online
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: offlineCount > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: offlineCount > 0 ? '#ef4444' : '#64748b' }}></span>
              {offlineCount} Offline
            </span>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handlePingAll}
            disabled={pingingAll}
            style={{ 
              borderColor: 'rgba(56, 189, 248, 0.35)', 
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)'
            }}
            title="Semak talian semua pelayan serentak"
          >
            <RefreshCw size={16} className={pingingAll ? 'spin' : ''} />
            <span>{pingingAll ? 'Sedang Ping...' : 'Ping Semua'}</span>
          </button>

          <button 
            className="btn btn-primary" 
            onClick={handleOpenAdd}
            style={{ 
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <PlusCircle size={17} /> Daftar Pelayan Baharu
          </button>
        </div>
      </div>

      {/* Server List Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.75rem auto' }} />
          <div>Memuatkan status pelayan berdaftar...</div>
        </div>
      ) : servers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Server size={44} style={{ margin: '0 auto 1rem auto', opacity: 0.35 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>Tiada Pelayan Berdaftar</h3>
          <p style={{ fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto 1.25rem auto' }}>
            Daftarkan alamat IP pelayan RIS, PACS, LIS, atau HL7 Mirth hospital anda untuk dipantau secara langsung di Laman Utama.
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <PlusCircle size={16} /> Daftar Pelayan Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {servers.map((s) => {
            const isOnline = s.status === 'online';
            const isPinging = pingingId === s.id;

            return (
              <div 
                key={s.id} 
                className="glass-panel"
                style={{ 
                  padding: '1.4rem', 
                  borderRadius: '16px',
                  borderTop: isOnline ? '4px solid #10b981' : '4px solid #ef4444',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'relative',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* Top row: Status dot + Service badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: isOnline ? '#10b981' : '#ef4444',
                        boxShadow: isOnline ? '0 0 10px #10b981' : '0 0 10px #ef4444',
                        flexShrink: 0
                      }}></span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        color: isOnline ? '#10b981' : '#ef4444',
                        letterSpacing: '0.3px'
                      }}>
                        {isOnline ? 'ONLINE' : 'OFFLINE / TIADA RESPON'}
                      </span>
                    </div>

                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 600, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      {s.service_type || 'Pelayan'}
                    </span>
                  </div>

                  {/* Server Name */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                    {s.name}
                  </h3>

                  {/* IP Address & Port pill */}
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'rgba(15, 23, 42, 0.75)', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>
                      {s.ip_address}{s.port ? `:${s.port}` : ''}
                    </span>
                    <button 
                      onClick={(e) => handleCopyIp(s.id, s.ip_address, s.port, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 0.2rem' }}
                      title="Salin IP"
                    >
                      {copiedId === s.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Location & Description */}
                  {s.location && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      <MapPin size={13} style={{ color: 'var(--accent-amber)' }} />
                      <span>{s.location}</span>
                    </div>
                  )}

                  {s.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: '0.4rem 0 0 0' }}>
                      {s.description}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Metrics & Action Buttons */}
                <div style={{ 
                  paddingTop: '0.85rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Activity size={12} style={{ color: isOnline ? '#10b981' : '#64748b' }} />
                      <span>Kependaman: </span>
                      <strong style={{ color: isOnline ? '#34d399' : 'var(--text-muted)' }}>
                        {isOnline && s.latency_ms ? `${s.latency_ms} ms` : '-'}
                      </strong>
                    </span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      Disemak: {s.last_checked_at ? new Date(s.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Belum disemak'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={(e) => handlePingSingle(s.id, e)}
                      disabled={isPinging}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      title="Uji sambungan sekarang"
                    >
                      <RefreshCw size={13} className={isPinging ? 'spin' : ''} />
                      <span>{isPinging ? 'Menguji...' : 'Ping'}</span>
                    </button>

                    <button 
                      className="btn btn-secondary" 
                      onClick={(e) => handleOpenEdit(s, e)}
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                      title="Kemaskini maklumat"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button 
                      className="btn btn-secondary" 
                      onClick={(e) => handleDelete(s, e)}
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: '#ef4444' }}
                      title="Padam pelayan"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah / Edit Pelayan */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '540px',
            width: '100%',
            padding: '2rem',
            background: 'var(--surface-color, #111827)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={22} color="#38bdf8" />
              {editingServer ? 'Kemaskini Pelayan' : 'Daftar Pelayan Baharu'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nama Pelayan <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Server RIS (Radiology), Server PACS, Server LIS Strateq"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Alamat IP / Hos <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 10.10.20.15 atau localhost"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Port Servis (Opt.)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 80, 104, 3306"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Kategori Servis</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Radiologi, Makmal, DB, HL7"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasi Pelayan</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Bilik Server, Pusat Data"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Keterangan / Catatan Ringkas</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  placeholder="e.g. Menyimpan rekod imej x-ray dan dihubungkan ke bilik doktor..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
                >
                  {editingServer ? 'Simpan Kemaskini' : 'Daftar Pelayan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
