import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://lcuhqxfwhhwlukyskcte.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWhxeGZ3aGh3bHVreXNrY3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjQ3MTUsImV4cCI6MjA4NDQ0MDcxNX0.wb62767TK3HLQGtpbD_J2C_kq3M22SIH_a8W86-SFlo';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWhxeGZ3aGh3bHVreXNrY3RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg2NDcxNSwiZXhwIjoyMDg0NDQwNzE1fQ.5b3a1RbvRS49vSQNKTUihFi4KBFIIhGdd146u1lX_GE';

export default function App() {
  const [vista, setVista] = useState('home');
  const [propiedades, setPropiedades] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [procesando, setProcesando] = useState(null);

  const supabaseFetch = async (table, params = '') => {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.desc${params}`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  };

  const supabasePatch = async (table, id, data) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [propData, visitasData] = await Promise.all([
        supabaseFetch('propiedades'),
        supabaseFetch('visitas')
      ]);
      setPropiedades(propData || []);
      setVisitas(visitasData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vista !== 'home') cargarDatos();
  }, [vista]);

  // ── Cambiar disponibilidad de propiedad ───────────────────────────────────
  const toggleDisponibilidad = async (prop) => {
    const nuevo = prop.disponible === false ? true : false;
    const label = nuevo ? 'disponible' : 'ocupado';
    if (!confirm(`¿Marcar esta propiedad como ${label}?`)) return;
    setProcesando(prop.id);
    try {
      await supabasePatch('propiedades', prop.id, { disponible: nuevo });
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(null);
    }
  };

  // ── Cambiar estado de visita ──────────────────────────────────────────────
  const confirmarVisita = async (id) => {
    setProcesando(id);
    try {
      await supabasePatch('visitas', id, { operacion: 'confirmado' });
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(null);
    }
  };

  const cancelarVisita = async (id) => {
    if (!confirm('¿Cancelar esta visita?')) return;
    setProcesando(id);
    try {
      await supabasePatch('visitas', id, { operacion: 'cancelado' });
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(null);
    }
  };

  const restaurarVisita = async (id) => {
    setProcesando(id);
    try {
      await supabasePatch('visitas', id, { operacion: 'pendiente' });
      await cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    const [yyyy, mm, dd] = fechaISO.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatearHora = (hora) => hora ? hora.substring(0, 5) : '-';

  const formatearPrecio = (precio) =>
    precio ? `$${Number(precio).toLocaleString('es-AR')}` : 'Consultar';

  const estadoPropiedad = (prop) => {
    if (prop.disponible === false)
      return { texto: 'Ocupado', clase: 'badge-ocupado', icono: '🔴' };
    return { texto: 'Disponible', clase: 'badge-disponible', icono: '🟢' };
  };

  const estadoVisita = (v) => {
    if (v.operacion === 'confirmado')
      return { texto: 'Confirmada', clase: 'badge-confirmado', icono: '✓' };
    if (v.operacion === 'cancelado')
      return { texto: 'Cancelada', clase: 'badge-cancelado', icono: '✕' };
    return { texto: 'Pendiente', clase: 'badge-pendiente', icono: '⏳' };
  };

  // ── Filtros ───────────────────────────────────────────────────────────────
  const propiedadesFiltradas = propiedades.filter(p => {
    if (filtro === 'disponibles' && p.disponible === false) return false;
    if (filtro === 'ocupadas' && p.disponible !== false) return false;
    if (busqueda) {
      const s = busqueda.toLowerCase();
      return (
        p.direccion?.toLowerCase().includes(s) ||
        p.barrio?.toLowerCase().includes(s) ||
        p.tipologia?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const visitasFiltradas = visitas.filter(v => {
    if (filtro === 'pendientes' && v.operacion !== 'pendiente') return false;
    if (filtro === 'confirmadas' && v.operacion !== 'confirmado') return false;
    if (filtro === 'canceladas' && v.operacion !== 'cancelado') return false;
    if (busqueda) {
      const s = busqueda.toLowerCase();
      return (
        v.nombre?.toLowerCase().includes(s) ||
        v.telefono?.toString().includes(s)
      );
    }
    return true;
  });

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const propDisponibles = propiedades.filter(p => p.disponible !== false).length;
  const propOcupadas    = propiedades.filter(p => p.disponible === false).length;
  const visitasPendientes  = visitas.filter(v => v.operacion === 'pendiente').length;
  const visitasConfirmadas = visitas.filter(v => v.operacion === 'confirmado').length;
  const visitasCanceladas  = visitas.filter(v => v.operacion === 'cancelado').length;

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════════════════════════════════════
  if (vista === 'home') {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { margin: 0 !important; }

          .sp-home {
            width: 100vw; height: 100vh;
            background: #0f0f0f;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            position: relative; overflow: hidden;
            font-family: 'DM Sans', sans-serif;
          }

          /* Líneas decorativas de fondo */
          .sp-home::before {
            content: '';
            position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(196,163,111,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(196,163,111,0.06) 1px, transparent 1px);
            background-size: 60px 60px;
          }

          .sp-home-logo {
            font-family: 'Playfair Display', serif;
            font-size: 13px; font-weight: 400;
            letter-spacing: 8px; text-transform: uppercase;
            color: #c4a36f; margin-bottom: 8px;
          }

          .sp-home-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(42px, 6vw, 76px);
            font-weight: 900; color: #f5f0e8;
            line-height: 1; margin-bottom: 6px;
          }

          .sp-home-subtitle {
            font-size: 14px; color: #666; letter-spacing: 3px;
            text-transform: uppercase; margin-bottom: 64px;
          }

          .sp-home-divider {
            width: 60px; height: 1px; background: #c4a36f;
            margin: 0 auto 64px;
          }

          .sp-home-cards {
            display: flex; gap: 24px; position: relative; z-index: 1;
          }

          .sp-home-card {
            width: 280px; padding: 40px 32px;
            border: 1px solid rgba(196,163,111,0.2);
            background: rgba(255,255,255,0.02);
            cursor: pointer; transition: all 0.35s ease;
            text-align: center; text-decoration: none;
            display: block;
          }

          .sp-home-card:hover {
            border-color: #c4a36f;
            background: rgba(196,163,111,0.06);
            transform: translateY(-4px);
          }

          .sp-home-card-icon {
            font-size: 36px; margin-bottom: 20px; display: block;
          }

          .sp-home-card-title {
            font-family: 'Playfair Display', serif;
            font-size: 22px; color: #f5f0e8;
            margin-bottom: 8px;
          }

          .sp-home-card-desc {
            font-size: 13px; color: #777; line-height: 1.5;
          }

          .sp-corner {
            position: absolute; width: 80px; height: 80px;
            border-color: rgba(196,163,111,0.25); border-style: solid;
          }
          .sp-corner-tl { top: 32px; left: 32px; border-width: 1px 0 0 1px; }
          .sp-corner-tr { top: 32px; right: 32px; border-width: 1px 1px 0 0; }
          .sp-corner-bl { bottom: 32px; left: 32px; border-width: 0 0 1px 1px; }
          .sp-corner-br { bottom: 32px; right: 32px; border-width: 0 1px 1px 0; }
        `}</style>

        <div className="sp-home">
          <div className="sp-corner sp-corner-tl"></div>
          <div className="sp-corner sp-corner-tr"></div>
          <div className="sp-corner sp-corner-bl"></div>
          <div className="sp-corner sp-corner-br"></div>

          <div style={{position:'relative', zIndex:1, textAlign:'center'}}>
            <div className="sp-home-logo">Córdoba Capital</div>
            <div className="sp-home-title">Salomon<br/>Propiedades</div>
            <div className="sp-home-subtitle">Sistema de gestión</div>
            <div className="sp-home-divider"></div>
            <div className="sp-home-cards">
              <div className="sp-home-card" onClick={() => setVista('propiedades')}>
                <span className="sp-home-card-icon">🏠</span>
                <div className="sp-home-card-title">Propiedades</div>
                <div className="sp-home-card-desc">Gestión de stock y disponibilidad</div>
              </div>
              <div className="sp-home-card" onClick={() => setVista('visitas')}>
                <span className="sp-home-card-icon">📅</span>
                <div className="sp-home-card-title">Visitas</div>
                <div className="sp-home-card-desc">Visitas agendadas por el bot</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS COMPARTIDOS (dashboard)
  // ═══════════════════════════════════════════════════════════════════════════
  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0 !important; font-family: 'DM Sans', sans-serif; background: #f8f6f2; }

    .sp-nav {
      background: #0f0f0f; padding: 0 32px;
      display: flex; align-items: center; justify-content: space-between;
      height: 64px; position: sticky; top: 0; z-index: 100;
      border-bottom: 1px solid rgba(196,163,111,0.2);
    }
    .sp-nav-brand {
      font-family: 'Playfair Display', serif;
      font-size: 18px; color: #f5f0e8; letter-spacing: 0.5px;
    }
    .sp-nav-brand span { color: #c4a36f; }
    .sp-nav-back {
      background: none; border: 1px solid rgba(196,163,111,0.4);
      color: #c4a36f; padding: 8px 20px; font-size: 13px;
      cursor: pointer; letter-spacing: 1px; text-transform: uppercase;
      transition: all 0.2s; font-family: 'DM Sans', sans-serif;
    }
    .sp-nav-back:hover { background: rgba(196,163,111,0.1); border-color: #c4a36f; }

    .sp-content { padding: 32px; max-width: 1400px; margin: 0 auto; }

    .sp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .sp-stat {
      background: #fff; padding: 24px; border-top: 3px solid transparent;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .sp-stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 8px; }
    .sp-stat-value { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #0f0f0f; }
    .sp-stat.gold  { border-top-color: #c4a36f; }
    .sp-stat.green { border-top-color: #4caf7d; }
    .sp-stat.red   { border-top-color: #e05c5c; }
    .sp-stat.amber { border-top-color: #e6a817; }
    .sp-stat.blue  { border-top-color: #5b8dd9; }

    .sp-toolbar {
      background: #fff; padding: 16px 20px;
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
      margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .sp-search {
      flex: 1; min-width: 200px; padding: 10px 16px;
      border: 1px solid #e0dbd4; background: #faf9f7;
      font-family: 'DM Sans', sans-serif; font-size: 14px; color: #333;
      outline: none;
    }
    .sp-search:focus { border-color: #c4a36f; }

    .sp-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .sp-filter-btn {
      padding: 8px 16px; border: 1px solid #e0dbd4; background: none;
      font-size: 12px; letter-spacing: 0.5px; cursor: pointer;
      font-family: 'DM Sans', sans-serif; color: #777;
      transition: all 0.2s;
    }
    .sp-filter-btn:hover { border-color: #c4a36f; color: #c4a36f; }
    .sp-filter-btn.active { background: #0f0f0f; border-color: #0f0f0f; color: #f5f0e8; }
    .sp-filter-btn.active-green  { background: #4caf7d; border-color: #4caf7d; color: #fff; }
    .sp-filter-btn.active-red    { background: #e05c5c; border-color: #e05c5c; color: #fff; }
    .sp-filter-btn.active-amber  { background: #e6a817; border-color: #e6a817; color: #fff; }
    .sp-filter-btn.active-blue   { background: #5b8dd9; border-color: #5b8dd9; color: #fff; }

    .sp-table-wrap { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead { background: #0f0f0f; }
    thead th {
      color: #f5f0e8; font-weight: 400; font-size: 11px;
      letter-spacing: 1.5px; text-transform: uppercase;
      padding: 14px 16px; text-align: left; white-space: nowrap;
    }
    tbody tr { border-bottom: 1px solid #f0ede8; transition: background 0.15s; }
    tbody tr:hover { background: #faf9f7; }
    tbody td { padding: 14px 16px; color: #333; vertical-align: middle; }

    .badge-disponible { background: #edf7f2; color: #2d7a51; border: 1px solid #b8e4cf; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; }
    .badge-ocupado    { background: #fdf0f0; color: #c0392b; border: 1px solid #f5c6c6; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; }
    .badge-pendiente  { background: #fef9ec; color: #a07800; border: 1px solid #f5dfa0; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; }
    .badge-confirmado { background: #edf7f2; color: #2d7a51; border: 1px solid #b8e4cf; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; }
    .badge-cancelado  { background: #fdf0f0; color: #c0392b; border: 1px solid #f5c6c6; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; }

    .sp-btn { padding: 7px 14px; font-size: 12px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px; transition: opacity 0.2s; }
    .sp-btn:hover { opacity: 0.85; }
    .sp-btn:disabled { opacity: 0.4; cursor: wait; }
    .sp-btn-disponible { background: #4caf7d; color: #fff; }
    .sp-btn-ocupar     { background: #e05c5c; color: #fff; }
    .sp-btn-confirmar  { background: #4caf7d; color: #fff; }
    .sp-btn-cancelar   { background: #e05c5c; color: #fff; }
    .sp-btn-restaurar  { background: #999; color: #fff; }

    .sp-footer { text-align: center; padding: 16px; font-size: 12px; color: #aaa; letter-spacing: 0.5px; }

    .sp-empty { text-align: center; padding: 64px; color: #bbb; font-size: 15px; }
    .sp-empty-icon { font-size: 40px; margin-bottom: 12px; }

    .sp-spinner { text-align: center; padding: 64px; }
    .sp-spinner-ring {
      width: 40px; height: 40px; border-radius: 50%;
      border: 2px solid #e0dbd4; border-top-color: #c4a36f;
      animation: spin 0.8s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .sp-error { background: #fdf0f0; border: 1px solid #f5c6c6; padding: 24px; margin-bottom: 20px; }
    .sp-error h5 { color: #c0392b; margin-bottom: 8px; }
    .sp-error p { color: #666; font-size: 14px; margin-bottom: 12px; }
    .sp-retry { background: #e05c5c; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; }

    .tipologia-tag {
      display: inline-block; background: #f0ede8; color: #666;
      padding: 2px 8px; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;
    }
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPIEDADES
  // ═══════════════════════════════════════════════════════════════════════════
  if (vista === 'propiedades') {
    return (
      <>
        <style>{sharedStyles}</style>

        <nav className="sp-nav">
          <div className="sp-nav-brand">🏠 <span>Salomon</span> Propiedades — Stock</div>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <button className="sp-nav-back" onClick={cargarDatos}>↺ Actualizar</button>
            <button className="sp-nav-back" onClick={() => { setVista('home'); setBusqueda(''); setFiltro('todas'); }}>← Volver</button>
          </div>
        </nav>

        <div className="sp-content">
          {/* Stats */}
          <div className="sp-stats">
            <div className="sp-stat gold">
              <div className="sp-stat-label">Total</div>
              <div className="sp-stat-value">{propiedades.length}</div>
            </div>
            <div className="sp-stat green">
              <div className="sp-stat-label">Disponibles</div>
              <div className="sp-stat-value">{propDisponibles}</div>
            </div>
            <div className="sp-stat red">
              <div className="sp-stat-label">Ocupadas</div>
              <div className="sp-stat-value">{propOcupadas}</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="sp-toolbar">
            <input
              className="sp-search"
              placeholder="🔍 Buscar por dirección, barrio, tipología..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setFiltro('todas'); }}
            />
            <div className="sp-filters">
              <button className={`sp-filter-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
              <button className={`sp-filter-btn ${filtro === 'disponibles' ? 'active-green' : ''}`} onClick={() => setFiltro('disponibles')}>🟢 Disponibles</button>
              <button className={`sp-filter-btn ${filtro === 'ocupadas' ? 'active-red' : ''}`} onClick={() => setFiltro('ocupadas')}>🔴 Ocupadas</button>
            </div>
          </div>

          {/* Tabla */}
          <div className="sp-table-wrap">
            {loading ? (
              <div className="sp-spinner">
                <div className="sp-spinner-ring"></div>
                <p style={{color:'#aaa', fontSize:14}}>Cargando propiedades...</p>
              </div>
            ) : error ? (
              <div className="sp-error">
                <h5>Error al cargar datos</h5>
                <p>{error}</p>
                <button className="sp-retry" onClick={cargarDatos}>Reintentar</button>
              </div>
            ) : propiedadesFiltradas.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">🏠</div>
                <p>No hay propiedades que mostrar</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Operación</th>
                    <th>Dirección</th>
                    <th>Barrio</th>
                    <th>Ambientes</th>
                    <th>Dormitorios</th>
                    <th>Precio</th>
                    <th>Banco</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {propiedadesFiltradas.map(prop => {
                    const est = estadoPropiedad(prop);
                    const esOcupada = prop.disponible === false;
                    return (
                      <tr key={prop.id}>
                        <td style={{color:'#bbb', fontSize:12}}>#{prop.id}</td>
                        <td><span className="tipologia-tag">{prop.tipologia}</span></td>
                        <td style={{textTransform:'capitalize'}}>{prop.operacion}</td>
                        <td><strong style={{color:'#0f0f0f'}}>{prop.direccion}</strong></td>
                        <td>{prop.barrio}</td>
                        <td style={{textAlign:'center'}}>{prop.ambientes || '-'}</td>
                        <td style={{textAlign:'center'}}>{prop.dormitorios || '-'}</td>
                        <td><strong style={{color:'#c4a36f'}}>{formatearPrecio(prop.precio)}</strong></td>
                        <td style={{textAlign:'center'}}>{prop.apto_banco ? '✓' : '—'}</td>
                        <td><span className={est.clase}>{est.icono} {est.texto}</span></td>
                        <td>
                          <button
                            className={`sp-btn ${esOcupada ? 'sp-btn-disponible' : 'sp-btn-ocupar'}`}
                            onClick={() => toggleDisponibilidad(prop)}
                            disabled={procesando === prop.id}
                          >
                            {procesando === prop.id ? '...' : esOcupada ? 'Marcar disponible' : 'Marcar ocupado'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="sp-footer">
            Mostrando {propiedadesFiltradas.length} de {propiedades.length} propiedades
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VISITAS
  // ═══════════════════════════════════════════════════════════════════════════
  if (vista === 'visitas') {
    return (
      <>
        <style>{sharedStyles}</style>

        <nav className="sp-nav">
          <div className="sp-nav-brand">📅 <span>Salomon</span> Propiedades — Visitas</div>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <button className="sp-nav-back" onClick={cargarDatos}>↺ Actualizar</button>
            <button className="sp-nav-back" onClick={() => { setVista('home'); setBusqueda(''); setFiltro('todas'); }}>← Volver</button>
          </div>
        </nav>

        <div className="sp-content">
          {/* Stats */}
          <div className="sp-stats">
            <div className="sp-stat gold">
              <div className="sp-stat-label">Total</div>
              <div className="sp-stat-value">{visitas.length}</div>
            </div>
            <div className="sp-stat amber">
              <div className="sp-stat-label">Pendientes</div>
              <div className="sp-stat-value">{visitasPendientes}</div>
            </div>
            <div className="sp-stat green">
              <div className="sp-stat-label">Confirmadas</div>
              <div className="sp-stat-value">{visitasConfirmadas}</div>
            </div>
            <div className="sp-stat red">
              <div className="sp-stat-label">Canceladas</div>
              <div className="sp-stat-value">{visitasCanceladas}</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="sp-toolbar">
            <input
              className="sp-search"
              placeholder="🔍 Buscar por nombre o teléfono..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setFiltro('todas'); }}
            />
            <div className="sp-filters">
              <button className={`sp-filter-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
              <button className={`sp-filter-btn ${filtro === 'pendientes' ? 'active-amber' : ''}`} onClick={() => setFiltro('pendientes')}>⏳ Pendientes</button>
              <button className={`sp-filter-btn ${filtro === 'confirmadas' ? 'active-green' : ''}`} onClick={() => setFiltro('confirmadas')}>✓ Confirmadas</button>
              <button className={`sp-filter-btn ${filtro === 'canceladas' ? 'active-red' : ''}`} onClick={() => setFiltro('canceladas')}>✕ Canceladas</button>
            </div>
          </div>

          {/* Tabla */}
          <div className="sp-table-wrap">
            {loading ? (
              <div className="sp-spinner">
                <div className="sp-spinner-ring"></div>
                <p style={{color:'#aaa', fontSize:14}}>Cargando visitas...</p>
              </div>
            ) : error ? (
              <div className="sp-error">
                <h5>Error al cargar datos</h5>
                <p>{error}</p>
                <button className="sp-retry" onClick={cargarDatos}>Reintentar</button>
              </div>
            ) : visitasFiltradas.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">📅</div>
                <p>No hay visitas que mostrar</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Propiedad</th>
                    <th>Estado</th>
                    <th style={{width:200}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visitasFiltradas.map(v => {
                    const est = estadoVisita(v);
                    const esPendiente  = v.operacion === 'pendiente';
                    const esConfirmada = v.operacion === 'confirmado';
                    const esCancelada  = v.operacion === 'cancelado';
                    // Buscar dirección de la propiedad
                    const propiedad = propiedades.find(p => p.id === v.id_propiedad);
                    return (
                      <tr key={v.id}>
                        <td style={{color:'#bbb', fontSize:12}}>#{v.id}</td>
                        <td><strong>{formatearFecha(v.fecha)}</strong></td>
                        <td>{formatearHora(v.hora)}</td>
                        <td><strong style={{color:'#0f0f0f'}}>{v.nombre}</strong></td>
                        <td>{v.telefono}</td>
                        <td>
                          {propiedad ? (
                            <span>
                              <span className="tipologia-tag">{propiedad.tipologia}</span>
                              <span style={{marginLeft:6, fontSize:13, color:'#555'}}>{propiedad.direccion}</span>
                            </span>
                          ) : (
                            <span style={{color:'#bbb'}}>ID #{v.id_propiedad}</span>
                          )}
                        </td>
                        <td><span className={est.clase}>{est.icono} {est.texto}</span></td>
                        <td>
                          <div style={{display:'flex', gap:6}}>
                            {esPendiente && (
                              <button className="sp-btn sp-btn-confirmar" onClick={() => confirmarVisita(v.id)} disabled={procesando === v.id}>
                                {procesando === v.id ? '...' : '✓ Confirmar'}
                              </button>
                            )}
                            {esPendiente && (
                              <button className="sp-btn sp-btn-cancelar" onClick={() => cancelarVisita(v.id)} disabled={procesando === v.id}>
                                {procesando === v.id ? '...' : '✕ Cancelar'}
                              </button>
                            )}
                            {(esConfirmada || esCancelada) && (
                              <button className="sp-btn sp-btn-restaurar" onClick={() => restaurarVisita(v.id)} disabled={procesando === v.id}>
                                {procesando === v.id ? '...' : '↺ Pendiente'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="sp-footer">
            Mostrando {visitasFiltradas.length} de {visitas.length} visitas totales
          </div>
        </div>
      </>
    );
  }
}
