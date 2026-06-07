import { Icons } from '../ui/Icons';

const proofPoints = [
  { name: 'Inventario trazable', icon: <Icons.Traceability /> },
  { name: 'EPP con vencimiento', icon: <Icons.Shield /> },
  { name: 'Carros y mantenciones', icon: <Icons.Truck /> },
  { name: 'Reportes PDF', icon: <Icons.Report /> },
  { name: 'Donaciones integradas', icon: <Icons.Finance /> },
  { name: 'Preparado para cambios de mando', icon: <Icons.User /> },
];

function CompanyMarquee() {
  const row = [...proofPoints, ...proofPoints];

  return (
    <section className="company-marquee" aria-label="Puntos de confianza de CuartelAmigo">
      <p>Control real para el día a día del cuartel</p>
      <div className="company-marquee-track">
        {row.map((item, index) => (
          <div className="company-logo" key={`${item.name}-${index}`}>
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CompanyMarquee;
