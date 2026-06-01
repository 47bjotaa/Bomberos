import { useState, useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import CompanyMarquee from '../components/landing/CompanyMarquee';
import Problema from '../components/landing/Problema';
import Solucion from '../components/landing/Solucion';
import Semaforo from '../components/landing/Semaforo';
import DashboardPreview from '../components/landing/DashboardPreview';
import ComoFunciona from '../components/landing/ComoFunciona';
import PlanesSuscripcion from '../components/landing/PlanesSuscripcion';
import CtaFinal from '../components/landing/CtaFinal';
import Footer from '../components/landing/Footer';

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page fade-in">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <Hero />
      <CompanyMarquee />
      <Problema />
      <Solucion />
      <Semaforo />
      <DashboardPreview />
      <ComoFunciona />
      <PlanesSuscripcion />
      <CtaFinal />
      <Footer />
    </div>
  );
}

export default Landing;
