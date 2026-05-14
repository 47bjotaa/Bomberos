import { useEffect, useMemo, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { apiFetch } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { getThemePalette } from '../../utils/themePalette';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeDetail = (data, fallback = {}) => {
  const isSerialized = Boolean(data.esSerializacion || data.idItem || data.codigoUnico || fallback.serializado);

  return {
    id: data.idItem || data.idMaterial || fallback.id,
    idItem: data.idItem || fallback.idItem,
    idMaterial: data.idMaterial || fallback.idMaterial,
    nombre: data.nombreMaterial || data.nombre || fallback.nombre || 'Material',
    descripcion: data.descripcionMaterial || data.descripcion || 'Sin descripcion registrada.',
    tipo: data.nombreTipoProducto || fallback.categoria || 'Sin tipo',
    esSerializacion: isSerialized,
    requiereMantencion: Boolean(data.requiereMantencion),
    codigoUnico: data.codigoUnico || fallback.codigo || '',
    valorUnitario: data.valorUnitario,
    ubicacion: data.nombreUbicacion || fallback.ubicacion || '',
    estadoInventario: data.estadoInventario || '',
    observaciones: Array.isArray(data.observaciones) ? data.observaciones : [],
    mantenciones: Array.isArray(data.mantenciones) ? data.mantenciones : [],
  };
};

function EmptyState({ children, palette }) {
  return (
    <div
      className="rounded-lg border border-dashed px-4 py-8 text-center text-sm"
      style={{ borderColor: palette.border, color: palette.muted }}
    >
      {children}
    </div>
  );
}

function MaterialDetailView({ route, onBack }) {
  const { theme } = useTheme();
  const palette = getThemePalette(theme);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [observationImage, setObservationImage] = useState(null);
  const [observationImagePreview, setObservationImagePreview] = useState('');
  const [observationSaving, setObservationSaving] = useState(false);
  const [observationError, setObservationError] = useState('');

  const resetObservationDraft = () => {
    setShowObservationForm(false);
    setObservationText('');
    setObservationImage(null);
    setObservationImagePreview('');
    setObservationError('');
  };

  const handleObservationImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setObservationImage(file);
    setObservationImagePreview(file ? URL.createObjectURL(file) : '');
  };

  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      setShowObservationForm(false);
      setObservationText('');
      setObservationImage(null);
      setObservationImagePreview('');
      setObservationError('');

      try {
        const endpoint = route.type === 'item'
          ? `/api/materiales/items/${route.id}`
          : `/api/materiales/${route.id}`;
        const data = await apiFetch(endpoint);

        if (mounted) {
          setDetail(normalizeDetail(data, route.fallback));
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'No se pudo cargar el detalle del material.');
          setDetail(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      mounted = false;
    };
  }, [route]);

  useEffect(() => () => {
    if (observationImagePreview) {
      URL.revokeObjectURL(observationImagePreview);
    }
  }, [observationImagePreview]);

  const material = useMemo(() => detail || normalizeDetail({}, route.fallback), [detail, route.fallback]);
  const shouldShowMantenciones = Boolean(material.requiereMantencion);
  const gridColumns = shouldShowMantenciones ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  const handleCreateObservation = async (event) => {
    event.preventDefault();

    const trimmedObservation = observationText.trim();
    if (!trimmedObservation) return;

    const idItem = material.esSerializacion ? Number(material.idItem || route.id) : 0;
    const idMaterial = material.esSerializacion ? 0 : Number(material.idMaterial || route.id);
    const fecha = new Date().toISOString();
    const payload = {
      idItem,
      idMaterial,
      idVehiculo: 0,
      observacion: trimmedObservation,
      fecha,
    };

    setObservationSaving(true);
    setObservationError('');

    try {
      const createdObservation = await apiFetch('/api/observaciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const nextObservation = {
        ...payload,
        ...createdObservation,
        observacion: createdObservation.observacion || payload.observacion,
        fecha: createdObservation.fecha || payload.fecha,
      };

      setDetail((currentDetail) => {
        const current = currentDetail || material;

        return {
          ...current,
          observaciones: [nextObservation, ...(current.observaciones || [])],
        };
      });
      setObservationText('');
      setObservationImage(null);
      setObservationImagePreview('');
      setShowObservationForm(false);
    } catch (err) {
      setObservationError(err.message || 'No se pudo crear la observacion.');
    } finally {
      setObservationSaving(false);
    }
  };

  return (
    <section className="themed-ui h-full overflow-y-auto" style={{ background: palette.isLight ? '#FFFFFF' : palette.bg, color: palette.text }}>
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: palette.border }}>
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 border-r pr-4 text-sm font-medium transition-colors hover:text-brand-cyan"
              style={{ borderColor: palette.border, color: palette.muted }}
            >
              <span className="text-lg leading-none">&larr;</span>
              Volver
            </button>
            <h2 className="truncate text-lg font-bold" style={{ color: palette.text }}>Detalle del Item</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              type="button"
            >
              <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">
                <Icons.AlertTriangle />
              </span>
              Dar de baja
            </button>
            <button
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:border-brand-cyan/50"
              style={{ background: palette.card, borderColor: palette.border, color: palette.text }}
              type="button"
            >
              <span className="text-base leading-none">&#9998;</span>
              Editar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-cyan/20 border-t-brand-cyan"></div>
            <p className="text-sm" style={{ color: palette.muted }}>Cargando especificaciones...</p>
          </div>
        ) : error ? (
          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-brand-red/30 bg-brand-red/10 p-6 text-center">
            <p className="font-semibold" style={{ color: palette.text }}>No se pudo cargar el material</p>
            <p className="mt-2 text-sm text-brand-red">{error}</p>
          </div>
        ) : (
          <>
            <div className="mt-7 rounded-2xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
              <div className="grid gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div
                    className="aspect-square rounded-xl border"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.isLight ? '#F8FAFC' : palette.bg2,
                      backgroundImage: `linear-gradient(45deg, ${palette.isLight ? '#E5E7EB' : '#111827'} 25%, transparent 25%), linear-gradient(-45deg, ${palette.isLight ? '#E5E7EB' : '#111827'} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${palette.isLight ? '#E5E7EB' : '#111827'} 75%), linear-gradient(-45deg, transparent 75%, ${palette.isLight ? '#E5E7EB' : '#111827'} 75%)`,
                      backgroundSize: '32px 32px',
                      backgroundPosition: '0 0, 0 16px, 16px -16px, -16px 0px',
                    }}
                  />
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold transition-colors hover:border-brand-cyan/50"
                    style={{ borderColor: palette.border, background: palette.cardSoft, color: palette.text }}
                    type="button"
                  >
                    <span className="text-base leading-none">&#128247;</span>
                    Anadir foto
                  </button>
                  {material.ubicacion && (
                    <div className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: palette.border, background: palette.cardSoft }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                        <span className="text-sm">&#9906;</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: palette.muted }}>Ubicacion actual</p>
                        <p className="truncate text-sm font-semibold" style={{ color: palette.text }}>{material.ubicacion}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">{material.tipo}</span>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: palette.bg3, color: palette.muted }}>
                      {material.esSerializacion ? 'Serializado' : 'No serializado'}
                    </span>
                    {material.estadoInventario && (
                      <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green">{material.estadoInventario}</span>
                    )}
                  </div>

                  <h1 className="mt-3 text-3xl font-bold leading-tight" style={{ color: palette.text }}>{material.nombre}</h1>
                  <p className="mt-3 max-w-4xl text-sm leading-relaxed" style={{ color: palette.muted }}>{material.descripcion}</p>

                  <div className={`mt-auto grid gap-3 pt-8 ${material.esSerializacion ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                    {material.esSerializacion && (
                      <div className="rounded-lg border px-4 py-3" style={{ borderColor: palette.border, background: palette.cardSoft }}>
                        <p className="text-xs" style={{ color: palette.muted }}>Codigo Unico (SKU)</p>
                        <p className="mt-1 font-mono text-sm font-bold" style={{ color: palette.text }}>{material.codigoUnico || 'Sin codigo'}</p>
                      </div>
                    )}
                    <div className="rounded-lg border px-4 py-3" style={{ borderColor: palette.border, background: palette.cardSoft }}>
                      <p className="text-xs" style={{ color: palette.muted }}>Valor Unitario</p>
                      <p className="mt-1 text-sm font-bold" style={{ color: palette.text }}>{formatCurrency(material.valorUnitario)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-6 grid gap-6 ${gridColumns}`}>
              <div>
                <div className="mb-3 flex items-center justify-between border-b pb-2" style={{ borderColor: palette.border }}>
                  <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: palette.text }}>
                    <span className="text-text-muted">&#128196;</span>
                    Observaciones
                  </h3>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-brand-cyan/50"
                    style={{ borderColor: palette.border, background: palette.card, color: palette.text }}
                    type="button"
                    onClick={() => {
                      setShowObservationForm(true);
                      setObservationError('');
                    }}
                  >
                    + Agregar
                  </button>
                </div>
                <div className="space-y-3">
                  {material.observaciones.length > 0 ? material.observaciones.map((obs) => (
                    <article key={obs.idObservacion || `${obs.fecha}-${obs.observacion}`} className="rounded-lg border p-4" style={{ borderColor: palette.border, background: palette.card }}>
                      <p className="text-xs" style={{ color: palette.muted }}>{formatDate(obs.fecha)}</p>
                      <p className="mt-3 text-sm font-semibold" style={{ color: palette.text }}>Observacion</p>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.muted }}>{obs.observacion || 'Sin detalle'}</p>
                    </article>
                  )) : (
                    <EmptyState palette={palette}>No hay observaciones registradas.</EmptyState>
                  )}
                </div>
              </div>

              {shouldShowMantenciones && (
                <div>
                  <div className="mb-3 flex items-center justify-between border-b pb-2" style={{ borderColor: palette.border }}>
                    <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: palette.text }}>
                      <span className="text-text-muted">&#128295;</span>
                      Mantenciones
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: palette.border, background: palette.card, color: palette.text }} type="button">
                        Programar
                      </button>
                      <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: palette.border, background: palette.card, color: palette.text }} type="button">
                        + Agregar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {material.mantenciones.length > 0 ? material.mantenciones.map((mant) => (
                      <article key={mant.idMantencion || `${mant.fecha}-${mant.descripcion}`} className="rounded-lg border p-4" style={{ borderColor: palette.border, background: palette.card }}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs" style={{ color: palette.muted }}>{formatDate(mant.fecha)}</p>
                          {mant.estadoMantencion && (
                            <span className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-xs font-semibold text-brand-cyan">{mant.estadoMantencion}</span>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-semibold" style={{ color: palette.text }}>{mant.tipo || 'Mantencion'}</p>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.muted }}>{mant.descripcion || 'Sin detalle'}</p>
                      </article>
                    )) : (
                      <EmptyState palette={palette}>No hay mantenciones registradas.</EmptyState>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showObservationForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: palette.overlay }}
          onClick={() => {
            if (!observationSaving) resetObservationDraft();
          }}
        >
          <form
            onSubmit={handleCreateObservation}
            className="w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
            style={{ borderColor: palette.border, background: palette.surface }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: palette.text }}>Agregar observacion</h3>
                <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>{material.nombre}</p>
              </div>
              <button
                type="button"
                onClick={resetObservationDraft}
                disabled={observationSaving}
                className="rounded-lg px-2 py-1 text-xl leading-none transition-colors hover:text-brand-red disabled:opacity-50"
                style={{ color: palette.muted }}
              >
                x
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold" style={{ color: palette.text }}>
                  Observacion
                </label>
                <textarea
                  autoFocus
                  value={observationText}
                  onChange={(event) => setObservationText(event.target.value)}
                  placeholder="Escribe el detalle de la observacion..."
                  className="min-h-[120px] w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-brand-cyan"
                  style={{ borderColor: palette.border, background: palette.bg, color: palette.text }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold" style={{ color: palette.text }}>
                  Imagen
                </label>
                <label
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-colors hover:border-brand-cyan/60"
                  style={{ borderColor: palette.border, background: palette.cardSoft, color: palette.muted }}
                >
                  {observationImagePreview ? (
                    <img src={observationImagePreview} alt="Vista previa" className="mb-3 max-h-40 rounded-lg object-contain" />
                  ) : (
                    <span className="mb-2 text-2xl">&#128247;</span>
                  )}
                  <span className="text-sm font-semibold" style={{ color: palette.text }}>
                    {observationImage ? observationImage.name : 'Seleccionar imagen'}
                  </span>
                  <span className="mt-1 text-xs" style={{ color: palette.muted }}>PNG, JPG o JPEG</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleObservationImageChange}
                    disabled={observationSaving}
                  />
                </label>
              </div>

              {observationError && (
                <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                  {observationError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
              <button
                type="button"
                onClick={resetObservationDraft}
                disabled={observationSaving}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:text-brand-cyan disabled:opacity-50"
                style={{ color: palette.muted }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!observationText.trim() || observationSaving}
                className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {observationSaving ? 'Guardando...' : 'Guardar observacion'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default MaterialDetailView;
