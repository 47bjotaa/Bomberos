import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import LogoCuartelAmigo from '../components/ui/LogoCuartelAmigo';

const getSlugFromPath = () => decodeURIComponent(window.location.pathname.replace(/^\/donar\/?/, '').split('/')[0] || '');
const getRefFromSearch = () => new URLSearchParams(window.location.search).get('ref') || '';

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;
const parseCurrencyValue = (value) => parseInt(String(value || '').replace(/\D/g, ''), 10) || 0;
const cleanDonorName = (value) => value.replace(/[^A-Za-z\u00C0-\u017F\s'-]/g, '');
const isValidDonorName = (value) => /^[A-Za-z\u00C0-\u017F]+(?:[\s'-]+[A-Za-z\u00C0-\u017F]+)*$/.test(value.trim());
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
const normalizeDonationPhone = (value) => `+569${String(value || '').replace(/\D/g, '').slice(0, 8)}`;
const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

const formatDateChile = (value) => {
  if (!value) return '';
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(date);
};

const getCampaignCompanyName = (campaign) => {
  const safeCampaign = campaign || {};

  return (
    safeCampaign.nombreCompania
    || safeCampaign.compania?.nombreCompania
    || safeCampaign.compania?.nombre
    || safeCampaign.Compania?.nombreCompania
    || safeCampaign.Compania?.nombre
    || safeCampaign.nombreCuerpoBomberos
    || safeCampaign.cuerpoBomberos
    || ''
  );
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
        setError('No se encontró la campaña solicitada.');
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

  const meta = Number(campana?.metaMonto || 0);
  const recaudado = Number(campana?.montoRecaudado || 0);
  const progreso = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : 0;
  const amount = customAmount ? parseCurrencyValue(customAmount) : selectedAmount;
  const companyName = getCampaignCompanyName(campana);
  const campaignDescription = campana?.descripcion?.replace(/donen mierda/gi, 'Donen') || '';

  const handleCustomAmountChange = (event) => {
    const rawValue = event.target.value.replace(/\D/g, '');
    setCustomAmount(rawValue ? '$' + parseInt(rawValue, 10).toLocaleString('es-CL') : '');
    setSelectedAmount(null);
  };

  const handleCreatePaymentLink = async (event) => {
    event.preventDefault();
    setPaymentError('');

    const nombre = donorData.nombre.trim().replace(/\s+/g, ' ');
    const email = donorData.email.trim();
    const telefonoDigits = donorData.telefono.replace(/\D/g, '').slice(0, 8);
    const telefono = normalizeDonationPhone(telefonoDigits);

    if (!nombre || !email || !telefonoDigits) {
      setPaymentError('Ingresa nombre, email y teléfono para continuar.');
      return;
    }

    if (!isValidDonorName(nombre)) {
      setPaymentError('Ingresa un nombre válido, sin números ni símbolos.');
      return;
    }

    if (!isValidEmail(email)) {
      setPaymentError('Ingresa un email válido.');
      return;
    }

    if (telefonoDigits.length !== 8) {
      setPaymentError('Ingresa los 8 dígitos del teléfono después de +569.');
      return;
    }

    if (amount < 1000) {
      setPaymentError('El monto mínimo de donación es $1.000.');
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
          nombre,
          email,
          telefono,
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
    <div className="relative min-h-screen overflow-hidden bg-dark-bg text-text-main">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] [background-size:42px_42px]"></div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-cyan/10 via-dark-surface/50 to-transparent"></div>
      <header className="relative border-b border-dark-border bg-dark-surface/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <LogoCuartelAmigo size={44} />
          </a>
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {companyName && (
              <span className="hidden max-w-xs truncate text-sm font-semibold text-text-main sm:inline">
                {companyName}
              </span>
            )}
            <span className="shrink-0 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-[11px] font-semibold text-brand-cyan sm:px-3 sm:text-xs">
              Donación segura
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-8 lg:py-10">
        {loading ? (
          <div className="rounded-xl border border-dark-border bg-dark-surface px-4 py-16 text-center text-text-muted sm:px-6 sm:py-20 lg:col-span-2">
            Cargando campaña...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-10 text-center sm:px-6 sm:py-12 lg:col-span-2">
            <p className="text-sm font-semibold text-brand-red">{error}</p>
          </div>
        ) : (
          <>
            <section className="min-w-0">
              <div className="mb-5 flex flex-col items-stretch gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center">
                {companyName && (
                  <div className="inline-flex min-w-0 items-center gap-3 rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-3 sm:px-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-cyan/30 bg-dark-bg text-brand-cyan">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6M9 10h.01M12 10h.01M15 10h.01"></path></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-cyan">Compañía</p>
                      <p className="truncate text-sm font-bold text-white sm:max-w-md">{companyName}</p>
                    </div>
                  </div>
                )}
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                  <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                  {campana.estado}
                </div>
              </div>

              <h1 className="rajdhani max-w-3xl break-words text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">{campana.nombre}</h1>
              {campaignDescription && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">{campaignDescription}</p>
              )}

              <div className="mt-6 overflow-hidden rounded-2xl border border-brand-cyan/20 bg-dark-surface shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:mt-8">
                {campana.imagenUrl ? (
                  <img src={campana.imagenUrl} alt={campana.nombre} className="h-56 w-full object-cover sm:h-72 lg:h-80" />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-dark-bg2 text-brand-cyan sm:h-72 lg:h-80">
                    <svg className="h-16 w-16 opacity-60 sm:h-20 sm:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                  </div>
                )}
                <div className="grid gap-px bg-dark-border sm:grid-cols-3">
                  <div className="bg-dark-surface px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Organiza</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{companyName || 'Compañía de bomberos'}</p>
                  </div>
                  <div className="bg-dark-surface px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Inicio</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatDateChile(campana.fechaInicio) || '-'}</p>
                  </div>
                  <div className="bg-dark-surface px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Meta</p>
                    <p className="mt-1 text-sm font-semibold text-brand-cyan">{formatCurrency(meta)}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="min-w-0 self-start rounded-2xl border border-brand-cyan/30 bg-dark-surface/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6">
              <div className="mb-6 rounded-xl border border-dark-border bg-dark-bg px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">Aporte directo</p>
                    <p className="mt-2 break-words text-2xl font-bold text-white">{formatCurrency(recaudado)}</p>
                    <p className="mt-1 text-sm text-text-muted">Meta: {formatCurrency(meta)}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21s-7-4.35-9.2-8.78C1.15 8.9 3.38 5 7.1 5c2.02 0 3.46 1.03 4.9 2.7C13.44 6.03 14.88 5 16.9 5c3.72 0 5.95 3.9 4.3 7.22C19 16.65 12 21 12 21Z"></path></svg>
                  </span>
                </div>
                {companyName && (
                  <p className="mt-4 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-xs font-semibold text-text-main">
                    Tu donación apoyará a <span className="text-brand-cyan">{companyName}</span>
                  </p>
                )}
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-dark-bg3">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-brand-cyan" style={{ width: `${progreso}%` }}></div>
              </div>
              <p className="mt-2 text-right text-xs font-semibold text-brand-cyan">{progreso}% logrado</p>

              <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[5000, 10000, 20000].map(presetAmount => (
                    <button
                      type="button"
                      key={presetAmount}
                      onClick={() => {
                        setSelectedAmount(presetAmount);
                        setCustomAmount('');
                      }}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold text-white transition-colors ${selectedAmount === presetAmount && !customAmount ? 'border-brand-cyan bg-brand-cyan/10' : 'border-dark-border bg-dark-bg hover:border-brand-cyan/50'}`}
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
                    placeholder="Monto personalizado mínimo $1.000"
                  />
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    value={donorData.nombre}
                    onChange={(event) => setDonorData({ ...donorData, nombre: cleanDonorName(event.target.value) })}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Nombre completo *"
                    autoComplete="name"
                  />
                  <input
                    type="email"
                    value={donorData.email}
                    onChange={(event) => setDonorData({ ...donorData, email: event.target.value })}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-white placeholder-text-muted outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Email *"
                    autoComplete="email"
                  />
                  <div className="flex overflow-hidden rounded-lg border border-dark-border bg-dark-bg transition-all focus-within:border-brand-cyan focus-within:ring-1 focus-within:ring-brand-cyan">
                    <span className="flex items-center border-r border-dark-border bg-dark-bg2 px-4 text-sm font-semibold text-brand-cyan">
                      +569
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={8}
                      value={donorData.telefono}
                      onChange={(event) => setDonorData({ ...donorData, telefono: event.target.value.replace(/\D/g, '').slice(0, 8) })}
                      className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-text-muted outline-none"
                      placeholder="8 dígitos *"
                      autoComplete="tel-national"
                    />
                  </div>
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
