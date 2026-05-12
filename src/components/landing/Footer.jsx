import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); }}>
            <img src="/images/logo.png" className="brand-logo" alt="SYNETIX" style={{ height: '32px' }} />
          </a>
          <p className="footer-slogan">Transformando la infraestructura digital para un futuro escalable.</p>
        </div>
        <div className="footer-credits">
          Desarrollado para 1ª Cía. Bomberos Coquimbo<br />
          © 2026 SYNETIX · Ingeniería en Informática · Santo Tomás Coquimbo
        </div>
      </div>
    </footer>
  );
}

export default Footer;
