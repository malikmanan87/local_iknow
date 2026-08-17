import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, RefreshCw, Search, Wifi, WifiOff,
  AlertCircle, CheckCircle, Clock, Minus, Eye, X,
  Loader, Layers, Folder, FileText, Printer, RotateCcw,
  Hash, User, Calendar, ShieldCheck, ShieldAlert
} from 'lucide-react';
import api from '../services/api';

const MSG_TYPES  = ['Semua', 'ORM', 'ORR', 'ORU', 'P03'];
const STATUSES   = ['Semua', 'SENT', 'ERROR', 'QUEUED', 'FILTERED'];
const PAGE_SIZE  = 10;

const statusStyle = {
  SENT:     { bg: 'rgba(16,185,129,0.15)', color: '#10b981', icon: <CheckCircle size={12}/> },
  ERROR:    { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', icon: <AlertCircle size={12}/> },
  QUEUED:   { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: <Clock size={12}/> },
  FILTERED: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', icon: <Minus size={12}/> },
};

const msgTypeBadge = {
  ORM: { bg: 'rgba(6,182,212,0.15)',  color: '#06b6d4' },
  ORR: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  ORU: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  P03: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
};

// ─── HL7 Parser Helper ──────────────────────────────────────────────────────
function parseHl7(raw) {
  if (!raw) return null;
  const lines = raw.split('\r').filter(Boolean);
  const data = {
    msh: {}, pid: {}, pv1: {}, orc: {}, obr: {}, obxList: [], pdfBase64: null,
  };
  lines.forEach(line => {
    const f = line.split('|');
    const seg = f[0];
    if (seg === 'MSH') {
      data.msh = { sendingApp: f[2], facility: f[3], dateTime: f[6], msgType: f[8] };
    } else if (seg === 'PID') {
      data.pid = {
        mrn: f[3] || f[2],
        ic: f[4],
        name: (f[5] || '').replace(/\^/g, ' ').trim(),
        dob: f[7],
        gender: f[8] === 'F' ? 'Perempuan (Female)' : f[8] === 'M' ? 'Lelaki (Male)' : f[8],
      };
    } else if (seg === 'PV1') {
      data.pv1 = { visitNo: f[19] };
    } else if (seg === 'ORC') {
      data.orc = { orderNo: f[2], doctor: (f[12] || '').replace(/\^/g, ' ').trim() };
    } else if (seg === 'OBR') {
      data.obr = {
        orderId: f[2],
        testName: (f[4] || '').split('^')[1] || (f[4] || '').split('^')[0] || f[4],
        testCode: (f[4] || '').split('^')[0],
        date: f[7],
        pdfFile: f[22],
      };
    } else if (seg === 'OBX') {
      if (f[2] === 'ED' && (f[4] === 'Base64' || (f[5] && f[5].length > 100))) {
        data.pdfBase64 = f[5];
      }
      data.obxList.push({
        id: f[1],
        type: f[2],
        param: (f[3] || '').split('^')[1] || (f[3] || '').split('^')[0] || f[3],
        paramCode: (f[3] || '').split('^')[0],
        value: f[5],
        unit: f[6],
        refRange: f[7],
        flag: f[8],
        status: f[11],
        obsDate: f[14],
        doctor: (f[16] || '').replace(/\^/g, ' ').trim(),
      });
    }
  });
  return data;
}

function formatHl7Date(d) {
  if (!d || d.length < 8) return d || '-';
  const y = d.substring(0, 4);
  const m = d.substring(4, 6);
  const day = d.substring(6, 8);
  const hh = d.length >= 10 ? d.substring(8, 10) : '';
  const mm = d.length >= 12 ? d.substring(10, 12) : '';
  const ss = d.length >= 14 ? d.substring(12, 14) : '';
  return `${day}/${m}/${y} ${hh}:${mm}${ss ? ':' + ss : ''}`.trim();
}

// ─── Human Readable Medical Report Modal (PDF Print View) ───────────────────
function Hl7ReportModal({ raw, onClose }) {
  if (!raw) return null;
  const hl7 = useMemo(() => parseHl7(raw), [raw]);
  if (!hl7) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1150 }}>
      <div className="modal-content printable-report" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '840px', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', color: '#f8fafc' }}>

        {/* Top Header Bar (Hidden during print) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18}/> Laporan Kesihatan & Keputusan Makmal (Human-Readable)
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handlePrint} style={{ fontSize: '0.8rem' }}>
              <Printer size={14}/> Cetak / Simpan PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem' }}><X size={16}/></button>
          </div>
        </div>

        {/* Formatted Medical Report Content Paper */}
        <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '12px', padding: '2rem', fontFamily: 'Arial, sans-serif', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>

          {/* Hospital / Facility Header */}
          <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0369a1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                HOSPITAL OPERATIONAL SYSTEM — IKNOW
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem', fontWeight: 600 }}>
                INTEGRATED HEALTHCARE HL7 RESULT REPORT ({hl7.msh.sendingApp || 'HL7 Engine'})
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
              <div><strong>Tarikh Diterima:</strong> {formatHl7Date(hl7.msh.dateTime)}</div>
              <div><strong>Jenis Mesej:</strong> {hl7.msh.msgType || 'ORU^R01'}</div>
            </div>
          </div>

          {/* Patient Details Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.9rem 1.1rem', marginBottom: '1.1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem', letterSpacing: '0.5px' }}>
              👤 MAKLUMAT PESAKIT (PATIENT DETAILS)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.83rem' }}>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>Nama Pesakit:</span><br/><strong>{hl7.pid.name || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>No. MRN:</span><br/><strong style={{ fontFamily: 'monospace', color: '#0369a1', fontSize: '0.9rem' }}>{hl7.pid.mrn || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>No. Kad Pengenalan / IC:</span><br/><strong style={{ fontFamily: 'monospace' }}>{hl7.pid.ic || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>Jantina:</span><br/><strong>{hl7.pid.gender || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>Tarikh Lahir:</span><br/><strong>{formatHl7Date(hl7.pid.dob) || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>No. Episode / Visit:</span><br/><strong>{hl7.pv1.visitNo || '-'}</strong></div>
            </div>
          </div>

          {/* Order Details Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.9rem 1.1rem', marginBottom: '1.1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem', letterSpacing: '0.5px' }}>
              📋 MAKLUMAT UJIAN & PESANAN (TEST ORDER DETAILS)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.83rem' }}>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>Nama Ujian:</span><br/><strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{hl7.obr.testName || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>No. Order / Accession:</span><br/><strong style={{ fontFamily: 'monospace' }}>{hl7.obr.orderId || hl7.orc.orderNo || '-'}</strong></div>
              <div><span style={{ color: '#64748b', fontSize: '0.73rem' }}>Doktor Pemohon:</span><br/><strong>{hl7.orc.doctor || hl7.obxList[0]?.doctor || '-'}</strong></div>
            </div>
          </div>

          {/* Embedded Base64 PDF (If Present) */}
          {hl7.pdfBase64 && (
            <div style={{ marginBottom: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#e2e8f0', padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                📎 DOKUMEN PDF LAMPIRAN (EMBEDDED PDF ATTACHMENT)
              </div>
              <iframe
                src={`data:application/pdf;base64,${hl7.pdfBase64}`}
                style={{ width: '100%', height: '480px', border: 'none' }}
                title="Embedded PDF Document"
              />
            </div>
          )}

          {/* Test Results Table (OBX) */}
          {hl7.obxList.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.5px' }}>
                📊 KEPUTUSAN PARAMETER MAKMAL (LABORATORY PARAMETER RESULTS)
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: '#0f172a' }}>
                <thead>
                  <tr style={{ background: '#0284c7', color: '#ffffff' }}>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Parameter Ujian</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>Keputusan</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>Julat Rujukan Normal</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Status / Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {hl7.obxList.map((obx, idx) => {
                    const isHigh = obx.flag === 'H';
                    const isLow  = obx.flag === 'L';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{obx.param || '-'}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: (isHigh || isLow) ? 800 : 600, color: isHigh ? '#dc2626' : isLow ? '#d97706' : '#0f172a' }}>
                          {obx.value || '-'}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{obx.unit || '-'}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{obx.refRange || '-'}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                          {isHigh ? (
                            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.72rem' }}>🔴 HIGH</span>
                          ) : isLow ? (
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.72rem' }}>🟠 LOW</span>
                          ) : (
                            <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.72rem' }}>🟢 Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Signoff */}
          <div style={{ marginTop: '1.75rem', paddingTop: '0.85rem', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: '#64748b' }}>
            <div>Dokumen ini dijana secara automatik daripada Mirth Connect Integration Engine.</div>
            <div>Halaman 1 daripada 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HL7 Inspector Modal ────────────────────────────────────────────────────
function Hl7Inspector({ raw, onClose, onViewReport }) {
  if (!raw) return null;
  const segments = raw.split('\r').filter(Boolean);
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🔬 HL7 Message Inspector (Raw)</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => { onClose(); onViewReport(raw); }} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
              <FileText size={13}/> Papar Laporan PDF (Readable)
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem' }}><X size={16}/></button>
          </div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#0a0f1a', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)' }}>
          {segments.map((seg, i) => {
            const segName = seg.substring(0, 3);
            const segColors = {
              MSH: '#06b6d4', PID: '#10b981', ORC: '#818cf8',
              OBR: '#f59e0b', OBX: '#34d399', DFT: '#f59e0b',
              FT1: '#fb923c', EVN: '#a78bfa', NTE: '#94a3b8',
            };
            const color  = segColors[segName] || '#94a3b8';
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

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function MirthViewer() {
  const [connStatus, setConnStatus]   = useState(null);
  const [groups, setGroups]           = useState([]);
  const [channels, setChannels]       = useState([]);
  const [channelsTotal, setChannelsTotal] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);

  // Search Filters
  const [selectedGroup, setSelectedGroup] = useState('Semua');
  const [mrnInput, setMrnInput]           = useState('');
  const [orderIdInput, setOrderIdInput]   = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [typeFilter, setTypeFilter]       = useState('Semua');
  const [statusFilter, setStatusFilter]   = useState('Semua');

  // Search execution state
  const [isSearched, setIsSearched]       = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState('');

  // Pagination
  const [currentPage, setCurrentPage]   = useState(1);
  const pageSize = PAGE_SIZE; // Fixed 10 max per page
  const [inspectMsg, setInspectMsg]       = useState(null);
  const [reportMsg, setReportMsg]         = useState(null);
  const [fetchingHl7Id, setFetchingHl7Id] = useState(null);

  // 1. Fetch Mirth Connection Status & Groups Metadata (Lightweight & Cached)
  const fetchStatusAndGroups = useCallback(async (isRefresh = false) => {
    setStatusLoading(true);
    try {
      const [statusRes, chanRes] = await Promise.allSettled([
        api.get('/mirth/status'),
        api.get('/mirth/channels', { params: isRefresh ? { refresh: '1' } : {} }),
      ]);

      if (statusRes.status === 'fulfilled') {
        setConnStatus(statusRes.value.data);
      } else {
        setConnStatus({ connected: false, authenticated: false, error: 'Gagal hubungi backend' });
      }

      if (chanRes.status === 'fulfilled') {
        setGroups(chanRes.value.data.groups || []);
        setChannelsTotal(chanRes.value.data.total || 0);
      }
    } catch {
      setConnStatus({ connected: false, authenticated: false, error: 'Ralat sambungan' });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Initial load: Only status & group chips metadata — ZERO message queries!
  useEffect(() => {
    fetchStatusAndGroups();
  }, [fetchStatusAndGroups]);

  // Date Presets
  const setPresetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const setPresetDaysAgo = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  // 2. Search HL7 Messages on Demand (Triggered ONLY when user clicks "Cari" or Enter)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    const cleanMrn     = mrnInput.trim();
    const cleanOrderId = orderIdInput.trim();
    const cleanStart   = startDate.trim();
    const cleanEnd     = endDate.trim();

    if (!cleanMrn && !cleanOrderId && !cleanStart) {
      setSearchError('Sila masukkan No. MRN, No. Order ID, atau pilih Tarikh sebelum membuat carian.');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setIsSearched(true);
    setSearchResults([]);
    setCurrentPage(1); // Reset to page 1 on new search

    try {
      const params = {
        group:        selectedGroup,
        ...(cleanMrn     && { mrn: cleanMrn }),
        ...(cleanOrderId && { order_id: cleanOrderId }),
        ...(cleanStart   && { start_date: cleanStart }),
        ...(cleanEnd     && { end_date: cleanEnd }),
        ...(typeFilter !== 'Semua'   && { type: typeFilter }),
        ...(statusFilter !== 'Semua' && { status: statusFilter }),
      };

      const res = await api.get('/mirth/search', { params });
      setSearchResults(res.data.messages || []);
      if ((res.data.messages || []).length === 0) {
        setSearchError('Tiada mesej HL7 dijumpai bagi kriteria dan selang tarikh carian ini.');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.messages?.error 
        || (typeof err.response?.data?.messages === 'string' ? err.response?.data?.messages : null)
        || err.response?.data?.message
        || (err.message ? `Ralat: ${err.message}` : null)
        || 'Ralat semasa membuat carian mesej HL7.';
      setSearchError(serverMsg);
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset filter form
  const handleReset = () => {
    setMrnInput('');
    setOrderIdInput('');
    setStartDate('');
    setEndDate('');
    setSelectedGroup('Semua');
    setTypeFilter('Semua');
    setStatusFilter('Semua');
    setIsSearched(false);
    setSearchResults([]);
    setSearchError('');
    setCurrentPage(1);
  };

  // 3. On-demand HL7 Fetch for Inspector / Printable Report
  const handleViewMessage = async (msg, targetModal = 'report') => {
    if (!msg.message_id || !msg.channel_id) return;
    setFetchingHl7Id(msg.message_id);
    try {
      const res = await api.get(`/mirth/message/${msg.message_id}`, {
        params: { channel_id: msg.channel_id },
      });
      const raw = res.data?.raw_hl7;
      if (!raw) {
        alert('Kandungan HL7 tidak ditemui untuk mesej ini.');
        return;
      }
      if (targetModal === 'report') {
        setReportMsg(raw);
      } else {
        setInspectMsg(raw);
      }
    } catch {
      alert('Gagal memuatkan perincian mesej HL7 daripada Mirth.');
    } finally {
      setFetchingHl7Id(null);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    try {
      return new Date(parseInt(ts)).toLocaleString('ms-MY', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const getMsgBaseType = (type) => {
    const base = (type || '').split('^')[0].toUpperCase();
    return base === 'DFT' ? 'P03' : base;
  };

  return (
    <div style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>

      {/* ── Header & Mirth Status Bar ──────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        background: 'rgba(255,255,255,0.02)',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <Activity size={22} color="var(--accent-cyan)" /> Mirth Connect — Carian Mesej HL7
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
            Carian pantas berpusat merentas kumpulan channel Mirth — <strong>Hanya Baca (Read-Only)</strong>
          </p>
        </div>

        {/* Live Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {statusLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Loader size={14} className="spin" /> Menyemak status...
            </div>
          ) : connStatus?.authenticated ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981', padding: '0.4rem 0.85rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600
            }}>
              <ShieldCheck size={16} />
              <span>Tersambung & Log Masuk</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.8, borderLeft: '1px solid rgba(16,185,129,0.3)', paddingLeft: '0.5rem' }}>
                v{connStatus.version || '4.x'} ({channelsTotal} Channels)
              </span>
            </div>
          ) : connStatus?.connected ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#f59e0b', padding: '0.4rem 0.85rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600
            }}>
              <ShieldAlert size={16} />
              <span>Pelayan Aktif (Gagal Auth)</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', padding: '0.4rem 0.85rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600
            }}>
              <WifiOff size={16} />
              <span>Mirth Tidak Tersambung</span>
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => fetchStatusAndGroups(true)}
            title="Muat semula status sambungan"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <RefreshCw size={14} className={statusLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Search Control Panel ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-color, #1e293b)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
      }}>
        <form onSubmit={handleSearch}>

          {/* 1. Input Fields Row (MRN, Order ID, Date Range) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* MRN */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
                <User size={13} style={{ display: 'inline', marginRight: '4px' }} /> No. MRN Pesakit
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 123456 atau MRN..."
                  value={mrnInput}
                  onChange={e => setMrnInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
                {mrnInput && (
                  <button type="button" onClick={() => setMrnInput('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Order ID */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
                <Hash size={13} style={{ display: 'inline', marginRight: '4px' }} /> No. Order / Accession ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 789012 atau ORD..."
                  value={orderIdInput}
                  onChange={e => setOrderIdInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
                {orderIdInput && (
                  <button type="button" onClick={() => setOrderIdInput('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} /> Tarikh Mula
              </label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.84rem',
                  colorScheme: 'dark'
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} /> Tarikh Akhir
              </label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.84rem',
                  colorScheme: 'dark'
                }}
              />
            </div>
          </div>

          {/* Quick Date Presets Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pilihan Selang Tarikh:</span>
            <button
              type="button"
              onClick={setPresetToday}
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                border: '1px solid rgba(56,189,248,0.3)',
                background: 'rgba(56,189,248,0.1)',
                color: '#38bdf8'
              }}
            >
              📅 Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPresetDaysAgo(7)}
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                border: '1px solid rgba(56,189,248,0.3)',
                background: 'rgba(56,189,248,0.1)',
                color: '#38bdf8'
              }}
            >
              📅 7 Hari Lepas
            </button>
            <button
              type="button"
              onClick={() => setPresetDaysAgo(30)}
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                border: '1px solid rgba(56,189,248,0.3)',
                background: 'rgba(56,189,248,0.1)',
                color: '#38bdf8'
              }}
            >
              📅 30 Hari Lepas
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDates}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444'
                }}
              >
                ✕ Kosongkan Tarikh
              </button>
            )}
          </div>

          {/* 2. Channel Group Selection as Buttons/Chips */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}>
              <Folder size={13} style={{ display: 'inline', marginRight: '4px' }} /> Pilih Kumpulan Channel Mirth:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedGroup('Semua')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: selectedGroup === 'Semua' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  border: selectedGroup === 'Semua' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: selectedGroup === 'Semua' ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.03)',
                  color: selectedGroup === 'Semua' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}
              >
                🌐 Semua Kumpulan
              </button>

              {groups.map(g => {
                const isSelected = selectedGroup === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGroup(g)}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      border: isSelected ? '1px solid var(--primary, #6366f1)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#a5b4fc' : 'var(--text-muted)'
                    }}
                  >
                    📁 {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Secondary Filters (Type & Status) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '1.25rem'
          }}>
            {/* Message Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Jenis Mesej:</span>
              {MSG_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: typeFilter === t ? 'var(--accent-cyan)' : 'transparent',
                    background: typeFilter === t ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                    color: typeFilter === t ? 'var(--accent-cyan)' : 'var(--text-muted)'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: statusFilter === s ? '#10b981' : 'transparent',
                    background: statusFilter === s ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                    color: statusFilter === s ? '#10b981' : 'var(--text-muted)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={searchLoading}
              style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            >
              <RotateCcw size={14} /> Set Semula
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={searchLoading}
              style={{
                fontSize: '0.88rem',
                padding: '0.55rem 1.4rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
              }}
            >
              {searchLoading ? (
                <>
                  <Loader size={16} className="spin" /> Sedang Mencari...
                </>
              ) : (
                <>
                  <Search size={16} /> Cari Mesej HL7
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Search Error Banner ────────────────────────────────────────────── */}
      {searchError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} />
          <span>{searchError}</span>
        </div>
      )}

      {/* ── Results View ───────────────────────────────────────────────────── */}
      {!isSearched && !searchLoading && (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          background: 'rgba(255,255,255,0.01)',
          borderRadius: '16px',
          border: '1px dashed var(--border-color)',
          color: 'var(--text-muted)'
        }}>
          <Search size={40} style={{ opacity: 0.35, marginBottom: '1rem', color: 'var(--accent-cyan)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
            Modul Sedia Untuk Carian
          </h4>
          <p style={{ fontSize: '0.82rem', maxWidth: '480px', margin: '0 auto' }}>
            Sila masukkan <strong>No. MRN</strong>, <strong>No. Order ID</strong>, atau <strong>Selang Tarikh</strong>, pilih Kumpulan Channel, dan tekan butang <strong>"Cari Mesej HL7"</strong>.
          </p>
        </div>
      )}

      {searchLoading && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1.5rem',
          background: 'rgba(255,255,255,0.01)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <Loader size={36} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
            Menjalankan Carian Mesej HL7...
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Menyemak saluran bagi kumpulan <strong>{selectedGroup}</strong>
            {startDate ? ` (${startDate} hingga ${endDate || startDate})` : ''}
          </p>
        </div>
      )}

      {isSearched && !searchLoading && searchResults.length > 0 && (() => {
        const totalPages   = Math.ceil(searchResults.length / pageSize);
        const startIdx     = (currentPage - 1) * pageSize;
        const endIdx       = Math.min(startIdx + pageSize, searchResults.length);
        const pagedResults = searchResults.slice(startIdx, endIdx);

        return (
          <div style={{
            background: 'var(--surface-color, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}>
            {/* Results Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                Keputusan Carian: <span style={{ color: 'var(--accent-cyan)' }}>{searchResults.length}</span> mesej dijumpai
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Kumpulan: <strong style={{ color: '#fff' }}>{selectedGroup}</strong>
                {startDate && <span style={{ marginLeft: '0.5rem', color: '#38bdf8' }}>📅 {startDate} s/d {endDate || startDate}</span>}
              </div>
            </div>

          {/* Results Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Tarikh & Masa</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Kumpulan / Channel</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Jenis</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>No. MRN</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>No. Order</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((msg, idx) => {
                  const baseType = getMsgBaseType(msg.msg_type);
                  const typeBg   = msgTypeBadge[baseType] || { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8' };
                  const stStyle  = statusStyle[msg.status] || { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8' };
                  const isFetchingThis = fetchingHl7Id === msg.message_id;
                  const rowIdx = startIdx + idx;

                  return (
                    <tr
                      key={msg.message_id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Date Time */}
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        {formatDate(msg.date_time)}
                      </td>

                      {/* Group & Channel */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{msg.channel_name || '-'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                          📁 {msg.channel_group}
                        </div>
                      </td>

                      {/* Message Type */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          background: typeBg.bg,
                          color: typeBg.color,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '5px',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {msg.msg_type || 'HL7'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          background: stStyle.bg,
                          color: stStyle.color,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '5px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {stStyle.icon}
                          {msg.status || '-'}
                        </span>
                      </td>

                      {/* MRN */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
                        {msg.mrn || '-'}
                      </td>

                      {/* Order ID */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#e2e8f0' }}>
                        {msg.order_id || '-'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          {/* Printable Medical Report Button */}
                          <button
                            className="btn btn-primary"
                            onClick={() => handleViewMessage(msg, 'report')}
                            disabled={isFetchingThis}
                            style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
                            title="Papar dan Cetak Laporan Mesra Pengguna (Human-Readable)"
                          >
                            {isFetchingThis ? <Loader size={12} className="spin" /> : <Printer size={12} />}
                            <span>Laporan (Print)</span>
                          </button>

                          {/* Raw Inspector Button */}
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleViewMessage(msg, 'raw')}
                            disabled={isFetchingThis}
                            style={{ fontSize: '0.74rem', padding: '0.3rem 0.55rem' }}
                            title="Papar Segmen HL7 Mentah (Raw Segments)"
                          >
                            <Eye size={12} />
                            <span>Raw</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Controls ─────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.15)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              {/* Info */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Papar <strong style={{ color: '#f8fafc' }}>{startIdx + 1}–{endIdx}</strong> daripada <strong style={{ color: 'var(--accent-cyan)' }}>{searchResults.length}</strong> mesej
              </div>

              {/* Page Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {/* First */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: currentPage === 1 ? 'var(--text-muted)' : '#f8fafc', opacity: currentPage === 1 ? 0.4 : 1
                  }}
                  title="Halaman Pertama"
                >«</button>

                {/* Prev */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: currentPage === 1 ? 'var(--text-muted)' : '#f8fafc', opacity: currentPage === 1 ? 0.4 : 1
                  }}
                  title="Halaman Sebelum"
                >‹ Sebelum</button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === '...' ? (
                      <span key={`ellipsis-${i}`} style={{ padding: '0 0.3rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        style={{
                          padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer',
                          minWidth: '32px', fontWeight: currentPage === item ? 700 : 400,
                          background: currentPage === item ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)',
                          border: currentPage === item ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
                          color: currentPage === item ? '#a5b4fc' : '#f8fafc',
                        }}
                      >{item}</button>
                    )
                  )
                }

                {/* Next */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: currentPage === totalPages ? 'var(--text-muted)' : '#f8fafc', opacity: currentPage === totalPages ? 0.4 : 1
                  }}
                  title="Halaman Seterusnya"
                >Seterusnya ›</button>

                {/* Last */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: currentPage === totalPages ? 'var(--text-muted)' : '#f8fafc', opacity: currentPage === totalPages ? 0.4 : 1
                  }}
                  title="Halaman Terakhir"
                >»</button>
              </div>

              {/* Fixed 10 Per Page Badge */}
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                Maksimum <strong>10</strong> rekod / halaman
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Modal Laporan Perubatan (Print / PDF) ─────────────────────────── */}
      {reportMsg && (
        <Hl7ReportModal raw={reportMsg} onClose={() => setReportMsg(null)} />
      )}

      {/* ── Modal Raw HL7 Inspector ────────────────────────────────────────── */}
      {inspectMsg && (
        <Hl7Inspector
          raw={inspectMsg}
          onClose={() => setInspectMsg(null)}
          onViewReport={(raw) => {
            setInspectMsg(null);
            setReportMsg(raw);
          }}
        />
      )}

    </div>
  );
}
