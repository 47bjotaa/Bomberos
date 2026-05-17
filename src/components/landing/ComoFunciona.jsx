import React from 'react';

function ComoFunciona() {
  return (
    <section id="como-funciona" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">Implementación sin Fricción</h2>
        <p className="section-subtitle">Transición rápida y asistida desde planillas Excel a una plataforma centralizada y robusta.</p>
      </div>
      <div className="steps-container">
        <div className="step-item reveal"><div className="step-num">01</div><div className="step-content"><h3>Onboarding Guiado</h3><p>El equipo de Cuartel Amigo realiza el levantamiento inicial de tus datos y capacita al personal clave para una adopción rápida y sin estrés.</p></div></div>
        <div className="step-item reveal delay-100"><div className="step-num">02</div><div className="step-content"><h3>Digitalización Total</h3><p>Se codifican los activos, se configuran las alertas y se georreferencian los elementos según el layout de tu cuartel y carros.</p></div></div>
        <div className="step-item reveal delay-200"><div className="step-num">03</div><div className="step-content"><h3>Control Permanente</h3><p>El sistema entra en régimen. El mando tiene visibilidad 24/7 y la información se resguarda íntegra ante los futuros cambios de oficialidad.</p></div></div>
      </div>
    </section>
  );
}

export default ComoFunciona;
