import React, { useState, useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Problema from '../components/landing/Problema';
import Solucion from '../components/landing/Solucion';
import Semaforo from '../components/landing/Semaforo';
import DashboardPreview from '../components/landing/DashboardPreview';
import ComoFunciona from '../components/landing/ComoFunciona';
import CtaFinal from '../components/landing/CtaFinal';
import Footer from '../components/landing/Footer';

function Landing({ setView }) {
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
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} setView={setView} />
      <Hero setView={setView} />
      <Problema />
      <Solucion />
      <Semaforo />
      <DashboardPreview />
      <ComoFunciona />
      <CtaFinal setView={setView} />
      <Footer />
    </div>
  );
}

export default Landing;
