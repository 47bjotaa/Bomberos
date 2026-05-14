import { Icons } from '../../components/ui/Icons';
import { APP_LOGIN_URL } from '../../utils/constants';

function Hero() {
  return (
    <section className="hero text-center" style={{ paddingBottom: '160px' }}>
      <video autoPlay loop muted playsInline className="hero-video-bg">
        <source src="/images/b_a_b_af_ec_e_e_b_c_d_b_e_b_mp_.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay"></div>
      <div className="hero-orbs"></div>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="hero-title reveal is-visible">
          Gestión Logística Bomberil <br /><span className="highlight">Inteligente y Escalable</span>
        </h1>
        <p className="hero-subtitle reveal is-visible delay-100">
          Transformando la infraestructura digital para un futuro seguro.
          Optimiza la gestión operativa y protege a tus voluntarios con un sistema
          integral, robusto y en tiempo real diseñado exclusivamente para bomberos.
        </p>
        <div className="flex justify-center gap-4 reveal is-visible delay-200">
          <a href={APP_LOGIN_URL} className="btn btn-primary">Registrarse / Ingresar <Icons.ChevronRight /></a>
          <a href="#solucion" className="btn btn-secondary">Explorar Módulos</a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
