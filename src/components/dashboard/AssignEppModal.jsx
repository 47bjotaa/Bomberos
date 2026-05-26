import { useEffect, useMemo, useState } from 'react';
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

const getInitial = (name) => (name?.trim()?.charAt(0) || '?').toUpperCase();

const isAssigned = (item) => Boolean(item.idBomberoAsignado || item.nombreBomberoAsignado);

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

const mapEppItem = (item) => ({
  ...item,
  id: item.idInventarioItem || item.idItem || item.idDetalleEpp || item.id,
  idItem: item.idItem || item.id,
  equipo: item.nombreMaterial || item.equipo || 'EPP sin nombre',
  codigo: item.codigoUnico || item.codigo || '-',
  tipo: item.nombreTipoProducto || item.tipo || 'EPP',
  estado: item.estadoInventario || item.estadoEpp || item.estado || 'Sin estado',
});

function AssignEppModal({ onClose, onAssign }) {
  const [selectedBomberoId, setSelectedBomberoId] = useState('');
  const [searchEpp, setSearchEpp] = useState('');
  const [selectedEppIds, setSelectedEppIds] = useState([]);
  const [bomberos, setBomberos] = useState([]);
  const [eppDisponibles, setEppDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const [eppData, bomberosData] = await Promise.all([
          apiFetch('/api/materiales/items/epp'),
          apiFetch('/api/bomberos'),
        ]);

        if (ignore) return;

        const mappedEpp = getArrayPayload(eppData)
          .filter(item => !isAssigned(item))
          .map(mapEppItem)
          .filter(item => item.id && item.idItem);

        const mappedBomberos = getArrayPayload(bomberosData)
          .map(bombero => ({
            id: bombero.idBombero || bombero.id,
            nombre: bombero.nombre || 'Bombero sin nombre',
          }))
          .filter(bombero => bombero.id);

        setEppDisponibles(mappedEpp);
        setBomberos(mappedBomberos);
      } catch (fetchError) {
        console.error('Error al cargar datos para asignar EPP:', fetchError);
        if (!ignore) {
          setError(fetchError.message || 'No se pudieron cargar los datos para asignar EPP.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedBombero = bomberos.find(bombero => String(bombero.id) === selectedBomberoId);

  const filteredEpp = useMemo(() => {
    const search = searchEpp.trim().toLowerCase();

    if (!search) return eppDisponibles;

    return eppDisponibles.filter(item =>
      String(item.equipo || '').toLowerCase().includes(search) ||
      String(item.codigo || '').toLowerCase().includes(search)
    );
  }, [eppDisponibles, searchEpp]);

  const toggleEpp = (id) => {
    setSelectedEppIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!selectedBombero || selectedEppIds.length === 0 || saving) return;

    const selectedItems = selectedEppIds
      .map(id => eppDisponibles.find(item => item.id === id))
      .filter(Boolean);
    const now = getChileIsoString();

    setSaving(true);
    setError('');

    try {
      await Promise.all(selectedItems.map(item => apiFetch('/api/bomberos/items/asignaciones', {
        method: 'POST',
        body: JSON.stringify({
          idBombero: Number(selectedBombero.id),
          idItem: Number(item.idItem),
          fechaInicio: now,
          fechaFin: null,
        }),
      })));

      onAssign(selectedItems.map(item => ({
        ...item,
        idBomberoAsignado: selectedBombero.id,
        nombreBomberoAsignado: selectedBombero.nombre,
        asignadoA: selectedBombero.nombre,
        inicial: getInitial(selectedBombero.nombre),
        fecha: new Date(now).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Santiago' }),
      })));
      onClose();
    } catch (assignError) {
      console.error('Error al asignar EPP:', assignError);
      setError(assignError.message || 'No se pudo completar la asignacion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl fade-in flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            <h3 className="text-lg font-bold text-text-main rajdhani tracking-wide">Asignar Equipo de Proteccion Personal</h3>
          </div>
          <button onClick={onClose} disabled={saving} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text-main mb-2 rajdhani tracking-wide">Seleccionar Bombero <span className="text-brand-red">*</span></label>
            <div className="relative">
              <select
                value={selectedBomberoId}
                onChange={(e) => setSelectedBomberoId(e.target.value)}
                disabled={loading || saving || bomberos.length === 0}
                className="w-full pl-12 pr-10 py-3 bg-dark-bg border border-dark-border text-text-main rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none transition-all disabled:opacity-50"
              >
                <option value="">{loading ? 'Cargando bomberos...' : 'Seleccionar bombero...'}</option>
                {bomberos.map(bombero => (
                  <option key={bombero.id} value={bombero.id}>{bombero.nombre}</option>
                ))}
              </select>
              <div className="absolute left-3 top-2.5 w-7 h-7 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-xs">
                {selectedBombero ? getInitial(selectedBombero.nombre) : '?'}
              </div>
              <svg className="w-4 h-4 absolute right-4 top-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-text-main rajdhani tracking-wide">Seleccionar EPP disponibles <span className="text-brand-red">*</span></label>
              <span className="text-xs text-text-muted">{selectedEppIds.length} seleccionados</span>
            </div>

            <div className="relative mb-3">
              <svg className="w-4 h-4 absolute left-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Buscar por equipo, talla, codigo..."
                className="w-full pl-9 pr-4 py-2 bg-dark-bg border border-dark-border text-text-main rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted disabled:opacity-50"
                value={searchEpp}
                onChange={(e) => setSearchEpp(e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-6 text-text-muted text-sm border border-dashed border-dark-border rounded-lg">
                  Cargando EPP disponibles...
                </div>
              ) : filteredEpp.length > 0 ? filteredEpp.map(item => {
                const isSelected = selectedEppIds.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleEpp(item.id)}
                    disabled={saving}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all text-left disabled:opacity-50 ${isSelected ? 'bg-brand-cyan/10 border-brand-cyan shadow-[0_0_10px_rgba(56,189,248,0.1)]' : 'bg-dark-bg border-dark-border hover:border-brand-cyan/50'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-brand-cyan border-brand-cyan' : 'border-dark-border bg-dark-bg3'}`}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-dark-bg font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-medium text-sm truncate ${isSelected ? 'text-brand-cyan' : 'text-text-main'}`}>{item.equipo}</div>
                        <div className="text-xs text-text-muted font-mono truncate">{item.codigo}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-4">
                      <span className="text-xs text-text-muted">{item.tipo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${item.estado === 'Nuevo' ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'}`}>
                        {item.estado}
                      </span>
                    </div>
                  </button>
                );
              }) : (
                <div className="text-center py-6 text-text-muted text-sm border border-dashed border-dark-border rounded-lg">
                  No se encontraron EPP disponibles.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver
          </button>
          <button
            disabled={!selectedBomberoId || selectedEppIds.length === 0 || saving}
            onClick={handleAssign}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(59,130,246,0.4)] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            {saving ? 'Asignando...' : `Asignar (${selectedEppIds.length}) Equipos`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignEppModal;
