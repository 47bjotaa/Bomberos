import React from 'react';
import { Icons } from '../../components/ui/Icons';

function DashboardPreview() {
  return (
    <section id="plataforma" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">Control Total a un Clic</h2>
        <p className="section-subtitle">Una interfaz intuitiva y oscura, optimizada para reducir la fatiga visual y resaltar lo crítico.</p>
      </div>
      <div className="dash-preview reveal delay-100">
        <div className="dash-header">
          <div className="dash-dots"><div className="dash-dot" style={{ backgroundColor: '#ff5f56' }}></div><div className="dash-dot" style={{ backgroundColor: '#ffbd2e' }}></div><div className="dash-dot" style={{ backgroundColor: '#27c93f' }}></div></div>
          <div className="dash-title">SGLB - Dashboard Operativo</div>
        </div>
        <div className="dash-body">
          <div className="dash-sidebar">
            <div className="sidebar-item active"><Icons.Dashboard /> Dashboard</div>
            <div className="sidebar-item"><Icons.Inventory /> Inventario</div>
            <div className="sidebar-item"><Icons.Shield /> EPP & Ciclo Vida</div>
            <div className="sidebar-item"><Icons.AlertTriangle /> Emergencias</div>
            <div className="sidebar-item"><Icons.Finance /> Reportes</div>
            <div className="sidebar-item" style={{ marginTop: 'auto' }}><Icons.Settings /> Configuración</div>
          </div>
          <div className="dash-main">
            <div className="dash-kpis">
              <div className="kpi-card"><div className="kpi-label">Total Activos</div><div className="kpi-val text-cyan">247</div></div>
              <div className="kpi-card"><div className="kpi-label">En Servicio</div><div className="kpi-val text-green">198</div></div>
              <div className="kpi-card"><div className="kpi-label">Alertas EPP</div><div className="kpi-val text-red">4</div></div>
              <div className="kpi-card"><div className="kpi-label">En Custodia</div><div className="kpi-val text-ember">12</div></div>
            </div>
            <div className="dash-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead><tr><th>Activo</th><th>Categoría</th><th>Ubicación</th><th>Estado</th><th>Vencimiento</th></tr></thead>
                <tbody>
                  <tr><td>Manguera Ø 45mm — Seg. A</td><td>Material HID.</td><td>Carro 1 / Gav. 3</td><td><span className="status-badge badge-green">🟢 En Servicio</span></td><td>—</td></tr>
                  <tr><td>Casco Bombero — Vol. Contreras</td><td>EPP</td><td>Bodega / Armario 2</td><td><span className="status-badge badge-yellow">🟡 Por Vencer</span></td><td>15 días</td></tr>
                  <tr><td>Motobomba HONDA GX200</td><td>Motorizado</td><td>Carro 2</td><td><span className="status-badge badge-red">🔴 Dañado</span></td><td>—</td></tr>
                  <tr><td>Kit Espuma AFFF 200L</td><td>Consumible</td><td>Bodega Principal</td><td><span className="status-badge badge-orange">🟠 En Custodia</span></td><td>—</td></tr>
                  <tr><td>Traje de Aproximación</td><td>EPP</td><td>Carro 1</td><td><span className="status-badge badge-green">🟢 En Servicio</span></td><td>—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
