import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { UPLOAD_BASE_URL } from '../services/api';

export default function ImageLightbox({ imageUrl, title, onClose }) {
  if (!imageUrl) return null;

  const fullUrl = imageUrl.startsWith('http') ? imageUrl : (UPLOAD_BASE_URL + (imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', padding: '1rem', background: '#0a0d14' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{title || 'Pratinjau Imej'}</h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={fullUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              <ExternalLink size={14} /> Buka Tab Baru
            </a>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem 0.6rem' }}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', maxHeight: '80vh' }}>
          <img 
            src={fullUrl} 
            alt={title} 
            style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', objectFit: 'contain' }} 
          />
        </div>
      </div>
    </div>
  );
}
