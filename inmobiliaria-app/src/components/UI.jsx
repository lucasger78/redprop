// Shared UI primitives — estética CRM dark navy/purple

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-purple-500 animate-spin-smooth" />
      <p className="text-white/40 text-sm tracking-widest uppercase">Cargando...</p>
    </div>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/30">
      <span className="text-5xl">{icon}</span>
      <p className="text-sm tracking-wider uppercase">{text}</p>
    </div>
  );
}

export function ErrorPanel({ msg, onRetry }) {
  return (
    <div className="m-6 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
      <p className="text-red-400 font-semibold mb-2">Error de conexión</p>
      <p className="text-white/60 text-sm mb-4">{msg}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors">
        Reintentar
      </button>
    </div>
  );
}

export function Badge({ type }) {
  const map = {
    disponible: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    ocupado:    'bg-red-500/15 text-red-400 border border-red-500/30',
    pendiente:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    confirmado: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cancelado:  'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  const labels = { disponible:'Disponible', ocupado:'Ocupada', pendiente:'Pendiente', confirmado:'Confirmada', cancelado:'Cancelada' };
  return <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${map[type] || map.pendiente}`}>{labels[type] || type}</span>;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up rounded-2xl"
        style={{ background: '#131026', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-semibold text-lg font-display">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 pb-6 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none transition-colors ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors ${className}`}
      style={{ background: '#131026', borderColor: 'rgba(255,255,255,0.1)' }}
      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full border rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none transition-colors resize-y min-h-[80px] ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      {...props}
    />
  );
}

export function Btn({ variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary:   'text-white',
    secondary: 'bg-white/10 hover:bg-white/15 text-white/80',
    danger:    'bg-red-500/20 hover:bg-red-500/30 text-red-400',
    success:   'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400',
    ghost:     'border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80',
  };
  const primaryStyle = variant === 'primary'
    ? { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }
    : {};
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-wait ${variants[variant]} ${className}`}
      style={primaryStyle}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value, color = 'purple' }) {
  const colors = {
    gold:    { border: '#facc15', glow: 'rgba(250,204,21,0.1)' },
    green:   { border: '#34d399', glow: 'rgba(52,211,153,0.1)' },
    red:     { border: '#f87171', glow: 'rgba(248,113,113,0.1)' },
    amber:   { border: '#fbbf24', glow: 'rgba(251,191,36,0.1)' },
    blue:    { border: '#22d3ee', glow: 'rgba(34,211,238,0.1)' },
    purple:  { border: '#a78bfa', glow: 'rgba(167,139,250,0.1)' },
  };
  const c = colors[color] || colors.purple;
  return (
    <div className="rounded-xl p-5 border-t-2" style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(255,255,255,0.06)`,
      borderTopColor: c.border,
      borderTopWidth: '2px',
      boxShadow: `0 4px 20px ${c.glow}`,
    }}>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-white font-display">{value}</p>
    </div>
  );
}

export function Navbar({ title, onBack, onRefresh, extra }) {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl px-6 h-16 flex items-center justify-between"
      style={{ background: 'rgba(13,11,24,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-bold gradient-text">Red Prop</span>
        <span className="text-white/20">|</span>
        <span className="text-white/60 text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra}
        <button onClick={onRefresh} className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-purple-400 hover:bg-white/8 rounded-lg transition-colors text-base">↺</button>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-white/60 hover:text-white/80 rounded-lg text-sm transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          ← Inicio
        </button>
      </div>
    </nav>
  );
}
