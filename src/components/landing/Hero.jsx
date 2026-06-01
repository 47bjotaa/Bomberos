import { useEffect, useState } from 'react';
import { Icons } from '../../components/ui/Icons';

function Hero() {
  const [dockProgress, setDockProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      frameId = 0;
      setDockProgress(Math.min(window.scrollY / 170, 1));
    };

    const handleScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section
      className="hero landing-hero"
      style={{
        '--dock-progress': dockProgress,
        '--title-opacity': Math.max(0, 1 - (dockProgress * 2.8)),
        '--title-scale': 1 - (dockProgress * 0.72),
        '--title-lift': `${dockProgress * -108}px`,
        '--card-lift': `${dockProgress * -34}px`,
      }}
    >
      <video autoPlay loop muted playsInline className="hero-video-bg">
        <source src="/images/b_a_b_af_ec_e_e_b_c_d_b_e_b_mp_.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay"></div>
      <div className="container hero-layout">
        <h1 className="hero-brand-title reveal is-visible">CuartelAmigo</h1>
        <div className="hero-info-card reveal is-visible delay-100">
          <h2>Orden operativo para cada guardia, bodega y compañía.</h2>
          <p>
            Controla inventario, EPP, vehículos, personal, donaciones y reportes desde una plataforma diseñada para el ritmo real del cuartel.
          </p>
          <div className="hero-actions">
            <a href="#planes" className="btn btn-primary">Ver planes <Icons.ChevronRight /></a>
            <a href="#plataforma" className="btn btn-secondary">Vista mini</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
