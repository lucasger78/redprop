import { useEffect, useState, useRef } from 'react';
import { supabaseFetch, fmt, TABLES } from '../lib.js';

// ─── MINI ICONS ────────────────────────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  DollarSign: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  ),
  Building: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

// ─── DONUT CHART ───────────────────────────────────────────────────────────────
function DonutChart({ data, size = 120, thickness = 22 }) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  const segments = data.map((d) => {
    const dash = total > 0 ? (d.value / total) * circumference : 0;
    const gap = circumference - dash;
    const seg = { ...d, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={-seg.offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      ))}
    </svg>
  );
}

// ─── MINI LINE CHART ───────────────────────────────────────────────────────────
function MiniLineChart({ data, color = '#8b5cf6', color2 = '#22d3ee', width = 300, height = 80 }) {
  if (!data || data.length < 2) return <div style={{height}} className="flex items-center justify-center text-white/20 text-xs">Sin datos</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * w},${pad + h - ((v - min) / range) * h}`).join(' ');
  const areaPath = pts.split(' ');
  const area = `M${pad},${pad + h} L${areaPath.join(' L')} L${pad + w},${pad + h} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`lg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lg${color.replace('#','')})`} />
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        i === data.indexOf(max) ? (
          <circle key={i} cx={pad + (i / (data.length - 1)) * w} cy={pad + h - ((v - min) / range) * h} r="4" fill={color2} stroke="#0d0b18" strokeWidth="2" />
        ) : null
      ))}
    </svg>
  );
}

// ─── ANIMATED STAT CARD ────────────────────────────────────────────────────────
function KPICard({ label, value, sub, gradient, icon: IconComp, trend, trendUp }) {
  return (
    <div className="crm-card p-5 relative overflow-hidden flex flex-col gap-3">
      <div className="absolute inset-0 opacity-10" style={{ background: gradient }} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-white font-display animate-count">{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: gradient, opacity: 0.8 }}>
          {IconComp && <IconComp />}
        </div>
      </div>
      {trend != null && (
        <div className={`relative z-10 flex items-center gap-1.5 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          <span>{trendUp ? '▲' : '▼'}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ─── MINI BAR CHART ────────────────────────────────────────────────────────────
function BarChartWidget({ data, maxH = 80 }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: maxH }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="chart-bar w-full"
            style={{
              height: `${Math.max(6, (d.value / maxVal) * (maxH - 18))}px`,
              background: d.color || 'linear-gradient(to top, #8b5cf6, #22d3ee)',
            }}
          />
          <span className="text-[9px] text-white/30 whitespace-nowrap truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, goTo }) {
  const navItems = [
    { id: 'dashboard', icon: <Icon.BarChart />, label: 'Dashboard' },
    { id: 'propiedades', icon: <Icon.Home />, label: 'Propiedades' },
    { id: 'visitas', icon: <Icon.Calendar />, label: 'Visitas' },
    { id: 'inquilinos', icon: <Icon.Users />, label: 'Inquilinos' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-52 flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #0e0b1f 0%, #0d0b18 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)' }}>
            <Icon.Building />
          </div>
          <div>
            <p className="text-white font-bold font-display text-sm leading-tight">Red Prop</p>
            <p className="text-white/30 text-[10px]">CRM Inmobiliario</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <p className="text-[10px] text-white/20 uppercase tracking-widest px-2 mb-2">Principal</p>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => item.id === 'dashboard' ? setActive('dashboard') : goTo(item.id)}
            className={`sidebar-item text-left w-full ${active === item.id ? 'active' : ''}`}
          >
            <span className={active === item.id ? 'text-purple-400' : 'text-white/30'}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <p className="text-[10px] text-white/20 uppercase tracking-widest px-2 mb-2 mt-4">Módulos</p>
        <button
          onClick={() => goTo('barrios')}
          className={`sidebar-item text-left w-full ${active === 'barrios' ? 'active' : ''}`}
        >
          <span className={active === 'barrios' ? 'text-purple-400' : 'text-white/30'}><Icon.MapPin /></span>
          <span>Barrios</span>
        </button>
        <button
          onClick={() => goTo('reportes')}
          className={`sidebar-item text-left w-full ${active === 'reportes' ? 'active' : ''}`}
        >
          <span className={active === 'reportes' ? 'text-purple-400' : 'text-white/30'}><Icon.TrendingUp /></span>
          <span>Reportes</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <a
          href="https://lucasconti.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-white/20 hover:text-purple-400 transition-colors"
        >
          Lucas Conti Dev © {new Date().getFullYear()}
        </a>
      </div>
    </aside>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard({ goTo }) {
  const [data, setData] = useState({ props: [], visits: [], tenants: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [props, visits, tenants] = await Promise.all([
        supabaseFetch(TABLES.properties),
        supabaseFetch(TABLES.visits),
        supabaseFetch(TABLES.tenants),
      ]);
      setData({ props: props || [], visits: visits || [], tenants: tenants || [] });
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const { props, visits, tenants } = data;

  // ── KPIs ──
  const totalProps = props.length;
  const disponibles = props.filter(p => p.operacion !== null).length;
  const ocupadas = props.filter(p => p.operacion === null).length;
  const enAlquiler = props.filter(p => p.operacion === 'alquiler').length;
  const enVenta = props.filter(p => p.operacion === 'venta').length;
  const totalVisitas = visits.length;
  const visitasPendientes = visits.filter(v => v.operacion === 'pendiente').length;
  const visitasConfirmadas = visits.filter(v => v.operacion === 'confirmado').length;
  const totalInquilinos = tenants.length;
  const recaudacion = tenants.reduce((s, i) => s + (Number(i.alquiler) || 0), 0);
  const recaudacionTotal = tenants.reduce((s, i) =>
    s + (Number(i.alquiler) || 0) + (Number(i.impuestos) || 0) + (Number(i.servicios) || 0), 0);
  const aptosBanco = props.filter(p => p.apto_banco === 1 || p.apto_banco === true).length;
  const tasaOcupacion = totalProps > 0 ? Math.round((ocupadas / totalProps) * 100) : 0;
  const tasaDisponibilidad = totalProps > 0 ? Math.round((disponibles / totalProps) * 100) : 0;

  // ── Tipologías para donut ──
  const tipoCount = props.reduce((acc, p) => {
    const t = p.tipologia || 'Otro';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const tipoColors = ['#8b5cf6', '#22d3ee', '#f472b6', '#facc15', '#34d399', '#f97316'];
  const donutData = Object.entries(tipoCount).map(([k, v], i) => ({
    label: k, value: v, color: tipoColors[i % tipoColors.length],
  }));

  // ── Barrios top ──
  const barrioCount = props.reduce((acc, p) => {
    const b = p.barrio || 'Otro';
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {});
  const barrioTop = Object.entries(barrioCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const barrioBarData = barrioTop.map(([label, value], i) => ({
    label: label.split(' ')[0],
    value,
    color: `linear-gradient(to top, ${tipoColors[i % tipoColors.length]}88, ${tipoColors[i % tipoColors.length]})`,
  }));

  // ── Visitas recientes ──
  const visitasRecientes = [...visits]
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
    .slice(0, 6);

  // ── Precio promedio por operación ──
  const precioAlquilerProm = (() => {
    const arr = props.filter(p => p.operacion === 'alquiler' && p.precio > 0);
    return arr.length ? arr.reduce((s, p) => s + Number(p.precio), 0) / arr.length : 0;
  })();
  const precioVentaProm = (() => {
    const arr = props.filter(p => p.operacion === 'venta' && p.precio > 0);
    return arr.length ? arr.reduce((s, p) => s + Number(p.precio), 0) / arr.length : 0;
  })();

  // ── Mini line data (tendencia por grupos de IDs) ──
  const lineData = (() => {
    if (visits.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const sorted = [...visits].sort((a, b) => a.id - b.id);
    const chunk = Math.ceil(sorted.length / 7) || 1;
    return Array.from({ length: 7 }, (_, i) => sorted.slice(i * chunk, (i + 1) * chunk).length);
  })();

  if (loading) {
    return (
      <div className="ml-52 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-purple-500 animate-spin-smooth" />
          <p className="text-white/40 text-sm tracking-widest uppercase">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-52 min-h-screen p-6" style={{ background: '#0d0b18' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ left: '13rem' }}>
        <div className="absolute top-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full blur-[100px] opacity-15"
          style={{ background: 'radial-gradient(circle, #22d3ee, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Dashboard <span className="gradient-text">Red Prop</span></h1>
            <p className="text-white/40 text-sm mt-0.5">
              {lastUpdate ? `Última actualización: ${lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Icon.RefreshCw /> Actualizar
          </button>
        </div>

        {/* KPIs row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="Total Propiedades"
            value={totalProps}
            sub={`${aptosBanco} aptas banco`}
            gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
            icon={Icon.Home}
          />
          <KPICard
            label="Disponibles"
            value={disponibles}
            sub={`${tasaDisponibilidad}% del stock`}
            gradient="linear-gradient(135deg, #22d3ee, #0e7490)"
            icon={Icon.Building}
            trend={`${enAlquiler} alquiler · ${enVenta} venta`}
            trendUp={true}
          />
          <KPICard
            label="Visitas Agendadas"
            value={totalVisitas}
            sub={`${visitasPendientes} pendientes · ${visitasConfirmadas} confirmadas`}
            gradient="linear-gradient(135deg, #f472b6, #be185d)"
            icon={Icon.Calendar}
          />
          <KPICard
            label="Recaudación Mensual"
            value={fmt.monto(recaudacion)}
            sub={`Total c/gastos: ${fmt.monto(recaudacionTotal)}`}
            gradient="linear-gradient(135deg, #facc15, #b45309)"
            icon={Icon.DollarSign}
            trend={`${totalInquilinos} inquilinos activos`}
            trendUp={true}
          />
        </div>

        {/* Row 2: mini stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Ocupadas', value: ocupadas, pct: tasaOcupacion, color: '#f472b6' },
            { label: 'En Alquiler', value: enAlquiler, pct: totalProps > 0 ? Math.round((enAlquiler/totalProps)*100) : 0, color: '#22d3ee' },
            { label: 'En Venta', value: enVenta, pct: totalProps > 0 ? Math.round((enVenta/totalProps)*100) : 0, color: '#facc15' },
            { label: 'Inquilinos', value: totalInquilinos, pct: totalProps > 0 ? Math.round((totalInquilinos/totalProps)*100) : 0, color: '#34d399' },
          ].map((s, i) => (
            <div key={i} className="crm-card p-4">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs text-white/40 uppercase tracking-widest">{s.label}</p>
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.pct}%</span>
              </div>
              <p className="text-2xl font-bold text-white font-display mb-3">{s.value}</p>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Distribución tipología */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Distribución por Tipología</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <DonutChart data={donutData.length > 0 ? donutData : [{ label: 'Sin datos', value: 1, color: '#2d2060' }]} size={120} thickness={20} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-white font-display">{totalProps}</p>
                  <p className="text-[10px] text-white/40">total</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {donutData.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-white/60 truncate flex-1">{d.label}</span>
                    <span className="text-xs font-bold text-white/80">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barrios top */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Stock por Barrio</h3>
              <span className="text-xs text-white/30">{barrioTop.length} barrios</span>
            </div>
            {barrioBarData.length > 0 ? (
              <BarChartWidget data={barrioBarData} maxH={100} />
            ) : (
              <div className="flex items-center justify-center h-20 text-white/20 text-xs">Sin datos</div>
            )}
          </div>

          {/* Tendencia visitas */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Tendencia Visitas</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-cyan-400"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                Total: {totalVisitas}
              </span>
            </div>
            <MiniLineChart data={lineData} color="#8b5cf6" color2="#22d3ee" width={280} height={80} />
            <div className="flex justify-between mt-3 text-[10px] text-white/30">
              <span>Inicio</span><span>Reciente</span>
            </div>
          </div>
        </div>

        {/* Row 4: Precios + Visitas recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

          {/* Precios promedio */}
          <div className="crm-card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white/90 mb-4">Precios Promedio</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-white/50">🏠 Alquiler</span>
                  <span className="text-sm font-bold" style={{ color: '#22d3ee' }}>{fmt.precio(Math.round(precioAlquilerProm))}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }} />
                </div>
                <p className="text-[10px] text-white/30 mt-1">{enAlquiler} propiedades en alquiler</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-white/50">💰 Venta</span>
                  <span className="text-sm font-bold" style={{ color: '#facc15' }}>{fmt.precio(Math.round(precioVentaProm))}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '45%', background: 'linear-gradient(90deg, #f472b6, #facc15)' }} />
                </div>
                <p className="text-[10px] text-white/30 mt-1">{enVenta} propiedades en venta</p>
              </div>

              {/* Operación split */}
              <div className="pt-3 border-t border-white/5">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Distribución operación</p>
                <div className="flex gap-2">
                  {[
                    { label: 'Alquiler', value: enAlquiler, color: '#22d3ee' },
                    { label: 'Venta', value: enVenta, color: '#facc15' },
                    { label: 'Ocupadas', value: ocupadas, color: '#f472b6' },
                  ].map((o, i) => (
                    <div key={i} className="flex-1 text-center p-2 rounded-lg" style={{ background: `${o.color}12` }}>
                      <p className="text-lg font-bold" style={{ color: o.color }}>{o.value}</p>
                      <p className="text-[9px] text-white/40">{o.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Visitas recientes */}
          <div className="crm-card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Visitas Recientes</h3>
              <button
                onClick={() => goTo('visitas')}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Ver todas <Icon.ChevronRight />
              </button>
            </div>
            {visitasRecientes.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-white/20 text-xs">Sin visitas registradas</div>
            ) : (
              <div className="space-y-2">
                {visitasRecientes.map((v) => {
                  const prop = props.find(p => p.id === v.id_propiedad);
                  const statusColors = {
                    pendiente: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)', label: 'Pendiente' },
                    confirmado: { bg: 'rgba(52,211,153,0.1)', text: '#34d399', border: 'rgba(52,211,153,0.2)', label: 'Confirmada' },
                    cancelado: { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.2)', label: 'Cancelada' },
                  };
                  const sc = statusColors[v.operacion] || statusColors.pendiente;
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-purple-400"
                        style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <Icon.Calendar />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{v.nombre}</p>
                        <p className="text-xs text-white/40 truncate">
                          {fmt.fecha(v.fecha)} {fmt.hora(v.hora)} · {prop ? prop.direccion : `#${v.id_propiedad}`}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Inquilinos + Propiedades recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Finanzas inquilinos */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white/90">Finanzas Inquilinos</h3>
              <button onClick={() => goTo('inquilinos')} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Ver todos <Icon.ChevronRight />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Alquileres', val: tenants.reduce((s, i) => s + (Number(i.alquiler) || 0), 0), color: '#22d3ee' },
                { label: 'Impuestos', val: tenants.reduce((s, i) => s + (Number(i.impuestos) || 0), 0), color: '#facc15' },
                { label: 'Servicios', val: tenants.reduce((s, i) => s + (Number(i.servicios) || 0), 0), color: '#34d399' },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl" style={{ background: `${item.color}10` }}>
                  <p className="text-xs text-white/40 mb-1">{item.label}</p>
                  <p className="text-sm font-bold" style={{ color: item.color }}>{fmt.monto(item.val)}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl flex justify-between items-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <span className="text-sm text-white/60">Total mensual proyectado</span>
              <span className="text-lg font-bold gradient-text font-display">{fmt.monto(recaudacionTotal)}</span>
            </div>
          </div>

          {/* Propiedades recientes */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Stock Reciente</h3>
              <button onClick={() => goTo('propiedades')} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Ver todas <Icon.ChevronRight />
              </button>
            </div>
            {props.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-white/20 text-xs">Sin propiedades</div>
            ) : (
              <div className="space-y-2">
                {props.slice(0, 5).map((p) => {
                  const isDisp = p.operacion !== null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: isDisp ? 'rgba(34,211,238,0.1)' : 'rgba(248,113,113,0.1)' }}>
                        <Icon.Home />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{p.direccion}</p>
                        <p className="text-xs text-white/40">{p.barrio} · {p.tipologia} · {p.ambientes} amb.</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold capitalize" style={{ color: isDisp ? '#22d3ee' : '#f87171' }}>
                          {isDisp ? p.operacion || '—' : 'Ocupada'}
                        </p>
                        <p className="text-[10px] text-white/50">{fmt.precio(p.precio)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Sidebar };
