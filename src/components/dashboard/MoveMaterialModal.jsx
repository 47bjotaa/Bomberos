import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../services/api';

function MoveMaterialModal({ material, origen, onClose, onMoved }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [subUbicaciones, setSubUbicaciones] = useState([]);
  const [selectedGeneral, setSelectedGeneral] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingHijas, setLoadingHijas] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [motivo, setMotivo] = useState('');

  const getArrayPayload = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }

    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.result)) return payload.result;
    if (payload?.data && typeof payload.data === 'object') return getArrayPayload(payload.data, keys);
    return [];
  };

  const mapUbicacion = (ubicacion) => ({
    id: ubicacion.idUbicacion || ubicacion.id,
    name: ubicacion.nombre || ubicacion.name || ubicacion.nombreUbicacion || 'Ubicacion',
    nombreTipo: ubicacion.nombreTipo || ubicacion.tipo || ubicacion.tipoUbicacion || '',
    idPadre: ubicacion.idPadre,
    nombrePadre: ubicacion.nombrePadre
  });

  useEffect(() => {
    const fetchUbicaciones = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await apiFetch('/api/ubicaciones');
        setUbicaciones(getArrayPayload(data, ['ubicaciones']).map(mapUbicacion).filter(ubi => ubi.id));
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las ubicaciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchUbicaciones();
  }, []);

  const selectedTarget = useMemo(() => (
    subUbicaciones.find(ubi => String(ubi.id) === String(selectedTargetId)) || null
  ), [subUbicaciones, selectedTargetId]);

  const targetName = selectedTarget?.name || '';
  const idUsuario = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.idUsuario || user.id || 0;
    } catch {
      return 0;
    }
  }, []);

  const isSerializado = Boolean(material?.serializado || material?.idItem || material?.codigo);
  const canMove = selectedTarget && motivo.trim() && (isSerializado ? material?.idItem : material?.idMaterial) && (isSerializado || (material?.idUbicacion || origen?.id));

  const selectGeneral = async (ubicacion) => {
    setSelectedGeneral(ubicacion);
    setSelectedTargetId('');
    setSubUbicaciones([]);
    setError('');
    setLoadingHijas(true);

    try {
      const data = await apiFetch(`/api/ubicaciones/${ubicacion.id}/hijas`);
      setSubUbicaciones(getArrayPayload(data, ['ubicaciones', 'hijas', 'subUbicaciones']).map(mapUbicacion).filter(ubi => ubi.id));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las ubicaciones hijas.');
    } finally {
      setLoadingHijas(false);
    }
  };

  const goBack = () => {
    setSelectedGeneral(null);
    setSelectedTargetId('');
    setSubUbicaciones([]);
    setError('');
  };

  const handleMove = async () => {
    if (!canMove) return;

    setSaving(true);
    setError('');

    const fecha = new Date().toISOString();
    const endpoint = isSerializado ? '/api/materiales/items/movimiento' : '/api/materiales/movimiento';
    const payload = isSerializado
      ? {
          idItem: material.idItem,
          idUbicacionDestino: selectedTarget.id,
          idUsuario,
          motivo: motivo.trim(),
          fecha
        }
      : {
          idMaterial: material.idMaterial,
          idUbicacionOrigen: material.idUbicacion || origen.id,
          idUbicacionDestino: selectedTarget.id,
          idUsuario,
          motivo: motivo.trim(),
          fecha
        };

    try {
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await onMoved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo mover el material.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <div>
            <h3 className="rajdhani text-xl font-bold text-white">¿Donde quieres mover el material seleccionado?</h3>
            <p className="mt-1 text-sm text-text-muted">{material?.nombre}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-dark-bg3 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!selectedGeneral ? (
            <>
              {loading ? (
                <div className="py-16 text-center text-sm text-text-muted">Cargando ubicaciones...</div>
              ) : ubicaciones.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ubicaciones.map(ubicacion => (
                    <button
                      key={ubicacion.id}
                      onClick={() => selectGeneral(ubicacion)}
                      className="rounded-2xl border border-dark-border bg-dark-bg/50 p-5 text-center transition-all hover:border-brand-cyan/50 hover:bg-brand-cyan/5"
                    >
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-dark-bg3 text-brand-cyan">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-white">{ubicacion.name}</p>
                      <p className="mt-1 text-xs text-text-muted">{ubicacion.nombreTipo || 'Ubicacion'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-border py-14 text-center text-sm text-text-muted">No hay ubicaciones disponibles.</div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Ubicacion general</p>
                  <h4 className="mt-1 text-lg font-bold text-white">{selectedGeneral.name}</h4>
                </div>
                <button onClick={goBack} className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg3 hover:text-white">
                  Volver
                </button>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-main">Ubicacion hija objetivo</span>
                <select
                  value={selectedTargetId}
                  disabled={loadingHijas || subUbicaciones.length === 0}
                  onChange={(event) => setSelectedTargetId(event.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 focus:border-brand-cyan"
                >
                  <option value="">{loadingHijas ? 'Cargando...' : 'Seleccionar ubicacion hija...'}</option>
                  {subUbicaciones.map(ubicacion => (
                    <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.name}</option>
                  ))}
                </select>
              </label>

              {subUbicaciones.length === 0 && !loadingHijas && (
                <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">
                  Esta ubicacion no tiene ubicaciones hijas disponibles para mover el material.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-dark-border bg-dark-bg/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Origen</p>
                  <p className="mt-2 font-semibold text-white">{material?.ubicacion || origen?.name || 'Ubicacion actual'}</p>
                </div>
                <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Objetivo</p>
                  <p className="mt-2 font-semibold text-white">{targetName || 'Sin seleccionar'}</p>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-main">Motivo <span className="text-brand-red">*</span></span>
                <textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  className="min-h-[86px] w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                  placeholder="Ej: Reubicacion de inventario"
                />
              </label>
            </div>
          )}

          {error && <div className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg/50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg3 hover:text-white">
            Cancelar
          </button>
          <button
            onClick={handleMove}
            disabled={!canMove || saving}
            className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Moviendo...' : 'Mover'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveMaterialModal;
