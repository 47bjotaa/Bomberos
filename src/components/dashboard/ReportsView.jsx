import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { Icons } from '../ui/Icons';

const MOTIVOS = [
  { value: 'TODOS', label: 'Todos los motivos' },
  { value: 'BAJA', label: 'Dado de baja' },
  { value: 'PERDIDA', label: 'Pérdida' },
];

const PERIODOS = [
  { value: 'TODO', label: 'Todo el historial' },
  { value: 'MES', label: 'Por mes' },
  { value: 'ANIO', label: 'Por año' },
];

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.ubicaciones || payload?.data || payload?.result || payload?.value || [];
};

const triggerPdfDownload = (pdf, filename) => {
  const url = window.URL.createObjectURL(pdf);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

function ReportsView({ palette }) {
  const today = new Date();
  const [filters, setFilters] = useState({
    motivo: 'TODOS',
    periodo: 'TODO',
    anio: String(today.getFullYear()),
    mes: String(today.getMonth() + 1),
  });
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [rootLocationId, setRootLocationId] = useState('');
  const [rootLocations, setRootLocations] = useState([]);
  const [loadingRootLocations, setLoadingRootLocations] = useState(false);
  const [stockDownloading, setStockDownloading] = useState(false);
  const [stockError, setStockError] = useState('');

  useEffect(() => {
    const fetchRootLocations = async () => {
      setLoadingRootLocations(true);
      setStockError('');

      try {
        const data = await apiFetch('/api/ubicaciones');
        const locations = getArrayPayload(data)
          .map(location => ({
            id: location.idUbicacion || location.id,
            name: location.nombre || location.name || location.nombreUbicacion || 'Ubicación',
          }))
          .filter(location => location.id);
        setRootLocations(locations);
      } catch (locationsError) {
        setStockError(locationsError.message || 'No se pudieron cargar las ubicaciones raiz.');
      } finally {
        setLoadingRootLocations(false);
      }
    };

    fetchRootLocations();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
    setError('');
  };

  const downloadBajasReport = async () => {
    if (filters.periodo !== 'TODO' && !filters.anio) {
      setError('Selecciona un año para generar el reporte.');
      return;
    }

    const params = new URLSearchParams();
    if (filters.motivo !== 'TODOS' || filters.periodo !== 'TODO') {
      params.set('motivo', filters.motivo);
      params.set('periodo', filters.periodo);
      if (filters.periodo !== 'TODO') params.set('anio', filters.anio);
      if (filters.periodo === 'MES') params.set('mes', filters.mes);
    }

    setDownloading(true);
    setError('');

    try {
      const query = params.toString();
      const pdf = await apiFetch(`/api/materiales/reportes/bajas/pdf${query ? `?${query}` : ''}`, {
        responseType: 'blob',
      });
      const suffix = filters.periodo === 'TODO'
        ? 'historial'
        : `${filters.periodo.toLowerCase()}-${filters.anio}${filters.periodo === 'MES' ? `-${filters.mes.padStart(2, '0')}` : ''}`;
      triggerPdfDownload(pdf, `reporte-bajas-${filters.motivo.toLowerCase()}-${suffix}.pdf`);
    } catch (downloadError) {
      setError(downloadError.message || 'No se pudo generar el reporte. Verifica el permiso VER_REPORTES.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadStockReport = async () => {
    const query = rootLocationId ? `?idUbicacionRaiz=${encodeURIComponent(rootLocationId)}` : '';
    setStockDownloading(true);
    setStockError('');

    try {
      const pdf = await apiFetch(`/api/materiales/reportes/stock-cantidad/pdf${query}`, {
        responseType: 'blob',
      });
      triggerPdfDownload(pdf, `reporte-stock-cantidad-${rootLocationId ? `ubicacion-${rootLocationId}` : 'compania'}.pdf`);
    } catch (downloadError) {
      setStockError(downloadError.message || 'No se pudo generar el reporte. Verifica el permiso VER_REPORTES.');
    } finally {
      setStockDownloading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Reportes</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border p-5" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-red/30 bg-brand-red/10 text-brand-red">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Bajas de inventario</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
              </div>
            </div>
            <span className="rounded border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
              VER_REPORTES
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Motivo</span>
              <select name="motivo" value={filters.motivo} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                {MOTIVOS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Periodo</span>
              <select name="periodo" value={filters.periodo} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                {PERIODOS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {filters.periodo !== 'TODO' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Año</span>
                <input name="anio" type="number" min="2000" max="2100" value={filters.anio} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan" />
              </label>
            )}
            {filters.periodo === 'MES' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Mes</span>
                <select name="mes" value={filters.mes} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {error && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{error}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={downloadBajasReport} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60">
              <Icons.Report className="h-4 w-4" />
              {downloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </section>
        <section className="rounded-lg border p-5" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Stock por cantidad</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
              </div>
            </div>
            <span className="rounded border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
              VER_REPORTES
            </span>
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Ubicación raíz</span>
              <select
                value={rootLocationId}
                onChange={(event) => {
                  setRootLocationId(event.target.value);
                  setStockError('');
                }}
                disabled={loadingRootLocations}
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan disabled:opacity-60"
              >
                <option value="">Toda la compañía</option>
                {rootLocations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>
          </div>

          {stockError && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{stockError}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={downloadStockReport} disabled={stockDownloading || loadingRootLocations} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60">
              <Icons.Report className="h-4 w-4" />
              {stockDownloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
