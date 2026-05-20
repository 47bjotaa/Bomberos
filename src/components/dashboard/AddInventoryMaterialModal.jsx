import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { getThemePalette } from '../../utils/themePalette';

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.materiales)) return payload.materiales;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (payload?.data && typeof payload.data === 'object') return getArrayPayload(payload.data);
  return [];
};

const toBoolean = (value) => (
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
);

const mapMaterial = (material) => ({
  id: material.idMaterial || material.id,
  idTipoProducto: material.idTipoProducto,
  nombre: material.nombre || material.nombreMaterial || material.name || 'Material',
  tipo: material.tipoMaterial || material.nombreTipoProducto || material.tipo || 'General',
  serializado: toBoolean(material.serializado) || toBoolean(material.esSerializado) || toBoolean(material.esSerializacion) || toBoolean(material.requiereCodigoUnico),
});

function AddInventoryMaterialModal({ idUbicacion, onClose, onAdded }) {
  const { theme } = useTheme();
  const palette = getThemePalette(theme);
  const [catalogo, setCatalogo] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    cantidad: 1,
    codigoUnico: '',
    estado: 'Operativo',
    motivo: '',
    talla: '',
    fechaVencimiento: ''
  });

  useEffect(() => {
    const fetchCatalogo = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await apiFetch('/api/materiales/creados');
        setCatalogo(getArrayPayload(data).map(mapMaterial).filter(material => material.id));
      } catch (err) {
        setError(err.message || 'No se pudo cargar el catalogo de materiales.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogo();
  }, []);

  const filteredCatalogo = useMemo(() => (
    catalogo.filter(material =>
      material.nombre.toLowerCase().includes(search.toLowerCase()) ||
      material.tipo.toLowerCase().includes(search.toLowerCase())
    )
  ), [catalogo, search]);

  const idUsuario = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.idUsuario || user.id || 0;
    } catch {
      return 0;
    }
  }, []);

  const isEpp = Number(selectedMaterial?.idTipoProducto) === 1 || selectedMaterial?.tipo?.trim().toLowerCase() === 'epp';
  const usesItemEndpoint = Boolean(selectedMaterial?.serializado || isEpp);
  const canSubmit = selectedMaterial && idUbicacion &&
    (usesItemEndpoint ? formData.codigoUnico.trim() : Number(formData.cantidad) > 0) &&
    (!isEpp || (formData.talla.trim() && formData.fechaVencimiento));

  const getCreatedItemId = (payload) => {
    if (typeof payload === 'number' || typeof payload === 'string') return payload;
    if (!payload || typeof payload !== 'object') return null;

    if (payload.idItem || payload.idInventarioItem || payload.id) {
      return payload.idItem || payload.idInventarioItem || payload.id;
    }

    if (Array.isArray(payload)) return getCreatedItemId(payload[0]);
    if (payload.item && typeof payload.item === 'object') return getCreatedItemId(payload.item);
    if (payload.data && typeof payload.data === 'object') return getCreatedItemId(payload.data);
    if (payload.result && typeof payload.result === 'object') return getCreatedItemId(payload.result);

    return null;
  };

  const selectMaterial = (material) => {
    const materialIsEpp = Number(material.idTipoProducto) === 1 || material.tipo?.trim().toLowerCase() === 'epp';
    const materialRequiresItem = material.serializado || materialIsEpp;

    setSelectedMaterial(material);
    setError('');
    setFormData(prev => ({
      ...prev,
      cantidad: materialRequiresItem ? 1 : Math.max(1, Number(prev.cantidad) || 1),
      codigoUnico: materialRequiresItem ? prev.codigoUnico : '',
      estado: materialRequiresItem ? prev.estado : 'Operativo',
      talla: materialIsEpp ? prev.talla : '',
      fechaVencimiento: materialIsEpp ? prev.fechaVencimiento : ''
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setError('');

    const fecha = new Date().toISOString();
    const endpoint = usesItemEndpoint ? '/api/materiales/items/anadir' : '/api/materiales/anadir';
    const motivo = formData.motivo.trim();
    const payload = usesItemEndpoint
      ? {
          idMaterial: selectedMaterial.id,
          idUbicacion,
          idUsuario,
          codigoUnico: formData.codigoUnico.trim(),
          estado: formData.estado,
          motivo: motivo || null,
          fecha
        }
      : {
          idMaterial: selectedMaterial.id,
          idUbicacion,
          idUsuario,
          cantidad: Number(formData.cantidad),
          motivo: motivo || null,
          fecha
        };

    try {
      const createdItem = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (isEpp) {
        const idItem = getCreatedItemId(createdItem);

        if (!idItem) {
          throw new Error('El material fue creado, pero no se recibio el idItem para guardar el detalle EPP.');
        }

        await apiFetch(`/api/materiales/items/${idItem}/detalle-epp`, {
          method: 'POST',
          body: JSON.stringify({
            talla: formData.talla.trim(),
            estadoEpp: formData.estado,
            fechaVencimiento: new Date(formData.fechaVencimiento).toISOString()
          })
        });
      }

      await onAdded?.();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo añadir el material.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="themed-ui fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: palette.overlay }}>
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: palette.surface, borderColor: palette.border, color: palette.text }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: palette.border }}>
          <h3 className="rajdhani text-xl font-bold text-white">Añadir Material al Inventario</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-dark-bg3 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid min-h-[460px] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
          <section className="flex min-h-0 flex-col border-b p-5 lg:border-b-0 lg:border-r" style={{ borderColor: palette.border }}>
            <div className="relative mb-4">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
                placeholder="Buscar por nombre..."
              />
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-text-muted">Cargando catalogo...</div>
              ) : filteredCatalogo.length > 0 ? (
                <div className="space-y-2">
                  {filteredCatalogo.map(material => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => selectMaterial(material)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        selectedMaterial?.id === material.id
                          ? 'border-brand-cyan bg-brand-cyan/10 shadow-[0_0_14px_rgba(56,189,248,0.12)]'
                          : 'border-dark-border bg-dark-bg/50 hover:border-brand-cyan/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{material.nombre}</p>
                          <p className="mt-1 text-xs text-text-muted">Tipo: {material.tipo}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${material.serializado ? 'bg-brand-cyan/15 text-brand-cyan' : 'bg-dark-bg3 text-text-muted'}`}>
                          {material.serializado ? 'Serializado' : 'Generico'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-dark-border py-12 text-center text-sm text-text-muted">No hay materiales en el catalogo.</div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col p-6 overflow-y-auto">
            {selectedMaterial ? (
              <>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">Material seleccionado</p>
                <h4 className="mb-3 text-2xl font-bold text-white">{selectedMaterial.nombre}</h4>

                {usesItemEndpoint && (
                  <div className="mb-6 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-4 text-sm text-brand-cyan">
                    Este material requiere control individualizado. La cantidad se fija en 1 y debes ingresar su codigo unico.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Cantidad</span>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad}
                      disabled={usesItemEndpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all disabled:cursor-not-allowed disabled:opacity-45 focus:border-brand-cyan"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Codigo Unico {usesItemEndpoint && <span className="text-brand-red">*</span>}</span>
                    <input
                      type="text"
                      value={formData.codigoUnico}
                      disabled={!usesItemEndpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigoUnico: e.target.value }))}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all disabled:cursor-not-allowed disabled:opacity-45 focus:border-brand-cyan"
                      placeholder="Ej: EXT-MANG-001"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Estado</span>
                    <select
                      value={formData.estado}
                      disabled={!usesItemEndpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all disabled:cursor-not-allowed disabled:opacity-45 focus:border-brand-cyan"
                    >
                      <option value="Operativo">Operativo</option>
                      <option value="En Reparacion">En Reparacion</option>
                      <option value="Fuera de Servicio">Fuera de Servicio</option>
                    </select>
                  </label>

                  {isEpp && (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-text-main">Talla <span className="text-brand-red">*</span></span>
                        <input
                          type="text"
                          value={formData.talla}
                          onChange={(e) => setFormData(prev => ({ ...prev, talla: e.target.value }))}
                          className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                          placeholder="Ej: M, L, 42..."
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-text-main">Fecha de vencimiento <span className="text-brand-red">*</span></span>
                        <input
                          type="date"
                          value={formData.fechaVencimiento}
                          onChange={(e) => setFormData(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                          className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-cyan"
                        />
                      </label>
                    </>
                  )}

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-text-main">Motivo</span>
                    <textarea
                      value={formData.motivo}
                      onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                      className="min-h-[92px] w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                      placeholder="Ej: Ingreso inicial de inventario"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-border text-center">
                <p className="rajdhani text-lg font-semibold text-white">Selecciona un material</p>
                <p className="mt-2 max-w-sm text-sm text-text-muted">El formulario se habilitara segun si el material del catalogo es serializado o generico.</p>
              </div>
            )}

            {error && <div className="mt-4 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

            <div className="mt-auto flex justify-end gap-3 border-t border-dark-border pt-5">
              <button type="button" onClick={onClose} className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg3 hover:text-white">
                Volver
              </button>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Añadiendo...' : 'Añadir material'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}

export default AddInventoryMaterialModal;
