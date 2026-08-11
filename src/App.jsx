import { useState } from 'react';
import Dashboard, { Sidebar } from './components/Dashboard.jsx';
import Propiedades from './components/Propiedades.jsx';
import Visitas from './components/Visitas.jsx';
import Inquilinos from './components/Inquilinos.jsx';
import Barrios from './components/Barrios.jsx';
import Reportes from './components/Reportes.jsx';

export default function App() {
  const [vista, setVista] = useState('dashboard');

  const goTo = (v) => setVista(v);
  const goHome = () => setVista('dashboard');

  // Módulos con navegación propia (con navbar interna)
  if (vista === 'propiedades') return (
    <div className="flex min-h-screen" style={{ background: '#0d0b18' }}>
      <Sidebar active="propiedades" setActive={setVista} goTo={goTo} />
      <div className="flex-1 ml-52">
        <Propiedades onBack={goHome} />
      </div>
    </div>
  );

  if (vista === 'visitas') return (
    <div className="flex min-h-screen" style={{ background: '#0d0b18' }}>
      <Sidebar active="visitas" setActive={setVista} goTo={goTo} />
      <div className="flex-1 ml-52">
        <Visitas onBack={goHome} />
      </div>
    </div>
  );

  if (vista === 'inquilinos') return (
    <div className="flex min-h-screen" style={{ background: '#0d0b18' }}>
      <Sidebar active="inquilinos" setActive={setVista} goTo={goTo} />
      <div className="flex-1 ml-52">
        <Inquilinos onBack={goHome} />
      </div>
    </div>
  );

  if (vista === 'barrios') return (
    <div className="flex min-h-screen" style={{ background: '#0d0b18' }}>
      <Sidebar active="barrios" setActive={setVista} goTo={goTo} />
      <div className="flex-1 ml-52">
        <Barrios onBack={goHome} />
      </div>
    </div>
  );

  if (vista === 'reportes') return (
    <div className="flex min-h-screen" style={{ background: '#0d0b18' }}>
      <Sidebar active="reportes" setActive={setVista} goTo={goTo} />
      <div className="flex-1 ml-52">
        <Reportes onBack={goHome} />
      </div>
    </div>
  );

  // Dashboard principal
  return (
    <div className="flex min-h-screen" style={{ background: '#0d0b18' }}>
      <Sidebar active="dashboard" setActive={setVista} goTo={goTo} />
      <Dashboard goTo={goTo} />
    </div>
  );
}
