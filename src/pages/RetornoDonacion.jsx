import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import LogoCuartelAmigo from '../components/ui/LogoCuartelAmigo';

const getSlugFromPath = () => decodeURIComponent(window.location.pathname.replace(/^\/donacion-gracias\/?/, '').split('/')[0] || '');

const formatDateChile = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  }).format(date);
};

function RetornoDonacion() {
  const [campana, setCampana] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const slug = useMemo(getSlugFromPath, []);

  useEffect(() => {
    let ignore = false;

    const fetchCampana = async () => {
      if (!slug) {
        setError('No se encontró la campaña asociada a esta donación.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await apiFetch(`/api/campanasdonaciones/publica/${encodeURIComponent(slug)}`, {
          skipAuth: true,
        });

        if (!ignore) {
          setCampana(data);
        }
      } catch (fetchError) {
        console.error('Error al cargar campana de retorno:', fetchError);
        if (!ignore) {
          setError(fetchError.message || 'No se pudo cargar la campaña.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchCampana();

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-dark-bg text-text-main">
      <header className="border-b border-dark-border bg-dark-surface px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <LogoCuartelAmigo size={44} />
          </a>
          <span className="rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
            Donación recibida
          </span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center px-6 py-12">
        {loading ? (
          <div className="w-full rounded-xl border border-dark-border bg-dark-surface px-6 py-16 text-center text-text-muted">
            Cargando confirmación...
          </div>
        ) : error ? (
          <div className="w-full rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-brand-red">{error}</p>
          </div>
        ) : (
          <section className="w-full overflow-hidden rounded-xl border border-brand-cyan/30 bg-dark-surface shadow-lg">
            <div className="p-8 text-center md:p-12">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10 text-brand-green">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h1 className="rajdhani text-4xl font-bold text-white">Gracias por donar</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
                Tu aporte a la campaña <span className="font-semibold text-white">{campana.nombre}</span> fue registrado.
              </p>
              <div className="mx-auto mt-8 max-w-md rounded-lg border border-dark-border bg-dark-bg px-5 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Campaña</p>
                <p className="mt-1 text-lg font-bold text-white">{campana.nombre}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Fecha</p>
                <p className="mt-1 text-sm text-white">{formatDateChile()}</p>
              </div>
              <a href={`/donar/${campana.slug}`} className="mt-8 inline-flex rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-brand-cyan/50">
                Volver a la campaña
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default RetornoDonacion;
