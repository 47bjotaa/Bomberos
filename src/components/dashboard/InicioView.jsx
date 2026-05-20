import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { Icons } from '../ui/Icons';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin" />
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon, color, loading }) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center gap-4 hover:border-dark-border/80 transition-colors">
      <div className={`flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0`}
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
        <span className="w-6 h-6">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wide truncate">{title}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 bg-dark-bg3 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-white mt-0.5 leading-none">{value}</p>
        )}
        {sub && !loading && <p className="text-xs text-text-muted mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InicioView({ onNavigate }) {
  const [bomberos, setBomberos]         = useState([]);
  const [vehiculos, setVehiculos]       = useState([]);
  const [eppItems, setEppItems]         = useState([]);
  const [stockMinimos, setStockMinimos] = useState([]);
  const [notificaciones, setNotifs]     = useState([]);
  const [campanas, setCampanas]         = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchAll = async () => {
      try {
        const [bData, vData, eppData, smData, nData, cData] = await Promise.allSettled([
          apiFetch('/api/bomberos'),
          apiFetch('/api/vehiculos'),
          apiFetch('/api/materiales/items/epp'),
          apiFetch('/api/stockminimos'),
          apiFetch('/api/notificaciones?leida=false'),
          apiFetch('/api/campanasdonaciones?estado=Activa'),
        ]);
        if (ignore) return;
        if (bData.status === 'fulfilled')  setBomberos(Array.isArray(bData.value) ? bData.value : []);
        if (vData.status === 'fulfilled')  setVehiculos(Array.isArray(vData.value) ? vData.value : []);
        if (eppData.status === 'fulfilled') setEppItems(Array.isArray(eppData.value) ? eppData.value : []);
        if (smData.status === 'fulfilled') setStockMinimos(Array.isArray(smData.value) ? smData.value : []);
        if (nData.status === 'fulfilled')  setNotifs(Array.isArray(nData.value) ? nData.value : []);
        if (cData.status === 'fulfilled')  setCampanas(Array.isArray(cData.value) ? cData.value : []);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchAll();
    return () => { ignore = true; };
  }, []);

  // ── Derived KPI data ──────────────────────────────────────────────────────
  const personalActivo = bomberos.filter(b =>
    !b.estado || b.estado === 'Activo' || b.estado === 'activo'
  ).length;

  const flotaTotal   = vehiculos.length;
  const flotaOp      = vehiculos.filter(v => (v.estadoVehiculo || v.estado || '').toLowerCase().includes('operativ')).length;
  const flotaMant    = vehiculos.filter(v => (v.estadoVehiculo || v.estado || '').toLowerCase().includes('mantenc')).length;
  const flotaFuera   = flotaTotal - flotaOp - flotaMant;
  const pctOp        = flotaTotal ? Math.round((flotaOp / flotaTotal) * 100)   : 0;
  const pctMant      = flotaTotal ? Math.round((flotaMant / flotaTotal) * 100) : 0;
  const pctFuera     = flotaTotal ? 100 - pctOp - pctMant                      : 0;

  // EPP vencimientos
  const today = new Date();
  const eppEste  = eppItems.filter(e => { const d = daysUntil(e.fechaVencimiento); return d !== null && d <= 30 && d >= 0; }).length;
  const epp3m    = eppItems.filter(e => { const d = daysUntil(e.fechaVencimiento); return d !== null && d > 30 && d <= 90; }).length;
  const epp6m    = eppItems.filter(e => { const d = daysUntil(e.fechaVencimiento); return d !== null && d > 90 && d <= 180; }).length;
  const eppMaxBar = Math.max(eppEste, epp3m, epp6m, 1);

  // Stock crítico = stockminimos con cantidadActual < cantidadMinima
  const stockCritico = stockMinimos.filter(s =>
    Number(s.cantidadActual ?? s.cantidadDisponible ?? 0) < Number(s.cantidadMinima ?? 0)
  ).length;

  // Alertas (notificaciones no leídas)
  const alertasCriticas = notificaciones.length;

  // Campaña activa
  const campanaActiva = campanas[0] || null;
  const metaMonto     = Number(campanaActiva?.metaMonto || 0);
  const recaudado     = Number(campanaActiva?.montoRecaudado || 0);
  const progreso      = metaMonto > 0 ? Math.min(100, Math.round((recaudado / metaMonto) * 100)) : 0;

  // Últimas 7 notificaciones como "alertas"
  const alertasPanel = notificaciones.slice(0, 5);

  // ── Conical gradient for donut ─────────────────────────────────────────────
  const conicGrad = flotaTotal > 0
    ? `conic-gradient(#10b981 0% ${pctOp}%, #eab308 ${pctOp}% ${pctOp + pctMant}%, #ef4444 ${pctOp + pctMant}% 100%)`
    : 'conic-gradient(#374151 0% 100%)';

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Panel de Control</h2>
        <p className="text-text-muted text-sm mt-1">Resumen operativo en tiempo real del cuartel.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard loading={loading} title="Alertas sin leer" value={alertasCriticas}
          sub="Notificaciones pendientes"
          icon={<Icons.AlertTriangle />} color="#ef4444" />
        <KpiCard loading={loading} title="Personal activo" value={personalActivo}
          sub={`${bomberos.length} bomberos en total`}
          icon={<Icons.User />} color="#06b6d4" />
        <KpiCard loading={loading} title="Recaudación"
          value={campanaActiva ? `${progreso}%` : '—'}
          sub={campanaActiva ? campanaActiva.nombre : 'Sin campaña activa'}
          icon={<Icons.Finance />} color="#10b981" />
        <KpiCard loading={loading} title="Stock crítico" value={stockCritico}
          sub="Materiales bajo mínimo"
          icon={<Icons.Inventory />} color="#f97316" />
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut: Flota */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 flex flex-col items-center">
          <h3 className="text-white font-semibold mb-4 w-full text-left text-sm">Estado de Flota</h3>
          {loading ? <Spinner /> : flotaTotal === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">Sin vehículos registrados</p>
          ) : (
            <>
              <div className="relative w-36 h-36 rounded-full mb-5" style={{ background: conicGrad }}>
                <div className="absolute inset-0 m-4 bg-dark-surface rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{flotaTotal}</span>
                  <span className="text-[10px] text-text-muted">Vehículos</span>
                </div>
              </div>
              <div className="w-full space-y-2 text-sm">
                {[
                  { label: 'Operativos', n: flotaOp,   pct: pctOp,   color: '#10b981' },
                  { label: 'Mantención', n: flotaMant, pct: pctMant, color: '#eab308' },
                  { label: 'Fuera de Serv.', n: flotaFuera, pct: pctFuera, color: '#ef4444' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                      {r.label}
                    </span>
                    <span className="font-bold text-white">{r.n} ({r.pct}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Barras: EPP por vencer */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-white font-semibold mb-5 text-sm">EPP Próximo a Vencer</h3>
          {loading ? <Spinner /> : eppItems.length === 0 ? (
            <p className="text-text-muted text-sm my-auto text-center py-6">Sin equipos EPP registrados</p>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-5">
              {[
                { label: 'Este mes (≤ 30 días)', n: eppEste, color: '#ef4444' },
                { label: 'En 3 meses (31–90 días)', n: epp3m, color: '#f97316' },
                { label: 'En 6 meses (91–180 días)', n: epp6m, color: '#06b6d4' },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted">{r.label}</span>
                    <span className="font-bold" style={{ color: r.color }}>{r.n} Equipo{r.n !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 w-full bg-dark-bg3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(r.n / eppMaxBar) * 100}%`, background: r.color }} />
                  </div>
                </div>
              ))}
              <button onClick={() => onNavigate?.('epp')}
                className="mt-2 self-end text-xs text-brand-cyan hover:underline">
                Ver todos los EPP →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campaña activa: barra de progreso + stats */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold text-sm">Campaña de Donación Activa</h3>
            {campanaActiva && (
              <span className="text-xs font-medium text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-1 rounded-full">
                {progreso}% logrado
              </span>
            )}
          </div>
          {loading ? <Spinner /> : !campanaActiva ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted text-sm gap-2">
              <Icons.Finance />
              <p>No hay campañas activas en este momento</p>
              <button onClick={() => onNavigate?.('donaciones')}
                className="text-xs text-brand-cyan hover:underline mt-1">Ir a Donaciones →</button>
            </div>
          ) : (
            <>
              <p className="text-lg font-bold text-white mb-1">{campanaActiva.nombre}</p>
              <p className="text-xs text-text-muted mb-5">{campanaActiva.descripcion || 'Sin descripción'}</p>

              {/* Barra de progreso */}
              <div className="h-3 w-full bg-dark-bg3 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-brand-cyan transition-all duration-700"
                  style={{ width: `${progreso}%` }} />
              </div>
              <div className="flex justify-between text-xs text-text-muted mb-5">
                <span>Recaudado: <span className="text-white font-bold">{fmt(recaudado)}</span></span>
                <span>Meta: <span className="text-white font-bold">{fmt(metaMonto)}</span></span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                  <p className="text-xs text-text-muted">Donaciones</p>
                  <p className="mt-1 font-bold text-white">{campanaActiva.totalDonaciones ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                  <p className="text-xs text-text-muted">Cierre</p>
                  <p className="mt-1 font-bold text-white">
                    {campanaActiva.fechaFin
                      ? new Date(campanaActiva.fechaFin).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>
              <button onClick={() => onNavigate?.('donaciones')}
                className="mt-4 w-full text-xs font-semibold text-brand-cyan border border-brand-cyan/30 rounded-lg py-2 hover:bg-brand-cyan/10 transition-colors">
                Ver campaña completa →
              </button>
            </>
          )}
        </div>

        {/* Alertas / Notificaciones */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold text-sm">Alertas Recientes</h3>
            {alertasCriticas > 0 && (
              <span className="text-xs font-bold text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded-full">
                {alertasCriticas}
              </span>
            )}
          </div>
          {loading ? <Spinner /> : alertasPanel.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted text-sm gap-2 text-center">
              <Icons.AlertTriangle />
              <p>Sin alertas pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertasPanel.map((n, i) => (
                <div key={n.idNotificacion ?? i}
                  className="flex gap-3 items-start border-b border-dark-bg3 pb-3 last:border-0 last:pb-0">
                  <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-brand-red" />
                  <div className="min-w-0">
                    <p className="text-sm text-white/90 leading-snug line-clamp-2">
                      {n.titulo || n.mensaje || n.descripcion || 'Notificación sin título'}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {n.fechaCreacion
                        ? new Date(n.fechaCreacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
