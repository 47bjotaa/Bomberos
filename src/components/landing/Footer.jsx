import LogoCuartelAmigo from '../ui/LogoCuartelAmigo';

function Footer() {
  return (
    <footer id="contacto" className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); }}>
            <LogoCuartelAmigo size={220} />
          </a>
          <p className="footer-slogan">Infraestructura digital para compañías que necesitan continuidad, trazabilidad y control operativo.</p>
        </div>
        <div className="footer-social">
          <span>Redes</span>
          <div>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
        <div className="footer-credits">
          Desarrollado para 1a Cia. Bomberos Coquimbo<br />
          © 2026 CuartelAmigo
        </div>
      </div>
    </footer>
  );
}

export default Footer;
