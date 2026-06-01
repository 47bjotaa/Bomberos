import { Icons } from '../../components/ui/Icons';
import { getAppUrl } from '../../utils/constants';

function Hero() {
  return (
    <section className="hero landing-hero">
      <video autoPlay loop muted playsInline className="hero-video-bg">
        <source src="/images/b_a_b_af_ec_e_e_b_c_d_b_e_b_mp_.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay"></div>
      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="hero-kicker reveal is-visible">
            <span>Software por suscripción</span>
            <span>Para compañías de bomberos</span>
          </div>
          <h1 className="hero-title reveal is-visible">
            CuartelAmigo
            <span> ordena la operación diaria de tu cuartel.</span>
          </h1>
          <p className="hero-subtitle reveal is-visible delay-100">
            Inventario, EPP, vehículos, personal, donaciones y reportes en una plataforma pensada para mando, bodega y administración. Elige un plan y escala cuando tu compañía lo necesite.
          </p>
          <div className="hero-actions reveal is-visible delay-200">
            <a href="#planes" className="btn btn-primary">Ver planes <Icons.ChevronRight /></a>
            <a href="#plataforma" className="btn btn-secondary">Ver dashboard</a>
          </div>
          <div className="social-proof reveal is-visible delay-300" aria-label="Redes sociales">
            <span>Síguenos</span>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
        <div className="hero-panel reveal is-visible delay-100" aria-hidden="true">
          <div className="hero-panel-top">
            <span>Estado operativo</span>
            <strong>En línea</strong>
          </div>
          <div className="hero-stack">
            <div className="hero-stack-card active">
              <Icons.Inventory />
              <div>
                <strong>Stock crítico</strong>
                <span>2 materiales bajo mínimo</span>
              </div>
            </div>
            <div className="hero-stack-card">
              <Icons.Shield />
              <div>
                <strong>EPP próximo a vencer</strong>
                <span>Alertas por voluntario</span>
              </div>
            </div>
            <div className="hero-stack-card">
              <Icons.User />
              <div>
                <strong>Personal activo</strong>
                <span>Cargos y contacto al día</span>
              </div>
            </div>
          </div>
          <a href={getAppUrl('/login')} className="hero-login-link">Ingresar a la app</a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
