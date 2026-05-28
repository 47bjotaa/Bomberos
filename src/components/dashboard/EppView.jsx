import { useEffect, useMemo, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { apiFetch } from '../../services/api';
import EppDetailView from './EppDetailView';

const EPP_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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
    timeZone: 'America/Santiago',
  }).format(date);
};

const normalizeEstado = (estadoRaw) => {
  if (!estadoRaw) return 'Operativo';
  const lower = estadoRaw.toLowerCase().trim();
  if (lower.includes('operativo') && !lower.includes('no')) {
    return 'Operativo';
  }
  if (lower.includes('baja') || lower.includes('fuera de servicio') || lower.includes('no operativo')) {
    return 'De baja';
  }
  if (lower.includes('reparacion') || lower.includes('mantenimiento') || lower.includes('mantencion') || lower.includes('pendiente')) {
    return 'Mantenimiento';
  }
  return 'Operativo';
};

const getInitial = (name) => (name?.trim()?.charAt(0) || '-').toUpperCase();
const isAssigned = (item) => Boolean(item.idBomberoAsignado || item.nombreBomberoAsignado || item.asignadoA);

const getChileIsoString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const chileAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    Number(milliseconds)
  );
  const offsetMinutes = Math.round((chileAsUtc - date.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, '0');

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}${sign}${offsetHours}:${offsetRemainder}`;
};

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
    fechaVencimientoFormateada: formatDate(item.fechaVencimiento),
    estado: normalizeEstado(item.estadoInventario || item.estadoEpp || item.estado),
  };
};

function EppView({
  eppData,
  setEppData,
  onDetailChange,
  canViewCompanyEpp = true,
  canViewOwnEpp = true,
  canManageEpp = false,
  canChangeState = false,
  canDeactivate = false,
  canManageObservations = false,
  canManageMaintenances = false,
}) {
  const [activeEppTab, setActiveEppTab] = useState(canViewCompanyEpp ? 'asignados' : 'propio');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Filtrar');
  const [loadingEpp, setLoadingEpp] = useState(false);
  const [loadingOwnEpp, setLoadingOwnEpp] = useState(false);
  const [eppError, setEppError] = useState('');
  const [ownEppError, setOwnEppError] = useState('');
  const [eppActionError, setEppActionError] = useState('');
  const [unassigningEppId, setUnassigningEppId] = useState(null);
  const [decommissionItem, setDecommissionItem] = useState(null);
  const [decommissionReason, setDecommissionReason] = useState('');
  const [confirmDecommission, setConfirmDecommission] = useState(false);
  const [decommissioning, setDecommissioning] = useState(false);
  const [selectedEppDetailId, setSelectedEppDetailId] = useState(null);
  const [eppPage, setEppPage] = useState(1);
  const [eppPageSize, setEppPageSize] = useState(5);
  const [ownEppData, setOwnEppData] = useState([]);
  const [stateChangeItem, setStateChangeItem] = useState(null);
  const [stateChangeValue, setStateChangeValue] = useState('Operativo');
  const [stateChangeSaving, setStateChangeSaving] = useState(false);
  const [stateChangeError, setStateChangeError] = useState('');

  const [editingEppId, setEditingEppId] = useState(null);
  const [editEppData, setEditEppData] = useState({});
  const [confirmEppAction, setConfirmEppAction] = useState(null);

  useEffect(() => {
    onDetailChange?.(Boolean(selectedEppDetailId));
    return () => onDetailChange?.(false);
  }, [onDetailChange, selectedEppDetailId]);

  useEffect(() => {
    let ignore = false;

    const fetchEppItems = async () => {
      if (!canViewCompanyEpp) {
        setEppData([]);
        setLoadingEpp(false);
        return;
      }

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
  }, [canViewCompanyEpp, setEppData]);

  useEffect(() => {
    let ignore = false;

    const fetchOwnEppItems = async () => {
      if (!canViewOwnEpp) {
        setOwnEppData([]);
        setLoadingOwnEpp(false);
        return;
      }

      setLoadingOwnEpp(true);
      setOwnEppError('');

      try {
        const data = await apiFetch('/api/materiales/items/epp/propio');
        const mappedItems = getArrayPayload(data).map(mapEppItem).filter(item => item.id);

        if (!ignore) {
          setOwnEppData(mappedItems);
        }
      } catch (error) {
        console.error('Error al cargar EPP propio:', error);
        if (!ignore) {
          setOwnEppError(error.message || 'No se pudo cargar tu EPP.');
          setOwnEppData([]);
        }
      } finally {
        if (!ignore) {
          setLoadingOwnEpp(false);
        }
      }
    };

    fetchOwnEppItems();

    return () => {
      ignore = true;
    };
  }, [canViewOwnEpp]);

  useEffect(() => {
    if (!canViewCompanyEpp && activeEppTab !== 'propio') {
      setActiveEppTab('propio');
      return;
    }

    if (!canViewOwnEpp && activeEppTab === 'propio') {
      setActiveEppTab(canViewCompanyEpp ? 'asignados' : 'propio');
    }
  }, [activeEppTab, canViewCompanyEpp, canViewOwnEpp]);

  const assignedData = useMemo(() => eppData.filter(isAssigned), [eppData]);
  const unassignedData = useMemo(() => eppData.filter(item => !isAssigned(item)), [eppData]);
  const currentTabData = activeEppTab === 'propio'
    ? ownEppData
    : activeEppTab === 'asignados'
      ? assignedData
      : unassignedData;
  const currentLoading = activeEppTab === 'propio' ? loadingOwnEpp : loadingEpp;
  const currentError = activeEppTab === 'propio' ? ownEppError : eppError;

  const availableStates = ['Operativo', 'De baja', 'Mantenimiento'];

  const filteredData = currentTabData.filter(item => {
    const search = filtroTexto.trim().toLowerCase();
    const textMatch = !search ||
      String(item.equipo || '').toLowerCase().includes(search) ||
      String(item.codigo || '').toLowerCase().includes(search) ||
      String(item.asignadoA || item.nombreBomberoAsignado || '').toLowerCase().includes(search);
    const stateMatch = filtroEstado === 'Filtrar' || item.estado === filtroEstado;
    return textMatch && stateMatch;
  });
  const eppItemCount = filteredData.length;
  const eppPageCount = Math.max(1, Math.ceil(eppItemCount / eppPageSize));
  const safeEppPage = Math.min(eppPage, eppPageCount);
  const eppRows = filteredData.slice((safeEppPage - 1) * eppPageSize, safeEppPage * eppPageSize);

  useEffect(() => {
    setEppPage(1);
  }, [activeEppTab, filtroTexto, filtroEstado, eppPageSize]);

  useEffect(() => {
    if (eppPage > eppPageCount) {
      setEppPage(eppPageCount);
    }
  }, [eppPage, eppPageCount]);

  const handleUnassign = async (item) => {
    const itemId = item.idItem || item.id;
    if (!canManageEpp || !itemId || unassigningEppId) return;

    setUnassigningEppId(item.id);
    setEppActionError('');

    try {
      await apiFetch(`/api/bomberos/items/${itemId}/asignacion`, {
        method: 'PATCH',
        body: JSON.stringify({
          fechaFin: getChileIsoString(),
        }),
      });

      setEppData(prev => prev.map(e => (
        e.id === item.id
          ? {
              ...e,
              idBomberoAsignado: null,
              nombreBomberoAsignado: null,
              fechaAsignacion: null,
              asignadoA: '',
              inicial: '-',
              fecha: '-',
            }
          : e
      )));
    } catch (error) {
      console.error('Error al desasignar EPP:', error);
      setEppActionError(error.message || 'No se pudo desasignar el EPP.');
    } finally {
      setUnassigningEppId(null);
    }
  };

  const openDecommissionModal = (item) => {
    if (!canDeactivate) return;

    setDecommissionItem(item);
    setDecommissionReason('');
    setConfirmDecommission(false);
    setEppActionError('');
  };

  const closeDecommissionModal = () => {
    if (decommissioning) return;
    setDecommissionItem(null);
    setDecommissionReason('');
    setConfirmDecommission(false);
  };

  const handleDecommission = async () => {
    if (!canDeactivate || !decommissionItem || !decommissionReason.trim() || decommissioning) return;

    const itemId = decommissionItem.idItem || decommissionItem.id;
    if (!itemId) {
      setEppActionError('No se pudo identificar el idItem del EPP.');
      return;
    }

    setDecommissioning(true);
    setEppActionError('');

    try {
      await apiFetch('/api/materiales/items/restar', {
        method: 'POST',
        body: JSON.stringify({
          idItem: Number(itemId),
          motivo: decommissionReason.trim(),
          fecha: getChileIsoString(),
        }),
      });

      setEppData(prev => prev.filter(item => item.id !== decommissionItem.id));
      setDecommissionItem(null);
      setDecommissionReason('');
      setConfirmDecommission(false);
    } catch (error) {
      console.error('Error al dar de baja EPP:', error);
      setEppActionError(error.message || 'No se pudo dar de baja el EPP.');
    } finally {
      setDecommissioning(false);
    }
  };

  const openStateChangeModal = (item) => {
    if (!canChangeState) return;

    setStateChangeItem(item);
    setStateChangeValue(item.estado || 'Operativo');
    setStateChangeError('');
  };

  const closeStateChangeModal = () => {
    if (stateChangeSaving) return;
    setStateChangeItem(null);
    setStateChangeError('');
  };

  const handleStateChange = async (event) => {
    event.preventDefault();
    if (!canChangeState || !stateChangeItem || stateChangeSaving) return;

    const itemId = stateChangeItem.idItem || stateChangeItem.id;
    if (!itemId) {
      setStateChangeError('No se pudo identificar el EPP.');
      return;
    }

    const payload = { estado: stateChangeValue };

    setStateChangeSaving(true);
    setStateChangeError('');
    setEppActionError('');

    try {
      const updatedDetail = await apiFetch(`/api/materiales/items/${itemId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const updatedState = normalizeEstado(updatedDetail?.estado || updatedDetail?.estadoEpp || updatedDetail?.estadoInventario || payload.estado);
      const applyUpdate = item => (
        String(item.idItem || item.id) === String(itemId)
          ? { ...item, ...(updatedDetail || {}), estadoInventario: payload.estado, estado: updatedState }
          : item
      );

      setOwnEppData(prev => prev.map(applyUpdate));
      setEppData(prev => prev.map(applyUpdate));
      setStateChangeItem(null);
    } catch (error) {
      setStateChangeError(error.message || 'No se pudo cambiar el estado del EPP.');
    } finally {
      setStateChangeSaving(false);
    }
  };

  if (selectedEppDetailId) {
    return (
      <EppDetailView
        itemId={selectedEppDetailId}
        onBack={() => setSelectedEppDetailId(null)}
        canEdit={canManageEpp}
        canDeactivate={canDeactivate}
        canManageImages={canManageEpp}
        canManageObservations={canManageObservations}
        canManageMaintenances={canManageMaintenances}
        onRemoved={() => {
          setEppData(prev => prev.filter(item => String(item.idItem || item.id) !== String(selectedEppDetailId)));
          setSelectedEppDetailId(null);
        }}
      />
    );
  }

  return (
    <div className="h-full overflow-auto p-8 custom-scrollbar fade-in">
      <div className="flex gap-3 mb-6">
        {canViewCompanyEpp && (
          <>
            <button
              onClick={() => setActiveEppTab('asignados')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'asignados' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'bg-transparent border-transparent text-text-muted hover:text-text-main'}`}
            >
              <Icons.User className="w-4 h-4 text-brand-cyan" />
              Asignados <span className="bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full text-xs font-bold ml-1">{assignedData.length}</span>
            </button>
            <button
              onClick={() => setActiveEppTab('no-asignados')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'no-asignados' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'bg-transparent border-transparent text-text-muted hover:text-text-main'}`}
            >
              <Icons.Inventory className="w-4 h-4 text-text-muted" />
              No asignados <span className="bg-dark-bg3 text-text-muted px-2 py-0.5 rounded-full text-xs font-bold border border-dark-border ml-1">{unassignedData.length}</span>
            </button>
          </>
        )}
        {canViewOwnEpp && (
          <button
            onClick={() => setActiveEppTab('propio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'propio' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'bg-transparent border-transparent text-text-muted hover:text-text-main'}`}
          >
            <Icons.Shield className="w-4 h-4 text-brand-cyan" />
            Mi EPP <span className="bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full text-xs font-bold ml-1">{ownEppData.length}</span>
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            placeholder="Buscar por código, nombre o voluntario..."
            className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-dark-border text-text-main rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <div className="w-48 relative">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={`w-full px-4 py-2 bg-dark-surface border text-text-main rounded-lg outline-none focus:ring-1 appearance-none text-sm pl-10 transition-all ${
              filtroEstado === 'Operativo' ? 'border-brand-green/60 focus:border-brand-green focus:ring-brand-green' :
              filtroEstado === 'De baja' ? 'border-brand-red/60 focus:border-brand-red focus:ring-brand-red' :
              filtroEstado === 'Mantenimiento' ? 'border-brand-gold/60 focus:border-brand-gold focus:ring-brand-gold' :
              'border-dark-border focus:border-brand-cyan focus:ring-brand-cyan'
            }`}
          >
            <option value="Filtrar" className="bg-dark-surface text-text-main">Filtrar</option>
            {availableStates.map(state => (
              <option key={state} value={state} className="bg-dark-surface text-text-main">{state}</option>
            ))}
          </select>
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          <svg className="w-4 h-4 absolute right-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {eppActionError && (
        <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {eppActionError}
        </div>
      )}

      <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface shadow-lg">
        <div
          className="custom-scrollbar min-h-[27rem] max-h-[27rem] overflow-auto"
          style={{ scrollbarGutter: 'stable' }}
        >
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-xs tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-semibold">EQUIPO</th>
                <th className="px-6 py-3 font-semibold">CÓDIGO ÚNICO</th>
                <th className="px-6 py-3 font-semibold">ASIGNADO A</th>
                <th className="px-6 py-3 font-semibold">{activeEppTab === 'no-asignados' ? 'FECHA VENCIMIENTO' : 'FECHA ASIGNACIÓN'}</th>
                <th className="px-6 py-3 font-semibold">ESTADO</th>
                <th className="px-6 py-3 font-semibold text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {currentLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-text-muted">Cargando EPP...</td>
                </tr>
              ) : currentError ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="inline-flex flex-col items-center rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-4">
                      <p className="text-sm font-semibold text-brand-red">{currentError}</p>
                    </div>
                  </td>
                </tr>
              ) : eppRows.length > 0 ? eppRows.map(item => {
                const isEditing = editingEppId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedEppDetailId(item.idItem || item.id)}
                    className="group cursor-pointer hover:bg-dark-bg3 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-text-muted border border-dark-border shadow-[0_0_10px_rgba(0,0,0,0.2)]">
                          <Icons.Shield className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-white transition-colors group-hover:text-brand-cyan">{item.equipo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-text-muted font-mono text-xs">{item.codigo}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-xs">
                          {item.inicial}
                        </div>
                        <span className={item.asignadoA ? 'text-white' : 'text-text-muted'}>{item.asignadoA || 'Sin asignar'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-text-muted">
                      {activeEppTab === 'no-asignados' ? item.fechaVencimientoFormateada : item.fecha}
                    </td>
                    <td className="px-6 py-3">
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.estado === 'Operativo' ? 'bg-brand-green border-brand-green/20 text-white' :
                          item.estado === 'De baja' ? 'bg-brand-red border-brand-red/20 text-white' :
                          item.estado === 'Mantenimiento' ? 'bg-brand-gold border-brand-gold/20 text-white' :
                          'bg-dark-bg3 border-dark-border text-text-muted'
                        }`}>
                          {item.estado}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {activeEppTab === 'propio' && canChangeState ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openStateChangeModal(item);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1.5 text-xs font-semibold text-brand-cyan transition-colors hover:bg-brand-cyan/20"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0119 5m0 0h-5m5 0v5"></path></svg>
                            Cambiar estado
                          </button>
                        ) : activeEppTab === 'asignados' && isAssigned(item) && canManageEpp ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleUnassign(item);
                            }}
                            disabled={unassigningEppId === item.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-1.5 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a6 6 0 0112 0M16 11h6"></path></svg>
                            {unassigningEppId === item.id ? 'Desasignando...' : 'Desasignar'}
                          </button>
                        ) : activeEppTab === 'no-asignados' && !isAssigned(item) && canDeactivate ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openDecommissionModal(item);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-1.5 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            Dar de baja
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-xl p-8">
                      <div className="mb-4 h-12 w-12 text-text-muted opacity-20">
                        <Icons.Shield />
                      </div>
                      <p className="text-text-muted rajdhani text-lg">
                        No hay EPP {activeEppTab === 'propio' ? 'propio' : activeEppTab === 'asignados' ? 'asignados' : 'no asignados'} con ese criterio.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!currentLoading && !currentError && eppItemCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={eppPageSize}
              onChange={(event) => {
                setEppPageSize(Number(event.target.value));
                setEppPage(1);
              }}
              className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2 text-text-main outline-none focus:border-brand-cyan"
            >
              {EPP_PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <span>por página</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-text-main">
              {eppItemCount} registros - Página {safeEppPage} de {eppPageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEppPage(page => Math.max(1, page - 1))}
                disabled={safeEppPage <= 1}
                className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-text-main transition-colors hover:border-brand-cyan/50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setEppPage(page => Math.min(eppPageCount, page + 1))}
                disabled={safeEppPage >= eppPageCount}
                className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-text-main transition-colors hover:border-brand-cyan/50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

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
                ? `Estás a punto de eliminar "${confirmEppAction.item.equipo}". Esta acción no se puede deshacer.`
                : `Estás a punto de modificar el estado de "${confirmEppAction.item.equipo}".`}
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

      {stateChangeItem && canChangeState && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleStateChange} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl fade-in">
            <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white rajdhani">Cambiar estado</h3>
                <p className="mt-0.5 text-xs text-text-muted">{stateChangeItem.equipo}</p>
              </div>
              <button
                type="button"
                onClick={closeStateChangeModal}
                disabled={stateChangeSaving}
                className="text-text-muted hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                <p className="text-sm font-semibold text-white">{stateChangeItem.equipo}</p>
                <p className="mt-1 text-xs text-text-muted font-mono">{stateChangeItem.codigo}</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white rajdhani tracking-wide">Estado</span>
                <select
                  value={stateChangeValue}
                  onChange={(event) => setStateChangeValue(event.target.value)}
                  disabled={stateChangeSaving}
                  className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                >
                  {availableStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </label>
              {stateChangeError && (
                <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                  {stateChangeError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
              <button
                type="button"
                onClick={closeStateChangeModal}
                disabled={stateChangeSaving}
                className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={stateChangeSaving}
                className="px-4 py-2 text-sm font-medium text-dark-bg bg-brand-cyan rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stateChangeSaving ? 'Guardando...' : 'Guardar estado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {decommissionItem && canDeactivate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl fade-in">
            <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white rajdhani">
                {confirmDecommission ? 'Confirmar baja' : 'Dar de baja EPP'}
              </h3>
              <button
                onClick={closeDecommissionModal}
                disabled={decommissioning}
                className="text-text-muted hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {!confirmDecommission ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (decommissionReason.trim()) {
                    setConfirmDecommission(true);
                  }
                }}
              >
                <div className="p-6 space-y-4">
                  <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                    <p className="text-sm font-semibold text-white">{decommissionItem.equipo}</p>
                    <p className="mt-1 text-xs text-text-muted font-mono">{decommissionItem.codigo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2 rajdhani tracking-wide">
                      Motivo de la baja <span className="text-brand-red">*</span>
                    </label>
                    <textarea
                      autoFocus
                      rows="4"
                      value={decommissionReason}
                      onChange={(event) => setDecommissionReason(event.target.value)}
                      disabled={decommissioning}
                      className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                      placeholder="Ej. Equipo deteriorado, vencido o fuera de servicio..."
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDecommissionModal}
                    disabled={decommissioning}
                    className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!decommissionReason.trim() || decommissioning}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dar de baja
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-text-muted">
                    Estás a punto de dar de baja "{decommissionItem.equipo}". Esta acción registrará el motivo y quitará el EPP de la lista disponible.
                  </p>
                  <div className="mt-4 rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Motivo</p>
                    <p className="mt-1 text-sm text-white">{decommissionReason.trim()}</p>
                  </div>
                </div>
                <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDecommission(false)}
                    disabled={decommissioning}
                    className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleDecommission}
                    disabled={decommissioning}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {decommissioning ? 'Dando de baja...' : 'Si, dar de baja'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EppView;
