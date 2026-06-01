function Semaforo() {
  const states = [
    {
      tone: 'green',
      title: 'En Servicio',
      label: 'Verde',
      desc: 'Activo operativo, inspeccionado y listo para salir en la próxima emergencia.',
    },
    {
      tone: 'red',
      title: 'Dañado',
      label: 'Rojo',
      desc: 'Material inoperativo que requiere revisión técnica urgente o baja.',
    },
    {
      tone: 'yellow',
      title: 'En Mantención/Desgastado',
      label: 'Amarillo',
      desc: 'Equipo en reparación, revisión preventiva o con desgaste visible controlado.',
    },
    {
      tone: 'orange',
      title: 'En Custodia',
      label: 'Naranja',
      desc: 'Activo dejado temporalmente en un recinto externo, hospital o apoyo logístico.',
    },
  ];

  return (
    <section id="semaforo" className="section container">
      <div className="semaforo-wrap reveal">
        <div className="grid-2 items-center">
          <div>
            <span className="section-eyebrow">Estados claros</span>
            <h2 className="section-title semaforo-title">Sistema Semáforo</h2>
            <p className="section-subtitle semaforo-subtitle">
              Cada activo comunica su condición de un vistazo. Menos interpretación, más decisiones rápidas antes y después de una emergencia.
            </p>
            <div className="status-list">
              {states.map((state) => (
                <div className="status-item" key={state.title}>
                  <div className={`status-dot ${state.tone}`}></div>
                  <div className="status-content">
                    <h4>{state.title} <span>({state.label})</span></h4>
                    <p>{state.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="semaforo-visual" aria-hidden="true">
            <div className="traffic-device">
              <div className="traffic-dot green active"></div>
              <div className="traffic-dot yellow"></div>
              <div className="traffic-dot orange"></div>
              <div className="traffic-dot red"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Semaforo;
