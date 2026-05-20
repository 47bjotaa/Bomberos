import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import LogoCuartelAmigo from '../components/ui/LogoCuartelAmigo';

const getSlugFromPath = () => decodeURIComponent(window.location.pathname.replace(/^\/donar\/?/, '').split('/')[0] || '');
const getRefFromSearch = () => new URLSearchParams(window.location.search).get('ref') || '';

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;
const parseCurrencyValue = (value) => parseInt(String(value || '').replace(/\D/g, ''), 10) || 0;

const formatDateChile = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(date);
};

function PaginaDonacion() {
  const [campana, setCampana] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [donorData, setDonorData] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
  const [paymentError, setPaymentError] = useState('');
  const [creatingPayment, setCreatingPayment] = useState(false);
  const slug = useMemo(getSlugFromPath, []);
  const codigoLink = useMemo(getRefFromSearch, []);

  useEffect(() => {
    let ignore = false;

    const fetchCampana = async () => {
      if (!slug) {
        setError('No se encontro la campana solicitada.');
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
        console.error('Error al cargar campana publica:', fetchError);
        if (!ignore) {
          setError(fetchError.message || 'No se pudo cargar la campana.');
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

  const meta = Number(campana?.metaMonto || 0);
  const recaudado = Number(campana?.montoRecaudado || 0);
  const progreso = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : 0;
  const amount = customAmount ? parseCurrencyValue(customAmount) : selectedAmount;

  const handleCustomAmountChange = (event) => {
    const rawValue = event.target.value.replace(/\D/g, '');
    setCustomAmount(rawValue ? '$' + parseInt(rawValue, 10).toLocaleString('es-CL') : '');
    setSelectedAmount(null);
  };

  const handleCreatePaymentLink = async (event) => {
    event.preventDefault();
    setPaymentError('');

    if (!donorData.nombre.trim() || !donorData.email.trim() || !donorData.telefono.trim()) {
      setPaymentError('Ingresa nombre, email y telefono para continuar.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(donorData.email.trim())) {
      setPaymentError('Ingresa un email valido.');
      return;
    }

    if (amount < 1000) {
      setPaymentError('El monto minimo de donacion es $1.000.');
      return;
    }

    setCreatingPayment(true);

    try {
      const response = await apiFetch('/api/donaciones/link-pago', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          idCompania: Number(campana.idCompania),
          idCampaniaDonacion: Number(campana.idCampanaDonacion),
          codigoLink,
          monto: amount,
          nombre: donorData.nombre.trim(),
          email: donorData.email.trim(),
          telefono: donorData.telefono.trim(),
          mensaje: donorData.mensaje.trim(),
        }),
      });

      const paymentUrl = response.urlPago || response.url || response.linkPago || response.initPoint || response.redirectUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      setPaymentError('La API no devolvio un link de pago.');
    } catch (paymentLinkError) {
      console.error('Error al crear link de pago:', paymentLinkError);
      setPaymentError(paymentLinkError.message || 'No se pudo crear el link de pago.');
    } finally {
      setCreatingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-main">
      <header className="border-b border-dark-border bg-dark-surface px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <LogoCuartelAmigo size={44} />
          </a>
          <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
            Donacion segura
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_.9fr]">
        {loading ? (
          <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-20 text-center text-text-muted lg:col-span-2">
            Cargando campana...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-12 text-center lg:col-span-2">
            <p className="text-sm font-semibold text-brand-red">{error}</p>
          </div>
        ) : (
          <>
            <section>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                {campana.estado}
              </div>
              <h1 className="rajdhani text-4xl font-bold leading-tight text-white md:text-5xl">{campana.nombre}</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">{campana.descripcion?.replace(/donen mierda/gi, 'Donen')}</p>

              <div className="mt-8 overflow-hidden rounded-xl border border-dark-border bg-dark-surface">
                {campana.imagenUrl ? (
                  <img src={campana.imagenUrl} alt={campana.nombre} className="h-72 w-full object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center bg-dark-bg2 text-brand-cyan">
                    <svg className="h-20 w-20 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                  </div>
                )}
              </div>
            </section>

            <aside className="self-start rounded-xl border border-brand-cyan/30 bg-dark-surface p-6 shadow-lg">
              <div className="mb-6">
                <p className="text-sm text-text-muted">Recaudado</p>
                <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(recaudado)}</p>
                <p className="mt-1 text-sm text-text-muted">Meta: {formatCurrency(meta)}</p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-dark-bg3">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-brand-cyan" style={{ width: `${progreso}%` }}></div>
              </div>
              <p className="mt-2 text-right text-xs font-semibold text-brand-cyan">{progreso}% logrado</p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-dark-border bg-dark-bg px-3 py-3">
                  <p className="text-xs text-text-muted">Donaciones</p>
                  <p className="mt-1 font-bold text-white">{campana.totalDonaciones || 0}</p>
                </div>
                <div className="rounded-lg border border-dark-border bg-dark-bg px-3 py-3">
                  <p className="text-xs text-text-muted">Cierre</p>
                  <p className="mt-1 font-bold text-white">{formatDateChile(campana.fechaFin)}</p>
                </div>
              </div>

              <form onSubmit={handleCreatePaymentLink} className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-white">Monto a donar</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 20000].map(presetAmount => (
                    <button
                      type="button"
                      key={presetAmount}
                      onClick={() => {
                        setSelectedAmount(presetAmount);
                        setCustomAmount('');
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold text-white transition-colors ${selectedAmount === presetAmount && !customAmount ? 'border-brand-cyan bg-brand-cyan/10' : 'border-dark-border bg-dark-bg hover:border-brand-cyan/50'}`}
                    >
                      {formatCurrency(presetAmount)}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Monto personalizado minimo $1.000"
                  />
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    value={donorData.nombre}
                    onChange={(event) => setDonorData({ ...donorData, nombre: event.target.value })}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Nombre completo *"
                  />
                  <input
                    type="email"
                    value={donorData.email}
                    onChange={(event) => setDonorData({ ...donorData, email: event.target.value })}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Email *"
                  />
                  <input
                    type="tel"
                    value={donorData.telefono}
                    onChange={(event) => setDonorData({ ...donorData, telefono: event.target.value.replace(/\D/g, '') })}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Telefono *"
                  />
                  <textarea
                    rows="3"
                    value={donorData.mensaje}
                    onChange={(event) => setDonorData({ ...donorData, mensaje: event.target.value })}
                    className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Mensaje opcional"
                  />
                </div>

                {paymentError && (
                  <p className="mt-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {paymentError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={creatingPayment}
                  className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(59,130,246,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingPayment ? 'Preparando pago...' : 'Donar ahora'}
                </button>
                <p className="mt-3 text-center text-xs text-text-muted">Inicio: {formatDateChile(campana.fechaInicio)}</p>
              </form>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

export default PaginaDonacion;
