import React from 'react';
import { Icons } from '../../components/ui/Icons';

function Problema() {
  const problems = [
    { title: "Falta de Trazabilidad", desc: "La información histórica se pierde con cada cambio de mando bianual al no existir un sistema estandarizado institucional.", icon: <Icons.Traceability /> },
    { title: "Incertidumbre Operativa", desc: "El mando no tiene visibilidad inmediata del estado real de herramientas, elevando el riesgo de fallas durante emergencias.", icon: <Icons.Uncertainty /> },
    { title: "Gestión Financiera Ineficiente", desc: "Sin inventario valorizado es imposible recuperar costos ante siniestros ni planificar compras basadas en stock crítico.", icon: <Icons.Finance /> },
    { title: "Riesgo en EPP", desc: "Sin control de vencimientos de Equipos de Protección Personal, los voluntarios operan con material fuera de norma.", icon: <Icons.Shield /> }
  ];
  return (
    <section id="problema" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">La gestión manual pone en riesgo vidas y patrimonio</h2>
        <p className="section-subtitle">Identificamos los puntos críticos que amenazan la operatividad y la seguridad de tu compañía.</p>
      </div>
      <div className="grid-4">
        {problems.map((p, i) => (
          <div className="card reveal" style={{ transitionDelay: `${(i + 1) * 0.1}s` }} key={i}>
            <div className="card-icon">{p.icon}</div>
            <h3 className="card-title">{p.title}</h3>
            <p className="card-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Problema;
