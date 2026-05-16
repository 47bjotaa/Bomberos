import { useEffect, useMemo, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { apiFetch } from '../../services/api';

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (payload?.data && typeof payload.data === 'object') return getArrayPayload(payload.data);
  if (payload?.result && typeof payload.result === 'object') return getArrayPayload(payload.result);
  return [];
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getInitial = (name) => (name?.trim()?.charAt(0) || '-').toUpperCase();
const isAssigned = (item) => Boolean(item.idBomberoAsignado || item.nombreBomberoAsignado || item.asignadoA);

const mapEppItem = (item) => {
  const assignedName = item.nombreBomberoAsignado || item.asignadoA || '';

  return {
    ...item,
    id: item.idInventarioItem || item.idItem || item.idDetalleEpp || item.id,
    equipo: item.nombreMaterial || item.equipo || 'EPP sin nombre',
    codigo: item.codigoUnico || item.codigo || '-',
    asignadoA: assignedName,
    inicial: getInitial(assignedName),
    fecha: formatDate(item.fechaAsignacion || item.fecha),
    estado: item.estadoInventario || item.estadoEpp || item.estado || 'Sin estado',
  };
};

function EppView({ eppData, setEppData }) {
  const [activeEppTab, setActiveEppTab] = useState('asignados');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Filtrar');
  const [loadingEpp, setLoadingEpp] = useState(false);
  const [eppError, setEppError] = useState('');

  const [editingEppId, setEditingEppId] = useState(null);
  const [editEppData, setEditEppData] = useState({});
  const [confirmEppAction, setConfirmEppAction] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchEppItems = async () => {
      setLoadingEpp(true);
      setEppError('');

      try {
        const data = await apiFetch('/api/materiales/items/epp');
        const mappedItems = getArrayPayload(data).map(mapEppItem).filter(item => item.id);

        if (!ignore) {
          setEppData(mappedItems);
        }
      } catch (error) {
        console.error('Error al cargar items EPP:', error);
        if (!ignore) {
          setEppError(error.message || 'No se pudieron cargar los EPP.');
          setEppData([]);
        }
      } finally {
        if (!ignore) {
          setLoadingEpp(false);
        }
      }
    };

    fetchEppItems();

    return () => {
      ignore = true;
    };
  }, [setEppData]);

  const assignedData = useMemo(() => eppData.filter(isAssigned), [eppData]);
  const unassignedData = useMemo(() => eppData.filter(item => !isAssigned(item)), [eppData]);
  const currentTabData = activeEppTab === 'asignados' ? assignedData : unassignedData;

  const availableStates = useMemo(() => {
    const states = new Set(eppData.map(item => item.estado).filter(Boolean));
    return Array.from(states).sort((a, b) => a.localeCompare(b, 'es'));
  }, [eppData]);

  const filteredData = currentTabData.filter(item => {
    const search = filtroTexto.trim().toLowerCase();
    const textMatch = !search ||
      String(item.equipo || '').toLowerCase().includes(search) ||
      String(item.codigo || '').toLowerCase().includes(search) ||
      String(item.asignadoA || item.nombreBomberoAsignado || '').toLowerCase().includes(search);
    const stateMatch = filtroEstado === 'Filtrar' || item.estado === filtroEstado;
    return textMatch && stateMatch;
  });

  return (
    <div className="p-8 flex flex-col h-full fade-in">
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveEppTab('asignados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'asignados' ? 'bg-dark-bg3 border-dark-border text-white' : 'bg-transparent border-transparent text-text-muted hover:text-white'}`}
        >
          <svg className="w-4 h-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Asignados <span className="bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full text-xs font-bold ml-1">{assignedData.length}</span>
        </button>
        <button
          onClick={() => setActiveEppTab('no-asignados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'no-asignados' ? 'bg-dark-bg3 border-dark-border text-white' : 'bg-transparent border-transparent text-text-muted hover:text-white'}`}
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          No asignados <span className="bg-dark-bg3 text-text-muted px-2 py-0.5 rounded-full text-xs font-bold border border-dark-border ml-1">{unassignedData.length}</span>
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            placeholder="Buscar por codigo, nombre o voluntario..."
            className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <div className="w-48 relative">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-2 bg-dark-surface border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none text-sm pl-10"
          >
            <option value="Filtrar">Filtrar</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          <svg className="w-4 h-4 absolute right-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface shadow-lg flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-xs tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">EQUIPO</th>
                <th className="px-6 py-4 font-semibold">CODIGO UNICO</th>
                <th className="px-6 py-4 font-semibold">ASIGNADO A</th>
                <th className="px-6 py-4 font-semibold">FECHA ASIGNACION</th>
                <th className="px-6 py-4 font-semibold">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loadingEpp ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-text-muted">Cargando EPP...</td>
                </tr>
              ) : eppError ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="inline-flex flex-col items-center rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-4">
                      <p className="text-sm font-semibold text-brand-red">{eppError}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? filteredData.map(item => {
                const isEditing = editingEppId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-dark-bg3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-text-muted border border-dark-border shadow-[0_0_10px_rgba(0,0,0,0.2)]">
                          <Icons.Shield className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-white">{item.equipo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-mono text-xs">{item.codigo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-xs">
                          {item.inicial}
                        </div>
                        <span className={item.asignadoA ? 'text-white' : 'text-text-muted'}>{item.asignadoA || 'Sin asignar'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{item.fecha}</td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editEppData.estado}
                          onChange={e => setEditEppData({ ...editEppData, estado: e.target.value })}
                          className="bg-dark-bg border border-brand-cyan rounded text-sm text-white focus:outline-none px-2 py-1"
                        >
                          {availableStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.estado === 'Operativo' ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                          {item.estado}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setConfirmEppAction({ type: 'edit', item: editEppData })}
                              className="text-brand-green hover:opacity-80 transition-opacity"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                            <button
                              onClick={() => setEditingEppId(null)}
                              className="text-brand-red hover:opacity-80 transition-opacity"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingEppId(item.id);
                                setEditEppData({ ...item });
                              }}
                              className="text-text-muted hover:text-brand-cyan transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button
                              onClick={() => setConfirmEppAction({ type: 'delete', item })}
                              className="text-text-muted hover:text-brand-red transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-xl p-8">
                      <Icons.Shield size={48} className="text-text-muted mb-4 opacity-20" />
                      <p className="text-text-muted rajdhani text-lg">
                        No hay EPP {activeEppTab === 'asignados' ? 'asignados' : 'no asignados'} con ese criterio.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmEppAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 max-w-sm w-full shadow-2xl fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(232,55,42,0.1)]">
              {confirmEppAction.type === 'delete' ? (
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              ) : (
                <svg className="w-8 h-8 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 rajdhani">
              {confirmEppAction.type === 'delete' ? 'Eliminar equipo?' : 'Guardar cambios?'}
            </h3>
            <p className="text-text-muted mb-6 text-sm">
              {confirmEppAction.type === 'delete'
                ? `Estas a punto de eliminar "${confirmEppAction.item.equipo}". Esta accion no se puede deshacer.`
                : `Estas a punto de modificar el estado de "${confirmEppAction.item.equipo}".`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEppAction(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 hover:bg-dark-bg2 border border-dark-border rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmEppAction.type === 'delete') {
                    setEppData(eppData.filter(e => e.id !== confirmEppAction.item.id));
                  } else {
                    setEppData(eppData.map(e => e.id === confirmEppAction.item.id ? confirmEppAction.item : e));
                    setEditingEppId(null);
                  }
                  setConfirmEppAction(null);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-lg ${
                  confirmEppAction.type === 'delete'
                    ? 'bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 shadow-[0_4px_15px_rgba(232,55,42,0.3)]'
                    : 'bg-gradient-to-r from-brand-cyan to-blue-500 hover:opacity-90 shadow-[0_4px_15px_rgba(56,189,248,0.3)]'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EppView;
