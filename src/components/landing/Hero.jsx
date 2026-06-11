import { useEffect, useState } from 'react';
import { Icons } from '../../components/ui/Icons';

const getTitleMetrics = () => {
  if (typeof window === 'undefined') {
    return { initialTop: 170, dockedTop: -27 };
  }

  const width = window.innerWidth || 1440;
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const minTitleSize = 4.9 * rootFontSize;
  const maxTitleSize = 9.9 * rootFontSize;
  const responsiveTitleSize = width * 0.108;
  const titleSize = Math.min(Math.max(responsiveTitleSize, minTitleSize), maxTitleSize);
  const titleHeight = titleSize * 0.82;
  const navCenter = width <= 768 ? 40 : 38;
  const dockedTop = navCenter - (titleHeight / 2);
  const initialTop = width <= 768 ? 116 : Math.min(Math.max(width * 0.088, 132), 170);

  return { initialTop, dockedTop };
};

function Hero() {
  const [isDocked, setIsDocked] = useState(false);
  const [titleMetrics, setTitleMetrics] = useState(getTitleMetrics);

  useEffect(() => {
    const updateDockState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      setIsDocked(scrollTop > 8);
    };

    const handleScroll = () => {
      window.requestAnimationFrame(updateDockState);
    };

    const handleResize = () => {
      window.requestAnimationFrame(() => {
        setTitleMetrics(getTitleMetrics());
        updateDockState();
      });
    };

    updateDockState();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const dockProgress = isDocked ? 1 : 0;
  const titleScale = 1 - (dockProgress * 0.78);
  const titleTop = titleMetrics.initialTop - (dockProgress * (titleMetrics.initialTop - titleMetrics.dockedTop));
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
        <span className="hero-logo-metal" data-text="CuartelAmigo">CuartelAmigo</span>
      </h1>
      <div className="container hero-layout">
        <div className="hero-info-card reveal is-visible delay-100" style={{ transform: cardTransform }}>
          <h2>Todo el cuartel, en orden de servicio.</h2>
          <p>
            El cuartel ordenado antes de la emergencia: inventario, EPP, vehículos, guardias, donaciones y reportes en una plataforma pensada para el ritmo real de una compañía.
          </p>
          <div className="hero-actions">
            <a href="#planes" className="btn btn-primary">Ver planes <Icons.ChevronRight /></a>
            <a href="#plataforma" className="btn btn-secondary">Ver plataforma</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
