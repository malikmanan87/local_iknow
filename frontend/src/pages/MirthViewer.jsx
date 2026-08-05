import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, Filter, Search, Wifi, WifiOff,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock,
  Minus, Eye, X, Loader
} from 'lucide-react';
import api from '../services/api';

const MSG_TYPES = ['Semua', 'ORM', 'ORR', 'ORU', 'P03'];
const STATUSES  = ['Semua', 'SENT', 'ERROR', 'QUEUED', 'FILTERED'];

const statusStyle = {
  SENT:     { bg: 'rgba(16,185,129,0.15)', color: '#10b981', icon: <CheckCircle size={12}/> },
  ERROR:    { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', icon: <AlertCircle size={12}/> },
  QUEUED:   { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: <Clock size={12}/> },
  FILTERED: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', icon: <Minus size={12}/> },
};

const msgTypeBadge = {
  ORM: { bg: 'rgba(6,182,212,0.15)',   color: '#06b6d4' },
  ORR: { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  ORU: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  P03: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
};

function Hl7Inspector({ raw, onClose }) {
  if (!raw) return null;
  const segments = raw.split('\r').filter(Boolean);
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🔬 HL7 Message Inspector (Raw)</h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem' }}><X size={16}/></button>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#0a0f1a', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)' }}>
          {segments.map((seg, i) => {
            const segName = seg.substring(0, 3);
            const segColors = {
              MSH: '#06b6d4', PID: '#10b981', ORC: '#818cf8',
              OBR: '#f59e0b', OBX: '#34d399', DFT: '#f59e0b',
              FT1: '#fb923c', EVN: '#a78bfa', NTE: '#94a3b8',
            };
            const color = segColors[segName] || '#94a3b8';
            const fields = seg.split('|');
            return (
              <div key={i} style={{ marginBottom: '0.4rem', lineHeight: '1.5' }}>
                <span style={{ color, fontWeight: 700, marginRight: '0.3rem' }}>{fields[0]}|</span>
                <span style={{ color: '#cbd5e1' }}>{fields.slice(1).join('|')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MirthViewer() {
  const [connStatus, setConnStatus]   = useState(null);
  const [channels, setChannels]       = useState([]);
  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [chanLoading, setChanLoading] = useState(false);
  const [error, setError]             = useState('');

  const [selectedChannel, setSelectedChannel] = useState('');
  const [typeFilter, setTypeFilter]   = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [mrnFilter, setMrnFilter]     = useState('');
  const [inspectMsg, setInspectMsg]   = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/mirth/status');
      setConnStatus(res.data);
    } catch {
      setConnStatus({ connected: false, error: 'Tidak dapat hubungi backend' });
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    setChanLoading(true);
    setError('');
    try {
      const res = await api.get('/mirth/channels');
      setChannels(res.data.channels || []);
      if (res.data.channels?.length > 0 && !selectedChannel) {
        setSelectedChannel(res.data.channels[0].id);
      }
    } catch (e) {
      setError('Gagal memuatkan senarai channel Mirth. Semak credentials dalam .env');
    } finally {
      setChanLoading(false);
    }
  }, [selectedChannel]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChannel) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        channel_id: selectedChannel,
        limit: 100,
        offset: 0,
        ...(typeFilter !== 'Semua'   && { type: typeFilter }),
        ...(statusFilter !== 'Semua' && { status: statusFilter }),
        ...(mrnFilter                && { mrn: mrnFilter }),
      };
      const res = await api.get('/mirth/messages', { params });
      setMessages(res.data.messages || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuatkan mesej Mirth');
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, typeFilter, statusFilter, mrnFilter]);

  useEffect(() => { fetchStatus(); }, []);
  useEffect(() => {
    if (connStatus?.authenticated) fetchChannels();
  }, [connStatus]);
  useEffect(() => {
    if (selectedChannel) fetchMessages();
  }, [selectedChannel, typeFilter, statusFilter]);

  const formatDate = (ts) => {
    if (!ts) return '-';
    try { return new Date(parseInt(ts)).toLocaleString('ms-MY'); } catch { return ts; }
  };

  const getMsgBaseType = (type) => {
    const base = (type || '').split('^')[0].toUpperCase();
    if (base === 'DFT') return 'P03';
    return base;
  };

  return (
    <div style={{ paddingTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} color="var(--accent-cyan)" /> Mirth Connect — HL7 Viewer
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Pemantauan mesej HL7 (ORM / ORR / ORU / P03) — <strong>Read-Only</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => { fetchStatus(); fetchChannels(); }}>
            <RefreshCw size={14}/> Muat Semula
          </button>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: connStatus?.connected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${connStatus?.connected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {connStatus?.connected
            ? <Wifi size={18} color="#10b981"/>
            : <WifiOff size={18} color="#ef4444"/>}
          <div>
            <span style={{ fontWeight: 700, color: connStatus?.connected ? '#10b981' : '#ef4444', fontSize: '0.9rem' }}>
              {connStatus?.connected ? `Mirth Connect ${connStatus.version} — Berjaya Disambungkan` : 'Tidak Dapat Disambungkan'}
            </span>
            <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {connStatus?.host}
            </span>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: connStatus?.authenticated ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
          {connStatus?.authenticated ? '🔐 Terlog Masuk' : connStatus?.connected ? '⚠️ Belum Terlog Masuk' : ''}
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', color: '#ef4444', fontSize: '0.85rem' }}>
          <AlertCircle size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }}/>{error}
        </div>
      )}

      {/* Channel + Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 160px', gap: '0.75rem', alignItems: 'end' }}>
          {/* Channel Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Channel Mirth</label>
            <select className="form-select" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
              {chanLoading && <option>Memuatkan...</option>}
              {channels.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.state}) — ✅{c.sent} ❌{c.error}
                </option>
              ))}
              {!chanLoading && channels.length === 0 && <option value="">Tiada channel</option>}
            </select>
          </div>

          {/* Message Type */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Jenis Mesej</label>
            <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {MSG_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* MRN Search */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Cari No. MRN</label>
            <input
              type="text"
              className="form-input"
              placeholder="Cth: MRN123456"
              value={mrnFilter}
              onChange={e => setMrnFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchMessages()}
            />
          </div>

          <button className="btn btn-primary" onClick={fetchMessages} disabled={loading || !selectedChannel} style={{ height: '38px', justifyContent: 'center' }}>
            {loading ? <Loader size={14} className="spin"/> : <><Search size={14}/> Cari</>}
          </button>
        </div>
      </div>

      {/* Channel Summary Cards */}
      {channels.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {channels.slice(0, 6).map(c => (
            <div key={c.id} className="glass-panel" onClick={() => setSelectedChannel(c.id)}
              style={{ padding: '0.85rem 1rem', cursor: 'pointer', border: selectedChannel === c.id ? '1px solid var(--primary)' : '1px solid var(--border-color)', transition: 'border 0.2s' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#10b981' }}>✅ {c.sent}</span>
                <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>❌ {c.error}</span>
                <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>🕐 {c.queued}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Log Mesej HL7 {messages.length > 0 && <span style={{ color: 'var(--accent-cyan)', fontWeight: 400 }}>({messages.length} mesej)</span>}
          </h3>
          {loading && <Loader size={16} color="var(--accent-cyan)" className="spin"/>}
        </div>

        {messages.length === 0 && !loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {selectedChannel ? 'Tiada mesej dijumpai dengan tapisan semasa.' : 'Sila pilih channel Mirth untuk melihat log mesej.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Tarikh & Masa', 'Jenis Mesej', 'Status', 'No. MRN', 'Order ID', 'Tindakan'].map(h => (
                    <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, i) => {
                  const baseType = getMsgBaseType(msg.msg_type);
                  const typeStyle = msgTypeBadge[baseType] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
                  const st = statusStyle[msg.status?.toUpperCase()] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', icon: null };
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(msg.date_time)}</td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ background: typeStyle.bg, color: typeStyle.color, padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                          {msg.msg_type || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ background: st.bg, color: st.color, padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {st.icon}{msg.status || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#cbd5e1' }}>{msg.mrn || '-'}</td>
                      <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{msg.order_id || '-'}</td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        {msg.raw_hl7 && (
                          <button className="btn btn-secondary" onClick={() => setInspectMsg(msg.raw_hl7)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
                            <Eye size={12}/> HL7
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HL7 Inspector Modal */}
      {inspectMsg && <Hl7Inspector raw={inspectMsg} onClose={() => setInspectMsg(null)}/>}
    </div>
  );
}
