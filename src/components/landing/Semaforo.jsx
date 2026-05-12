import React from 'react';

function Semaforo() {
  return (
    <section className="section container reveal">
      <div className="semaforo-wrap">
        <div className="grid-2 items-center">
          <div>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Sistema Semáforo</h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 3rem 0' }}>Conoce el estado exacto de cada activo en tiempo real. Decisiones rápidas, operaciones seguras.</p>
            <div className="flex-col gap-6">
              <div className="status-item"><div className="status-dot green"></div><div className="status-content"><h4>En Servicio (Verde)</h4><p>Activo operativo, inspeccionado y listo para ser desplegado en la próxima emergencia.</p></div></div>
              <div className="status-item"><div className="status-dot red"></div><div className="status-content"><h4>Dañado (Rojo)</h4><p>Material inoperativo que requiere revisión técnica urgente o ha sido dado de baja.</p></div></div>
              <div className="status-item"><div className="status-dot yellow"></div><div className="status-content"><h4>En Mantención (Amarillo)</h4><p>El activo se encuentra actualmente en proceso de reparación o mantenimiento preventivo.</p></div></div>
              <div className="status-item"><div className="status-dot orange"></div><div className="status-content"><h4>En Custodia (Naranja)</h4><p>Activo dejado temporalmente en un recinto externo, como un centro de salud u hospital.</p></div></div>
            </div>
          </div>
          <div className="text-center" style={{ padding: '2rem' }}>
            <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%', border: '1px dashed var(--border)' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 40px var(--shadow)' }}>
                <div className="status-dot green" style={{ width: '40px', height: '40px', boxShadow: '0 0 30px var(--green)' }}></div>
                <div className="status-dot yellow" style={{ width: '40px', height: '40px', boxShadow: '0 0 10px var(--gold)', opacity: 0.3 }}></div>
                <div className="status-dot orange" style={{ width: '40px', height: '40px', boxShadow: '0 0 10px var(--ember)', opacity: 0.3 }}></div>
                <div className="status-dot red" style={{ width: '40px', height: '40px', boxShadow: '0 0 10px var(--red)', opacity: 0.3 }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Semaforo;
