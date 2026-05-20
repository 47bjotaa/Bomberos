import React, { useState, useEffect } from 'react';
import { Icons } from '../../components/ui/Icons';
import { apiFetch } from '../../services/api';

function VehiculosView() {
  const [view, setView] = useState('list'); // list, detail
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingVehiculo, setSavingVehiculo] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/vehiculos');
      const mappedData = data.map(mapVehiculo);
      setVehiculos(mappedData);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    descripcion: '',
    nomenclatura: '',
    tipoVehiculo: '',
    estadoVehiculo: 'Operativo',
    patente: ''
  });

  // Detail states
  const [isEditingPatente, setIsEditingPatente] = useState(false);
  const [tempPatente, setTempPatente] = useState('');

  const [showAddObs, setShowAddObs] = useState(false);
  const [newObs, setNewObs] = useState({ titulo: '', desc: '' });

  const [showAddMant, setShowAddMant] = useState(false);
  const [newMant, setNewMant] = useState({ titulo: '', desc: '' });

  const updateVehiculo = (updatedV) => {
    setVehiculos(vehiculos.map(v => v.id === updatedV.id ? updatedV : v));
    setSelectedVehiculo(updatedV);
  };

  const mapVehiculo = (v) => ({
    id: v.idVehiculo || v.id,
    nombre: v.nombre || v.name || v.nomenclatura || `Unidad ${v.patente || ''}`,
    patente: v.patente || 'S/N',
    tipo: v.tipoVehiculo || v.tipo || 'Material Mayor',
    modelo: v.modelo || v.descripcion || 'Sin especificar',
    estado: v.estadoVehiculo || v.estado || 'Operativo',
    estadoUbicacion: v.estadoUbicacion || '',
    observaciones: v.observaciones || [],
    mantenciones: v.mantenciones || []
  });

  const resetAddForm = () => {
    setFormData({
      descripcion: '',
      nomenclatura: '',
      tipoVehiculo: '',
      estadoVehiculo: 'Operativo',
      patente: ''
    });
    setAddError('');
  };

  const closeAddModal = () => {
    if (savingVehiculo) return;
    setShowAddModal(false);
    resetAddForm();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (savingVehiculo) return;

    setSavingVehiculo(true);
    setAddError('');

    const payload = {
      descripcion: formData.descripcion.trim(),
      estadoUbicacion: 'Activa',
      nomenclatura: formData.nomenclatura.trim(),
      tipoVehiculo: formData.tipoVehiculo.trim(),
      estadoVehiculo: formData.estadoVehiculo.trim(),
      patente: formData.patente.trim()
    };

    try {
      await apiFetch('/api/vehiculos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await fetchVehiculos();
      setShowAddModal(false);
      resetAddForm();
    } catch (error) {
      setAddError(error.message || 'No se pudo crear el vehiculo.');
    } finally {
      setSavingVehiculo(false);
    }
  };

  if (view === 'list') {
    return (
      <div className="p-8 pb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-1 rajdhani tracking-wide">Parque Automotriz</h3>
            <p className="text-sm text-text-muted">Gestiona los vehículos, carros y ambulancias de la compañía.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
            Agregar vehículo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin mb-4"></div>
              <p className="text-text-muted rajdhani text-lg">Cargando parque automotriz...</p>
            </div>
          ) : vehiculos.length > 0 ? (
            vehiculos.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedVehiculo(v);
                  setView('detail');
                  setIsEditingPatente(false);
                  setShowAddObs(false);
                  setShowAddMant(false);
                }}
                className={`bg-dark-surface border rounded-xl cursor-pointer hover:shadow-lg hover:shadow-brand-cyan/5 transition-all flex flex-col items-center justify-center pt-8 pb-4 relative group overflow-hidden border-dark-border hover:border-brand-cyan/50`}
              >
                <div className={`w-20 h-20 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 text-text-muted`}>
                  <Icons.Truck />
                </div>
                <div className={`w-full py-3 px-4 text-center border-t border-dark-border bg-dark-bg/50`}>
                  <div className={`text-sm font-semibold mb-1 text-white`}>{v.nombre}</div>
                  <div className="text-xs text-text-muted">{v.modelo} - {v.patente}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-dark-border rounded-2xl">
              <Icons.Truck size={48} className="text-text-muted mb-4 opacity-20" />
              <p className="text-text-muted rajdhani text-lg">No hay vehículos registrados.</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 text-brand-cyan hover:underline">Registrar el primer vehículo</button>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
                <div>
                  <h3 className="rajdhani text-xl font-bold text-white">Agregar Vehiculo</h3>
                  <p className="mt-1 text-sm text-text-muted">Registra una nueva unidad del parque automotriz.</p>
                </div>
                <button type="button" onClick={closeAddModal} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-dark-bg3 hover:text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="custom-scrollbar max-h-[calc(88vh-76px)] overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Nomenclatura <span className="text-brand-red">*</span></span>
                    <input
                      required
                      type="text"
                      value={formData.nomenclatura}
                      onChange={e => setFormData({ ...formData, nomenclatura: e.target.value })}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                      placeholder="Ej: B-1, RX-2, AB1234"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Patente <span className="text-brand-red">*</span></span>
                    <input
                      required
                      type="text"
                      value={formData.patente}
                      onChange={e => setFormData({ ...formData, patente: e.target.value })}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                      placeholder="Ej: AB-12-34"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Tipo de vehiculo <span className="text-brand-red">*</span></span>
                    <input
                      required
                      type="text"
                      value={formData.tipoVehiculo}
                      onChange={e => setFormData({ ...formData, tipoVehiculo: e.target.value })}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                      placeholder="Ej: Carro bomba, ambulancia, rescate"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Estado del vehiculo</span>
                    <select
                      value={formData.estadoVehiculo}
                      onChange={e => setFormData({ ...formData, estadoVehiculo: e.target.value })}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-cyan"
                    >
                      <option value="Operativo">Operativo</option>
                      <option value="En Mantencion">En Mantencion</option>
                      <option value="Fuera de Servicio">Fuera de Servicio</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-text-main">Descripcion</span>
                    <textarea
                      value={formData.descripcion}
                      onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      className="min-h-[110px] w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                      placeholder="Marca, modelo, capacidad, observaciones generales..."
                    />
                  </label>
                </div>

                {addError && (
                  <div className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">
                    {addError}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-dark-border pt-5">
                  <button type="button" onClick={closeAddModal} className="rounded-lg border border-dark-border bg-dark-bg px-5 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg3 hover:text-white">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingVehiculo}
                    className="rounded-lg bg-brand-cyan px-5 py-2.5 text-sm font-bold text-dark-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingVehiculo ? 'Creando...' : 'Crear vehiculo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedVehiculo) {
    const v = selectedVehiculo;
    return (
      <div className="p-8 max-w-5xl mx-auto pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-dark-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="text-text-muted hover:text-white flex items-center gap-2 text-sm font-medium transition-colors border-r border-dark-border pr-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Volver
            </button>
            <h3 className="text-xl font-bold text-white rajdhani">Detalle del Vehículo</h3>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            Editar
          </button>
        </div>

        {/* Main Info Card */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3 aspect-[4/3] bg-dark-bg border border-dashed border-dark-border rounded-lg flex flex-col items-center justify-center text-text-muted relative overflow-hidden group">
            {v.foto ? (
              <img src={v.foto} alt={v.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="opacity-30 mb-4 scale-150">
                <Icons.Truck />
              </div>
            )}
            <label className={`px-3 py-1.5 text-xs font-medium bg-dark-bg3 border border-dark-border rounded-md hover:text-white transition-colors flex items-center gap-2 cursor-pointer ${v.foto ? 'absolute bottom-4 opacity-0 group-hover:opacity-100' : 'relative'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {v.foto ? 'Cambiar foto' : 'Añadir foto'}
              <input type="file" hidden accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const url = URL.createObjectURL(e.target.files[0]);
                  updateVehiculo({ ...v, foto: url });
                }
              }} />
            </label>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-full text-xs font-bold uppercase tracking-wider">Estado: {v.estado}</span>
              <span className="text-brand-cyan text-xs font-medium">Material Mayor</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 rajdhani">{v.nombre}</h2>
            <p className="text-text-muted mb-8 leading-relaxed">
              Unidad principal de ataque y extinción de incendios estructurales. Equipado con cuerpo de bomba de alta y baja presión y estanque de 4.000 litros.
            </p>

            <div className="flex gap-6">
              <div className="bg-dark-bg border border-dark-border rounded-lg px-5 py-3 flex-1">
                <div className="text-xs text-text-muted mb-1">Tipo de Vehículo</div>
                <div className="text-sm font-semibold text-white">{v.tipo}</div>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg px-5 py-3 flex-1 flex flex-col justify-center">
                <div className="text-xs text-text-muted mb-1 flex justify-between items-center">
                  Patente
                  {!isEditingPatente && (
                    <button onClick={() => { setIsEditingPatente(true); setTempPatente(v.patente); }} className="hover:text-brand-cyan transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                  )}
                </div>
                {isEditingPatente ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input autoFocus type="text" value={tempPatente} onChange={e => setTempPatente(e.target.value)} className="w-full px-2 py-1 text-sm bg-dark-bg2 border border-brand-cyan rounded text-white focus:outline-none" />
                    <button onClick={() => { updateVehiculo({ ...v, patente: tempPatente }); setIsEditingPatente(false); }} className="text-brand-green hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
                    <button onClick={() => setIsEditingPatente(false)} className="text-brand-red hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-white">{v.patente}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Columns: Observaciones & Mantenciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Observaciones */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-dark-border pb-2">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                Observaciones
              </h4>
              <button onClick={() => setShowAddObs(!showAddObs)} className="text-xs font-medium text-text-muted hover:text-brand-cyan transition-colors flex items-center gap-1">
                <span>{showAddObs ? '-' : '+'}</span> {showAddObs ? 'Cancelar' : 'Agregar'}
              </button>
            </div>
            <div className="space-y-4">
              {showAddObs && (
                <div className="bg-dark-bg2 border border-brand-cyan/50 rounded-lg p-4 mb-4">
                  <input type="text" placeholder="Título de observación" value={newObs.titulo} onChange={e => setNewObs({ ...newObs, titulo: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan" />
                  <textarea placeholder="Detalle de la observación" value={newObs.desc} onChange={e => setNewObs({ ...newObs, desc: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan min-h-[80px]"></textarea>
                  <div className="flex justify-end">
                    <button onClick={() => {
                      if (!newObs.titulo || !newObs.desc) return;
                      const d = new Date();
                      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                      updateVehiculo({ ...v, observaciones: [{ fecha: dateStr, titulo: newObs.titulo, desc: newObs.desc }, ...v.observaciones] });
                      setShowAddObs(false);
                      setNewObs({ titulo: '', desc: '' });
                    }} className="px-3 py-1.5 bg-brand-cyan text-dark-bg text-xs font-bold rounded hover:opacity-90 transition-opacity">Guardar Observación</button>
                  </div>
                </div>
              )}
              {v.observaciones.map((obs, idx) => (
                <div key={idx} className="bg-dark-surface border border-dark-border rounded-lg p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-text-muted">{obs.fecha}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => updateVehiculo({ ...v, observaciones: v.observaciones.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-brand-red"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  </div>
                  <h5 className="text-sm font-semibold text-white mb-1">{obs.titulo}</h5>
                  <p className="text-sm text-text-muted leading-relaxed">{obs.desc}</p>
                </div>
              ))}
              {v.observaciones.length === 0 && !showAddObs && (
                <div className="text-center p-6 border border-dashed border-dark-border rounded-lg text-text-muted text-sm">
                  No hay observaciones registradas.
                </div>
              )}
            </div>
          </div>

          {/* Mantenciones */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-dark-border pb-2">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Mantenciones
              </h4>
              <button onClick={() => setShowAddMant(!showAddMant)} className="text-xs font-medium text-text-muted hover:text-brand-cyan transition-colors flex items-center gap-1">
                <span>{showAddMant ? '-' : '+'}</span> {showAddMant ? 'Cancelar' : 'Agregar'}
              </button>
            </div>
            <div className="space-y-4">
              {showAddMant && (
                <div className="bg-dark-bg2 border border-brand-cyan/50 rounded-lg p-4 mb-4">
                  <input type="text" placeholder="Título de mantención" value={newMant.titulo} onChange={e => setNewMant({ ...newMant, titulo: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan" />
                  <textarea placeholder="Detalle de la mantención" value={newMant.desc} onChange={e => setNewMant({ ...newMant, desc: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan min-h-[80px]"></textarea>
                  <div className="flex justify-end">
                    <button onClick={() => {
                      if (!newMant.titulo || !newMant.desc) return;
                      const d = new Date();
                      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                      updateVehiculo({ ...v, mantenciones: [{ fecha: dateStr, titulo: newMant.titulo, desc: newMant.desc }, ...v.mantenciones] });
                      setShowAddMant(false);
                      setNewMant({ titulo: '', desc: '' });
                    }} className="px-3 py-1.5 bg-brand-cyan text-dark-bg text-xs font-bold rounded hover:opacity-90 transition-opacity">Guardar Mantención</button>
                  </div>
                </div>
              )}
              {v.mantenciones.map((mant, idx) => (
                <div key={idx} className="bg-dark-surface border border-dark-border rounded-lg p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-text-muted">{mant.fecha}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => updateVehiculo({ ...v, mantenciones: v.mantenciones.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-brand-red"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  </div>
                  <h5 className="text-sm font-semibold text-white mb-1">{mant.titulo}</h5>
                  <p className="text-sm text-text-muted leading-relaxed">{mant.desc}</p>
                </div>
              ))}
              {v.mantenciones.length === 0 && !showAddMant && (
                <div className="text-center p-6 border border-dashed border-dark-border rounded-lg text-text-muted text-sm">
                  No hay mantenciones registradas.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return null;
}

export default VehiculosView;
