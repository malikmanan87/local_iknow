import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, FileText, Upload, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';
import { chatGhop, getGhopStatus } from '../services/api';
import GhopPdfUploadModal from './GhopPdfUploadModal';

export default function GhopAiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Salam sejahtera! Saya Pembantu Maya **GHOP AI**. Tanyakan sebarang soalan berkenaan **Polisi Operasi Am Hospital (GHOP)**.',
      references: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [ghopStatus, setGhopStatus] = useState(null);

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Polisi waktu melawat pesakit di wad",
    "Polisi kebenaran peneman pesakit",
    "Prosedur kecemasan Code Blue"
  ];

  const fetchGhopStatus = async () => {
    try {
      const res = await getGhopStatus();
      setGhopStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGhopStatus();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend = null) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await chatGhop(query);
      const aiMsg = {
        sender: 'ai',
        text: res.data.answer,
        references: res.data.references || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Maaf, berlaku ralat teknikal semasa menghubung sistem GHOP AI.',
          references: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Avatar Trigger Button (Bottom Right) */}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            style={{ 
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '0.4rem 0.85rem',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>Tanya GHOP AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)',
            position: 'relative',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease'
          }}
          title="GHOP AI Assistant"
        >
          {isOpen ? <X size={24} /> : <Bot size={28} />}
          {/* Online Indicator */}
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--accent-emerald)',
            border: '2px solid #0f172a'
          }} />
        </button>
      </div>

      {/* Floating Chat Window Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '380px',
            maxHeight: '560px',
            height: '80vh',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  GHOP AI Assistant
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                  📄 {ghopStatus?.pdf_filename ? `Fail: ${ghopStatus.pdf_filename}` : 'Kandungan PDF GHOP'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowUploadModal(true)} 
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                title="Muat naik fail PDF GHOP baru"
              >
                <Upload size={13} /> PDF
              </button>
              <button className="btn btn-secondary" onClick={() => setIsOpen(false)} style={{ padding: '0.3rem' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
                    background: m.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {m.text}

                  {/* PDF Reference Citation Cards */}
                  {m.references && m.references.length > 0 && (
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                        📖 Rujukan Fail PDF GHOP:
                      </span>
                      {m.references.map((r, rIdx) => (
                        <div key={rIdx} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '0.4rem 0.6rem', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                            Muka Surat {r.page_number} - {r.chapter_title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {r.title} ({r.section_code || 'GHOP'})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', padding: '0.6rem 1rem', borderRadius: '16px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                🤖 Menyemak fail PDF GHOP...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div style={{ padding: '0.5rem 0.85rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
            {quickPrompts.map((qp, qIdx) => (
              <button 
                key={qIdx}
                onClick={() => handleSend(qp)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '0.25rem 0.6rem', 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)', 
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}
          >
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tanya soalan mengenai GHOP..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', borderRadius: '10px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ padding: '0.5rem 0.75rem' }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* PDF Upload Modal */}
      {showUploadModal && (
        <GhopPdfUploadModal 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => fetchGhopStatus()}
        />
      )}
    </>
  );
}
