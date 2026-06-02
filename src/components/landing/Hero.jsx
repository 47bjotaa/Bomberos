import { useEffect, useState } from 'react';
import { Icons } from '../../components/ui/Icons';

function Hero() {
  const [isDocked, setIsDocked] = useState(false);

  useEffect(() => {
    const updateDockState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      setIsDocked(scrollTop > 8);
    };

    const handleScroll = () => {
      window.requestAnimationFrame(updateDockState);
    };

    updateDockState();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const dockProgress = isDocked ? 1 : 0;
  const titleScale = 1 - (dockProgress * 0.78);
  const titleTop = 170 - (dockProgress * 210);
  const titleTransform = `translateX(-50%) scale(${titleScale})`;
  const cardTransform = `translateY(${-34 * dockProgress}px)`;

  return (
    <section className="hero landing-hero">
      <video autoPlay loop muted playsInline className="hero-video-bg">
        <source src="/images/b_a_b_af_ec_e_e_b_c_d_b_e_b_mp_.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay"></div>
      <h1
        className="hero-brand-title"
        style={{ top: `${titleTop}px`, transform: titleTransform }}
      >
        CuartelAmigo
      </h1>
      <div className="container hero-layout">
        <div className="hero-info-card reveal is-visible delay-100" style={{ transform: cardTransform }}>
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
