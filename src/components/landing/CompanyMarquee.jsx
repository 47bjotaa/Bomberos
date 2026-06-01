import { Icons } from '../ui/Icons';

const logos = [
  { name: 'Primera Cía.', icon: <Icons.Shield /> },
  { name: 'Rescate Norte', icon: <Icons.Truck /> },
  { name: 'Bomba Central', icon: <Icons.Inventory /> },
  { name: 'Guardia Activa', icon: <Icons.Report /> },
  { name: 'Brigada Sur', icon: <Icons.User /> },
  { name: 'Cuartel Digital', icon: <Icons.Traceability /> },
];

function CompanyMarquee() {
  const row = [...logos, ...logos];

  return (
    <section className="company-marquee" aria-label="Compañías que han implementado CuartelAmigo">
      <p>Implementado por compañías como</p>
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
