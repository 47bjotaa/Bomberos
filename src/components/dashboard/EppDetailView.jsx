import { useEffect, useState } from 'react';
import { Icons } from '../ui/Icons';
import { apiFetch } from '../../services/api';
import MaterialDetailView from './MaterialDetailView';

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(date);
};

function DetailCard({ label, value, tone = 'default' }) {
  const toneClass = tone === 'cyan'
    ? 'border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan'
    : tone === 'red'
      ? 'border-brand-red/20 bg-brand-red/10 text-brand-red'
      : 'border-dark-border bg-dark-bg text-white';

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold">{value || '-'}</p>
    </div>
  );
}

function EppDetailView({ itemId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchDetail = async () => {
      if (!itemId) {
        setError('No se pudo identificar el item EPP.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await apiFetch(`/api/materiales/items/${itemId}/detalle-epp`);
        if (!ignore) {
          setDetail(data);
        }
      } catch (fetchError) {
        console.error('Error al cargar detalle EPP:', fetchError);
        if (!ignore) {
          setError(fetchError.message || 'No se pudo cargar el detalle EPP.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [itemId]);

  return (
    <div className="h-full overflow-auto bg-dark-bg p-8 text-text-main fade-in">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/50 hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Volver
      </button>

      {loading ? (
        <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-20 text-center text-text-muted">
          Cargando detalle EPP...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan">
                  <Icons.Shield />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">Equipo de Proteccion Personal</p>
                  <h2 className="rajdhani mt-1 text-3xl font-bold text-white">{detail.nombreMaterial || 'EPP sin nombre'}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">{detail.descripcionMaterial || 'Sin descripcion registrada.'}</p>
                </div>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${detail.estadoEpp === 'Operativo' ? 'border-brand-green/20 bg-brand-green/10 text-brand-green' : 'border-brand-red/20 bg-brand-red/10 text-brand-red'}`}>
                {detail.estadoEpp || detail.estadoInventario || 'Sin estado'}
              </span>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailCard label="Codigo unico" value={detail.codigoUnico} tone="cyan" />
            <DetailCard label="Talla" value={detail.talla || 'Sin talla'} />
            <DetailCard label="Vencimiento" value={formatDate(detail.fechaVencimiento)} />
            <DetailCard label="Estado inventario" value={detail.estadoInventario} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
              <h3 className="rajdhani text-xl font-bold text-white">Informacion del material</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-dark-border pb-3">
                  <dt className="text-text-muted">Tipo producto</dt>
                  <dd className="font-semibold text-white">{detail.nombreTipoProducto || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-dark-border pb-3">
                  <dt className="text-text-muted">ID material</dt>
                  <dd className="font-mono text-brand-cyan">{detail.idMaterial || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">ID item</dt>
                  <dd className="font-mono text-brand-cyan">{detail.idItem || '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
              <h3 className="rajdhani text-xl font-bold text-white">Detalle EPP</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-dark-border pb-3">
                  <dt className="text-text-muted">ID detalle EPP</dt>
                  <dd className="font-mono text-brand-cyan">{detail.idDetalleEpp || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-dark-border pb-3">
                  <dt className="text-text-muted">Estado EPP</dt>
                  <dd className="font-semibold text-white">{detail.estadoEpp || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Fecha vencimiento</dt>
                  <dd className="font-semibold text-white">{formatDate(detail.fechaVencimiento)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-dark-border bg-dark-surface">
            <div className="border-b border-dark-border bg-dark-bg2 px-5 py-4">
              <h3 className="rajdhani text-xl font-bold text-white">Observaciones y mantenciones</h3>
              <p className="mt-1 text-sm text-text-muted">Gestiona el historial del item conservando las funciones del detalle general.</p>
            </div>
            <MaterialDetailView
              route={{ type: 'item', id: itemId, fallback: detail }}
              onBack={onBack}
              embedded
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default EppDetailView;
