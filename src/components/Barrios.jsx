import { useEffect, useState } from 'react';
import { supabaseFetch, supabasePatch, supabaseDelete, supabasePost, getNextId, TABLES } from '../lib.js';
import { Navbar, Spinner, EmptyState, ErrorPanel, StatCard, Btn, Modal, FormField, Input } from './UI.jsx';

export default function Barrios({ onBack }) {
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [nombreForm, setNombreForm] = useState('');
  const [modalError, setModalError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseFetch(TABLES.neighborhoods);
      // Sort alphabetically
      const sorted = (data || []).sort((a, b) => 
        a.nombre.localeCompare(b.nombre, 'es', { numeric: true, sensitivity: 'base' })
      );
      setBarrios(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const abrirCrear = () => {
    setNombreForm('');
    setModalError(null);
    setShowAdd(true);
  };

  const abrirEditar = (b) => {
    setEditItem(b);
    setNombreForm(b.nombre);
    setModalError(null);
  };

  const guardar = async () => {
    if (!nombreForm.trim()) {
      setModalError('El nombre del barrio es obligatorio');
      return;
    }
    setProcesando(true);
    setModalError(null);
    try {
      const nombreLimpio = nombreForm.trim();
      
      // Check duplicate locally
      const duplicado = barrios.some(b => 
        b.nombre.toLowerCase() === nombreLimpio.toLowerCase() && (!editItem || b.id !== editItem.id)
      );
      if (duplicado) {
        throw new Error('Ya existe un barrio con ese nombre');
      }

      if (editItem) {
        await supabasePatch(TABLES.neighborhoods, editItem.id, { nombre: nombreLimpio });
      } else {
        const nextId = await getNextId(TABLES.neighborhoods);
        await supabasePost(TABLES.neighborhoods, nextId ? { id: nextId, nombre: nombreLimpio } : { nombre: nombreLimpio });
      }
      
      setShowAdd(false);
      setEditItem(null);
      await load();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el barrio "${nombre}" definitivamente?`)) return;
    setProcesando(id);
    try {
      await supabaseDelete(TABLES.neighborhoods, id);
      await load();
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    } finally {
      setProcesando(null);
    }
  };

  const filtrados = barrios.filter(b => 
    b.nombre?.toLowerCase().includes(busqueda.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen" style={{ background: '#0d0b18' }}>
      <Navbar
        title="Barrios"
        onBack={onBack}
        onRefresh={load}
        extra={<Btn onClick={abrirCrear} className="mr-1 text-xs">➕ Agregar barrio</Btn>}
      />
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatCard label="Total de Barrios" value={barrios.length} color="purple" />
          <StatCard label="Barrios Filtrados" value={filtrados.length} color="blue" />
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 flex-wrap mb-5">
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre de barrio..."
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorPanel msg={error} onRetry={load} />
          ) : filtrados.length === 0 ? (
            <EmptyState icon="📍" text="Sin barrios" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2">
                    {['ID', 'Nombre', 'Creado El', 'Acciones'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs text-white/40 uppercase tracking-widest font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((b, i) => (
                    <tr key={b.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-6 py-4 text-white/30 text-xs font-mono">#{b.id}</td>
                      <td className="px-6 py-4 text-white font-medium text-base">{b.nombre}</td>
                      <td className="px-6 py-4 text-white/50 text-xs">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString('es-AR') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEditar(b)}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded-lg transition-colors border border-blue-500/20"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => eliminar(b.id, b.nombre)}
                            disabled={procesando === b.id}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20 disabled:opacity-40"
                          >
                            {procesando === b.id ? '...' : '🗑️ Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAdd || !!editItem) && (
        <Modal
          title={editItem ? '✏️ Editar Barrio' : '➕ Nuevo Barrio'}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          footer={
            <>
              <Btn variant="secondary" onClick={() => { setShowAdd(false); setEditItem(null); }} disabled={procesando}>
                Cancelar
              </Btn>
              <Btn onClick={guardar} disabled={procesando}>
                {procesando ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear'}
              </Btn>
            </>
          }
        >
          {modalError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
              {modalError}
            </div>
          )}
          <FormField label="Nombre del Barrio *">
            <Input
              placeholder="Ej. Nueva Córdoba"
              value={nombreForm}
              onChange={e => setNombreForm(e.target.value)}
              disabled={procesando}
              autoFocus
            />
          </FormField>
        </Modal>
      )}
    </div>
  );
}
