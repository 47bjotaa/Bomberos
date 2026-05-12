import React from 'react';

function CtaFinal({ setView }) {
  return (
    <section className="cta-section">
      <div className="container">
        <h2 className="cta-title reveal">Protege a tus voluntarios.<br />Protege tu patrimonio.</h2>
        <div className="reveal delay-100">
          <button onClick={() => setView('auth')} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '1rem 2.5rem' }}>Registrarse Ahora</button>
        </div>
        <p className="cta-note reveal delay-200">Sin pagos por adelantado · Implementación asistida · Soporte técnico incluido</p>
      </div>
    </section>
  );
}

export default CtaFinal;
