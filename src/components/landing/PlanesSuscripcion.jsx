import { getAppUrl } from '../../utils/constants';
import { Icons } from '../ui/Icons';

const STATIC_SUBSCRIPTION_PLANS = [
  {
    codigo: 'trial',
    nombre: 'Prueba',
    descripcion: 'Plan de prueba inicial para nuevas compañías.',
    precioMensual: 0,
    duracionDias: 7,
    donaciones: false,
  },
  {
    codigo: 'basico',
    nombre: 'Basico',
    descripcion: 'Plan base sin modulo de donaciones.',
    precioMensual: 35990,
    duracionDias: null,
    donaciones: false,
  },
  {
    codigo: 'pro',
    nombre: 'Pro',
    descripcion: 'Plan con modulo de donaciones activo.',
    precioMensual: 59990,
    duracionDias: null,
    donaciones: true,
  },
];

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;

function PlanesSuscripcion() {
  const getRegisterUrl = (plan) => {
    const path = `/register?plan=${encodeURIComponent(plan.codigo)}`;
    const url = getAppUrl(path);
    return url.startsWith('http') ? url : path;
  };

  return (
    <section id="planes" className="section container">
      <div className="section-header">
        <span className="section-eyebrow reveal">Planes por suscripcion</span>
        <h2 className="section-title reveal">Elige el plan para tu cuartel</h2>
        <p className="section-subtitle reveal delay-100">No vendemos una caja cerrada: habilitamos una operación digital con soporte, mejoras y módulos que crecen junto a tu compañía.</p>
      </div>

      <div className="pricing-grid">
        {STATIC_SUBSCRIPTION_PLANS.map((plan, index) => (
          <article key={plan.codigo} className={`pricing-card reveal is-visible ${index === 1 ? 'pricing-card-featured delay-100' : index === 2 ? 'delay-200' : ''}`}>
            {index === 1 && <span className="pricing-ribbon"><span>Recomendado</span></span>}
            <div className="pricing-icon">
              <Icons.Finance />
            </div>
            <h3 className="pricing-title">{plan.nombre}</h3>
            <p className="pricing-desc">{plan.descripcion || 'Gestiona tu compañía con herramientas digitales para el día a día.'}</p>
            <div className="pricing-price">
              {plan.precioMensual > 0 ? formatCurrency(plan.precioMensual) : 'Gratis'}
              <span>{plan.precioMensual > 0 ? '/mes' : ''}</span>
            </div>
            <div className="pricing-features">
              {plan.duracionDias ? <span>{plan.duracionDias} dias de prueba</span> : <span>Uso mensual</span>}
              <span>{plan.donaciones ? 'Incluye donaciones' : 'Sin modulo de donaciones'}</span>
              <span>Soporte y mejoras incluidas</span>
            </div>
            <a className="btn btn-primary pricing-btn" href={getRegisterUrl(plan)}>
              {plan.precioMensual > 0 ? 'Elegir plan' : 'Comenzar'}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PlanesSuscripcion;
