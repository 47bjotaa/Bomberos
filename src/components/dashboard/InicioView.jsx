import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { Icons } from '../ui/Icons';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;
const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const date = parseDateValue(dateStr);
  if (!date || Number.isNaN(date.getTime())) return null;
  const diff = date - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const formatDate = (value) => {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

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
    <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:border-dark-border/80 transition-colors">
      <div className="w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center [&>svg]:h-8 [&>svg]:w-8 sm:[&>svg]:h-10 sm:[&>svg]:w-10">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-text-muted text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">{title}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 bg-dark-bg3 rounded animate-pulse" />
        ) : (
          <p className="text-xl sm:text-2xl font-bold text-white mt-0.5 leading-none">{value}</p>
        )}
        {sub && !loading && <p className="text-xs text-text-muted mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InicioView({
  onNavigate,
  canViewBomberos = true,
  canViewVehiculos = true,
  canViewEpp = true,
  canViewInventory = true,
  canViewDonaciones = true,
}) {
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
          canViewBomberos ? apiFetch('/api/bomberos') : Promise.resolve([]),
          canViewVehiculos ? apiFetch('/api/vehiculos') : Promise.resolve([]),
          canViewEpp ? apiFetch('/api/materiales/items/epp') : Promise.resolve([]),
          canViewInventory ? apiFetch('/api/stockminimos') : Promise.resolve([]),
          apiFetch('/api/notificaciones?leida=false'),
          canViewDonaciones ? apiFetch('/api/campanasdonaciones?estado=Activa') : Promise.resolve([]),
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
  }, [canViewBomberos, canViewVehiculos, canViewEpp, canViewInventory, canViewDonaciones]);

  // ── Derived KPI data ──────────────────────────────────────────────────────
  const bomberosActivos = bomberos.filter(b =>
    !b.estado || b.estado === 'Activo' || b.estado === 'activo'
  );
  const personalActivo = bomberosActivos.length;

  const flotaTotal   = vehiculos.length;
  const flotaOp      = vehiculos.filter(v => (v.estadoVehiculo || v.estado || '').toLowerCase().includes('operativ')).length;
  const flotaMant    = vehiculos.filter(v => (v.estadoVehiculo || v.estado || '').toLowerCase().includes('mantenc')).length;
  const flotaFuera   = flotaTotal - flotaOp - flotaMant;
  const vehicleSummary = `${flotaOp} operativos / ${flotaMant} mant. / ${flotaFuera} fuera`;

  const cargoColors = ['#38bdf8', '#10b981', '#f97316', '#eab308', '#ef4444', '#8b5cf6'];
  const cargoRows = Object.entries(
    bomberosActivos.reduce((acc, bombero) => {
      const cargo = bombero.cargo || bombero.rol || bombero.nombreRol || 'Sin cargo';
      acc[cargo] = (acc[cargo] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({
      label,
      count,
      pct: personalActivo ? Math.round((count / personalActivo) * 100) : 0,
      color: cargoColors[index % cargoColors.length],
    }));

  let cargoCursor = 0;
  const cargoGradient = personalActivo > 0
    ? `conic-gradient(${cargoRows.map((row) => {
      const start = cargoCursor;
      const end = cargoCursor + (row.count / personalActivo) * 100;
      cargoCursor = end;
      return `${row.color} ${start}% ${end}%`;
    }).join(', ')})`
    : 'conic-gradient(#374151 0% 100%)';

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
  const kpiGridCols = canViewDonaciones ? 'xl:grid-cols-4' : 'xl:grid-cols-3';
  const alertasCardSpan = canViewDonaciones ? '' : 'lg:col-span-3';

  return (
    <div className="space-y-5 sm:space-y-6 pb-10">
      {/* KPIs */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${kpiGridCols} gap-3 sm:gap-4`}>
        <KpiCard loading={loading} title="Alertas sin leer" value={alertasCriticas}
          sub="Notificaciones pendientes"
          icon={<Icons.AlertTriangle />} color="#ef4444" />
        {canViewVehiculos && (
          <KpiCard loading={loading} title="Vehículos" value={flotaTotal}
            sub={vehicleSummary}
            icon={<Icons.Truck />} color="#06b6d4" />
        )}
        {canViewDonaciones && (
          <KpiCard loading={loading} title="Recaudación"
            value={campanaActiva ? `${progreso}%` : '—'}
            sub={campanaActiva ? campanaActiva.nombre : 'Sin campaña activa'}
            icon={<Icons.Finance />} color="#10b981" />
        )}
        {canViewInventory && (
          <KpiCard loading={loading} title="Stock crítico" value={stockCritico}
            sub="Materiales bajo mínimo"
            icon={<Icons.Inventory />} color="#f97316" />
        )}
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Personal por cargo */}
        {canViewBomberos && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-4">
            <h3 className="text-white font-semibold text-sm">Personal por Cargo</h3>
            <span className="text-xs font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full">
              {personalActivo} activos
            </span>
          </div>
          {loading ? <Spinner /> : personalActivo === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">Sin bomberos activos registrados</p>
          ) : (
            <>
              <div className="flex w-full flex-col items-center gap-5 rounded-lg border border-dark-border/50 bg-dark-bg/40 p-5">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full shadow-[0_0_28px_rgba(56,189,248,0.12)]"
                  style={{ background: cargoGradient }}
                  aria-label="Distribución de personal activo por cargo"
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-dark-border bg-dark-surface text-center shadow-[inset_0_0_18px_rgba(0,0,0,0.25)]">
                    <span className="text-3xl font-bold text-white">{personalActivo}</span>
                    <span className="text-[11px] font-semibold uppercase text-text-muted">Activos</span>
                  </div>
                </div>
                <button onClick={() => onNavigate?.('personal')}
                  className="text-xs font-semibold text-brand-cyan transition-colors hover:text-white">
                  Ver personal →
                </button>
              </div>
              <div className="hidden">
                <svg className="w-full h-full" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-bright" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <style>{`
                    @keyframes waveMove {
                      0% { transform: translateX(0px); }
                      100% { transform: translateX(-300px); }
                    }
                    .wave-green {
                      animation: waveMove 16s linear infinite;
                    }
                    .wave-red {
                      animation: waveMove 10s linear infinite;
                    }
                    .glow-bar {
                      transition: all 0.3s ease;
                    }
                    .glow-bar:hover {
                      filter: url(#glow-bright) !important;
                      stroke-width: 2.5px;
                    }
                  `}</style>

                  {/* Grid Lines */}
                  {/* Horizontal grid lines */}
                  <line x1="10" y1="25" x2="290" y2="25" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="10" y1="55" x2="290" y2="55" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="10" y1="85" x2="290" y2="85" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="10" y1="115" x2="290" y2="115" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="10" y1="140" x2="290" y2="140" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1.5" />

                  {/* Vertical grid lines */}
                  <line x1="20" y1="15" x2="20" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="60" y1="15" x2="60" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="100" y1="15" x2="100" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="140" y1="15" x2="140" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="180" y1="15" x2="180" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="220" y1="15" x2="220" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
                  <line x1="260" y1="15" x2="260" y2="140" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />

                  {/* Sparkles / Particles */}
                  <circle cx="45" cy="45" r="1.5" fill="#38bdf8" opacity="0.6" />
                  <circle cx="120" cy="105" r="2" fill="#fff" opacity="0.4" />
                  <circle cx="210" cy="35" r="1" fill="#38bdf8" opacity="0.7" />
                  <circle cx="275" cy="85" r="2.5" fill="#38bdf8" opacity="0.5" />
                  <circle cx="80" cy="130" r="1.2" fill="#fff" opacity="0.6" />

                  {/* Floating Green Wave (Operativos Trend) */}
                  <g className="wave-green">
                    <path
                      d="M 0 70 Q 75 35 150 70 T 300 70 T 450 70 T 600 70"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      filter="url(#glow-green)"
                      opacity="0.85"
                    />
                  </g>

                  {/* Floating Red Wave (Fuera de Servicio Trend) */}
                  <g className="wave-red">
                    <path
                      d="M 0 95 Q 75 125 150 95 T 300 95 T 450 95 T 600 95"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      filter="url(#glow-red)"
                      opacity="0.8"
                    />
                  </g>

                  {/* Dynamic Glowing Neon Bars representing vehicles */}
                  {(() => {
                    const numSlots = Math.max(8, flotaTotal);
                    const padding = 20;
                    const availableWidth = 300 - (padding * 2);
                    const barWidth = 14;
                    const gap = (availableWidth - (numSlots * barWidth)) / (numSlots - 1);
                    const baseHeights = [70, 95, 60, 85, 110, 75, 55, 90, 100, 80, 65, 95];

                    return Array.from({ length: numSlots }).map((_, index) => {
                      const height = baseHeights[index % baseHeights.length];
                      const x = padding + index * (barWidth + gap);
                      const y = 140 - height;

                      // Check if there is a vehicle associated with this slot
                      if (index < flotaTotal) {
                        const vehicle = vehiculos[index];
                        const estado = (vehicle.estadoVehiculo || vehicle.estado || '').toLowerCase();
                        
                        let strokeColor = '#06b6d4'; // default cyan
                        let filterId = 'glow-cyan';
                        
                        if (estado.includes('operativ')) {
                          strokeColor = '#10b981'; // green
                          filterId = 'glow-green';
                        } else if (estado.includes('mantenc')) {
                          strokeColor = '#eab308'; // yellow/gold
                          filterId = 'glow-yellow';
                        } else {
                          strokeColor = '#ef4444'; // red
                          filterId = 'glow-red';
                        }

                        return (
                          <rect
                            key={vehicle.idVehiculo || index}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={height}
                            rx="3"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="1.5"
                            filter={`url(#${filterId})`}
                            className="glow-bar cursor-pointer"
                          >
                            <title>{`${vehicle.nomenclatura || 'Vehículo'} (${vehicle.patente || ''}): ${vehicle.estadoVehiculo || vehicle.estado || 'Sin estado'}`}</title>
                          </rect>
                        );
                      } else {
                        // Dimmed slot representing empty/available space
                        return (
                          <rect
                            key={`empty-${index}`}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={height}
                            rx="3"
                            fill="none"
                            stroke="rgba(6, 182, 212, 0.2)"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                        );
                      }
                    });
                  })()}
                </svg>
              </div>

              <div className="w-full space-y-2 text-sm mt-2">
                {cargoRows.map(r => (
                  <div key={r.label} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                      {r.label}
                    </span>
                    <span className="font-bold text-white">{r.count} ({r.pct}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        )}

        {/* Barras: EPP por vencer */}
        {canViewEpp && (
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
        )}
      </div>

      {/* Gráficos fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campaña activa: barra de progreso + stats */}
        {canViewDonaciones && (
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
                      ? formatDate(campanaActiva.fechaFin)
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
        )}

        {/* Alertas / Notificaciones */}
        <div className={`bg-dark-surface border border-dark-border rounded-xl p-6 ${alertasCardSpan}`}>
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
