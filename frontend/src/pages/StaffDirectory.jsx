import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  X, 
  Copy, 
  Check, 
  Building2, 
  Phone, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { searchStaff } from '../services/api';

export default function StaffDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [staffData, setStaffData] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState({
    total_found: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIc, setCopiedIc] = useState(null);
  const debounceTimerRef = useRef(null);

  // Format Malaysian IC (e.g. 940413145823 -> 940413-14-5823)
  const formatIcNumber = (nokp) => {
    if (!nokp) return '-';
    const clean = nokp.toString().replace(/\D/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
    }
    return nokp;
  };

  // Format phone number cleanly
  const formatPhoneNumber = (noTel) => {
    if (!noTel) return '-';
    const clean = noTel.toString().trim();
    if (clean.length >= 10 && clean.startsWith('01')) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  };

  // Fetch staff from backend proxy
  const fetchStaff = async (query, page = 1, limit = pageSize) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStaffData([]);
      setPaginationInfo({ total_found: 0, total_pages: 0, has_next: false, has_prev: false });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await searchStaff({ q: trimmed, page, limit });
      const result = res.data;

      if (result && result.success !== false) {
        setStaffData(result.data || []);
        setPaginationInfo({
          total_found: result.total_found || 0,
          total_pages: result.total_pages || 0,
          has_next: !!result.has_next,
          has_prev: !!result.prev_page
        });
      } else {
        setStaffData([]);
        setError(result.message || 'Gagal memuat data staf.');
      }
    } catch (err) {
      console.error('Ralat carian staf:', err);
      setError(err.response?.data?.messages?.error || err.response?.data?.message || 'Gagal menyambung ke pelayan direktori staf.');
      setStaffData([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on query or page or limit change
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setActiveQuery(searchTerm);
    setCurrentPage(1);
    fetchStaff(searchTerm, 1, pageSize);
  };

  // Debounced input change (triggers search after 450ms idle)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setActiveQuery(val);
      setCurrentPage(1);
      fetchStaff(val, 1, pageSize);
    }, 450);
  };

  const handleClear = () => {
    setSearchTerm('');
    setActiveQuery('');
    setCurrentPage(1);
    setStaffData([]);
    setPaginationInfo({ total_found: 0, total_pages: 0, has_next: false, has_prev: false });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > paginationInfo.total_pages) return;
    setCurrentPage(newPage);
    fetchStaff(activeQuery, newPage, pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchStaff(activeQuery, 1, newSize);
  };

  // Auto Copy IC number
  const handleCopyIc = (rawIc, formattedIc) => {
    const textToCopy = rawIc || formattedIc;
    if (!textToCopy || textToCopy === '-') return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopiedIc(rawIc);
    setTimeout(() => {
      setCopiedIc(null);
    }, 2000);
  };

  return (
    <div style={{ padding: '2rem 0', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-emerald)',
            padding: '0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Users size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Direktori Staf</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Pencarian maklumat staf dan direktori rasmi UniSZA
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
            <Search 
              size={19} 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Masukkan nama staf (contoh: Nik Asyraf, Ahmad, Zulkifli)..."
              style={{ 
                paddingLeft: '2.75rem', 
                paddingRight: searchTerm ? '2.75rem' : '1rem',
                fontSize: '1rem',
                height: '48px',
                borderRadius: '12px'
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Padam carian"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ height: '48px', padding: '0 1.5rem', borderRadius: '12px' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />}
            <span>Cari</span>
          </button>
        </form>

        {/* Quick query chips if empty */}
        {!activeQuery && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>Cadangan carian:</span>
            {['Nik', 'Ahmad', 'Siti', 'Ismail', 'Nor'].map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => {
                  setSearchTerm(keyword);
                  setActiveQuery(keyword);
                  setCurrentPage(1);
                  fetchStaff(keyword, 1, pageSize);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-emerald)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                {keyword}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Header Info & Page size selector */}
      {activeQuery && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          padding: '0 0.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            {loading ? (
              <span>Sedang mencari maklumat staf...</span>
            ) : (
              <span>
                Menjumpai <strong style={{ color: 'var(--accent-emerald)' }}>{paginationInfo.total_found}</strong> rekod staf untuk carian "<strong>{activeQuery}</strong>"
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <span>Paparan setiap halaman:</span>
            <select
              className="form-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.75rem', fontSize: '0.88rem', borderRadius: '8px' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20 (Maksimum)</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>{error}</div>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            onClick={() => fetchStaff(activeQuery, currentPage, pageSize)}
          >
            Cuba Semula
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.75px'
              }}>
                <th style={{ padding: '1rem 1.25rem', width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '1rem 1.25rem', width: '280px' }}>Nama Staf</th>
                <th style={{ padding: '1rem 1.25rem', width: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CreditCard size={15} />
                    <span>No. KP (Klik Salin)</span>
                  </div>
                </th>
                <th style={{ padding: '1rem 1.25rem', width: '170px' }}>Gred / Skim</th>
                <th style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={15} />
                    <span>Jabatan / Fakulti</span>
                  </div>
                </th>
                <th style={{ padding: '1rem 1.25rem', width: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={15} />
                    <span>No. Telefon</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton loading rows
                [...Array(pageSize > 10 ? 10 : pageSize)].map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ height: '14px', width: '18px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ height: '16px', width: '200px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '6px' }}></div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ height: '14px', width: '110px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ height: '18px', width: '70px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', marginBottom: '4px' }}></div>
                      <div style={{ height: '12px', width: '90px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}></div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ height: '14px', width: '160px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ height: '14px', width: '95px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                    </td>
                  </tr>
                ))
              ) : staffData.length > 0 ? (
                staffData.map((staff, index) => {
                  const rowIndex = (currentPage - 1) * pageSize + index + 1;
                  const isCopied = copiedIc === staff.nokp;
                  const formattedIc = formatIcNumber(staff.nokp);
                  const formattedPhone = formatPhoneNumber(staff.no_tel);

                  return (
                    <tr 
                      key={staff.nokp || index} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Bilangan */}
                      <td style={{ padding: '1.1rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {rowIndex}
                      </td>

                      {/* Nama Staf */}
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#ffffff', lineHeight: 1.4 }}>
                          {staff.nama}
                        </div>
                      </td>

                      {/* No. KP dengan Klik Auto-Copy */}
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyIc(staff.nokp, formattedIc)}
                          title="Klik untuk salin No. KP"
                          style={{
                            background: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isCopied ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                            color: isCopied ? 'var(--accent-emerald)' : 'var(--text-main)',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.3px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                          onMouseOver={(e) => {
                            if (!isCopied) {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                              e.currentTarget.style.borderColor = 'var(--primary)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isCopied) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }
                          }}
                        >
                          <span>{formattedIc}</span>
                          {isCopied ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '0.75rem' }}>
                              <Check size={14} color="var(--accent-emerald)" />
                              <span>Disalin!</span>
                            </span>
                          ) : (
                            <Copy size={13} style={{ opacity: 0.6 }} />
                          )}
                        </button>
                      </td>

                      {/* Gred & Kod Skim */}
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{
                            display: 'inline-block',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            width: 'fit-content'
                          }}>
                            {staff.gred || '-'}
                          </span>
                          {staff.kod_skim && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {staff.kod_skim}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Jabatan / Fakulti */}
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 500 }}>
                            {staff.nama_jabatan || '-'}
                          </span>
                          {staff.jabatan && (
                            <span style={{
                              background: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: 'var(--text-muted)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 600
                            }}>
                              {staff.jabatan}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* No. Telefon (Teks Biasa) */}
                      <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.92rem' }}>
                        {staff.no_tel ? (
                          <span style={{ color: '#f8fafc', fontWeight: 500, fontFamily: 'monospace' }}>
                            {formattedPhone}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : activeQuery ? (
                // No Results State
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '1rem',
                        borderRadius: '50%',
                        color: 'var(--text-muted)'
                      }}>
                        <Search size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tiada Rekod Dijumpai</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px' }}>
                        Tiada staf yang sepadan dengan carian "<strong>{activeQuery}</strong>". Sila semak ejaan nama atau cuba kata kunci yang lebih ringkas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Initial Empty State
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        padding: '1.25rem',
                        borderRadius: '50%',
                        color: 'var(--accent-emerald)'
                      }}>
                        <Users size={36} />
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pencarian Direktori Staf</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', lineHeight: 1.5 }}>
                        Taipkan nama staf pada kotak carian di atas untuk mendapatkan maklumat perjawatan, no. kad pengenalan, fakulti, dan no. telefon.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {staffData.length > 0 && paginationInfo.total_pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Halaman <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> daripada{' '}
              <strong style={{ color: 'var(--text-main)' }}>{paginationInfo.total_pages}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage <= 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', opacity: currentPage <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
                <span>Sebelum</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={!paginationInfo.has_next || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', opacity: !paginationInfo.has_next ? 0.4 : 1 }}
              >
                <span>Seterusnya</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
