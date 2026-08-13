import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GitFork, Trash2, Link2, Download, Save, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const CANVAS_W = 2400;
const CANVAS_H = 1600;

const SHAPE_CATALOG = [
  { type: 'terminator', label: 'Terminator', sublabel: 'Start / End',       color: '#818cf8' },
  { type: 'process',    label: 'Process',    sublabel: 'Proses / Langkah',  color: '#22d3ee' },
  { type: 'decision',   label: 'Decision',   sublabel: 'Keputusan (Ya/Tidak)', color: '#fbbf24' },
  { type: 'io',         label: 'I / O',      sublabel: 'Input / Output',    color: '#34d399' },
  { type: 'subprocess', label: 'Sub-Process',sublabel: 'Proses Kecil',      color: '#c084fc' },
];

const SHAPE_SIZE = {
  terminator: { w: 150, h: 55  },
  process:    { w: 160, h: 65  },
  decision:   { w: 150, h: 90  },
  io:         { w: 160, h: 65  },
  subprocess: { w: 160, h: 65  },
};

let _uid = Date.now();
const uid = () => String(++_uid);

/* ─── Tiny shape preview for the palette panel ──────────────────────────── */
function ShapePreview({ type, color }) {
  const W = 84, H = 30;
  const cx = W / 2, cy = H / 2;

  const fill  = color + '22';
  const props = { fill, stroke: color, strokeWidth: 1.5 };

  switch (type) {
    case 'terminator':
      return <svg width={W} height={H}><ellipse cx={cx} cy={cy} rx={cx} ry={cy} {...props} /></svg>;
    case 'process':
      return <svg width={W} height={H}><rect x={0} y={0} width={W} height={H} {...props} /></svg>;
    case 'decision': {
      const pts = `${cx},0 ${W},${cy} ${cx},${H} 0,${cy}`;
      return <svg width={W} height={H}><polygon points={pts} {...props} /></svg>;
    }
    case 'io': {
      const sk = 9;
      return <svg width={W} height={H}><polygon points={`${sk},0 ${W},0 ${W - sk},${H} 0,${H}`} {...props} /></svg>;
    }
    case 'subprocess':
      return (
        <svg width={W} height={H}>
          <rect x={0} y={0} width={W} height={H} rx={4} {...props} />
          <line x1={10} y1={0} x2={10} y2={H} stroke={color} strokeWidth={1.5} />
          <line x1={W - 10} y1={0} x2={W - 10} y2={H} stroke={color} strokeWidth={1.5} />
        </svg>
      );
    default:
      return <svg width={W} height={H}><rect x={0} y={0} width={W} height={H} {...props} /></svg>;
  }
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function FlowchartEditor({ moduleId, contextKey }) {
  const storageKey = `fc_${moduleId}_${contextKey || 'main'}`;

  /* ── State ── */
  const [shapes,      setShapes]      = useState([]);
  const [connections, setConnections] = useState([]);
  const [selected,    setSelected]    = useState(null);   // id of shape OR connection
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);   // shape id
  const [editingId,   setEditingId]   = useState(null);   // shape id  |  'conn:id'
  const [editLabel,   setEditLabel]   = useState('');
  const [dragging,    setDragging]    = useState(null);   // { id, ox, oy }
  const [history,     setHistory]     = useState([]);
  const [savedFlash,  setSavedFlash]  = useState(false);
  const [zoom,        setZoom]        = useState(1);

  /* ── Refs ── */
  const svgRef     = useRef(null);
  const wrapRef    = useRef(null);
  const editRef    = useRef(null);

  /* unique SVG element ids per instance */
  const iid  = (moduleId + '_' + (contextKey || 'main')).replace(/\W/g, '_');
  const ARROW_ID     = `arr_${iid}`;
  const ARROW_SEL_ID = `arr_s_${iid}`;
  const GLOW_ID      = `glow_${iid}`;
  const GRID_ID      = `grid_${iid}`;

  /* ── Load from localStorage on mount ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { shapes: s = [], connections: c = [] } = JSON.parse(raw);
        setShapes(s);
        setConnections(c);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  /* ── Focus edit input when activated ── */
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (editingId) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        handleDelete();
      }
      if (e.key === 'Escape') {
        setConnectMode(false);
        setConnectFrom(null);
        setSelected(null);
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, selected]);

  /* ── Helpers ── */
  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-19), { shapes, connections }]);
  }, [shapes, connections]);

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setShapes(last.shapes);
    setConnections(last.connections);
    setHistory(prev => prev.slice(0, -1));
    setSelected(null);
  };

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ shapes, connections }));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  const clearAll = () => {
    if (!window.confirm('Kosongkan seluruh canvas? Data belum disimpan akan hilang.')) return;
    pushHistory();
    setShapes([]);
    setConnections([]);
    setSelected(null);
  };

  const handleDelete = useCallback(() => {
    if (!selected) return;
    pushHistory();
    if (shapes.find(s => s.id === selected)) {
      setShapes(prev => prev.filter(s => s.id !== selected));
      setConnections(prev => prev.filter(c => c.from !== selected && c.to !== selected));
    } else {
      setConnections(prev => prev.filter(c => c.id !== selected));
    }
    setSelected(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, shapes]);

  /* ── SVG coordinate from mouse event ── */
  const svgCoord = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top)  / zoom,
    };
  };

  /* ── Drag-and-drop from palette ── */
  const onPaletteDragStart = (e, type) => {
    e.dataTransfer.setData('shapeType', type);
  };

  const onSvgDragOver  = (e) => e.preventDefault();
  const onSvgDrop      = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('shapeType');
    if (!type) return;
    const { w, h } = SHAPE_SIZE[type];
    const coord     = svgCoord(e);
    const catalog   = SHAPE_CATALOG.find(s => s.type === type);
    pushHistory();
    const shape = {
      id:     uid(),
      type,
      x:      Math.max(10, coord.x - w / 2),
      y:      Math.max(10, coord.y - h / 2),
      width:  w,
      height: h,
      label:  catalog.label,
      color:  catalog.color,
    };
    setShapes(prev => [...prev, shape]);
  };

  /* ── Shape interaction ── */
  const onShapeMouseDown = (e, id) => {
    if (editingId) return;
    if (connectMode) return;
    e.stopPropagation();
    const coord = svgCoord(e);
    const shape = shapes.find(s => s.id === id);
    setDragging({ id, ox: coord.x - shape.x, oy: coord.y - shape.y });
    setSelected(id);
  };

  const onShapeClick = (e, id) => {
    e.stopPropagation();
    if (editingId) return;
    if (connectMode) {
      if (!connectFrom) {
        setConnectFrom(id);
      } else if (connectFrom !== id) {
        const exists = connections.find(c => c.from === connectFrom && c.to === id);
        if (!exists) {
          pushHistory();
          setConnections(prev => [...prev, { id: uid(), from: connectFrom, to: id, label: '' }]);
        }
        setConnectFrom(null);
        setConnectMode(false);
      }
      return;
    }
    setSelected(id);
  };

  const onShapeDblClick = (e, id) => {
    e.stopPropagation();
    if (connectMode) return;
    const shape = shapes.find(s => s.id === id);
    setEditingId(id);
    setEditLabel(shape.label);
  };

  /* ── Canvas mouse move / up ── */
  const onSvgMouseMove = (e) => {
    if (!dragging) return;
    const coord = svgCoord(e);
    setShapes(prev => prev.map(s =>
      s.id !== dragging.id ? s : {
        ...s,
        x: Math.max(0, coord.x - dragging.ox),
        y: Math.max(0, coord.y - dragging.oy),
      }
    ));
  };

  const onSvgMouseUp   = () => setDragging(null);
  const onCanvasClick  = () => { if (!connectMode) setSelected(null); };

  /* ── Connection interaction ── */
  const onConnClick    = (e, id) => { e.stopPropagation(); setSelected(id); };
  const onConnDblClick = (e, id) => {
    e.stopPropagation();
    const conn = connections.find(c => c.id === id);
    setEditingId('conn:' + id);
    setEditLabel(conn.label || '');
  };

  /* ── Label commit ── */
  const commitLabel = () => {
    if (!editingId) return;
    if (editingId.startsWith('conn:')) {
      const cid = editingId.slice(5);
      setConnections(prev => prev.map(c => c.id === cid ? { ...c, label: editLabel } : c));
    } else {
      setShapes(prev => prev.map(s => s.id === editingId ? { ...s, label: editLabel } : s));
    }
    setEditingId(null);
  };

  const onEditKey = (e) => {
    if (e.key === 'Enter')  commitLabel();
    if (e.key === 'Escape') setEditingId(null);
  };

  /* ── Connection path helpers ── */
  const shapeCenter = (s) => ({ x: s.x + s.width / 2, y: s.y + s.height / 2 });

  /**
   * Returns the point on the shape boundary that lies in the given direction
   * (angleRad) from the shape center.  padding adds extra space outside the shape.
   *
   * Fix: single, clear function — always go from center outward in the given direction.
   * For exit point (source → target): use angle as-is.
   * For entry point (target ← source): use angle + Math.PI (i.e. the side of target
   *   that faces the source).  This eliminates the previous double-negation bug where
   *   the arrow was entering from the wrong side.
   */
  const getBoundaryPoint = (shape, dirAngle, padding = 6) => {
    const cx = shape.x + shape.width  / 2;
    const cy = shape.y + shape.height / 2;
    const rx = shape.width  / 2 + padding;
    const ry = shape.height / 2 + padding;
    return {
      x: cx + Math.cos(dirAngle) * rx,
      y: cy + Math.sin(dirAngle) * ry,
    };
  };

  const getConnPath = (conn) => {
    const from = shapes.find(s => s.id === conn.from);
    const to   = shapes.find(s => s.id === conn.to);
    if (!from || !to) return { d: '', mx: 0, my: 0 };

    const c1 = shapeCenter(from);
    const c2 = shapeCenter(to);
    // angle: direction from source center → target center
    const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);

    // p1 = exit point on source (go toward target, padding 6)
    const p1 = getBoundaryPoint(from, angle, 6);
    // p2 = entry point on target (go toward source = angle + PI, padding 10)
    //   This ensures the arrowhead touches the correct face of the target shape.
    const p2 = getBoundaryPoint(to, angle + Math.PI, 10);

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    const d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    return { d, mx: midX, my: midY };
  };

  /* ── Render one shape ── */
  const renderShape = (shape) => {
    const { id, type, x, y, width: w, height: h, color, label } = shape;
    const isSel  = selected === id;
    const isFrom = connectFrom === id;
    const fill        = color + '18';
    const stroke      = isSel ? '#ffffff' : isFrom ? '#22d3ee' : color;
    const strokeWidth = isSel || isFrom ? 2.5 : 1.5;
    const filterAttr  = isSel ? `url(#${GLOW_ID})` : undefined;
    const cx = x + w / 2, cy = y + h / 2;

    let body;
    switch (type) {
      case 'terminator':
        body = <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filterAttr} />;
        break;
      case 'process':
        body = <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filterAttr} />;
        break;
      case 'decision': {
        const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
        body = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filterAttr} />;
        break;
      }
      case 'io': {
        const sk = 22;
        const pts = `${x + sk},${y} ${x + w},${y} ${x + w - sk},${y + h} ${x},${y + h}`;
        body = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filterAttr} />;
        break;
      }
      case 'subprocess':
        body = (
          <>
            <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filterAttr} />
            <line x1={x + 14} y1={y} x2={x + 14} y2={y + h} stroke={stroke} strokeWidth={1} opacity={0.7} />
            <line x1={x + w - 14} y1={y} x2={x + w - 14} y2={y + h} stroke={stroke} strokeWidth={1} opacity={0.7} />
          </>
        );
        break;
      default:
        body = <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    }

    // Truncate label for display
    const displayLabel = label.length > 20 ? label.slice(0, 18) + '…' : label;
    const isEditing    = editingId === id;

    return (
      <g
        key={id}
        style={{ cursor: connectMode ? 'crosshair' : dragging?.id === id ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={(e) => onShapeMouseDown(e, id)}
        onClick={(e)     => onShapeClick(e, id)}
        onDoubleClick={(e) => onShapeDblClick(e, id)}
      >
        {body}
        {!isEditing && (
          <text
            x={cx} y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#f1f5f9"
            fontSize={12}
            fontWeight={600}
            fontFamily="Inter, system-ui, sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            {displayLabel}
          </text>
        )}
      </g>
    );
  };

  /* ── Export PNG ── */
  const exportPNG = () => {
    if (shapes.length === 0) { alert('Tiada shapes untuk di-export.'); return; }
    const padding = 60;
    const minX = Math.min(...shapes.map(s => s.x)) - padding;
    const minY = Math.min(...shapes.map(s => s.y)) - padding;
    const maxX = Math.max(...shapes.map(s => s.x + s.width))  + padding;
    const maxY = Math.max(...shapes.map(s => s.y + s.height)) + padding;
    const vw = maxX - minX, vh = maxY - minY;

    const clone = svgRef.current.cloneNode(true);
    clone.setAttribute('viewBox', `${minX} ${minY} ${vw} ${vh}`);
    clone.setAttribute('width',  String(vw * 2));
    clone.setAttribute('height', String(vh * 2));
    // Set background rect
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', String(minX)); bg.setAttribute('y', String(minY));
    bg.setAttribute('width', String(vw)); bg.setAttribute('height', String(vh));
    bg.setAttribute('fill', '#0f1117');
    clone.insertBefore(bg, clone.firstChild);

    const svgStr  = new XMLSerializer().serializeToString(clone);
    const blob    = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url     = URL.createObjectURL(blob);
    const img     = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = vw * 2; c.height = vh * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0f1117';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const a = document.createElement('a');
      a.download = `flowchart-${moduleId}.png`;
      a.href = c.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  /* ── Inline edit overlay position ── */
  const editShape = editingId && !editingId.startsWith('conn:')
    ? shapes.find(s => s.id === editingId) : null;

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

      {/* ─ Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>

        {/* Undo */}
        <button className="btn btn-secondary" onClick={undo} disabled={history.length === 0}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="Undo (Ctrl+Z)">
          <RotateCcw size={13} /> Undo
        </button>

        {/* Connect mode */}
        <button
          className={`btn ${connectMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setConnectMode(v => !v); setConnectFrom(null); }}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
          title="Mode sambung shapes dengan anak panah"
        >
          <Link2 size={13} />
          {connectMode
            ? (connectFrom ? ' Pilih Target →' : ' Pilih Shape Pertama…')
            : ' Connect'}
        </button>

        {/* Cancel connect */}
        {connectMode && (
          <button className="btn btn-secondary" onClick={() => { setConnectMode(false); setConnectFrom(null); }}
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
            <X size={13} />
          </button>
        )}

        {/* Delete */}
        <button className="btn btn-danger" onClick={handleDelete} disabled={!selected}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="Padam yang dipilih (Del)">
          <Trash2 size={13} /> Padam
        </button>

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <button className="btn btn-secondary" onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))}
          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} title="Zoom Out">
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn btn-secondary" onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} title="Zoom In">
          <ZoomIn size={13} />
        </button>

        {/* Clear */}
        <button className="btn btn-secondary" onClick={clearAll}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}>
          Clear
        </button>

        {/* Save */}
        <button className="btn btn-secondary" onClick={save}
          style={{
            padding: '0.3rem 0.75rem', fontSize: '0.75rem',
            borderColor: savedFlash ? '#10b981' : '',
            color: savedFlash ? '#10b981' : '',
          }}>
          <Save size={13} /> {savedFlash ? 'Tersimpan ✓' : 'Simpan'}
        </button>

        {/* Export PNG */}
        <button className="btn btn-secondary" onClick={exportPNG}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
          <Download size={13} /> Export PNG
        </button>
      </div>

      {/* ─ Help hint ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        <span>🖱 Drag shape dari panel kiri</span>
        <span>✌ Double-click untuk edit label</span>
        <span>🔗 Connect mode → klik shape sumber → klik target</span>
        <span>⌨ Del untuk padam pilihan</span>
      </div>

      {/* ─ Editor layout ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

        {/* Shape Palette */}
        <div style={{
          width: 108,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          padding: '0.65rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
            Shapes
          </div>

          {SHAPE_CATALOG.map(({ type, label, sublabel, color }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => onPaletteDragStart(e, type)}
              title={`Drag ke canvas: ${label}`}
              style={{
                padding: '0.45rem 0.5rem',
                border: `1px dashed ${color}70`,
                borderRadius: '8px',
                cursor: 'grab',
                background: color + '12',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = color + '28'}
              onMouseLeave={e => e.currentTarget.style.background = color + '12'}
            >
              <ShapePreview type={type} color={color} />
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f1f5f9', marginTop: '0.3rem', lineHeight: 1.2 }}>{label}</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '0.1rem' }}>{sublabel}</div>
            </div>
          ))}
        </div>

        {/* Canvas wrapper */}
        <div
          ref={wrapRef}
          style={{
            flex: 1,
            overflow: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            background: '#080c14',
            position: 'relative',
            maxHeight: 540,
            cursor: connectMode ? 'crosshair' : 'default',
          }}
        >
          <svg
            ref={svgRef}
            width={CANVAS_W * zoom}
            height={CANVAS_H * zoom}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            onDragOver={onSvgDragOver}
            onDrop={onSvgDrop}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
            onClick={onCanvasClick}
            style={{ display: 'block' }}
          >
            {/* ── Defs ── */}
            <defs>
              {/* Arrowhead markers */}
              <marker id={ARROW_ID} markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
              <marker id={ARROW_SEL_ID} markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
              </marker>

              {/* Glow filter */}
              <filter id={GLOW_ID} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>

              {/* Grid pattern */}
              <pattern id={GRID_ID} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.8" fill="rgba(255,255,255,0.07)" />
              </pattern>
            </defs>

            {/* Grid background */}
            <rect width={CANVAS_W} height={CANVAS_H} fill={`url(#${GRID_ID})`} />

            {/* ── Connections ── */}
            {connections.map(conn => {
              const { d, mx, my } = getConnPath(conn);
              if (!d) return null;
              const isSel = selected === conn.id;
              return (
                <g key={conn.id}>
                  {/* Wide invisible hit area */}
                  <path d={d} stroke="transparent" strokeWidth={18} fill="none"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => onConnClick(e, conn.id)}
                    onDoubleClick={(e) => onConnDblClick(e, conn.id)}
                  />
                  {/* Visible path */}
                  <path
                    d={d}
                    stroke={isSel ? '#ffffff' : '#475569'}
                    strokeWidth={isSel ? 2 : 1.5}
                    fill="none"
                    markerEnd={`url(#${isSel ? ARROW_SEL_ID : ARROW_ID})`}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Connection label */}
                  {conn.label && (
                    <text x={mx} y={my - 6} textAnchor="middle" fill="#94a3b8" fontSize={11}
                      fontFamily="Inter, sans-serif" style={{ pointerEvents: 'none' }}>
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Shapes ── */}
            {shapes.map(renderShape)}
          </svg>

          {/* ── Inline label input overlay ── */}
          {editShape && (
            <div style={{
              position: 'absolute',
              left:   editShape.x * zoom,
              top:    editShape.y * zoom,
              width:  editShape.width  * zoom,
              height: editShape.height * zoom,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'all',
              zIndex: 10,
            }}>
              <input
                ref={editRef}
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={onEditKey}
                style={{
                  width: '88%',
                  background: 'rgba(10,14,22,0.96)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '5px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  fontWeight: 600,
                  textAlign: 'center',
                  padding: '3px 6px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* ── Empty state ── */}
          {shapes.length === 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              textAlign: 'center', color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}>
              <GitFork size={42} style={{ marginBottom: '0.75rem', opacity: 0.25 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>Canvas Flow Chart Kosong</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>Drag shape dari panel kiri ke sini untuk mula</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
