import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, RefreshCw, Search, Wifi, WifiOff,
  AlertCircle, CheckCircle, Clock, Minus, Eye, X,
  Loader, Settings, Folder, FileText, Printer
} from 'lucide-react';
import api from '../services/api';

const LS_KEY        = 'iknow_mirth_visible_channels';
const MSG_TYPES     = ['Semua', 'ORM', 'ORR', 'ORU', 'P03'];
const STATUSES      = ['Semua', 'SENT', 'ERROR', 'QUEUED', 'FILTERED'];

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


// ─── Channel Manager Modal ──────────────────────────────────────────────────
function ChannelManagerModal({ allChannels, groups, visibleIds, onSave, onClose }) {
  const [draft, setDraft] = useState(new Set(visibleIds));

  const toggle = (id) => {
    setDraft(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setDraft(new Set(allChannels.map(c => c.id)));
  const clearAll  = () => setDraft(new Set());

  const toggleGroup = (groupName) => {
    const groupChannelIds = allChannels.filter(c => (c.group || '[Default Group]') === groupName).map(c => c.id);
    const allSelected = groupChannelIds.every(id => draft.has(id));
    setDraft(prev => {
      const next = new Set(prev);
      groupChannelIds.forEach(id => {
        allSelected ? next.delete(id) : next.add(id);
      });
      return next;
    });
  };

  const stateColor = (state) => {
    if (state === 'STARTED') return '#10b981';
    if (state === 'STOPPED') return '#ef4444';
    return '#f59e0b';
  };

  // Group channels by group name
  const groupedChannels = useMemo(() => {
    const map = {};
    allChannels.forEach(c => {
      const g = c.group || '[Default Group]';
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    return map;
  }, [allChannels]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} color="var(--accent-cyan)" /> Urus Channel Mirth Mengikut Kumpulan
          </h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem' }}><X size={16} /></button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Hanya channel yang <strong style={{ color: '#fff' }}>di-tick (☑)</strong> akan dipaparkan dalam viewer. Pilihan tersimpan secara automatik.
        </p>

        {/* Select/Clear All */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={selectAll} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
            ☑ Pilih Semua
          </button>
          <button className="btn btn-secondary" onClick={clearAll} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
            ☐ Kosongkan Semua
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong>{draft.size}</strong> daripada <strong>{allChannels.length}</strong> channel dipilih
          </span>
        </div>

        {/* Grouped Channel List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {Object.entries(groupedChannels).map(([groupName, chList]) => {
            const groupSelectedCount = chList.filter(c => draft.has(c.id)).length;
            const isGroupAllSelected = groupSelectedCount === chList.length;

            return (
              <div key={groupName} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                {/* Group Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Folder size={15}/> {groupName}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>({groupSelectedCount}/{chList.length})</span>
                  </span>
                  <button className="btn btn-secondary" onClick={() => toggleGroup(groupName)}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', height: 'auto' }}>
                    {isGroupAllSelected ? '☐ Untick Group' : '☑ Tick Group'}
                  </button>
                </div>

                {/* Group Channels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {chList.map(c => (
                    <label key={c.id}
                      onClick={() => toggle(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 0.85rem',
                        background: draft.has(c.id) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${draft.has(c.id) ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.04)'}`,
                        borderRadius: '8px', cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                        background: draft.has(c.id) ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                        border: `1px solid ${draft.has(c.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}>
                        {draft.has(c.id) && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>✅ {c.sent.toLocaleString()} Sent</span>
                          <span>❌ {c.error.toLocaleString()} Error</span>
                        </div>
                      </div>

                      {/* State */}
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: stateColor(c.state), background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.45rem', borderRadius: '5px', flexShrink: 0 }}>
                        ● {c.state}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => { onSave([...draft]); onClose(); }}>
          💾 Simpan Tetapan Channel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function MirthViewer() {
  const [connStatus, setConnStatus]     = useState(null);
  const [allChannels, setAllChannels]   = useState([]);
  const [groups, setGroups]             = useState([]);
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [chanLoading, setChanLoading]   = useState(false);
  const [error, setError]               = useState('');

  const [selectedGroup, setSelectedGroup]     = useState('Semua');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [typeFilter, setTypeFilter]           = useState('Semua');
  const [statusFilter, setStatusFilter]       = useState('Semua');
  const [mrnFilter, setMrnFilter]             = useState('');
  const [inspectMsg, setInspectMsg]           = useState(null);
  const [reportMsg, setReportMsg]             = useState(null);
  const [showManager, setShowManager]         = useState(false);


  // ── Pagination State ──────────────────────────────────────────────────────
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ── Visible channel IDs (from localStorage) ──────────────────────────────
  const [visibleIds, setVisibleIds] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Channels that pass the visibility filter
  const visibleChannels = useMemo(() => {
    let list = visibleIds === null
      ? allChannels
      : allChannels.filter(c => visibleIds.includes(c.id));

    if (selectedGroup !== 'Semua') {
      list = list.filter(c => (c.group || '[Default Group]') === selectedGroup);
    }
    return list;
  }, [allChannels, visibleIds, selectedGroup]);

  // Group visible channels by group name for dropdown optgroup
  const groupedVisibleChannels = useMemo(() => {
    const map = {};
    visibleChannels.forEach(c => {
      const g = c.group || '[Default Group]';
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    return map;
  }, [visibleChannels]);

  const saveVisibleIds = (ids) => {
    setVisibleIds(ids);
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  };

  // ── API Calls ─────────────────────────────────────────────────────────────
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
      const chs = res.data.channels || [];
      const grps = res.data.groups || [];
      setAllChannels(chs);
      setGroups(grps);

      if (visibleIds === null && chs.length > 0) {
        const ids = chs.map(c => c.id);
        saveVisibleIds(ids);
      }

      if (!selectedChannel && chs.length > 0) {
        const firstVisible = (visibleIds ?? chs.map(c => c.id))[0];
        const match = chs.find(c => c.id === firstVisible) || chs[0];
        setSelectedChannel(match.id);
      }
    } catch {
      setError('Gagal memuatkan senarai channel Mirth. Semak credentials dalam .env');
    } finally {
      setChanLoading(false);
    }
  }, [selectedChannel, visibleIds]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChannel) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        channel_id: selectedChannel,
        limit: pageSize,
        offset: (page - 1) * pageSize,
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
  }, [selectedChannel, typeFilter, statusFilter, mrnFilter, page, pageSize]);

  useEffect(() => { fetchStatus(); }, []);
  useEffect(() => { if (connStatus?.authenticated) fetchChannels(); }, [connStatus]);
  useEffect(() => { if (selectedChannel) fetchMessages(); }, [selectedChannel, typeFilter, statusFilter, page, pageSize]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const handleGroupTabClick = (groupName) => {
    setSelectedGroup(groupName);
    setPage(1);
    // Auto-select first channel in this group
    const groupChannels = (visibleIds === null ? allChannels : allChannels.filter(c => visibleIds.includes(c.id)))
      .filter(c => groupName === 'Semua' || (c.group || '[Default Group]') === groupName);
    if (groupChannels.length > 0) {
      setSelectedChannel(groupChannels[0].id);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (ts) => {
    if (!ts) return '-';
    try { return new Date(parseInt(ts)).toLocaleString('ms-MY'); } catch { return ts; }
  };

  const getMsgBaseType = (type) => {
    const base = (type || '').split('^')[0].toUpperCase();
    return base === 'DFT' ? 'P03' : base;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} color="var(--accent-cyan)"/> Mirth Connect — HL7 Viewer
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Pemantauan mesej HL7 (ORM / ORR / ORU / P03) — <strong>Read-Only</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary"
            onClick={() => setShowManager(true)}
            title="Urus channel yang dipaparkan"
            style={{ borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8' }}
          >
            <Settings size={14}/> Urus Channel
            {visibleIds !== null && (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '10px', padding: '0.05rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}>
                {visibleChannels.length}/{allChannels.length}
              </span>
            )}
          </button>
          <button className="btn btn-secondary" onClick={() => { fetchStatus(); fetchChannels(); }}>
            <RefreshCw size={14}/> Muat Semula
          </button>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className="glass-panel" style={{
        padding: '0.85rem 1.25rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: connStatus?.connected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${connStatus?.connected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {connStatus?.connected ? <Wifi size={18} color="#10b981"/> : <WifiOff size={18} color="#ef4444"/>}
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

      {/* Group Pills Navigation */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <button
            onClick={() => handleGroupTabClick('Semua')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.78rem', padding: '0.35rem 0.8rem', whiteSpace: 'nowrap',
              background: selectedGroup === 'Semua' ? 'var(--primary)' : undefined,
              borderColor: selectedGroup === 'Semua' ? 'var(--primary)' : undefined,
              color: selectedGroup === 'Semua' ? '#fff' : undefined,
            }}
          >
            📁 Semua Kumpulan ({allChannels.length})
          </button>
          {groups.map(g => {
            const groupCount = allChannels.filter(c => (c.group || '[Default Group]') === g).length;
            const isSelected = selectedGroup === g;
            return (
              <button
                key={g}
                onClick={() => handleGroupTabClick(g)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.78rem', padding: '0.35rem 0.8rem', whiteSpace: 'nowrap',
                  background: isSelected ? 'rgba(6,182,212,0.2)' : undefined,
                  borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                  color: isSelected ? 'var(--accent-cyan)' : undefined,
                  fontWeight: isSelected ? 700 : 400,
                }}
              >
                {g} ({groupCount})
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 160px', gap: '0.75rem', alignItems: 'end' }}>

          {/* Channel Selector — Grouped with optgroup */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>
              Channel Mirth
              {selectedGroup !== 'Semua' && (
                <span style={{ marginLeft: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.68rem' }}>
                  [{selectedGroup}]
                </span>
              )}
            </label>
            <select className="form-select" value={selectedChannel} onChange={e => handleFilterChange(setSelectedChannel, e.target.value)}>
              {chanLoading && <option>Memuatkan...</option>}
              {Object.entries(groupedVisibleChannels).map(([groupName, chList]) => (
                <optgroup key={groupName} label={`📁 ${groupName}`}>
                  {chList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ✅{c.sent.toLocaleString()} ❌{c.error}
                    </option>
                  ))}
                </optgroup>
              ))}
              {!chanLoading && visibleChannels.length === 0 && (
                <option value="">Tiada channel dipilih — klik Urus Channel</option>
              )}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Jenis Mesej</label>
            <select className="form-select" value={typeFilter} onChange={e => handleFilterChange(setTypeFilter, e.target.value)}>
              {MSG_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
            <select className="form-select" value={statusFilter} onChange={e => handleFilterChange(setStatusFilter, e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Cari No. MRN</label>
            <input type="text" className="form-input" placeholder="Cth: MRN123456"
              value={mrnFilter} onChange={e => handleFilterChange(setMrnFilter, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchMessages()}/>
          </div>

          <button className="btn btn-primary" onClick={fetchMessages}
            disabled={loading || !selectedChannel} style={{ height: '38px', justifyContent: 'center' }}>
            {loading ? <Loader size={14}/> : <><Search size={14}/> Cari</>}
          </button>
        </div>
      </div>



      {/* Messages Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Log Mesej HL7 {messages.length > 0 && <span style={{ color: 'var(--accent-cyan)', fontWeight: 400 }}>({messages.length} mesej dalam halaman ini)</span>}
          </h3>
          {loading && <Loader size={16} color="var(--accent-cyan)"/>}
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
                  const baseType  = getMsgBaseType(msg.msg_type);
                  const typeStyle = msgTypeBadge[baseType] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
                  const st        = statusStyle[msg.status?.toUpperCase()] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', icon: null };
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
                          <button className="btn btn-secondary" onClick={() => setInspectMsg(msg.raw_hl7)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
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

        {/* Pagination Footer */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '0.75rem'
        }}>
          {/* Info */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {messages.length > 0 ? (
              <>Menunjukkan <strong>{(page - 1) * pageSize + 1} - {(page - 1) * pageSize + messages.length}</strong> mesej</>
            ) : (
              'Tiada mesej'
            )}
          </div>

          {/* Page Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Items Per Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Saiz:</span>
              <select className="form-select" value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: '0.25rem 1.8rem 0.25rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}>
                <option value={25}>25 / ms</option>
                <option value={50}>50 / ms</option>
                <option value={100}>100 / ms</option>
              </select>
            </div>

            {/* Prev/Next Buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', opacity: page <= 1 ? 0.4 : 1 }}
              >
                ◀ Sebelumnya
              </button>

              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', padding: '0 0.4rem' }}>
                Halaman {page}
              </span>

              <button
                className="btn btn-secondary"
                disabled={messages.length < pageSize || loading}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', opacity: messages.length < pageSize ? 0.4 : 1 }}
              >
                Seterusnya ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Manager Modal */}
      {showManager && (
        <ChannelManagerModal
          allChannels={allChannels}
          groups={groups}
          visibleIds={visibleIds ?? allChannels.map(c => c.id)}
          onSave={saveVisibleIds}
          onClose={() => setShowManager(false)}
        />
      )}

      {/* HL7 Raw Inspector Modal */}
      {inspectMsg && <Hl7Inspector raw={inspectMsg} onClose={() => setInspectMsg(null)} onViewReport={(raw) => setReportMsg(raw)} />}

      {/* Human-Readable HL7 PDF Report Modal */}
      {reportMsg && <Hl7ReportModal raw={reportMsg} onClose={() => setReportMsg(null)} />}
    </div>
  );
}

