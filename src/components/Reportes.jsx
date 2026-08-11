import { useEffect, useState } from 'react';
import { supabaseFetch, fmt, TABLES } from '../lib.js';
import { Navbar, Spinner, ErrorPanel, StatCard, Btn } from './UI.jsx';
import { exportToExcel } from '../excelUtils.js';

export default function Reportes({ onBack }) {
  const [data, setData] = useState({ props: [], visits: [], tenants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('financiero');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [props, visits, tenants] = await Promise.all([
        supabaseFetch(TABLES.properties),
        supabaseFetch(TABLES.visits),
        supabaseFetch(TABLES.tenants),
      ]);
      setData({ props: props || [], visits: visits || [], tenants: tenants || [] });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0b18' }}>
      <Spinner />
    </div>
  );

  if (error) return (
    <div className="min-h-screen p-6" style={{ background: '#0d0b18' }}>
      <Navbar title="Reportes" onBack={onBack} onRefresh={load} />
      <div className="max-w-screen-xl mx-auto p-6">
        <ErrorPanel msg={error} onRetry={load} />
      </div>
    </div>
  );

  const { props, visits, tenants } = data;

  // --- CALCULOS GENERALES ---
  const totalAlquileres = tenants.reduce((s, i) => s + (Number(i.alquiler) || 0), 0);
  const totalImpuestos = tenants.reduce((s, i) => s + (Number(i.impuestos) || 0), 0);
  const totalServicios = tenants.reduce((s, i) => s + (Number(i.servicios) || 0), 0);
  const totalGeneralRecaudado = totalAlquileres + totalImpuestos + totalServicios;

  const totalProps = props.length;
  const enAlquiler = props.filter(p => p.operacion === 'alquiler').length;
  const enVenta = props.filter(p => p.operacion === 'venta').length;
  const ocupadas = props.filter(p => p.operacion === null).length;

  const totalVisitas = visits.length;
  const visitasConfirmadas = visits.filter(v => v.operacion === 'confirmado').length;
  const visitasCanceladas = visits.filter(v => v.operacion === 'cancelado').length;
  const visitasPendientes = visits.filter(v => v.operacion === 'pendiente').length;

  // --- TABLAS PARA REPORTES ---

  // 1. Reporte Financiero (Lista de inquilinos con desgloses)
  const reporteFinanciero = tenants.map(i => {
    const prop = props.find(p => p.id === i.id_propiedad);
    const subtotal = (Number(i.alquiler) || 0) + (Number(i.impuestos) || 0) + (Number(i.servicios) || 0);
    return {
      'ID Inquilino': i.id,
      'Nombre': i.nombre,
      'DNI': i.dni,
      'Contrato N°': i.contrato || '—',
      'Propiedad ID': i.id_propiedad || '—',
      'Dirección': prop ? prop.direccion : '—',
      'Alquiler ($)': Number(i.alquiler) || 0,
      'Impuestos ($)': Number(i.impuestos) || 0,
      'Servicios ($)': Number(i.servicios) || 0,
      'Total ($)': subtotal,
    };
  });

  // 2. Reporte de Propiedades (Desglose de stock con detalles financieros)
  const reportePropiedades = props.map(p => {
    const inquilino = tenants.find(t => t.id_propiedad === p.id);
    return {
      'ID Propiedad': p.id,
      'Tipología': p.tipologia,
      'Dirección': p.direccion,
      'Barrio': p.barrio || '—',
      'Ambientes': p.ambientes || '—',
      'Dormitorios': p.dormitorios || '—',
      'Estado': p.operacion === null ? 'Ocupada' : 'Disponible',
      'Operación': p.operacion || 'Ocupada',
      'Apto Banco': p.apto_banco ? 'Sí' : 'No',
      'Precio ($)': Number(p.precio) || 0,
      'Inquilino Actual': inquilino ? inquilino.nombre : '—',
    };
  });

  // 3. Reporte de Visitas
  const reporteVisitas = visits.map(v => {
    const prop = props.find(p => p.id === v.id_propiedad);
    return {
      'ID Visita': v.id,
      'Fecha': fmt.fecha(v.fecha),
      'Hora': fmt.hora(v.hora),
      'Cliente': v.nombre,
      'Teléfono': v.telefono || '—',
      'Propiedad ID': v.id_propiedad || '—',
      'Dirección Propiedad': prop ? prop.direccion : '—',
      'Estado': v.operacion || 'pendiente',
    };
  });

  // --- EXPORTAR ---
  const exportarReporte = () => {
    if (activeTab === 'financiero') {
      exportToExcel(reporteFinanciero, 'Reporte_Financiero_Inquilinos');
    } else if (activeTab === 'propiedades') {
      exportToExcel(reportePropiedades, 'Reporte_Propiedades_Stock');
    } else if (activeTab === 'visitas') {
      exportToExcel(reporteVisitas, 'Reporte_Visitas_Agenda');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0b18' }}>
      <Navbar
        title="Reportes Inmobiliarios"
        onBack={onBack}
        onRefresh={load}
        extra={
          <Btn onClick={exportarReporte} className="mr-1 text-xs" variant="success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar Excel
          </Btn>
        }
      />
      <div className="max-w-screen-xl mx-auto p-6">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-3 mb-6">
          {[
            { id: 'financiero', label: '📊 Financiero Inquilinos', icon: '💰' },
            { id: 'propiedades', label: '🏠 Stock & Propiedades', icon: '🔑' },
            { id: 'visitas', label: '📅 Visitas & Conversión', icon: '📝' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
              style={
                activeTab === tab.id
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', shadow: '0 4px 20px rgba(139,92,246,0.2)' }
                  : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)' }
              }
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TABLA FINANCIERA --- */}
        {activeTab === 'financiero' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Recaudación Alquileres" value={fmt.monto(totalAlquileres)} color="blue" />
              <StatCard label="Total Impuestos" value={fmt.monto(totalImpuestos)} color="amber" />
              <StatCard label="Total Servicios" value={fmt.monto(totalServicios)} color="green" />
              <StatCard label="Total Recaudación General" value={fmt.monto(totalGeneralRecaudado)} color="purple" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg font-display">Resumen Financiero Mensual</h3>
                <span className="text-xs text-white/40">{tenants.length} contratos activos</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2">
                      {['Inquilino', 'DNI', 'Contrato', 'Dirección', 'Alquiler', 'Impuestos', 'Servicios', 'Subtotal'].map(h => (
                        <th key={h} className="px-5 py-4 text-left text-xs text-white/40 uppercase tracking-widest font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporteFinanciero.map((item, idx) => (
                      <tr key={idx} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-5 py-4 font-medium text-white">{item['Nombre']}</td>
                        <td className="px-5 py-4 text-white/60 font-mono text-xs">{item['DNI']}</td>
                        <td className="px-5 py-4 text-white/40 text-xs">#{item['Contrato N°']}</td>
                        <td className="px-5 py-4 text-white/60 text-xs truncate max-w-[200px]">{item['Dirección']}</td>
                        <td className="px-5 py-4 text-blue-400 font-semibold">{fmt.monto(item['Alquiler ($)'])}</td>
                        <td className="px-5 py-4 text-amber-400 font-semibold">{fmt.monto(item['Impuestos ($)'])}</td>
                        <td className="px-5 py-4 text-emerald-400 font-semibold">{fmt.monto(item['Servicios ($)'])}</td>
                        <td className="px-5 py-4 text-[#8b5cf6] font-bold text-base">{fmt.monto(item['Total ($)'])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TABLA PROPIEDADES --- */}
        {activeTab === 'propiedades' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Stock" value={totalProps} color="purple" />
              <StatCard label="En Alquiler" value={enAlquiler} color="blue" />
              <StatCard label="En Venta" value={enVenta} color="gold" />
              <StatCard label="Ocupadas" value={ocupadas} color="red" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg font-display">Reporte de Stock Completo</h3>
                <span className="text-xs text-white/40">{props.length} propiedades</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2">
                      {['Dirección', 'Barrio', 'Tipología', 'Estado', 'Operación', 'Apto Banco', 'Precio'].map(h => (
                        <th key={h} className="px-5 py-4 text-left text-xs text-white/40 uppercase tracking-widest font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportePropiedades.map((item, idx) => (
                      <tr key={idx} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-5 py-4 font-medium text-white">{item['Dirección']}</td>
                        <td className="px-5 py-4 text-white/60">{item['Barrio']}</td>
                        <td className="px-5 py-4 text-white/50 text-xs capitalize">{item['Tipología']}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item['Estado'] === 'Ocupada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {item['Estado']}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-white/60 capitalize">{item['Operación']}</td>
                        <td className="px-5 py-4 text-center">
                          {item['Apto Banco'] === 'Sí' ? <span className="text-emerald-400">✓</span> : <span className="text-white/20">—</span>}
                        </td>
                        <td className="px-5 py-4 text-[#8b5cf6] font-bold">{fmt.precio(item['Precio ($)'])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TABLA VISITAS --- */}
        {activeTab === 'visitas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Visitas" value={totalVisitas} color="purple" />
              <StatCard label="Visitas Confirmadas" value={visitasConfirmadas} color="green" />
              <StatCard label="Visitas Pendientes" value={visitasPendientes} color="amber" />
              <StatCard label="Visitas Canceladas" value={visitasCanceladas} color="red" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg font-display">Agenda Histórica de Visitas</h3>
                <span className="text-xs text-white/40">{visits.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2">
                      {['Fecha', 'Hora', 'Cliente', 'Teléfono', 'Dirección Propiedad', 'Estado'].map(h => (
                        <th key={h} className="px-5 py-4 text-left text-xs text-white/40 uppercase tracking-widest font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporteVisitas.map((item, idx) => (
                      <tr key={idx} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-5 py-4 font-semibold text-white">{item['Fecha']}</td>
                        <td className="px-5 py-4 text-white/60">{item['Hora']}</td>
                        <td className="px-5 py-4 text-white font-medium">{item['Cliente']}</td>
                        <td className="px-5 py-4 text-white/60 font-mono text-xs">{item['Teléfono']}</td>
                        <td className="px-5 py-4 text-white/60 text-xs truncate max-w-[240px]">{item['Dirección Propiedad']}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item['Estado'] === 'confirmado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            item['Estado'] === 'cancelado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {item['Estado'] === 'confirmado' ? 'Confirmada' : item['Estado'] === 'cancelado' ? 'Cancelada' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
