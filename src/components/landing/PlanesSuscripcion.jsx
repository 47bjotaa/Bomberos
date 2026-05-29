import { useEffect, useState } from 'react';
import { authService } from '../../services/api';
import { getAppUrl } from '../../utils/constants';
import { Icons } from '../ui/Icons';

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
};

const normalizePlan = (plan = {}) => {
  const id = plan.idTipoSuscripcion ?? plan.IdTipoSuscripcion ?? plan.id ?? plan.Id;
  const precio = Number(plan.precioMensual ?? plan.PrecioMensual ?? plan.precio ?? plan.Precio ?? 0) || 0;

  return {
    ...plan,
    id,
    codigo: plan.codigo ?? plan.Codigo ?? '',
    nombre: plan.nombre ?? plan.Nombre ?? plan.titulo ?? plan.Titulo ?? 'Plan',
    descripcion: plan.descripcion ?? plan.Descripcion ?? '',
    precioMensual: precio,
    flowPlanId: plan.flowPlanId ?? plan.FlowPlanId ?? '',
    activo: plan.activo ?? plan.Activo ?? true,
  };
};

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;

function PlanesSuscripcion() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const loadPlans = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await authService.getSubscriptionPlans({ soloActivos: true });
        const nextPlans = getArrayPayload(data).map(normalizePlan).slice(0, 3);
        if (alive) setPlans(nextPlans);
      } catch (loadError) {
        if (alive) setError(loadError.message || 'No se pudieron cargar los planes.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadPlans();
    return () => {
      alive = false;
    };
  }, []);

  const getRegisterUrl = (plan) => {
    const url = getAppUrl(`/register?plan=${encodeURIComponent(plan.id)}`);
    return url.startsWith('http') ? url : `/register?plan=${encodeURIComponent(plan.id)}`;
  };

  return (
    <section id="planes" className="section container">
      <div className="section-header">
        <h2 className="section-title reveal">Elige el plan para tu cuartel</h2>
        <p className="section-subtitle reveal delay-100">Comienza con el nivel que calza con tu operación y activa funciones avanzadas cuando las necesites.</p>
      </div>

      {loading ? (
        <div className="pricing-status reveal">Cargando planes...</div>
      ) : error ? (
        <div className="pricing-status pricing-status-error reveal">{error}</div>
      ) : (
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <article key={plan.id || plan.codigo || plan.nombre} className={`pricing-card reveal ${index === 1 ? 'pricing-card-featured delay-100' : index === 2 ? 'delay-200' : ''}`}>
              <div className="pricing-icon">
                <Icons.Finance />
              </div>
              <h3 className="pricing-title">{plan.nombre}</h3>
              <p className="pricing-desc">{plan.descripcion || 'Gestiona tu compañía con herramientas digitales para el día a día.'}</p>
              <div className="pricing-price">
                {plan.precioMensual > 0 ? formatCurrency(plan.precioMensual) : 'Gratis'}
                <span>{plan.precioMensual > 0 ? '/mes' : ''}</span>
              </div>
              <a className="btn btn-primary pricing-btn" href={getRegisterUrl(plan)}>
                {plan.precioMensual > 0 ? 'Elegir plan' : 'Comenzar'}
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PlanesSuscripcion;
