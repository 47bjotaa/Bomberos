import { Icons } from '../ui/Icons';

const details = [
  {
    icon: <Icons.Inventory />,
    title: 'Bodegas, carros y sububicaciones',
    text: 'Ordena material por compañía, bodega, carro, gaveta o espacio operativo sin perder trazabilidad.',
  },
  {
    icon: <Icons.Shield />,
    title: 'EPP y seguridad del voluntario',
    text: 'Controla asignaciones, estados y vencimientos para llegar a la emergencia con equipo revisado.',
  },
  {
    icon: <Icons.Report />,
    title: 'Continuidad ante cambio de mando',
    text: 'La información queda documentada para la siguiente oficialidad, sin depender de planillas personales.',
  },
];

function MarcaCuartel() {
  return (
    <section id="marca-cuartel" className="section container brand-section">
      <div className="brand-operational reveal">
        <div className="brand-operational-copy">
          <span className="section-eyebrow">Hecho para compañías chilenas</span>
          <h2 className="section-title">No es una plantilla de inventario. Es lenguaje de cuartel.</h2>
          <p className="section-subtitle">
            CuartelAmigo está diseñado alrededor de cómo se mueve una compañía: guardias, carros, bodegas, EPP, reportes y decisiones rápidas cuando el material tiene que estar listo.
          </p>
        </div>

        <div className="brand-operational-board" aria-label="Ejemplos de control operativo de CuartelAmigo">
          <div className="brand-board-header">
            <span>Orden de servicio</span>
            <strong>Guardia activa</strong>
          </div>
          {details.map((item) => (
            <article className="brand-board-row" key={item.title}>
              <div className="brand-board-icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MarcaCuartel;
