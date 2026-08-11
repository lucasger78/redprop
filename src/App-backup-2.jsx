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

  // Modal de creación de propiedad
  const [showModalPropiedad, setShowModalPropiedad] = useState(false);
  const [guardandoPropiedad, setGuardandoPropiedad] = useState(false);
  const [errorFormProp, setErrorFormProp] = useState(null);
  const [formPropiedad, setFormPropiedad] = useState({
    tipologia: 'departamento',
    operacion: 'alquiler',
    direccion: '',
    barrio: '',
    ambientes: '',
    dormitorios: '',
    descripcion: '',
    apto_banco: false,
    precio: '',
    cod_zp: '',
    cod_lvi: '',
    imagen: '',
    requisitos: ''
  });

  // Modal de cambiar operación cuando se libera propiedad ocupada
  const [showModalOperacion, setShowModalOperacion] = useState(false);
  const [propiedadTemp, setPropiedadTemp] = useState(null);

  const BARRIOS = [
    'Alberdi', 'Alta Córdoba', 'Argüello', 'Cerro de las Rosas', 'Cofico',
    'General Paz', 'Güemes', 'Jardín', 'Las Rosas', 'Los Boulevares',
    'Nueva Córdoba', 'Poeta Lugones', 'Quintas de Santa Ana', 'San Vicente',
    'Urca', 'Valle Escondido', 'Villa Allende Parque', 'Villa Belgrano',
    'Villa Cabrera', 'Villa Eucarística', 'Villa Los Troncos', 'Villa Warcalde'
  ];

  const supabaseFetch = async (table, params = '') => {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.desc${params}`;
    console.log('📡 Fetching:', url);
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    console.log(`✅ ${table}:`, data);
    return data;
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

  const supabasePost = async (table, data) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error ${response.status}: ${errText}`);
    }
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
      console.log('📊 Totales:', { propiedades: propData?.length, visitas: visitasData?.length });
    } catch (err) {
      setError(err.message);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vista !== 'home') cargarDatos();
  }, [vista]);

  // ── Cambiar disponibilidad de propiedad ───────────────────────────────────
  const toggleDisponibilidad = async (prop) => {
    const esOcupada = prop.operacion === null;
    
    if (esOcupada) {
      // Si está ocupada (operacion = null), preguntar qué operación asignar
      setPropiedadTemp(prop);
      setShowModalOperacion(true);
    } else {
      // Si está disponible, marcar como ocupada (operacion = null)
      if (!confirm('¿Marcar esta propiedad como ocupada?')) return;
      setProcesando(prop.id);
      try {
        await supabasePatch('propiedades', prop.id, { operacion: null });
        await cargarDatos();
        alert('✅ Propiedad marcada como ocupada');
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        setProcesando(null);
      }
    }
  };

  const confirmarOperacion = async (nuevaOperacion) => {
    if (!propiedadTemp) return;
    setProcesando(propiedadTemp.id);
    try {
      await supabasePatch('propiedades', propiedadTemp.id, { operacion: nuevaOperacion });
      await cargarDatos();
      alert(`✅ Propiedad marcada como disponible para ${nuevaOperacion}`);
      setShowModalOperacion(false);
      setPropiedadTemp(null);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(null);
    }
  };

  // ── Crear propiedad ────────────────────────────────────────────────────────
  const crearPropiedad = async () => {
    setGuardandoPropiedad(true);
    setErrorFormProp(null);
    try {
      if (!formPropiedad.direccion || !formPropiedad.barrio) {
        throw new Error('Dirección y barrio son obligatorios');
      }

      const propData = {
        tipologia: formPropiedad.tipologia,
        operacion: formPropiedad.operacion,
        direccion: formPropiedad.direccion.trim(),
        barrio: formPropiedad.barrio,
        ambientes: formPropiedad.ambientes ? parseInt(formPropiedad.ambientes, 10) : null,
        dormitorios: formPropiedad.dormitorios ? parseInt(formPropiedad.dormitorios, 10) : null,
        descripcion: formPropiedad.descripcion.trim() || null,
        apto_banco: formPropiedad.apto_banco,
        precio: formPropiedad.precio ? parseFloat(formPropiedad.precio) : null,
        cod_zp: formPropiedad.cod_zp.trim() || null,
        cod_lvi: formPropiedad.cod_lvi.trim() || null,
        imagen: formPropiedad.imagen.trim() || null,
        requisitos: formPropiedad.requisitos.trim() || null
      };

      await supabasePost('propiedades', propData);
      setShowModalPropiedad(false);
      setFormPropiedad({
        tipologia: 'departamento',
        operacion: 'alquiler',
        direccion: '',
        barrio: '',
        ambientes: '',
        dormitorios: '',
        descripcion: '',
        apto_banco: false,
        precio: '',
        cod_zp: '',
        cod_lvi: '',
        imagen: '',
        requisitos: ''
      });
      await cargarDatos();
      alert('✅ Propiedad creada exitosamente');
    } catch (err) {
      setErrorFormProp(err.message);
    } finally {
      setGuardandoPropiedad(false);
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
    if (prop.operacion === null)
      return { texto: 'Ocupada', clase: 'badge-ocupado', icono: '🔴' };
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
    if (filtro === 'disponibles' && p.operacion === null) return false;
    if (filtro === 'ocupadas' && p.operacion !== null) return false;
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
  const propDisponibles = propiedades.filter(p => p.operacion !== null).length;
  const propOcupadas    = propiedades.filter(p => p.operacion === null).length;
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
          .sp-home { width: 100vw; height: 100vh; background: #0f0f0f; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; font-family: 'DM Sans', sans-serif; }
          .sp-home::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(196,163,111,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(196,163,111,0.06) 1px, transparent 1px); background-size: 60px 60px; }
          .sp-home-logo { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 400; letter-spacing: 8px; text-transform: uppercase; color: #c4a36f; margin-bottom: 8px; }
          .sp-home-title { font-family: 'Playfair Display', serif; font-size: clamp(42px, 6vw, 76px); font-weight: 900; color: #f5f0e8; line-height: 1; margin-bottom: 6px; }
          .sp-home-subtitle { font-size: 14px; color: #666; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 64px; }
          .sp-home-divider { width: 60px; height: 1px; background: #c4a36f; margin: 0 auto 64px; }
          .sp-home-cards { display: flex; gap: 24px; position: relative; z-index: 1; }
          .sp-home-card { width: 280px; padding: 40px 32px; border: 1px solid rgba(196,163,111,0.2); background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.35s ease; text-align: center; text-decoration: none; display: block; }
          .sp-home-card:hover { border-color: #c4a36f; background: rgba(196,163,111,0.06); transform: translateY(-4px); }
          .sp-home-card-icon { font-size: 36px; margin-bottom: 20px; display: block; }
          .sp-home-card-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #f5f0e8; margin-bottom: 8px; }
          .sp-home-card-desc { font-size: 13px; color: #777; line-height: 1.5; }
          .sp-corner { position: absolute; width: 80px; height: 80px; border-color: rgba(196,163,111,0.25); border-style: solid; }
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
  // ESTILOS COMPARTIDOS
  // ═══════════════════════════════════════════════════════════════════════════
  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0 !important; font-family: 'DM Sans', sans-serif; background: #f8f6f2; }
    .sp-nav { background: #0f0f0f; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(196,163,111,0.2); }
    .sp-nav-brand { font-family: 'Playfair Display', serif; font-size: 18px; color: #f5f0e8; letter-spacing: 0.5px; }
    .sp-nav-brand span { color: #c4a36f; }
    .sp-nav-back { background: none; border: 1px solid rgba(196,163,111,0.4); color: #c4a36f; padding: 8px 20px; font-size: 13px; cursor: pointer; letter-spacing: 1px; text-transform: uppercase; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
    .sp-nav-back:hover { background: rgba(196,163,111,0.1); border-color: #c4a36f; }
    .sp-content { padding: 32px; max-width: 1400px; margin: 0 auto; }
    .sp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .sp-stat { background: #fff; padding: 24px; border-top: 3px solid transparent; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .sp-stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 8px; }
    .sp-stat-value { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #0f0f0f; }
    .sp-stat.gold  { border-top-color: #c4a36f; }
    .sp-stat.green { border-top-color: #4caf7d; }
    .sp-stat.red   { border-top-color: #e05c5c; }
    .sp-stat.amber { border-top-color: #e6a817; }
    .sp-toolbar { background: #fff; padding: 16px 20px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .sp-search { flex: 1; min-width: 200px; padding: 10px 16px; border: 1px solid #e0dbd4; background: #faf9f7; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #333; outline: none; }
    .sp-search:focus { border-color: #c4a36f; }
    .sp-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .sp-filter-btn { padding: 8px 16px; border: 1px solid #e0dbd4; background: none; font-size: 12px; letter-spacing: 0.5px; cursor: pointer; font-family: 'DM Sans', sans-serif; color: #777; transition: all 0.2s; }
    .sp-filter-btn:hover { border-color: #c4a36f; color: #c4a36f; }
    .sp-filter-btn.active { background: #0f0f0f; border-color: #0f0f0f; color: #f5f0e8; }
    .sp-filter-btn.active-green  { background: #4caf7d; border-color: #4caf7d; color: #fff; }
    .sp-filter-btn.active-red    { background: #e05c5c; border-color: #e05c5c; color: #fff; }
    .sp-filter-btn.active-amber  { background: #e6a817; border-color: #e6a817; color: #fff; }
    .sp-table-wrap { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead { background: #0f0f0f; }
    thead th { color: #f5f0e8; font-weight: 400; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; padding: 14px 16px; text-align: left; white-space: nowrap; }
    tbody tr { border-bottom: 1px solid #f0ede8; transition: background 0.15s; }
    tbody tr:hover { background: #faf9f7; }
    tbody td { padding: 14px 16px; color: #333; vertical-align: middle; }
    .badge-disponible { background: #edf7f2; color: #2d7a51; border: 1px solid #b8e4cf; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; display: inline-block; }
    .badge-ocupado    { background: #fdf0f0; color: #c0392b; border: 1px solid #f5c6c6; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; display: inline-block; }
    .badge-pendiente  { background: #fef9ec; color: #a07800; border: 1px solid #f5dfa0; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; display: inline-block; }
    .badge-confirmado { background: #edf7f2; color: #2d7a51; border: 1px solid #b8e4cf; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; display: inline-block; }
    .badge-cancelado  { background: #fdf0f0; color: #c0392b; border: 1px solid #f5c6c6; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 500; display: inline-block; }
    .sp-btn { padding: 7px 14px; font-size: 12px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px; transition: opacity 0.2s; }
    .sp-btn:hover { opacity: 0.85; }
    .sp-btn:disabled { opacity: 0.4; cursor: wait; }
    .sp-btn-disponible { background: #4caf7d; color: #fff; }
    .sp-btn-ocupar     { background: #e05c5c; color: #fff; }
    .sp-btn-confirmar  { background: #4caf7d; color: #fff; }
    .sp-btn-cancelar   { background: #e05c5c; color: #fff; }
    .sp-btn-restaurar  { background: #999; color: #fff; }
    .sp-btn-add        { background: #c4a36f; color: #fff; padding: 10px 24px; }
    .sp-footer { text-align: center; padding: 16px; font-size: 12px; color: #aaa; letter-spacing: 0.5px; }
    .sp-empty { text-align: center; padding: 64px; color: #bbb; font-size: 15px; }
    .sp-empty-icon { font-size: 40px; margin-bottom: 12px; }
    .sp-spinner { text-align: center; padding: 64px; }
    .sp-spinner-ring { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e0dbd4; border-top-color: #c4a36f; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sp-error { background: #fdf0f0; border: 1px solid #f5c6c6; padding: 24px; margin-bottom: 20px; }
    .sp-error h5 { color: #c0392b; margin-bottom: 8px; }
    .sp-error p { color: #666; font-size: 14px; margin-bottom: 12px; }
    .sp-retry { background: #e05c5c; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
    .tipologia-tag { display: inline-block; background: #f0ede8; color: #666; padding: 2px 8px; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; }
    .sp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
    .sp-modal { background: #fff; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .sp-modal-header { background: #0f0f0f; color: #f5f0e8; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .sp-modal-title { font-family: 'Playfair Display', serif; font-size: 20px; }
    .sp-modal-close { background: none; border: none; color: #c4a36f; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
    .sp-modal-body { padding: 24px; }
    .sp-form-group { margin-bottom: 16px; }
    .sp-form-label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; }
    .sp-form-input, .sp-form-select, .sp-form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #e0dbd4; font-family: 'DM Sans', sans-serif; font-size: 14px; background: #faf9f7; outline: none; }
    .sp-form-input:focus, .sp-form-select:focus, .sp-form-textarea:focus { border-color: #c4a36f; }
    .sp-form-textarea { resize: vertical; min-height: 80px; }
    .sp-form-checkbox-wrap { display: flex; align-items: center; gap: 8px; }
    .sp-form-checkbox { width: auto; }
    .sp-modal-footer { padding: 20px 24px; border-top: 1px solid #e0dbd4; display: flex; gap: 12px; justify-content: flex-end; }
    .sp-modal-btn { padding: 10px 20px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; transition: opacity 0.2s; }
    .sp-modal-btn:hover { opacity: 0.85; }
    .sp-modal-btn:disabled { opacity: 0.4; cursor: wait; }
    .sp-modal-btn-secondary { background: #e0dbd4; color: #333; }
    .sp-modal-btn-primary { background: #c4a36f; color: #fff; }
    .sp-modal-btn-alquiler { background: #5b8dd9; color: #fff; }
    .sp-modal-btn-venta { background: #e6a817; color: #fff; }
    .sp-alert-danger { background: #fdf0f0; border: 1px solid #f5c6c6; color: #c0392b; padding: 12px; margin-bottom: 16px; font-size: 13px; }
  `;

  // PROPIEDADES - Implementación completa con modal
  if (vista === 'propiedades') {
    return (<>
<style>{sharedStyles}</style>
<nav className="sp-nav">
<div className="sp-nav-brand">🏠 <span>Salomon</span> Propiedades — Stock</div>
<div style={{display:'flex', gap:12, alignItems:'center'}}>
<button className="sp-btn sp-btn-add" onClick={() => setShowModalPropiedad(true)}>➕ Agregar</button>
<button className="sp-nav-back" onClick={cargarDatos}>↺</button>
<button className="sp-nav-back" onClick={() => { setVista('home'); setBusqueda(''); setFiltro('todas'); }}>← Volver</button>
</div>
</nav>
<div className="sp-content">
<div className="sp-stats">
<div className="sp-stat gold"><div className="sp-stat-label">Total</div><div className="sp-stat-value">{propiedades.length}</div></div>
<div className="sp-stat green"><div className="sp-stat-label">Disponibles</div><div className="sp-stat-value">{propDisponibles}</div></div>
<div className="sp-stat red"><div className="sp-stat-label">Ocupadas</div><div className="sp-stat-value">{propOcupadas}</div></div>
</div>
<div className="sp-toolbar">
<input className="sp-search" placeholder="🔍 Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setFiltro('todas'); }} />
<div className="sp-filters">
<button className={`sp-filter-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
<button className={`sp-filter-btn ${filtro === 'disponibles' ? 'active-green' : ''}`} onClick={() => setFiltro('disponibles')}>🟢 Disponibles</button>
<button className={`sp-filter-btn ${filtro === 'ocupadas' ? 'active-red' : ''}`} onClick={() => setFiltro('ocupadas')}>🔴 Ocupadas</button>
</div>
</div>
<div className="sp-table-wrap">
{loading ? (<div className="sp-spinner"><div className="sp-spinner-ring"></div><p style={{color:'#aaa'}}>Cargando...</p></div>) : error ? (<div className="sp-error"><h5>Error</h5><p>{error}</p><button className="sp-retry" onClick={cargarDatos}>Reintentar</button></div>) : propiedadesFiltradas.length === 0 ? (<div className="sp-empty"><div className="sp-empty-icon">🏠</div><p>Sin propiedades</p></div>) : (
<table><thead><tr><th>ID</th><th>Tipo</th><th>Op</th><th>Dirección</th><th>Barrio</th><th>Amb</th><th>Dorm</th><th>Precio</th><th>Banco</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
{propiedadesFiltradas.map(p => { const est = estadoPropiedad(p); const esOcupada = p.operacion === null;
return (<tr key={p.id}><td style={{color:'#bbb', fontSize:12}}>#{p.id}</td><td><span className="tipologia-tag">{p.tipologia}</span></td><td style={{textTransform:'capitalize'}}>{p.operacion || '—'}</td><td><strong>{p.direccion}</strong></td><td>{p.barrio}</td><td style={{textAlign:'center'}}>{p.ambientes||'-'}</td><td style={{textAlign:'center'}}>{p.dormitorios||'-'}</td><td><strong style={{color:'#c4a36f'}}>{formatearPrecio(p.precio)}</strong></td><td style={{textAlign:'center'}}>{p.apto_banco?'✓':'—'}</td><td><span className={est.clase}>{est.icono} {est.texto}</span></td><td><button className={`sp-btn ${esOcupada ? 'sp-btn-disponible' : 'sp-btn-ocupar'}`} onClick={() => toggleDisponibilidad(p)} disabled={procesando === p.id}>{procesando === p.id ? '...' : esOcupada ? '🟢 Liberar' : '🔴 Ocupar'}</button></td></tr>);
})}
</tbody></table>
)}
</div>
<div className="sp-footer">Mostrando {propiedadesFiltradas.length} de {propiedades.length}</div>
</div>

{/* Modal Operación */}
{showModalOperacion && (
<div className="sp-modal-overlay"><div className="sp-modal" style={{maxWidth:400}}><div className="sp-modal-header"><div className="sp-modal-title">Liberar Propiedad</div><button className="sp-modal-close" onClick={() => { setShowModalOperacion(false); setPropiedadTemp(null); }}>×</button></div><div className="sp-modal-body"><p style={{marginBottom:20, color:'#666'}}>¿Para qué operación deseas marcar esta propiedad como disponible?</p><div style={{display:'flex', gap:12}}><button className="sp-modal-btn sp-modal-btn-alquiler" onClick={() => confirmarOperacion('alquiler')} disabled={procesando} style={{flex:1}}>🏠 Alquiler</button><button className="sp-modal-btn sp-modal-btn-venta" onClick={() => confirmarOperacion('venta')} disabled={procesando} style={{flex:1}}>💰 Venta</button></div></div></div></div>
)}

{/* Modal Crear Propiedad */}
{showModalPropiedad && (
<div className="sp-modal-overlay"><div className="sp-modal"><div className="sp-modal-header"><div className="sp-modal-title">➕ Nueva Propiedad</div><button className="sp-modal-close" onClick={() => { setShowModalPropiedad(false); setErrorFormProp(null); }}>×</button></div><div className="sp-modal-body">
{errorFormProp && <div className="sp-alert-danger">{errorFormProp}</div>}
<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
<div className="sp-form-group"><label className="sp-form-label">Tipología *</label><select className="sp-form-select" value={formPropiedad.tipologia} onChange={e => setFormPropiedad({...formPropiedad, tipologia: e.target.value})}><option value="departamento">Departamento</option><option value="casa">Casa</option><option value="ph">PH</option><option value="local">Local</option><option value="cochera">Cochera</option></select></div>
<div className="sp-form-group"><label className="sp-form-label">Operación *</label><select className="sp-form-select" value={formPropiedad.operacion} onChange={e => setFormPropiedad({...formPropiedad, operacion: e.target.value})}><option value="alquiler">Alquiler</option><option value="venta">Venta</option></select></div>
</div>
<div className="sp-form-group"><label className="sp-form-label">Dirección *</label><input className="sp-form-input" placeholder="Av. Colón 1234" value={formPropiedad.direccion} onChange={e => setFormPropiedad({...formPropiedad, direccion: e.target.value})} /></div>
<div className="sp-form-group"><label className="sp-form-label">Barrio *</label><select className="sp-form-select" value={formPropiedad.barrio} onChange={e => setFormPropiedad({...formPropiedad, barrio: e.target.value})}><option value="">Seleccionar...</option>{BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
<div className="sp-form-group"><label className="sp-form-label">Ambientes</label><input type="number" className="sp-form-input" value={formPropiedad.ambientes} onChange={e => setFormPropiedad({...formPropiedad, ambientes: e.target.value})} /></div>
<div className="sp-form-group"><label className="sp-form-label">Dormitorios</label><input type="number" className="sp-form-input" value={formPropiedad.dormitorios} onChange={e => setFormPropiedad({...formPropiedad, dormitorios: e.target.value})} /></div>
</div>
<div className="sp-form-group"><label className="sp-form-label">Precio</label><input type="number" className="sp-form-input" value={formPropiedad.precio} onChange={e => setFormPropiedad({...formPropiedad, precio: e.target.value})} /></div>
<div className="sp-form-group"><label className="sp-form-label">Descripción</label><textarea className="sp-form-textarea" value={formPropiedad.descripcion} onChange={e => setFormPropiedad({...formPropiedad, descripcion: e.target.value})}></textarea></div>
<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
<div className="sp-form-group"><label className="sp-form-label">Cód. Zonaprop</label><input className="sp-form-input" value={formPropiedad.cod_zp} onChange={e => setFormPropiedad({...formPropiedad, cod_zp: e.target.value})} /></div>
<div className="sp-form-group"><label className="sp-form-label">Cód. La Voz</label><input className="sp-form-input" value={formPropiedad.cod_lvi} onChange={e => setFormPropiedad({...formPropiedad, cod_lvi: e.target.value})} /></div>
</div>
<div className="sp-form-group"><div className="sp-form-checkbox-wrap"><input type="checkbox" className="sp-form-checkbox" checked={formPropiedad.apto_banco} onChange={e => setFormPropiedad({...formPropiedad, apto_banco: e.target.checked})} /><label className="sp-form-label" style={{marginBottom:0}}>Apto Banco</label></div></div>
</div><div className="sp-modal-footer">
<button className="sp-modal-btn sp-modal-btn-secondary" onClick={() => { setShowModalPropiedad(false); setErrorFormProp(null); }} disabled={guardandoPropiedad}>Cancelar</button>
<button className="sp-modal-btn sp-modal-btn-primary" onClick={crearPropiedad} disabled={guardandoPropiedad}>{guardandoPropiedad ? 'Guardando...' : '✅ Guardar'}</button>
</div></div></div>
)}
</>);
  }

  // VISITAS
  if (vista === 'visitas') {
    return (<>
<style>{sharedStyles}</style>
<nav className="sp-nav"><div className="sp-nav-brand">📅 <span>Salomon</span> Propiedades — Visitas</div><div style={{display:'flex', gap:12}}><button className="sp-nav-back" onClick={cargarDatos}>↺</button><button className="sp-nav-back" onClick={() => { setVista('home'); setBusqueda(''); setFiltro('todas'); }}>← Volver</button></div></nav>
<div className="sp-content">
<div className="sp-stats">
<div className="sp-stat gold"><div className="sp-stat-label">Total</div><div className="sp-stat-value">{visitas.length}</div></div>
<div className="sp-stat amber"><div className="sp-stat-label">Pendientes</div><div className="sp-stat-value">{visitasPendientes}</div></div>
<div className="sp-stat green"><div className="sp-stat-label">Confirmadas</div><div className="sp-stat-value">{visitasConfirmadas}</div></div>
<div className="sp-stat red"><div className="sp-stat-label">Canceladas</div><div className="sp-stat-value">{visitasCanceladas}</div></div>
</div>
<div className="sp-toolbar">
<input className="sp-search" placeholder="🔍 Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setFiltro('todas'); }} />
<div className="sp-filters">
<button className={`sp-filter-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
<button className={`sp-filter-btn ${filtro === 'pendientes' ? 'active-amber' : ''}`} onClick={() => setFiltro('pendientes')}>⏳ Pendientes</button>
<button className={`sp-filter-btn ${filtro === 'confirmadas' ? 'active-green' : ''}`} onClick={() => setFiltro('confirmadas')}>✓ Confirmadas</button>
<button className={`sp-filter-btn ${filtro === 'canceladas' ? 'active-red' : ''}`} onClick={() => setFiltro('canceladas')}>✕ Canceladas</button>
</div>
</div>
<div className="sp-table-wrap">
{loading ? (<div className="sp-spinner"><div className="sp-spinner-ring"></div><p style={{color:'#aaa'}}>Cargando...</p></div>) : error ? (<div className="sp-error"><h5>Error</h5><p>{error}</p><button className="sp-retry" onClick={cargarDatos}>Reintentar</button></div>) : visitasFiltradas.length === 0 ? (<div className="sp-empty"><div className="sp-empty-icon">📅</div><p>Sin visitas</p></div>) : (
<table><thead><tr><th>ID</th><th>Fecha</th><th>Hora</th><th>Nombre</th><th>Teléfono</th><th>Propiedad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
{visitasFiltradas.map(v => { const est = estadoVisita(v); const esPendiente = v.operacion === 'pendiente'; const esConfirmada = v.operacion === 'confirmado'; const esCancelada = v.operacion === 'cancelado'; const propiedad = propiedades.find(p => p.id === v.id_propiedad);
return (<tr key={v.id}><td style={{color:'#bbb', fontSize:12}}>#{v.id}</td><td><strong>{formatearFecha(v.fecha)}</strong></td><td>{formatearHora(v.hora)}</td><td><strong>{v.nombre}</strong></td><td>{v.telefono}</td><td>{propiedad ? <span><span className="tipologia-tag">{propiedad.tipologia}</span><span style={{marginLeft:6, fontSize:13, color:'#555'}}>{propiedad.direccion}</span></span> : <span style={{color:'#bbb'}}>ID #{v.id_propiedad}</span>}</td><td><span className={est.clase}>{est.icono} {est.texto}</span></td><td><div style={{display:'flex', gap:6}}>{esPendiente && (<><button className="sp-btn sp-btn-confirmar" onClick={() => confirmarVisita(v.id)} disabled={procesando === v.id}>{procesando === v.id ? '...' : '✓'}</button><button className="sp-btn sp-btn-cancelar" onClick={() => cancelarVisita(v.id)} disabled={procesando === v.id}>{procesando === v.id ? '...' : '✕'}</button></>)}{(esConfirmada || esCancelada) && (<button className="sp-btn sp-btn-restaurar" onClick={() => restaurarVisita(v.id)} disabled={procesando === v.id}>{procesando === v.id ? '...' : '↺ Pendiente'}</button>)}</div></td></tr>);
})}
</tbody></table>
)}
</div>
<div className="sp-footer">Mostrando {visitasFiltradas.length} de {visitas.length}</div>
</div>
</>);
  }
}
