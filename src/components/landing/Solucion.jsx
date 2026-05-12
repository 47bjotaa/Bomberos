import React from 'react';

function Solucion() {
  const modules = [
    { num: "01", tag: "Logística", title: "Inventario Georreferenciado", desc: "Stock visible por ubicación exacta (Bodega, Camioneta, Carros) con micro-gestión por gavetas. Atributos dinámicos por tipo de activo." },
    { num: "02", tag: "Operatividad", title: "Monitor de Estado Semáforo", desc: "Visualiza instantáneamente el estado operativo del material: En Servicio, Dañado, En Mantención o En Custodia/Hospital." },
    { num: "03", tag: "Seguridad", title: "Módulo EPP y Ciclo de Vida", desc: "Control de asignación individual de uniformes y cascos con alertas automáticas de vencimiento según normas ANB." },
    { num: "04", tag: "Administración", title: "Gestión Financiera", desc: "Costos de mercado actualizados para reportes de siniestralidad y recuperación ágil mediante pólizas de seguros." },
    { num: "05", tag: "Terreno", title: "Cierre Post-Emergencia", desc: "Formulario rápido post-incidente para reportar daños, consumibles usados o material que quedó retenido en hospitales." },
    { num: "06", tag: "Automatización", title: "Alertas y Reposición", desc: "Notificaciones push y SMS al Capitán cuando un insumo crítico (espuma, combustible, oxígeno) cae bajo el stock mínimo." }
  ];
  return (
    <section id="solucion" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">Seis módulos. Una plataforma.</h2>
        <p className="section-subtitle">SGLB centraliza todo el ciclo logístico para que te enfoques en lo que importa: salvar vidas.</p>
      </div>
      <div className="grid-3">
        {modules.map((m, i) => (
          <div className="card module-card reveal" style={{ transitionDelay: `${(i % 3 + 1) * 0.1}s` }} key={i}>
            <div className="module-num">{m.num}</div>
            <span className="module-tag">{m.tag}</span>
            <h3 className="card-title">{m.title}</h3>
            <p className="card-desc">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Solucion;
