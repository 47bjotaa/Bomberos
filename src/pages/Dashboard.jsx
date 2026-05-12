import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import BodegaCard from '../components/dashboard/BodegaCard';
import VehiculosView from '../components/dashboard/VehiculosView';
import EppView from '../components/dashboard/EppView';
import AssignEppModal from '../components/dashboard/AssignEppModal';

function Dashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('bodegas');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [ubicaciones, setUbicaciones] = useState([
    { id: 1, name: 'Cuartel Central', items: 12 },
    { id: 2, name: 'Bodega de Materiales', items: 8 },
    { id: 3, name: 'Carro Bomba (B-1)', items: 6 },
    { id: 4, name: 'Carro Rescate (R-1)', items: 5 },
    { id: 5, name: 'Oficina Guardia', items: 2 },
    { id: 6, name: 'Casino', items: 1 }
  ]);
  const [catalogo, setCatalogo] = useState([
    { id: 1, nombre: 'Manguera 50mm', tipo: 'Extinción', valor: '$120.000', desechable: false, serializado: true, mantencion: true },
    { id: 2, nombre: 'Guantes de Rescate', tipo: 'EPP', valor: '$25.000', desechable: true, serializado: false, mantencion: false },
    { id: 3, nombre: 'Pitón neblinero', tipo: 'Extinción', valor: '$350.000', desechable: false, serializado: true, mantencion: true },
    { id: 4, nombre: 'Mascarilla N95', tipo: 'Médico', valor: '$1.500', desechable: true, serializado: false, mantencion: false },
    { id: 5, nombre: 'Motamoladora', tipo: 'Herramientas', valor: '$850.000', desechable: false, serializado: true, mantencion: true },
  ]);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({});
  const [confirmCatAction, setConfirmCatAction] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('Todos los tipos');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialData, setNewMaterialData] = useState({ nombre: '', tipo: '', nuevoTipo: '', valor: '' });
  const [activeUbicacion, setActiveUbicacion] = useState(null);
  const [unassignedItems, setUnassignedItems] = useState([]);
  const [showAddUbicacionModal, setShowAddUbicacionModal] = useState(false);
  const [newUbicacionName, setNewUbicacionName] = useState("");
  const [showAssignEppModal, setShowAssignEppModal] = useState(false);
  const [eppData, setEppData] = useState([
    { id: 1, equipo: 'Casco Estructural Gallet F1', codigo: 'EPP-CAS-001', asignadoA: 'Juan Pérez', inicial: 'J', fecha: '12 Oct 2023', estado: 'Operativo' },
    { id: 2, equipo: 'Cota Estructural Lion', codigo: 'EPP-COT-015', asignadoA: 'María González', inicial: 'M', fecha: '05 Nov 2023', estado: 'En Reparación' },
    { id: 3, equipo: 'Botas de Rescate Haix', codigo: 'EPP-BOT-042', asignadoA: 'Carlos Soto', inicial: 'C', fecha: '10 Ene 2024', estado: 'Operativo' },
    { id: 4, equipo: 'Guantes Estructurales Seiz', codigo: 'EPP-GUA-088', asignadoA: 'Ana Rojas', inicial: 'A', fecha: '22 Feb 2024', estado: 'Operativo' },
    { id: 5, equipo: 'Esclavina (Monja)', codigo: 'EPP-ESC-102', asignadoA: 'Luis Méndez', inicial: 'L', fecha: '01 Mar 2024', estado: 'Operativo' }
  ]);

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-text-main overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-dark-border bg-dark-surface z-20 relative flex-shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mr-4 md:mr-8" onClick={() => setView('landing')}>
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/images/logo.png" className="brand-logo" alt="SYNETIX" style={{ height: '32px' }} />
          </div>
          <span className="font-bold text-white tracking-tight rajdhani text-xl hidden md:block">SGLB</span>
        </div>

        {/* Center: Navigation Icons */}
        <nav className="flex-1 flex items-center justify-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveTab('inicio')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'inicio' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Dashboard /> <span className="hidden lg:inline">Inicio</span>
          </button>
          <button onClick={() => setActiveTab('bodegas')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'bodegas' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Inventory /> <span className="hidden lg:inline">Ubicaciones Principales</span>
          </button>
          <button onClick={() => setActiveTab('vehiculos')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'vehiculos' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Truck /> <span className="hidden lg:inline">Vehículos</span>
          </button>
          <button onClick={() => setActiveTab('catalogo')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'catalogo' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Traceability /> <span className="hidden lg:inline">Catálogo</span>
          </button>
          <button onClick={() => setActiveTab('epp')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'epp' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Shield /> <span className="hidden lg:inline">EPP</span>
          </button>
          <button onClick={() => setActiveTab('emergencias')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'emergencias' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.AlertTriangle /> <span className="hidden lg:inline">Emergencias</span>
          </button>
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-4 ml-4 md:ml-8 relative">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-dark-bg3 p-1.5 rounded-lg transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-white">Nicolás C.</div>
              <div className="text-xs text-brand-cyan">Capitán</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-dark-bg2 border border-brand-cyan flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(56,189,248,0.2)]">NC</div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-xl overflow-hidden z-50">
              <button
                onClick={() => setView('landing')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-red hover:bg-dark-bg3 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-dark-bg relative" onClick={() => showProfileMenu && setShowProfileMenu(false)}>
        {/* Sub Header (Actions specific to active tab) */}
        {activeTab !== 'vehiculos' && (
          <div className="flex justify-between items-center px-8 py-4 border-b border-dark-border bg-dark-bg2 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-brand-cyan border border-dark-border shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                {activeTab === 'catalogo' ? <Icons.Traceability /> : activeTab === 'epp' ? <Icons.Shield /> : <Icons.Inventory />}
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white rajdhani tracking-wide leading-tight">
                  {activeTab === 'bodegas' ? 'Ubicaciones Principales' : activeTab === 'catalogo' ? 'Catálogo de Materiales' : activeTab === 'epp' ? 'Equipos de Protección Personal (EPP)' : 'Dashboard'}
                </h2>
                {activeTab === 'epp' && <span className="text-xs text-text-muted mt-0.5">Controla la asignación y estado del equipamiento de los voluntarios</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'bodegas' && (
                <>
                  <button onClick={() => {
                    setNewUbicacionName("");
                    setShowAddUbicacionModal(true);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors shadow-[0_4px_15px_rgba(232,55,42,0.3)]">Agregar ubicación</button>
                </>
              )}
              {activeTab === 'catalogo' && (
                <>
                  <button className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Importar catálogo
                  </button>
                  <button onClick={() => {
                    setNewMaterialData({ nombre: '', tipo: '', nuevoTipo: '', valor: '' });
                    setShowAddMaterialModal(true);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                    <span>+</span> Agregar material
                  </button>
                </>
              )}
              {activeTab === 'epp' && (
                <button onClick={() => setShowAssignEppModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                  Asignar EPP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'bodegas' && (
            <div className="flex h-full">
              {/* Main Grid area */}
              <div className="flex-1 p-8 bg-dark-bg">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-1 rajdhani tracking-wide">Ubicaciones Principales</h3>
                  <p className="text-sm text-text-muted">Selecciona una ubicación principal para ver sus subdivisiones o asignar items directamente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ubicaciones.map(ubi => (
                    <BodegaCard
                      key={ubi.id}
                      name={ubi.name}
                      items={ubi.items}
                      active={activeUbicacion === ubi.id}
                      onClick={() => setActiveUbicacion(ubi.id)}
                      onNameChange={(newName) => {
                        setUbicaciones(ubicaciones.map(u => u.id === ubi.id ? { ...u, name: newName } : u));
                      }}
                      onDelete={() => {
                        if (window.confirm(`¿Estás seguro que deseas eliminar la ubicación "${ubi.name}"?`)) {
                          setUbicaciones(ubicaciones.filter(u => u.id !== ubi.id));
                          if (activeUbicacion === ubi.id) setActiveUbicacion(null);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalogo' && (
            <div className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted" 
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                  />
                </div>
                <div className="w-64 relative">
                  <select 
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-bg3 border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none text-sm"
                  >
                    <option value="Todos los tipos">Todos los tipos</option>
                    {Array.from(new Set(catalogo.map(item => item.tipo))).map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 absolute right-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface shadow-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-base">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nombre</th>
                      <th className="px-6 py-4 font-semibold">Tipo Material</th>
                      <th className="px-6 py-4 font-semibold">Valor Unitario</th>
                      <th className="px-6 py-4 font-semibold text-center">Desechable</th>
                      <th className="px-6 py-4 font-semibold text-center">Serializado</th>
                      <th className="px-6 py-4 font-semibold text-center">Mantención</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {(filtroTipo === 'Todos los tipos' ? catalogo : catalogo.filter(item => item.tipo === filtroTipo))
                      .filter(item => item.nombre.toLowerCase().includes(filtroNombre.toLowerCase()))
                      .map(item => {
                      const isEditing = editingCatId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-dark-bg3 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{item.nombre}</td>
                          <td className="px-6 py-4"><span className="px-2.5 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-full text-xs font-medium">{item.tipo}</span></td>
                          <td className="px-6 py-4 text-text-muted">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={editCatData.valor} 
                                onChange={e => {
                                  let rawValue = e.target.value.replace(/\D/g, '');
                                  if (rawValue === '') {
                                    setEditCatData({...editCatData, valor: ''});
                                  } else {
                                    const numValue = parseInt(rawValue, 10);
                                    setEditCatData({...editCatData, valor: '$' + numValue.toLocaleString('es-CL')});
                                  }
                                }}
                                className="w-full px-2 py-1 bg-dark-bg border border-brand-cyan rounded text-sm text-white focus:outline-none"
                              />
                            ) : item.valor}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                              <input 
                                type="checkbox" 
                                checked={editCatData.desechable} 
                                onChange={e => setEditCatData({...editCatData, desechable: e.target.checked})}
                                className="accent-brand-cyan w-4 h-4 cursor-pointer"
                              />
                            ) : (item.desechable ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="checkbox" 
                                 checked={editCatData.serializado} 
                                 onChange={e => setEditCatData({...editCatData, serializado: e.target.checked})}
                                 className="accent-brand-cyan w-4 h-4 cursor-pointer"
                               />
                            ) : (item.serializado ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="checkbox" 
                                 checked={editCatData.mantencion} 
                                 onChange={e => setEditCatData({...editCatData, mantencion: e.target.checked})}
                                 className="accent-brand-cyan w-4 h-4 cursor-pointer"
                               />
                            ) : (item.mantencion ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                               <>
                                 <button 
                                   onClick={() => setConfirmCatAction({ type: 'edit', id: item.id, data: editCatData })}
                                   className="text-brand-green hover:opacity-80 transition-opacity mr-3"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                 </button>
                                 <button 
                                   onClick={() => setEditingCatId(null)}
                                   className="text-brand-red hover:opacity-80 transition-opacity"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                 </button>
                               </>
                            ) : (
                               <>
                                 <button 
                                   onClick={() => {
                                     setEditingCatId(item.id);
                                     setEditCatData({ ...item });
                                   }}
                                   className="text-text-muted hover:text-brand-cyan transition-colors mr-3"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                 </button>
                                 <button 
                                   onClick={() => setConfirmCatAction({ type: 'delete', id: item.id })}
                                   className="text-text-muted hover:text-brand-red transition-colors"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                 </button>
                               </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'vehiculos' && (
            <VehiculosView />
          )}

          {activeTab === 'epp' && (
            <EppView eppData={eppData} setEppData={setEppData} />
          )}

          {activeTab !== 'bodegas' && activeTab !== 'catalogo' && activeTab !== 'vehiculos' && activeTab !== 'epp' && (
            <div className="p-8 flex items-center justify-center h-full">
              <p className="text-text-muted text-lg">Contenido en construcción...</p>
            </div>
          )}
        </div>

        {showAddUbicacionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Nueva Ubicación</h3>
                <button onClick={() => setShowAddUbicacionModal(false)} className="text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-text-muted mb-2">Nombre de la ubicación</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                  placeholder="Ej. Carro 3, Bodega Central..."
                  value={newUbicacionName}
                  onChange={(e) => setNewUbicacionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newUbicacionName.trim()) {
                      const newId = Math.max(0, ...ubicaciones.map(u => u.id)) + 1;
                      setUbicaciones([...ubicaciones, { id: newId, name: newUbicacionName.trim(), items: 0 }]);
                      setShowAddUbicacionModal(false);
                    }
                  }}
                />
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setShowAddUbicacionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (newUbicacionName.trim()) {
                      const newId = Math.max(0, ...ubicaciones.map(u => u.id)) + 1;
                      setUbicaciones([...ubicaciones, { id: newId, name: newUbicacionName.trim(), items: 0 }]);
                      setShowAddUbicacionModal(false);
                    }
                  }}
                  disabled={!newUbicacionName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Ubicación
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmCatAction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${confirmCatAction.type === 'edit' ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' : 'bg-brand-red/10 text-brand-red border border-brand-red/20'}`}>
                  {confirmCatAction.type === 'edit' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white rajdhani">
                  {confirmCatAction.type === 'edit' ? 'Confirmar Cambios' : 'Eliminar Registro'}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-text-muted text-sm leading-relaxed">
                  {confirmCatAction.type === 'edit' 
                    ? '¿Estás seguro que deseas guardar los cambios realizados en este material?' 
                    : '¿Estás seguro que deseas eliminar este material del catálogo? Esta acción no se puede deshacer.'}
                </p>
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setConfirmCatAction(null)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmCatAction.type === 'edit') {
                      setCatalogo(catalogo.map(item => item.id === confirmCatAction.id ? confirmCatAction.data : item));
                      setEditingCatId(null);
                    } else if (confirmCatAction.type === 'delete') {
                      setCatalogo(catalogo.filter(item => item.id !== confirmCatAction.id));
                    }
                    setConfirmCatAction(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 ${confirmCatAction.type === 'edit' ? 'bg-brand-cyan shadow-[0_4px_15px_rgba(56,189,248,0.3)]' : 'bg-brand-red shadow-[0_4px_15px_rgba(232,55,42,0.3)]'}`}
                >
                  {confirmCatAction.type === 'edit' ? 'Guardar Cambios' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddMaterialModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Nuevo Material</h3>
                <button onClick={() => setShowAddMaterialModal(false)} className="text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Nombre del material</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. Esmeril Angular..."
                    value={newMaterialData.nombre}
                    onChange={(e) => setNewMaterialData({...newMaterialData, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Tipo de material</label>
                  <select
                    value={newMaterialData.tipo}
                    onChange={(e) => setNewMaterialData({...newMaterialData, tipo: e.target.value})}
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {Array.from(new Set(catalogo.map(item => item.tipo))).map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                    <option value="otro">+ Agregar nuevo tipo...</option>
                  </select>
                </div>
                {newMaterialData.tipo === 'otro' && (
                  <div>
                    <label className="block text-sm font-medium text-brand-cyan mb-2">Nuevo tipo de material</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-dark-bg border border-brand-cyan/50 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                      placeholder="Ej. Electrónico"
                      value={newMaterialData.nuevoTipo}
                      onChange={(e) => setNewMaterialData({...newMaterialData, nuevoTipo: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Valor Unitario</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. $15.000"
                    value={newMaterialData.valor}
                    onChange={(e) => {
                      let rawValue = e.target.value.replace(/\D/g, '');
                      if (rawValue === '') {
                        setNewMaterialData({...newMaterialData, valor: ''});
                      } else {
                        const numValue = parseInt(rawValue, 10);
                        setNewMaterialData({...newMaterialData, valor: '$' + numValue.toLocaleString('es-CL')});
                      }
                    }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const finalTipo = newMaterialData.tipo === 'otro' ? newMaterialData.nuevoTipo.trim() : newMaterialData.tipo;
                    if (newMaterialData.nombre.trim() && finalTipo) {
                      const newId = Math.max(0, ...catalogo.map(c => c.id)) + 1;
                      setCatalogo([{
                        id: newId,
                        nombre: newMaterialData.nombre.trim(),
                        tipo: finalTipo,
                        valor: newMaterialData.valor || '$0',
                        desechable: false,
                        serializado: false,
                        mantencion: false
                      }, ...catalogo]);
                      setShowAddMaterialModal(false);
                      setNewMaterialData({ nombre: '', tipo: '', nuevoTipo: '', valor: '' });
                    }
                  }}
                  disabled={!newMaterialData.nombre.trim() || (!newMaterialData.tipo) || (newMaterialData.tipo === 'otro' && !newMaterialData.nuevoTipo.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(232,55,42,0.3)]"
                >
                  Agregar Material
                </button>
              </div>
            </div>
          </div>
        )}

        {showAssignEppModal && (
          <AssignEppModal 
            onClose={() => setShowAssignEppModal(false)}
            onAssign={(newAssignments) => {
              setEppData(prev => [...newAssignments, ...prev]);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
