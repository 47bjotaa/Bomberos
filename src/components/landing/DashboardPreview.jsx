import { useState } from 'react';
import { Icons } from '../../components/ui/Icons';

const dashboardViews = {
  inicio: {
    label: 'Inicio',
    icon: <Icons.Dashboard />,
    subtitle: 'Resumen operativo en tiempo real del cuartel.',
    kpis: [
      { label: 'Alertas sin leer', value: '0', sub: 'Notificaciones pendientes', icon: <Icons.AlertTriangle /> },
      { label: 'Personal activo', value: '24', sub: '24 bomberos en total', icon: <Icons.User /> },
      { label: 'Recaudación', value: '68%', sub: 'Campaña activa', icon: <Icons.Finance /> },
      { label: 'Stock crítico', value: '2', sub: 'Materiales bajo mínimo', icon: <Icons.Inventory /> },
    ],
    panels: [
      {
        type: 'chart',
        title: 'Estado de Flota',
        badge: '4 Vehículos',
        legend: [
          ['green', 'Operativos', '3 (75%)'],
          ['yellow', 'Mantención', '1 (25%)'],
          ['red', 'Fuera de Serv.', '0 (0%)'],
        ],
      },
      {
        type: 'bars',
        title: 'EPP Próximo a Vencer',
        badge: 'Alertas',
        rows: [
          ['Este mes (≤ 30 días)', '2 Equipos', 'red', 72],
          ['En 3 meses (31-90 días)', '4 Equipos', 'orange', 54],
          ['En 6 meses (91-180 días)', '6 Equipos', 'cyan', 86],
        ],
      },
    ],
  },
  inventario: {
    label: 'Inventario',
    icon: <Icons.Inventory />,
    subtitle: 'Ubicaciones, materiales y stock mínimo del cuartel.',
    kpis: [
      { label: 'Vista actual', value: 'General', sub: 'Todos los materiales', icon: <Icons.Traceability /> },
      { label: 'Ubicaciones', value: '5', sub: 'Principales y sububicaciones', icon: <Icons.Inventory /> },
      { label: 'Stock mínimo', value: '2', sub: 'Bajo umbral', icon: <Icons.AlertTriangle /> },
    ],
    panels: [
      {
        type: 'table',
        title: 'Materiales en General',
        badge: 'Inventario',
        rows: [
          ['Casco estructural', 'EPP-CAS-001', 'Buen Estado'],
          ['Manguera 45 mm', 'AGU-MAN-045', 'En Servicio'],
          ['Pitón selectable', 'AGU-PIT-018', 'En Mantención'],
        ],
      },
      {
        type: 'cards',
        title: 'Ubicaciones principales',
        badge: 'Árbol',
        rows: [
          ['General', 'Todos los materiales'],
          ['Bodega central', '52 materiales'],
          ['Carro B-1', '31 materiales'],
          ['Sala EPP', '24 equipos'],
        ],
      },
    ],
  },
  vehiculos: {
    label: 'Vehículos',
    icon: <Icons.Truck />,
    subtitle: 'Listado de unidades, imágenes, observaciones y mantenciones.',
    kpis: [
      { label: 'Vehículos', value: '4', sub: 'Registrados', icon: <Icons.Truck /> },
      { label: 'Operativos', value: '3', sub: 'Listos para despacho', icon: <Icons.Dashboard /> },
      { label: 'Mantenciones', value: '1', sub: 'Programada', icon: <Icons.Settings /> },
    ],
    panels: [
      {
        type: 'vehicleCards',
        title: 'Unidades',
        badge: 'Listado',
        rows: [
          ['B-1', 'Bomba urbana', 'Operativo'],
          ['RX-1', 'Rescate', 'Operativo'],
          ['B-2', 'Bomba cisterna', 'Mantención'],
        ],
      },
      {
        type: 'table',
        title: 'Mantenciones',
        badge: 'Detalle',
        rows: [
          ['B-2', 'Revisión preventiva', 'Programada'],
          ['RX-1', 'Prueba de bomba', 'Realizada'],
          ['B-1', 'Observación registrada', 'Obs.'],
        ],
      },
    ],
  },
  epp: {
    label: 'EPP',
    icon: <Icons.Shield />,
    subtitle: 'Equipos asignados, no asignados y EPP propio.',
    kpis: [
      { label: 'Asignados', value: '24', sub: 'Con responsable', icon: <Icons.User /> },
      { label: 'No asignados', value: '6', sub: 'Disponibles', icon: <Icons.Inventory /> },
      { label: 'Estados', value: '3', sub: 'Buen Estado / Desgastada / Mal Estado', icon: <Icons.Shield /> },
    ],
    panels: [
      {
        type: 'tabs',
        title: 'EPP',
        badge: 'Asignados',
        tabs: ['Asignados 24', 'No asignados 6', 'Mi EPP 5'],
      },
      {
        type: 'eppTable',
        title: 'Tabla EPP',
        badge: 'Filtro + búsqueda',
        rows: [
          ['Casco Estructural Gallet F1', 'EPP-CAS-001', 'Juan Pérez', 'Buen Estado'],
          ['Cota Estructural Lion', 'EPP-COT-015', 'María González', 'Desgastada'],
          ['Botas de Rescate Haix', 'EPP-BOT-042', 'Carlos Soto', 'Buen Estado'],
        ],
      },
    ],
  },
  reportes: {
    label: 'Reportes',
    icon: <Icons.Report />,
    subtitle: 'Generación de reportes operativos y administrativos.',
    kpis: [
      { label: 'Post emergencia', value: 'PDF', sub: 'Registro + descarga', icon: <Icons.Report /> },
      { label: 'Bajas inventario', value: 'PDF', sub: 'Motivo y periodo', icon: <Icons.AlertTriangle /> },
      { label: 'Donaciones', value: 'PDF', sub: 'Campaña y pago', icon: <Icons.Finance /> },
    ],
    panels: [
      {
        type: 'reportCards',
        title: 'Módulos de reportes',
        badge: 'VER_REPORTES',
        rows: [
          ['Post emergencia', 'Vehículo + materiales + PDF', 'Registro + PDF'],
          ['Bajas de inventario', 'Motivo y periodo', 'PDF'],
          ['Donaciones por campaña', 'Estado de pago y periodo', 'PDF'],
          ['Stock por ubicación', 'Toda la compañía o ubicación', 'PDF'],
        ],
      },
      {
        type: 'formPreview',
        title: 'Formulario activo',
        badge: 'Ejemplo',
        rows: [
          ['Vehículo', 'Selecciona vehículo'],
          ['Motivo', 'Todos los motivos'],
          ['Periodo', 'Todo el historial'],
        ],
      },
    ],
  },
};

function MiniPanel({ panel }) {
  if (panel.type === 'chart') {
    return (
      <div className="mini-chart">
        <PanelHead panel={panel} />
        <div className="chart-lines">
          <i></i><i></i><i></i><i></i><i></i>
          <div className="curve green"></div>
          <div className="curve red"></div>
        </div>
        <div className="mini-legend">
          {panel.legend.map(([tone, label, value]) => (
            <span key={label}><b className={tone}></b>{label}<em>{value}</em></span>
          ))}
        </div>
      </div>
    );
  }

  if (panel.type === 'bars') {
    return (
      <div className="mini-table">
        <PanelHead panel={panel} />
        <div className="mini-bars">
          {panel.rows.map(([label, value, tone, width]) => (
            <div className="mini-bar-row" key={label}>
              <div><span>{label}</span><strong>{value}</strong></div>
              <i className={tone} style={{ width: `${width}%` }}></i>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (panel.type === 'cards' || panel.type === 'vehicleCards' || panel.type === 'reportCards') {
    return (
      <div className="mini-table">
        <PanelHead panel={panel} />
        <div className="mini-card-list">
          {panel.rows.map(([title, desc, tag]) => (
            <article key={title}>
              <strong>{title}</strong>
              <span>{desc}</span>
              {tag && <em>{tag}</em>}
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (panel.type === 'tabs') {
    return (
      <div className="mini-chart">
        <PanelHead panel={panel} />
        <div className="mini-tab-row">
          {panel.tabs.map((tab, index) => (
            <span className={index === 0 ? 'active' : ''} key={tab}>{tab}</span>
          ))}
        </div>
        <div className="mini-search-line"></div>
        <div className="mini-search-line short"></div>
      </div>
    );
  }

  if (panel.type === 'formPreview') {
    return (
      <div className="mini-table">
        <PanelHead panel={panel} />
        <div className="mini-form-preview">
          {panel.rows.map(([label, value]) => (
            <label key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </label>
          ))}
          <button type="button">Descargar PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-table">
      <PanelHead panel={panel} />
      <table>
        <tbody>
          {panel.rows.map(([name, tag, value]) => (
            <tr key={`${name}-${tag}`}>
              <td>{name}</td>
              <td><span className="pill cyan">{tag}</span></td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelHead({ panel }) {
  return (
    <div className="mini-chart-head">
      <strong>{panel.title}</strong>
      <span>{panel.badge}</span>
    </div>
  );
}

function DashboardPreview() {
  const [activeView, setActiveView] = useState('inicio');
  const view = dashboardViews[activeView];

  return (
    <section id="plataforma" className="section container">
      <div className="section-header reveal">
        <span className="section-eyebrow">Vista mini</span>
        <h2 className="section-title">Un dashboard parecido al que usarás todos los días</h2>
        <p className="section-subtitle">Una versión compacta de las pantallas reales: indicadores, inventario, vehículos, EPP y reportes.</p>
      </div>
      <div className="mini-dashboard reveal delay-100">
        <div className="mini-topbar">
          <div>
            <strong>{activeView === 'inicio' ? 'Panel de Control' : view.label}</strong>
            <span>{view.subtitle}</span>
          </div>
          <div className="mini-user">NR</div>
        </div>
        <div className="mini-nav">
          {Object.entries(dashboardViews).map(([key, item]) => (
            <button
              className={activeView === key ? 'active' : ''}
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="mini-kpis">
          {view.kpis.map((kpi) => (
            <article className="mini-kpi" key={kpi.label}>
              <div className="mini-kpi-icon">{kpi.icon}</div>
              <div>
                <span>{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <small>{kpi.sub}</small>
              </div>
            </article>
          ))}
        </div>
        <div className="mini-content">
          {view.panels.map((panel) => (
            <MiniPanel panel={panel} key={panel.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
