import { Icons } from '../../components/ui/Icons';

function DashboardPreview() {
  const kpis = [
    { label: 'Alertas sin leer', value: '0', sub: 'Notificaciones pendientes', icon: <Icons.AlertTriangle /> },
    { label: 'Personal activo', value: '24', sub: 'Bomberos en total', icon: <Icons.User /> },
    { label: 'Stock crítico', value: '2', sub: 'Materiales bajo mínimo', icon: <Icons.Inventory /> },
  ];

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
            <span>Visión general del estado del cuartel y recursos</span>
          </div>
          <div className="mini-user">NR</div>
        </div>
        <div className="mini-nav">
          <span className="active"><Icons.Dashboard /> Inicio</span>
          <span><Icons.Inventory /> Inventario</span>
          <span><Icons.Truck /> Vehículos</span>
          <span><Icons.Shield /> EPP</span>
          <span><Icons.Report /> Reportes</span>
        </div>
        <div className="mini-kpis">
          {kpis.map((kpi) => (
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
              <strong>Estado de Flota</strong>
              <span>4 vehículos</span>
            </div>
            <div className="chart-lines">
              <i></i><i></i><i></i><i></i><i></i>
              <div className="curve green"></div>
              <div className="curve red"></div>
            </div>
            <div className="mini-legend">
              <span><b className="green"></b>Operativos</span>
              <span><b className="yellow"></b>Mantención</span>
              <span><b className="red"></b>Fuera de serv.</span>
            </div>
          </div>
          <div className="mini-table">
            <div className="mini-chart-head">
              <strong>Catálogo</strong>
              <span>Materiales base</span>
            </div>
            <table>
              <tbody>
                <tr><td>Casco estructural</td><td><span className="pill cyan">EPP</span></td><td>$202.730</td></tr>
                <tr><td>Manguera 45 mm</td><td><span className="pill blue">Agua</span></td><td>$189.150</td></tr>
                <tr><td>Inmovilizador lateral</td><td><span className="pill cyan">Rescate</span></td><td>$55.713</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
