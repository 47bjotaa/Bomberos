import { useState } from 'react';
import { Icons } from '../../components/ui/Icons';

const demoViews = {
  inicio: {
    label: 'Inicio',
    icon: <Icons.Dashboard />,
    subtitle: 'Visión general del estado del cuartel y recursos',
    kpis: [
      { label: 'Alertas sin leer', value: '0', sub: 'Notificaciones pendientes', icon: <Icons.AlertTriangle /> },
      { label: 'Personal activo', value: '24', sub: 'Bomberos en total', icon: <Icons.User /> },
      { label: 'Stock crítico', value: '2', sub: 'Materiales bajo mínimo', icon: <Icons.Inventory /> },
    ],
    chart: {
      title: 'Estado de Flota',
      badge: '4 vehículos',
      legend: [
        ['green', 'Operativos', '3'],
        ['yellow', 'Mantención', '1'],
        ['red', 'Fuera de serv.', '0'],
      ],
    },
    table: {
      title: 'Catálogo',
      badge: 'Materiales base',
      rows: [
        ['Casco estructural', 'EPP', '$202.730'],
        ['Manguera 45 mm', 'Agua', '$189.150'],
        ['Inmovilizador lateral', 'Rescate', '$55.713'],
      ],
    },
  },
  inventario: {
    label: 'Inventario',
    icon: <Icons.Inventory />,
    subtitle: 'Materiales, stock mínimo y ubicación por bodega',
    kpis: [
      { label: 'Materiales registrados', value: '186', sub: 'Ítems inventariados', icon: <Icons.Inventory /> },
      { label: 'Stock crítico', value: '2', sub: 'Requieren reposición', icon: <Icons.AlertTriangle /> },
      { label: 'Bodegas activas', value: '5', sub: 'Pañol, carros y sala EPP', icon: <Icons.Traceability /> },
    ],
    chart: {
      title: 'Movimientos',
      badge: 'Últimos 7 días',
      legend: [
        ['green', 'Ingresos', '18'],
        ['yellow', 'Traslados', '7'],
        ['red', 'Bajas', '2'],
      ],
    },
    table: {
      title: 'Bajo mínimo',
      badge: 'Reposición',
      rows: [
        ['Guantes nitrilo L', 'Insumo', '4 unidades'],
        ['Cinta tubular 25 mm', 'Rescate', '2 rollos'],
        ['Filtro SCBA P3', 'EPP', '1 unidad'],
      ],
    },
  },
  vehiculos: {
    label: 'Vehículos',
    icon: <Icons.Truck />,
    subtitle: 'Disponibilidad, mantenciones y equipamiento por máquina',
    kpis: [
      { label: 'Máquinas operativas', value: '3', sub: 'Listas para despacho', icon: <Icons.Truck /> },
      { label: 'En mantención', value: '1', sub: 'B-2 revisión preventiva', icon: <Icons.Settings /> },
      { label: 'Checklist al día', value: '92%', sub: 'Revisiones completadas', icon: <Icons.Report /> },
    ],
    chart: {
      title: 'Disponibilidad',
      badge: 'Flota activa',
      legend: [
        ['green', 'B-1 / RX-1 / H-1', 'OK'],
        ['yellow', 'B-2', 'Taller'],
        ['red', 'Fuera de serv.', '0'],
      ],
    },
    table: {
      title: 'Próximas tareas',
      badge: 'Agenda',
      rows: [
        ['B-2 cambio aceite', 'Mantención', '03 Jun'],
        ['RX-1 carga combustible', 'Operación', 'Hoy'],
        ['H-1 prueba bomba', 'Checklist', '05 Jun'],
      ],
    },
  },
  epp: {
    label: 'EPP',
    icon: <Icons.Shield />,
    subtitle: 'Asignación y estado del equipo de protección personal',
    kpis: [
      { label: 'EPP asignado', value: '24', sub: 'Voluntarios con set', icon: <Icons.Shield /> },
      { label: 'Por vencer', value: '3', sub: 'Inspección este mes', icon: <Icons.AlertTriangle /> },
      { label: 'En custodia', value: '2', sub: 'Retiro temporal', icon: <Icons.User /> },
    ],
    chart: {
      title: 'Estado EPP',
      badge: 'Resumen',
      legend: [
        ['green', 'En servicio', '42'],
        ['yellow', 'Mantención/desgastado', '3'],
        ['red', 'Dañado', '1'],
      ],
    },
    table: {
      title: 'Asignaciones',
      badge: 'Ejemplo',
      rows: [
        ['Casco Gallet F1', 'C. Rojas', 'Verde'],
        ['Chaqueta estructural', 'M. Díaz', 'Amarillo'],
        ['Botas dieléctricas', 'P. Soto', 'Verde'],
      ],
    },
  },
  reportes: {
    label: 'Reportes',
    icon: <Icons.Report />,
    subtitle: 'Indicadores listos para revisión y rendición',
    kpis: [
      { label: 'Reportes generados', value: '8', sub: 'Durante mayo', icon: <Icons.Report /> },
      { label: 'Valor inventario', value: '$14,8M', sub: 'Estimado vigente', icon: <Icons.Finance /> },
      { label: 'Cumplimiento', value: '96%', sub: 'Registros completos', icon: <Icons.Dashboard /> },
    ],
    chart: {
      title: 'Cumplimiento',
      badge: 'Mensual',
      legend: [
        ['green', 'Completos', '96%'],
        ['yellow', 'Pendientes', '4%'],
        ['red', 'Atrasados', '0%'],
      ],
    },
    table: {
      title: 'Últimos reportes',
      badge: 'PDF/Excel',
      rows: [
        ['Inventario general', 'Excel', 'Mayo'],
        ['Mantenciones flota', 'PDF', 'Mayo'],
        ['EPP por voluntario', 'PDF', 'Abril'],
      ],
    },
  },
};

function DashboardPreview() {
  const [activeView, setActiveView] = useState('inicio');
  const view = demoViews[activeView];

  return (
    <section id="plataforma" className="section container">
      <div className="section-header reveal">
        <span className="section-eyebrow">Vista mini</span>
        <h2 className="section-title">Un dashboard parecido al que usarás todos los días</h2>
        <p className="section-subtitle">Más que una maqueta bonita: una lectura compacta del panel actual, con foco en acciones repetidas y señales críticas.</p>
      </div>
      <div className="mini-dashboard reveal delay-100">
        <div className="mini-topbar">
          <div>
            <strong>Panel de Control</strong>
            <span>{view.subtitle}</span>
          </div>
          <div className="mini-user">NR</div>
        </div>
        <div className="mini-nav">
          {Object.entries(demoViews).map(([key, item]) => (
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
          <div className="mini-chart">
            <div className="mini-chart-head">
              <strong>{view.chart.title}</strong>
              <span>{view.chart.badge}</span>
            </div>
            <div className="chart-lines">
              <i></i><i></i><i></i><i></i><i></i>
              <div className="curve green"></div>
              <div className="curve red"></div>
            </div>
            <div className="mini-legend">
              {view.chart.legend.map(([tone, label, value]) => (
                <span key={label}><b className={tone}></b>{label}<em>{value}</em></span>
              ))}
            </div>
          </div>
          <div className="mini-table">
            <div className="mini-chart-head">
              <strong>{view.table.title}</strong>
              <span>{view.table.badge}</span>
            </div>
            <table>
              <tbody>
                {view.table.rows.map(([name, tag, value]) => (
                  <tr key={`${name}-${tag}`}>
                    <td>{name}</td>
                    <td><span className="pill cyan">{tag}</span></td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
