import React, { useState, useEffect, useRef } from 'react';
import { authService } from './services/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Rajdhani:wght@400;500;600;700&display=swap');

  .landing-page {
    --bg: #05080F;
    --bg2: #0A0F1E;
    --bg3: #0F1729;
    --surface: #131D35;
    --border: rgba(255,255,255,0.07);
    --red: #E8372A;
    --ember: #FF6B35;
    --gold: #F5A623;
    --cyan: #38BDF8;
    --green: #22C55E;
    --text: #EEF2FF;
    --muted: #6B7FA8;

    background-color: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    line-height: 1.5;
    min-height: 100vh;
  }

  .landing-page::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
      linear-gradient(rgba(232, 55, 42, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(232, 55, 42, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: -1;
    pointer-events: none;
  }

  h1, h2, h3, h4, h5, h6, .rajdhani { font-family: 'Rajdhani', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--red); border-radius: 4px; }

  .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
  .text-center { text-align: center; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .flex-col { flex-direction: column; }
  .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; }
  
  .text-cyan { color: var(--cyan) !important; }
  .text-green { color: var(--green) !important; }
  .text-red { color: var(--red) !important; }
  .text-ember { color: var(--ember) !important; }

  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pulseGlow { 0%, 100% { text-shadow: 0 0 20px rgba(232, 55, 42, 0.5); } 50% { text-shadow: 0 0 40px rgba(232, 55, 42, 0.8); } }
  @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .reveal.is-visible { opacity: 1; transform: translateY(0); }
  .delay-100 { transition-delay: 0.1s; } .delay-200 { transition-delay: 0.2s; } .delay-300 { transition-delay: 0.3s; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.75rem 1.5rem; font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 1.1rem;
    border-radius: 6px; cursor: pointer; transition: all 0.3s ease; border: none; text-decoration: none; gap: 0.5rem;
  }
  .btn-primary { background: linear-gradient(135deg, var(--red), var(--ember)); color: white; box-shadow: 0 4px 15px rgba(232, 55, 42, 0.3); }
  .btn-primary:hover { box-shadow: 0 6px 25px rgba(232, 55, 42, 0.5); transform: translateY(-2px); }
  .btn-secondary { background: rgba(255,255,255,0.05); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

  /* LOGO CUSTOMIZATION */
  .brand-logo {
    height: 40px;
    /* Elimina el fondo blanco, invierte el texto a blanco y restaura el color azul del hexágono */
    filter: invert(1) hue-rotate(180deg) brightness(1.2);
    mix-blend-mode: screen;
  }

  /* LANDING SPECIFIC */
  .navbar { position: fixed; top: 0; left: 0; right: 0; height: 80px; backdrop-filter: blur(16px); background: rgba(5, 8, 15, 0.7); border-bottom: 1px solid var(--border); z-index: 1000; display: flex; align-items: center; }
  .logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; cursor: pointer; }
  .nav-links { display: flex; gap: 2rem; }
  .nav-links a { color: var(--muted); text-decoration: none; font-weight: 500; transition: color 0.3s; font-size: 0.95rem; }
  .nav-links a:hover { color: var(--text); }
  .mobile-menu-btn { display: none; background: none; border: none; color: white; cursor: pointer; }
  .mobile-menu-btn svg { width: 28px; height: 28px; }

  .hero { padding: 180px 0 100px; position: relative; overflow: hidden; }
  .hero-video-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -3; opacity: 0.6; }
  .hero-video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(5, 8, 15, 0.7) 0%, var(--bg) 100%); z-index: -2; }
  .hero-orbs { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(circle, var(--red) 0%, transparent 70%); opacity: 0.15; filter: blur(80px); z-index: -1; pointer-events: none; }
  .hero-title { font-size: 4.5rem; line-height: 1.1; margin-bottom: 1.5rem; font-weight: 700; }
  .hero-title .highlight { color: var(--red); animation: pulseGlow 3s infinite; }
  .hero-subtitle { font-size: 1.25rem; color: var(--muted); max-width: 650px; margin: 0 auto 2.5rem; line-height: 1.6; }

  .section { padding: 100px 0; }
  .section-header { text-align: center; margin-bottom: 4rem; }
  .section-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
  .section-subtitle { color: var(--muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4rem; }

  .card { background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; transition: all 0.3s ease; position: relative; overflow: hidden; }
  .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--red), var(--ember)); opacity: 0; transition: opacity 0.3s ease; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); }
  .card:hover::before { opacity: 1; }
  .card-icon { width: 48px; height: 48px; background: rgba(232, 55, 42, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--red); margin-bottom: 1.5rem; }
  .card-icon svg { width: 24px; height: 24px; }
  .card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: var(--text); }
  .card-desc { color: var(--muted); font-size: 0.95rem; line-height: 1.6; }

  .module-card { padding: 2.5rem 2rem; display: flex; flex-direction: column; height: 100%; }
  .module-num { font-family: 'Rajdhani', sans-serif; font-size: 3.5rem; font-weight: 700; color: rgba(255,255,255,0.03); position: absolute; top: 1rem; right: 1.5rem; line-height: 1; }
  .module-tag { display: inline-block; padding: 0.3rem 0.8rem; background: rgba(56, 189, 248, 0.1); color: var(--cyan); border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1.25rem; text-transform: uppercase; align-self: flex-start; letter-spacing: 0.5px; }

  .semaforo-wrap { background: var(--bg2); border-radius: 24px; padding: 4rem; border: 1px solid var(--border); position: relative; overflow: hidden; }
  .semaforo-wrap::after { content: ''; position: absolute; top: 0; right: 0; width: 400px; height: 400px; background: radial-gradient(circle, var(--red) 0%, transparent 70%); opacity: 0.05; pointer-events: none; }
  .status-item { display: flex; align-items: flex-start; gap: 1.5rem; }
  .status-dot { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 15px currentColor; margin-top: 0.25rem; }
  .status-dot.green { background: var(--green); color: var(--green); }
  .status-dot.red { background: var(--red); color: var(--red); }
  .status-dot.yellow { background: var(--gold); color: var(--gold); }
  .status-dot.orange { background: var(--ember); color: var(--ember); }
  .status-content h4 { font-size: 1.15rem; margin-bottom: 0.4rem; font-family: 'DM Sans', sans-serif; font-weight: 600; color: var(--text); }
  .status-content p { color: var(--muted); font-size: 0.95rem; line-height: 1.5; }

  .dash-preview { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
  .dash-header { background: var(--bg2); padding: 0.75rem 1.5rem; display: flex; align-items: center; border-bottom: 1px solid var(--border); }
  .dash-dots { display: flex; gap: 0.5rem; } .dash-dot { width: 12px; height: 12px; border-radius: 50%; }
  .dash-title { margin: 0 auto; font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; color: var(--muted); font-weight: 600; letter-spacing: 1px; }
  .dash-body { display: flex; height: 600px; }
  .dash-sidebar { width: 240px; background: var(--bg2); border-right: 1px solid var(--border); padding: 1.5rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .sidebar-item { padding: 0.75rem 1.5rem; color: var(--muted); display: flex; align-items: center; gap: 0.75rem; font-size: 0.95rem; transition: all 0.2s; cursor: pointer; font-weight: 500; }
  .sidebar-item svg { width: 20px; height: 20px; }
  .sidebar-item:hover { color: var(--text); background: rgba(255,255,255,0.02); }
  .sidebar-item.active { background: rgba(232, 55, 42, 0.1); color: var(--red); border-right: 3px solid var(--red); }
  .dash-main { flex: 1; padding: 2.5rem; overflow-y: auto; background: var(--bg); }
  .dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
  .kpi-card { background: var(--surface); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border); }
  .kpi-label { color: var(--muted); font-size: 0.8rem; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
  .kpi-val { font-family: 'Rajdhani', sans-serif; font-size: 2.2rem; font-weight: 700; line-height: 1; }
  .dash-table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
  .dash-table th, .dash-table td { padding: 1rem 1.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  .dash-table th { color: var(--muted); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; background: rgba(255,255,255,0.02); letter-spacing: 0.5px; }
  .dash-table td { color: var(--text); }
  .dash-table tr:hover td { background: rgba(255,255,255,0.02); }
  .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-green { background: rgba(34, 197, 94, 0.1); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.2); }
  .badge-red { background: rgba(232, 55, 42, 0.1); color: var(--red); border: 1px solid rgba(232, 55, 42, 0.2); }
  .badge-yellow { background: rgba(245, 166, 35, 0.1); color: var(--gold); border: 1px solid rgba(245, 166, 35, 0.2); }
  .badge-orange { background: rgba(255, 107, 53, 0.1); color: var(--ember); border: 1px solid rgba(255, 107, 53, 0.2); }

  .steps-container { position: relative; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 4rem; }
  .steps-container::before { content: ''; position: absolute; top: 0; bottom: 0; left: 40px; width: 2px; background: var(--border); }
  .step-item { display: flex; gap: 3rem; position: relative; }
  .step-num { width: 80px; height: 80px; background: var(--bg2); border: 2px solid var(--red); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Rajdhani', sans-serif; font-size: 2rem; font-weight: 700; color: var(--red); z-index: 2; flex-shrink: 0; box-shadow: 0 0 20px rgba(232, 55, 42, 0.2); }
  .step-content { padding-top: 1rem; }
  .step-content h3 { font-size: 1.5rem; margin-bottom: 1rem; color: var(--text); font-weight: 600; }
  .step-content p { color: var(--muted); line-height: 1.6; font-size: 1.05rem; }

  .cta-section { padding: 100px 0; text-align: center; background: linear-gradient(to top, var(--bg2), transparent); border-top: 1px solid var(--border); position: relative; }
  .cta-title { font-size: 3.5rem; font-weight: 700; margin-bottom: 2.5rem; max-width: 800px; margin-inline: auto; line-height: 1.1; }
  .cta-note { color: var(--muted); font-size: 0.95rem; margin-top: 2rem; }

  .footer { border-top: 1px solid var(--border); padding: 4rem 0; background: var(--bg2); }
  .footer-content { display: flex; justify-content: space-between; align-items: center; }
  .footer-brand .logo { margin-bottom: 1rem; }
  .footer-slogan { color: var(--muted); font-size: 0.95rem; max-width: 350px; line-height: 1.6; }
  .footer-credits { text-align: right; color: var(--muted); font-size: 0.9rem; line-height: 1.6; }

  /* AUTH STYLES */
  .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 10; }
  .auth-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 3rem; width: 100%; max-width: 500px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; overflow: hidden; }
  .auth-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--red), var(--ember)); }
  .auth-header { text-align: center; margin-bottom: 2.5rem; }
  .auth-title { font-size: 1.8rem; margin-bottom: 0.5rem; font-family: 'Rajdhani', sans-serif; font-weight: 700; }
  .auth-subtitle { color: var(--muted); font-size: 0.9rem; }
  .form-group { margin-bottom: 1.25rem; text-align: left; }
  .form-label { display: block; margin-bottom: 0.4rem; color: var(--text); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-control { width: 100%; padding: 0.75rem 1rem; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 1rem; transition: all 0.2s; }
  .form-control:focus { outline: none; border-color: var(--red); box-shadow: 0 0 0 3px rgba(232, 55, 42, 0.2); }
  .form-error { color: var(--red); font-size: 0.8rem; margin-top: 0.4rem; display: block; font-weight: 500; }
  .auth-switch { text-align: center; margin-top: 2rem; font-size: 0.95rem; color: var(--muted); }
  .auth-switch button { background: none; border: none; color: var(--cyan); font-weight: 600; cursor: pointer; font-family: inherit; font-size: inherit; margin-left: 0.5rem; transition: color 0.2s; }
  .auth-switch button:hover { color: white; text-decoration: underline; }
  .grid-2-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  /* DASHBOARD APP STYLES */
  .dashboard-layout { display: flex; height: 100vh; background: var(--bg); overflow: hidden; }
  .dash-sidebar-real { width: 280px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 2rem 0; z-index: 20; }
  .dash-brand { display: flex; align-items: center; gap: 1rem; padding: 0 2rem 2rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: opacity 0.2s; }
  .dash-brand:hover { opacity: 0.8; }
  .dash-nav { display: flex; flex-direction: column; gap: 0.5rem; padding: 2rem 1rem; flex: 1; overflow-y: auto; }
  .dash-nav-item { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; background: transparent; border: none; border-radius: 8px; color: var(--muted); font-size: 1rem; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: left; }
  .dash-nav-item svg { width: 22px; height: 22px; }
  .dash-nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
  .dash-nav-item.active { background: rgba(232, 55, 42, 0.1); color: var(--red); }
  .dash-bottom-nav { padding: 1rem; border-top: 1px solid var(--border); }

  .dash-main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: var(--bg); position: relative; }
  .dash-main-content::before { content: ''; position: fixed; top: 0; left: 280px; right: 0; bottom: 0; background-image: linear-gradient(rgba(232, 55, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232, 55, 42, 0.03) 1px, transparent 1px); background-size: 60px 60px; z-index: 0; pointer-events: none; }
  .dash-header-real { padding: 1.5rem 3rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background: rgba(10, 15, 30, 0.7); backdrop-filter: blur(16px); position: sticky; top: 0; z-index: 10; }
  .header-left h2 { font-size: 1.75rem; margin-bottom: 0.25rem; font-family: 'Rajdhani', sans-serif; font-weight: 600; color: var(--text); }
  .user-profile { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 40px; cursor: pointer; transition: all 0.2s; }
  .user-profile:hover { border-color: rgba(255,255,255,0.2); }
  .user-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, var(--red), var(--ember)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 1.1rem; color: white; }
  .user-info { display: flex; flex-direction: column; }
  .user-name { font-weight: 600; font-size: 0.9rem; color: var(--text); }
  .user-role { color: var(--muted); font-size: 0.75rem; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; }

  .dash-body-real { padding: 3rem; flex: 1; z-index: 1; }
  .action-bar { display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 2rem; }

  .bodegas-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); display: grid; gap: 2rem; }
  .bodega-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; transition: all 0.3s ease; display: flex; flex-direction: column; height: 100%; position: relative; overflow: hidden; }
  .bodega-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--red), var(--ember)); opacity: 0; transition: opacity 0.3s ease; }
  .bodega-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
  .bodega-card:hover::before { opacity: 1; }
  .bodega-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
  .bodega-icon { width: 56px; height: 56px; background: rgba(232, 55, 42, 0.1); color: var(--red); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .bodega-icon svg { width: 28px; height: 28px; }
  .icon-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s; }
  .icon-btn:hover { background: rgba(255,255,255,0.05); color: var(--text); }
  .bodega-name { font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text); font-family: 'Rajdhani', sans-serif; font-weight: 600; }
  .bodega-desc { color: var(--muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; flex: 1; }
  .bodega-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--border); }
  .bodega-stats { display: flex; flex-direction: column; gap: 0.25rem; }
  .bodega-stats .stat { font-size: 0.85rem; color: var(--muted); font-weight: 500; }
  .btn-sm { padding: 0.5rem 1rem; font-size: 0.95rem; border-radius: 6px; }

  @media (max-width: 1024px) {
    .hero-title { font-size: 3.5rem; }
    .grid-4, .dash-kpis { grid-template-columns: repeat(2, 1fr); }
    .semaforo-wrap { padding: 3rem; }
    .grid-2 { gap: 2rem; }
  }
  @media (max-width: 768px) {
    .nav-links { position: absolute; top: 80px; left: 0; right: 0; background: var(--bg2); border-bottom: 1px solid var(--border); flex-direction: column; padding: 2rem; gap: 1.5rem; transform: translateY(-100%); opacity: 0; pointer-events: none; transition: all 0.3s ease; z-index: 999; }
    .nav-links.mobile-active { transform: translateY(0); opacity: 1; pointer-events: all; }
    .navbar .nav-btn { display: none; }
    .mobile-menu-btn { display: block; }
    .hero-title { font-size: 2.5rem; }
    .hero-subtitle { font-size: 1.1rem; }
    .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
    .dash-sidebar { display: none; }
    .dash-main { padding: 1.5rem; }
    .dash-table { display: block; overflow-x: auto; }
    .steps-container::before { left: 30px; }
    .step-item { gap: 1.5rem; }
    .step-num { width: 60px; height: 60px; font-size: 1.5rem; }
    .footer-content { flex-direction: column; gap: 2rem; text-align: center; }
    .footer-credits { text-align: center; }
    .cta-title { font-size: 2.5rem; }

    /* Dashboard mobile */
    .dashboard-layout { flex-direction: column; }
    .dash-sidebar-real { width: 100%; height: auto; padding: 1rem 0; border-right: none; border-bottom: 1px solid var(--border); flex-direction: row; align-items: center; overflow-x: auto; }
    .dash-brand { padding: 0 1rem; border-bottom: none; border-right: 1px solid var(--border); margin-bottom: 0; }
    .dash-nav { flex-direction: row; padding: 0 1rem; }
    .dash-bottom-nav { display: none; }
    .dash-header-real { padding: 1.5rem; flex-direction: column; align-items: flex-start; gap: 1rem; }
    .dash-body-real { padding: 1.5rem; }
    .action-bar { flex-direction: column; }
    .bodegas-grid { grid-template-columns: 1fr; }
    .dash-main-content::before { left: 0; }
    .grid-2-form { grid-template-columns: 1fr; }
  }
`;

const Icons = {
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Traceability: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Uncertainty: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Finance: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
  Inventory: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Truck: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
};
const cuerposBomberos = [
  { "idCuerpoBomberos": 44, "nombre": "Cuerpo de Bomberos Cartagena", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 269, "nombre": "Cuerpo de Bomberos de Achao", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 42, "nombre": "Cuerpo de Bomberos de Algarrobo", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 3, "nombre": "Cuerpo de Bomberos de Alto Hospicio", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 270, "nombre": "Cuerpo de Bomberos de Ancud", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 27, "nombre": "Cuerpo de Bomberos de Andacollo", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 213, "nombre": "Cuerpo de Bomberos de Angol", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 249, "nombre": "Cuerpo de Bomberos de Antilhue", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 10, "nombre": "Cuerpo de Bomberos de Antofagasta", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 181, "nombre": "Cuerpo de Bomberos de Antuco", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 182, "nombre": "Cuerpo de Bomberos de Arauco", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 1, "nombre": "Cuerpo de Bomberos de Arica", "region": "Region de Arica y Parinacota" },
  { "idCuerpoBomberos": 2, "nombre": "Cuerpo de Bomberos de Arica", "region": "Region de Arica y Parinacota" },
  { "idCuerpoBomberos": 75, "nombre": "Cuerpo de Bomberos de Buin", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 162, "nombre": "Cuerpo de Bomberos de Bulnes", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 43, "nombre": "Cuerpo de Bomberos de Cabildo", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 183, "nombre": "Cuerpo de Bomberos de Cabrero", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 11, "nombre": "Cuerpo de Bomberos de Calama", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 271, "nombre": "Cuerpo de Bomberos de Calbuco", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 18, "nombre": "Cuerpo de Bomberos de Caldera", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 5, "nombre": "Cuerpo de Bomberos de Camina", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 28, "nombre": "Cuerpo de Bomberos de Candela", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 184, "nombre": "Cuerpo de Bomberos de Canete", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 214, "nombre": "Cuerpo de Bomberos de Capitan Pastene", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 215, "nombre": "Cuerpo de Bomberos de Carahue", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 272, "nombre": "Cuerpo de Bomberos de Carretera Austral", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 45, "nombre": "Cuerpo de Bomberos de Casablanca", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 273, "nombre": "Cuerpo de Bomberos de Castro", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 46, "nombre": "Cuerpo de Bomberos de Catemu", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 132, "nombre": "Cuerpo de Bomberos de Cauquenes", "region": "Region del Maule" },
  { "idCuerpoBomberos": 275, "nombre": "Cuerpo de Bomberos de Chacao", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 274, "nombre": "Cuerpo de Bomberos de Chaiten", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 19, "nombre": "Cuerpo de Bomberos de Chanaral", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 133, "nombre": "Cuerpo de Bomberos de Chanco", "region": "Region del Maule" },
  { "idCuerpoBomberos": 99, "nombre": "Cuerpo de Bomberos de Chepica", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 216, "nombre": "Cuerpo de Bomberos de Cherquenco", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 185, "nombre": "Cuerpo de Bomberos de Chiguayante", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 304, "nombre": "Cuerpo de Bomberos de Chile Chico", "region": "Region de Aysen" },
  { "idCuerpoBomberos": 163, "nombre": "Cuerpo de Bomberos de Chillan", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 100, "nombre": "Cuerpo de Bomberos de Chimbargongo", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 217, "nombre": "Cuerpo de Bomberos de Chol Chol", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 276, "nombre": "Cuerpo de Bomberos de Chonchi", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 250, "nombre": "Cuerpo de Bomberos de Choshuenco", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 164, "nombre": "Cuerpo de Bomberos de Cobquecura", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 277, "nombre": "Cuerpo de Bomberos de Cochamo", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 305, "nombre": "Cuerpo de Bomberos de Cochrane", "region": "Region de Aysen" },
  { "idCuerpoBomberos": 101, "nombre": "Cuerpo de Bomberos de Codegua", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 165, "nombre": "Cuerpo de Bomberos de Coelemu", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 166, "nombre": "Cuerpo de Bomberos de Coihueco", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 102, "nombre": "Cuerpo de Bomberos de Coinco", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 134, "nombre": "Cuerpo de Bomberos de Colbun", "region": "Region del Maule" },
  { "idCuerpoBomberos": 76, "nombre": "Cuerpo de Bomberos de Colina", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 218, "nombre": "Cuerpo de Bomberos de Collipulli", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 103, "nombre": "Cuerpo de Bomberos de Coltauco", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 29, "nombre": "Cuerpo de Bomberos de Combarbala", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 186, "nombre": "Cuerpo de Bomberos de Concepcion", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 77, "nombre": "Cuerpo de Bomberos de Conchali-Huechuraba", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 135, "nombre": "Cuerpo de Bomberos de Constitucion", "region": "Region del Maule" },
  { "idCuerpoBomberos": 187, "nombre": "Cuerpo de Bomberos de Contulmo", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 20, "nombre": "Cuerpo de Bomberos de Copiapo", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 30, "nombre": "Cuerpo de Bomberos de Coquimbo", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 188, "nombre": "Cuerpo de Bomberos de Coronel", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 251, "nombre": "Cuerpo de Bomberos de Corral", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 278, "nombre": "Cuerpo de Bomberos de Corte Alto", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 306, "nombre": "Cuerpo de Bomberos de Coyhaique", "region": "Region de Aysen" },
  { "idCuerpoBomberos": 252, "nombre": "Cuerpo de Bomberos de Crucero", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 136, "nombre": "Cuerpo de Bomberos de Cumpeo", "region": "Region del Maule" },
  { "idCuerpoBomberos": 219, "nombre": "Cuerpo de Bomberos de Cunco", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 220, "nombre": "Cuerpo de Bomberos de Curacautin", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 78, "nombre": "Cuerpo de Bomberos de Curacavi", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 279, "nombre": "Cuerpo de Bomberos de Curaco de Velez", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 189, "nombre": "Cuerpo de Bomberos de Curanilahue", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 221, "nombre": "Cuerpo de Bomberos de Curarrehue", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 137, "nombre": "Cuerpo de Bomberos de Curepto", "region": "Region del Maule" },
  { "idCuerpoBomberos": 138, "nombre": "Cuerpo de Bomberos de Curico", "region": "Region del Maule" },
  { "idCuerpoBomberos": 280, "nombre": "Cuerpo de Bomberos de Dalcahue", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 21, "nombre": "Cuerpo de Bomberos de Diego de Almagro", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 104, "nombre": "Cuerpo de Bomberos de Donihue", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 167, "nombre": "Cuerpo de Bomberos de El Carmen", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 79, "nombre": "Cuerpo de Bomberos de El Monte", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 31, "nombre": "Cuerpo de Bomberos de El Palqui", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 47, "nombre": "Cuerpo de Bomberos de El Quisco", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 48, "nombre": "Cuerpo de Bomberos de El Tabo", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 139, "nombre": "Cuerpo de Bomberos de Empedrado", "region": "Region del Maule" },
  { "idCuerpoBomberos": 281, "nombre": "Cuerpo de Bomberos de Entre Lagos", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 222, "nombre": "Cuerpo de Bomberos de Ercilla", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 190, "nombre": "Cuerpo de Bomberos de Florida", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 223, "nombre": "Cuerpo de Bomberos de Freire", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 23, "nombre": "Cuerpo de Bomberos de Freirina", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 282, "nombre": "Cuerpo de Bomberos de Fresia", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 283, "nombre": "Cuerpo de Bomberos de Frutillar", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 284, "nombre": "Cuerpo de Bomberos de Futaleufu", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 253, "nombre": "Cuerpo de Bomberos de Futrono", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 224, "nombre": "Cuerpo de Bomberos de Galvarino", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 225, "nombre": "Cuerpo de Bomberos de Gorbea", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 105, "nombre": "Cuerpo de Bomberos de Graneros", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 49, "nombre": "Cuerpo de Bomberos de Hijuelas", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 285, "nombre": "Cuerpo de Bomberos de Hualaihue", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 140, "nombre": "Cuerpo de Bomberos de Hualane", "region": "Region del Maule" },
  { "idCuerpoBomberos": 192, "nombre": "Cuerpo de Bomberos de Hualqui", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 191, "nombre": "Cuerpo de Bomberos de Huapen", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 6, "nombre": "Cuerpo de Bomberos de Huara", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 24, "nombre": "Cuerpo de Bomberos de Huasco", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 254, "nombre": "Cuerpo de Bomberos de Huellelhue", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 193, "nombre": "Cuerpo de Bomberos de Huepil", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 32, "nombre": "Cuerpo de Bomberos de Illapel", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 22, "nombre": "Cuerpo de Bomberos de Inca de Oro", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 7, "nombre": "Cuerpo de Bomberos de Iquique", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 80, "nombre": "Cuerpo de Bomberos de Isla de Maipo", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 50, "nombre": "Cuerpo de Bomberos de Isla de Pascua", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 51, "nombre": "Cuerpo de Bomberos de La Calera", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 52, "nombre": "Cuerpo de Bomberos de La Cruz", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 106, "nombre": "Cuerpo de Bomberos de La Estrella", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 81, "nombre": "Cuerpo de Bomberos de La Granja San Ramon y La Pintana", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 33, "nombre": "Cuerpo de Bomberos de La Higuera", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 257, "nombre": "Cuerpo de Bomberos de La Lanco", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 53, "nombre": "Cuerpo de Bomberos de La Ligua", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 34, "nombre": "Cuerpo de Bomberos de La Serena", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 255, "nombre": "Cuerpo de Bomberos de La Union", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 256, "nombre": "Cuerpo de Bomberos de Lago Ranco", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 194, "nombre": "Cuerpo de Bomberos de Laja", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 107, "nombre": "Cuerpo de Bomberos de Las Cabras", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 286, "nombre": "Cuerpo de Bomberos de Las Cascadas", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 35, "nombre": "Cuerpo de Bomberos de Las Vilos", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 226, "nombre": "Cuerpo de Bomberos de Lastarria", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 227, "nombre": "Cuerpo de Bomberos de Lautaro", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 195, "nombre": "Cuerpo de Bomberos de Lebu", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 228, "nombre": "Cuerpo de Bomberos de Lican Ray", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 141, "nombre": "Cuerpo de Bomberos de Licanten", "region": "Region del Maule" },
  { "idCuerpoBomberos": 54, "nombre": "Cuerpo de Bomberos de Limache", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 143, "nombre": "Cuerpo de Bomberos de Linares", "region": "Region del Maule" },
  { "idCuerpoBomberos": 108, "nombre": "Cuerpo de Bomberos de Litueche", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 287, "nombre": "Cuerpo de Bomberos de Llanquihue", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 55, "nombre": "Cuerpo de Bomberos de Llay-Llay", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 142, "nombre": "Cuerpo de Bomberos de Llico", "region": "Region del Maule" },
  { "idCuerpoBomberos": 109, "nombre": "Cuerpo de Bomberos de Lolol", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 229, "nombre": "Cuerpo de Bomberos de Loncoche", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 144, "nombre": "Cuerpo de Bomberos de Longavi", "region": "Region del Maule" },
  { "idCuerpoBomberos": 230, "nombre": "Cuerpo de Bomberos de Lonquimay", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 196, "nombre": "Cuerpo de Bomberos de Los alamos", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 197, "nombre": "Cuerpo de Bomberos de Los angeles", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 258, "nombre": "Cuerpo de Bomberos de Los Lagos", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 288, "nombre": "Cuerpo de Bomberos de Los Muermos", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 231, "nombre": "Cuerpo de Bomberos de Los Sauces", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 198, "nombre": "Cuerpo de Bomberos de Lota", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 232, "nombre": "Cuerpo de Bomberos de Lumaco", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 110, "nombre": "Cuerpo de Bomberos de Machali", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 259, "nombre": "Cuerpo de Bomberos de Mafil", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 82, "nombre": "Cuerpo de Bomberos de Maipu", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 260, "nombre": "Cuerpo de Bomberos de Malalhue", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 111, "nombre": "Cuerpo de Bomberos de Malloa", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 112, "nombre": "Cuerpo de Bomberos de Marchigue", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 12, "nombre": "Cuerpo de Bomberos de Maria Elena", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 83, "nombre": "Cuerpo de Bomberos de Maria Pinto", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 145, "nombre": "Cuerpo de Bomberos de Maule", "region": "Region del Maule" },
  { "idCuerpoBomberos": 289, "nombre": "Cuerpo de Bomberos de Maullin", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 261, "nombre": "Cuerpo de Bomberos de Mehuin", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 13, "nombre": "Cuerpo de Bomberos de Mejillones", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 307, "nombre": "Cuerpo de Bomberos de Melinka", "region": "Region de Aysen" },
  { "idCuerpoBomberos": 84, "nombre": "Cuerpo de Bomberos de Melipilla", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 233, "nombre": "Cuerpo de Bomberos de Mellipeuco", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 146, "nombre": "Cuerpo de Bomberos de Molina", "region": "Region del Maule" },
  { "idCuerpoBomberos": 199, "nombre": "Cuerpo de Bomberos de Mulchen", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 200, "nombre": "Cuerpo de Bomberos de Nacimiento", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 113, "nombre": "Cuerpo de Bomberos de Nancagua", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 114, "nombre": "Cuerpo de Bomberos de Navidad", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 201, "nombre": "Cuerpo de Bomberos de Negrete", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 168, "nombre": "Cuerpo de Bomberos de Ninhue", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 169, "nombre": "Cuerpo de Bomberos de nipas", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 170, "nombre": "Cuerpo de Bomberos de niquen", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 56, "nombre": "Cuerpo de Bomberos de Nogales", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 234, "nombre": "Cuerpo de Bomberos de Nueva Imperial", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 86, "nombre": "Cuerpo de Bomberos de nunoa", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 115, "nombre": "Cuerpo de Bomberos de Olivar", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 57, "nombre": "Cuerpo de Bomberos de Olmue", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 290, "nombre": "Cuerpo de Bomberos de Osorno", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 36, "nombre": "Cuerpo de Bomberos de Ovalle", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 37, "nombre": "Cuerpo de Bomberos de Paihuano", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 262, "nombre": "Cuerpo de Bomberos de Paillaco", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 87, "nombre": "Cuerpo de Bomberos de Paine", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 291, "nombre": "Cuerpo de Bomberos de Palena", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 116, "nombre": "Cuerpo de Bomberos de Palmilla", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 263, "nombre": "Cuerpo de Bomberos de Panguipulli", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 58, "nombre": "Cuerpo de Bomberos de Papudo", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 117, "nombre": "Cuerpo de Bomberos de Paredones", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 147, "nombre": "Cuerpo de Bomberos de Parral", "region": "Region del Maule" },
  { "idCuerpoBomberos": 148, "nombre": "Cuerpo de Bomberos de Pelarco", "region": "Region del Maule" },
  { "idCuerpoBomberos": 149, "nombre": "Cuerpo de Bomberos de Pelluhue", "region": "Region del Maule" },
  { "idCuerpoBomberos": 171, "nombre": "Cuerpo de Bomberos de Pemuco", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 88, "nombre": "Cuerpo de Bomberos de Penaflor", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 150, "nombre": "Cuerpo de Bomberos de Pencahue", "region": "Region del Maule" },
  { "idCuerpoBomberos": 202, "nombre": "Cuerpo de Bomberos de Penco", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 118, "nombre": "Cuerpo de Bomberos de Peralillo", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 235, "nombre": "Cuerpo de Bomberos de Perquenco", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 59, "nombre": "Cuerpo de Bomberos de Petorca", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 119, "nombre": "Cuerpo de Bomberos de Peumo", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 8, "nombre": "Cuerpo de Bomberos de Pica", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 120, "nombre": "Cuerpo de Bomberos de Pichidegua", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 121, "nombre": "Cuerpo de Bomberos de Pichilemu", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 264, "nombre": "Cuerpo de Bomberos de Pichirropulli", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 172, "nombre": "Cuerpo de Bomberos de Pinto", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 236, "nombre": "Cuerpo de Bomberos de Pitrufquen", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 122, "nombre": "Cuerpo de Bomberos de Placilla", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 173, "nombre": "Cuerpo de Bomberos de Portezuelo", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 310, "nombre": "Cuerpo de Bomberos de Porvenir", "region": "Region de Magallanes y Antartica Chilena" },
  { "idCuerpoBomberos": 9, "nombre": "Cuerpo de Bomberos de Pozo Almonte", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 60, "nombre": "Cuerpo de Bomberos de Puchuncavi", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 237, "nombre": "Cuerpo de Bomberos de Pucon", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 89, "nombre": "Cuerpo de Bomberos de Puente Alto", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 308, "nombre": "Cuerpo de Bomberos de Puerto Aysen", "region": "Region de Aysen" },
  { "idCuerpoBomberos": 309, "nombre": "Cuerpo de Bomberos de Puerto Cisnes", "region": "Region de Aysen" },
  { "idCuerpoBomberos": 292, "nombre": "Cuerpo de Bomberos de Puerto Montt", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 311, "nombre": "Cuerpo de Bomberos de Puerto Natales", "region": "Region de Magallanes y Antartica Chilena" },
  { "idCuerpoBomberos": 293, "nombre": "Cuerpo de Bomberos de Puerto Octay", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 238, "nombre": "Cuerpo de Bomberos de Puerto Saavedra", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 294, "nombre": "Cuerpo de Bomberos de Puerto Varas", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 312, "nombre": "Cuerpo de Bomberos de Puerto Williams", "region": "Region de Magallanes y Antartica Chilena" },
  { "idCuerpoBomberos": 123, "nombre": "Cuerpo de Bomberos de Pumanque", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 38, "nombre": "Cuerpo de Bomberos de Punitaqui", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 313, "nombre": "Cuerpo de Bomberos de Punta Arenas", "region": "Region de Magallanes y Antartica Chilena" },
  { "idCuerpoBomberos": 295, "nombre": "Cuerpo de Bomberos de Puqueldon", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 239, "nombre": "Cuerpo de Bomberos de Puren", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 296, "nombre": "Cuerpo de Bomberos de Purranque", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 61, "nombre": "Cuerpo de Bomberos de Putaendo", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 297, "nombre": "Cuerpo de Bomberos de Queilen", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 298, "nombre": "Cuerpo de Bomberos de Quellon", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 299, "nombre": "Cuerpo de Bomberos de Quemchi", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 203, "nombre": "Cuerpo de Bomberos de Quilaco", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 90, "nombre": "Cuerpo de Bomberos de Quilicura", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 204, "nombre": "Cuerpo de Bomberos de Quilleco", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 174, "nombre": "Cuerpo de Bomberos de Quillon", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 62, "nombre": "Cuerpo de Bomberos de Quillota", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 63, "nombre": "Cuerpo de Bomberos de Quilpue", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 124, "nombre": "Cuerpo de Bomberos de Quinta de Tilcoco", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 91, "nombre": "Cuerpo de Bomberos de Quinta Normal", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 64, "nombre": "Cuerpo de Bomberos de Quintero", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 175, "nombre": "Cuerpo de Bomberos de Quirihue", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 240, "nombre": "Cuerpo de Bomberos de Quitratue", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 125, "nombre": "Cuerpo de Bomberos de Rancagua", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 151, "nombre": "Cuerpo de Bomberos de Rauco", "region": "Region del Maule" },
  { "idCuerpoBomberos": 241, "nombre": "Cuerpo de Bomberos de Renaico", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 126, "nombre": "Cuerpo de Bomberos de Rengo", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 127, "nombre": "Cuerpo de Bomberos de Requinoa", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 152, "nombre": "Cuerpo de Bomberos de Retiro", "region": "Region del Maule" },
  { "idCuerpoBomberos": 265, "nombre": "Cuerpo de Bomberos de Reumen", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 300, "nombre": "Cuerpo de Bomberos de Riachuelo", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 65, "nombre": "Cuerpo de Bomberos de Rinconada", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 266, "nombre": "Cuerpo de Bomberos de Rio Bueno", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 39, "nombre": "Cuerpo de Bomberos de Rio Hurtado", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 301, "nombre": "Cuerpo de Bomberos de Rio Negro", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 153, "nombre": "Cuerpo de Bomberos de Romeral", "region": "Region del Maule" },
  { "idCuerpoBomberos": 154, "nombre": "Cuerpo de Bomberos de Sagrada Familia", "region": "Region del Maule" },
  { "idCuerpoBomberos": 40, "nombre": "Cuerpo de Bomberos de Salamanca", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 66, "nombre": "Cuerpo de Bomberos de San Antonio", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 92, "nombre": "Cuerpo de Bomberos de San Bernardo", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 176, "nombre": "Cuerpo de Bomberos de San Carlos", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 155, "nombre": "Cuerpo de Bomberos de San Clemente", "region": "Region del Maule" },
  { "idCuerpoBomberos": 67, "nombre": "Cuerpo de Bomberos de San Esteban", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 68, "nombre": "Cuerpo de Bomberos de San Felipe", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 128, "nombre": "Cuerpo de Bomberos de San Fernando", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 129, "nombre": "Cuerpo de Bomberos de San Francisco de Mostazal", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 177, "nombre": "Cuerpo de Bomberos de San Ignacio", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 156, "nombre": "Cuerpo de Bomberos de San Javier", "region": "Region del Maule" },
  { "idCuerpoBomberos": 267, "nombre": "Cuerpo de Bomberos de San Jose De La Mariquina", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 93, "nombre": "Cuerpo de Bomberos de San Jose de Maipo", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 302, "nombre": "Cuerpo de Bomberos de San Juan De La Costa", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 178, "nombre": "Cuerpo de Bomberos de San Nicolas", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 303, "nombre": "Cuerpo de Bomberos de San Pablo", "region": "Region de Los Lagos" },
  { "idCuerpoBomberos": 14, "nombre": "Cuerpo de Bomberos de San Pedro de Atacama", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 205, "nombre": "Cuerpo de Bomberos de San Pedro de la Paz", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 94, "nombre": "Cuerpo de Bomberos de San Pedro de Melipilla", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 157, "nombre": "Cuerpo de Bomberos de San Rafael", "region": "Region del Maule" },
  { "idCuerpoBomberos": 206, "nombre": "Cuerpo de Bomberos de San Rosendo", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 130, "nombre": "Cuerpo de Bomberos de San Vicente de Tagua Tagua", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 207, "nombre": "Cuerpo de Bomberos de Santa Barbara", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 131, "nombre": "Cuerpo de Bomberos de Santa Cruz", "region": "Region del Libertador General Bernardo OHiggins" },
  { "idCuerpoBomberos": 208, "nombre": "Cuerpo de Bomberos de Santa Juana", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 69, "nombre": "Cuerpo de Bomberos de Santa Maria", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 4, "nombre": "Cuerpo de Bomberos de Santa Rosa de Huantajaya", "region": "Region de Tarapaca" },
  { "idCuerpoBomberos": 95, "nombre": "Cuerpo de Bomberos de Santiago", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 70, "nombre": "Cuerpo de Bomberos de Santo Domingo", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 15, "nombre": "Cuerpo de Bomberos de Sierra Gorda", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 96, "nombre": "Cuerpo de Bomberos de Talagante", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 158, "nombre": "Cuerpo de Bomberos de Talca", "region": "Region del Maule" },
  { "idCuerpoBomberos": 209, "nombre": "Cuerpo de Bomberos de Talcahuano", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 16, "nombre": "Cuerpo de Bomberos de Taltal", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 242, "nombre": "Cuerpo de Bomberos de Temuco", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 159, "nombre": "Cuerpo de Bomberos de Teno", "region": "Region del Maule" },
  { "idCuerpoBomberos": 243, "nombre": "Cuerpo de Bomberos de Teodoro Schmidt", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 25, "nombre": "Cuerpo de Bomberos de Tierra Amarilla", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 97, "nombre": "Cuerpo de Bomberos de Til-til", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 210, "nombre": "Cuerpo de Bomberos de Tirua", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 17, "nombre": "Cuerpo de Bomberos de Tocopilla", "region": "Region de Antofagasta" },
  { "idCuerpoBomberos": 244, "nombre": "Cuerpo de Bomberos de Tolten", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 211, "nombre": "Cuerpo de Bomberos de Tome", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 245, "nombre": "Cuerpo de Bomberos de Traiguen", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 179, "nombre": "Cuerpo de Bomberos de Trehuaco", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 268, "nombre": "Cuerpo de Bomberos de Valdivia", "region": "Region de Los Rios" },
  { "idCuerpoBomberos": 26, "nombre": "Cuerpo de Bomberos de Vallenar", "region": "Region de Atacama" },
  { "idCuerpoBomberos": 71, "nombre": "Cuerpo de Bomberos de Valparaiso", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 246, "nombre": "Cuerpo de Bomberos de Victoria", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 41, "nombre": "Cuerpo de Bomberos de Vicuna", "region": "Region de Coquimbo" },
  { "idCuerpoBomberos": 247, "nombre": "Cuerpo de Bomberos de Vilcun", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 160, "nombre": "Cuerpo de Bomberos de Villa Alegre", "region": "Region del Maule" },
  { "idCuerpoBomberos": 72, "nombre": "Cuerpo de Bomberos de Villa Alemana", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 98, "nombre": "Cuerpo de Bomberos de Villa Alhue", "region": "Region de Metropolitana" },
  { "idCuerpoBomberos": 248, "nombre": "Cuerpo de Bomberos de Villarrica", "region": "Region de La Araucania" },
  { "idCuerpoBomberos": 73, "nombre": "Cuerpo de Bomberos de Vina del Mar", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 161, "nombre": "Cuerpo de Bomberos de Yerbas Buenas", "region": "Region del Maule" },
  { "idCuerpoBomberos": 212, "nombre": "Cuerpo de Bomberos de Yumbel", "region": "Region del Biobio" },
  { "idCuerpoBomberos": 180, "nombre": "Cuerpo de Bomberos de Yungay", "region": "Region del Nuble" },
  { "idCuerpoBomberos": 74, "nombre": "Cuerpo de Bomberos de Zapallar", "region": "Region de Valparaiso" },
  { "idCuerpoBomberos": 85, "nombre": "Cuerpo de Bomberos Metropolitano Sur", "region": "Region de Metropolitana" }
];

function AuthView({ setView }) {
  const [mode, setMode] = useState('register'); // Default to register based on screenshots
  const [step, setStep] = useState(1);
  const [cuerpoSearch, setCuerpoSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    rut: '', password: '', confirmPassword: '', nombre: '', telefono: '', correo: '', cuartel: '', cuerpoBomberos: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const rutRegex = /^[0-9]+-[0-9kK]{1}$/;

    if (mode === 'register') {
      if (step === 1) {
        if (!formData.nombre) newErrors.nombre = "Obligatorio";
        if (!formData.rut) newErrors.rut = "Obligatorio";
        else if (!rutRegex.test(formData.rut)) newErrors.rut = "Inválido";
        if (!formData.correo) newErrors.correo = "Obligatorio";
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.correo.trim())) newErrors.correo = "Inválido";
      } else if (step === 2) {
        if (!formData.cuartel) newErrors.cuartel = "Obligatorio";
        if (!formData.cuerpoBomberos) newErrors.cuerpoBomberos = "Obligatorio";
      } else if (step === 3) {
        if (!formData.password) newErrors.password = "Obligatorio";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    } else {
      if (!formData.rut) newErrors.rut = "Obligatorio";
      if (!formData.password) newErrors.password = "Obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      if (mode === 'login') {
        try {
          const res = await authService.login(formData.rut, formData.password);
          console.log("Login exitoso", res);
          setView('dashboard');
        } catch (error) {
          setErrors(prev => ({ ...prev, api: error.message || "Error al iniciar sesión." }));
          console.error("Error API Login:", error);
        }
      } else {
        try {
          // Mapeo según la API /api/Companias/registrar-compania
          const userData = {
            idCuerpoBomberos: parseInt(formData.cuerpoBomberos) || 1,
            nombreCompania: formData.cuartel,
            rutUsuario: formData.rut,
            emailUsuario: formData.correo,
            password: formData.password,
            nombreBombero: formData.nombre,
            telefonoBombero: formData.telefono || "N/A",
            rol: "Administrador" // Rol por defecto al crear una compañía
          };
          
          await authService.register(userData);
          console.log("Registro exitoso en BD");
          
          // Auto-login después de registrarse (opcional, o podrías enviarlo a 'login')
          await authService.login(formData.rut, formData.password);
          setView('dashboard');
        } catch (error) {
          setErrors(prev => ({ ...prev, api: error.message || "Error al intentar crear la cuenta en la base de datos." }));
          console.error("Error API Registro:", error);
        }
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const filteredCuerpos = cuerposBomberos.filter(c => 
    c.nombre.toLowerCase().includes(cuerpoSearch.toLowerCase()) || 
    c.region.toLowerCase().includes(cuerpoSearch.toLowerCase())
  );

  const groupedCuerpos = filteredCuerpos.reduce((acc, curr) => {
    const groupName = curr.region.replace(/Region (de |del )?/i, '').toUpperCase();
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(curr);
    return acc;
  }, {});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
        <div className="bg-dark-surface rounded-xl shadow-lg border border-dark-border p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 rajdhani">Iniciar Sesión</h2>
            <p className="text-text-muted text-sm">Ingresa tus credenciales para acceder</p>
          </div>
          {errors.api && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.api}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">RUT</label>
              <input type="text" name="rut" value={formData.rut} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors" placeholder="12.345.678-9" />
              {errors.rut && <p className="text-brand-red text-xs mt-1">{errors.rut}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Contraseña</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors" placeholder="••••••••" />
              {errors.password && <p className="text-brand-red text-xs mt-1">{errors.password}</p>}
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-all mt-6 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
              Iniciar Sesión
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-text-muted">
            ¿No tienes una cuenta? <button onClick={() => { setMode('register'); setStep(1); setErrors({}); }} className="text-brand-cyan font-medium hover:text-white transition-colors">Regístrate</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-dark-bg">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] relative bg-dark-bg items-end p-12 border-r border-dark-border overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-40">
          <source src="/images/necesito_que_crees_un_video_de.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent z-10"></div>
        <div className="relative z-20 max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-4 rajdhani">Únete a nuestra red</h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Plataforma unificada para la gestión y coordinación de cuerpos de bomberos a nivel nacional.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col justify-center items-center p-8 bg-dark-bg relative overflow-x-hidden">
        <div className="w-full max-w-5xl flex justify-center">
          <div className={`grid gap-8 items-start w-full ${step === 1 ? 'xl:grid-cols-[320px_minmax(0,512px)] justify-center' : 'grid-cols-[minmax(0,512px)] justify-center'}`}>
            
            {/* Info Card Column */}
            {step === 1 && (
              <div className="hidden xl:block w-full mt-[208px]">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left font-sans shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <h3 className="text-[#2563EB] text-[1.1rem] font-semibold mb-3">Registro de Compañía</h3>
                  <div className="text-[#64748B] text-[0.95rem] leading-relaxed">
                    <p className="pb-4 border-b border-[#E2E8F0]">
                      Para registrar una nueva compañía en la plataforma debes ser el <strong className="text-[#0F172A] font-semibold">administrador</strong> o tener autorización.
                    </p>
                    <p className="pt-4">
                      Si eres voluntario y tu compañía aún no utiliza el sistema, <strong className="text-[#0F172A] font-semibold">comunica a tu superior</strong> sobre CuartelAmigo para que puedan unirse.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Column */}
            <div className="w-full flex flex-col mx-auto max-w-md xl:max-w-none">
              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-white mb-3 rajdhani">
                  {step === 1 ? 'Crear cuenta' : step === 2 ? 'Registro de Institución' : 'Seguridad de la cuenta'}
                </h2>
                <p className="text-text-muted text-lg">
                  {step === 1 ? 'Ingresa tus datos personales para comenzar' : step === 2 ? 'Paso 2 de 3: Información de la Compañía' : 'Casi listo. Configura tu contraseña para terminar.'}
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-center mb-12">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-md ${step >= 1 ? 'bg-brand-cyan text-dark-bg' : 'bg-dark-surface text-text-muted border border-dark-border'}`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-brand-cyan' : 'bg-dark-border'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-md ${step >= 2 ? 'bg-brand-cyan text-dark-bg' : 'bg-dark-surface text-text-muted border border-dark-border'}`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-brand-cyan' : 'bg-dark-border'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-md ${step >= 3 ? 'bg-brand-cyan text-dark-bg' : 'bg-dark-surface text-text-muted border border-dark-border'}`}>
                  3
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-lg relative z-20">
              {step === 1 && <h3 className="text-lg font-semibold text-white mb-6 rajdhani">Datos Personales</h3>}
              {errors.api && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.api}</div>}

            <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(e); }}>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-text-main mb-2">Nombre completo</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="Ej. Juan Pérez" />
                    {errors.nombre && <p className="text-brand-red text-sm mt-1">{errors.nombre}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-base font-medium text-text-main mb-2">RUT</label>
                      <input type="text" name="rut" value={formData.rut} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="12.345.678-9" />
                      {errors.rut && <p className="text-brand-red text-sm mt-1">{errors.rut}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium text-text-main mb-2">Teléfono</label>
                      <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="+56 9 1234 5678" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-text-main mb-2">Email</label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="juan@ejemplo.com" />
                    {errors.correo && <p className="text-brand-red text-sm mt-1">{errors.correo}</p>}
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button type="button" onClick={handleNext} className="bg-dark-bg3 border border-dark-border hover:bg-dark-bg2 text-white text-lg font-medium py-3 px-8 rounded-xl transition-colors">
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-text-main mb-2">Nombre de la compañía</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                      </div>
                      <input type="text" name="cuartel" value={formData.cuartel} onChange={handleChange} className="w-full pl-12 pr-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="Ej: Primera Compañía de Bomberos" />
                    </div>
                    {errors.cuartel && <p className="text-brand-red text-sm mt-1">{errors.cuartel}</p>}
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-base font-medium text-text-main mb-2">Cuerpo de Bomberos</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Seleccione un cuerpo..." 
                        value={cuerpoSearch}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(e) => {
                          setCuerpoSearch(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all cursor-pointer"
                      />
                    </div>
                    {errors.cuerpoBomberos && <p className="text-brand-red text-sm mt-1">{errors.cuerpoBomberos}</p>}

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-dark-bg3 border border-dark-border rounded-lg shadow-xl max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:bg-text-muted/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {Object.keys(groupedCuerpos).length === 0 ? (
                          <div className="p-5 text-base text-text-muted italic text-center">No se encontraron resultados...</div>
                        ) : (
                          Object.entries(groupedCuerpos).map(([region, cuerpos]) => (
                            <div key={region} className="mb-2">
                              <div className="sticky top-0 bg-dark-bg3/95 backdrop-blur-sm px-4 py-3 text-sm font-bold text-brand-green uppercase tracking-wider">
                                {region}
                              </div>
                              {cuerpos.map(c => (
                                <div 
                                  key={c.idCuerpoBomberos}
                                  onClick={() => {
                                    handleChange({ target: { name: 'cuerpoBomberos', value: c.idCuerpoBomberos } });
                                    setCuerpoSearch(c.nombre);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`px-5 py-3 text-base cursor-pointer transition-colors ${formData.cuerpoBomberos == c.idCuerpoBomberos ? 'bg-brand-cyan/10 text-white font-medium' : 'text-text-main hover:bg-dark-bg/80 hover:text-white'}`}
                                >
                                  {c.nombre}
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 flex justify-between">
                    <button type="button" onClick={handlePrev} className="bg-dark-bg border border-dark-border hover:bg-dark-bg3 text-text-muted text-lg font-medium py-3 px-8 rounded-xl transition-colors">
                      Atrás
                    </button>
                    <button type="button" onClick={handleNext} className="bg-dark-bg3 border border-dark-border hover:bg-dark-bg2 text-white text-lg font-medium py-3 px-8 rounded-xl transition-colors">
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-text-main mb-2">Contraseña</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="••••••••" />
                    {errors.password && <p className="text-brand-red text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-text-main mb-2">Confirmar contraseña</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-white text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="••••••••" />
                    {errors.confirmPassword && <p className="text-brand-red text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="pt-3">
                    <label className="flex items-center p-4 rounded-xl border border-dark-border bg-dark-bg2 cursor-pointer transition-colors hover:border-brand-cyan/50">
                      <input type="checkbox" className="w-5 h-5 text-brand-cyan border-dark-border rounded focus:ring-brand-cyan bg-dark-bg" required />
                      <span className="ml-4 text-base text-text-muted font-medium">Acepto los términos y condiciones de uso</span>
                    </label>
                  </div>

                  <div className="pt-8 flex justify-between">
                    <button type="button" onClick={handlePrev} className="bg-dark-bg border border-dark-border hover:bg-dark-bg3 text-text-muted text-lg font-medium py-3 px-8 rounded-xl transition-colors">
                      Atrás
                    </button>
                    <button type="submit" className="bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 text-white text-lg font-medium py-3 px-8 rounded-xl transition-all shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                      Completar Registro
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-text-muted font-medium">
            ¿Ya tienes una cuenta? <button onClick={() => { setMode('login'); setErrors({}); }} className="text-brand-cyan hover:text-white transition-colors">Inicia sesión</button>
          </div>
        </div>
        
        </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ mobileMenuOpen, setMobileMenuOpen, setView }) {
  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between" style={{ width: '100%' }}>
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setView('landing'); }}>
          <img src="/images/logo.png" className="brand-logo" alt="SYNETIX" />
        </a>
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#problema" onClick={() => setMobileMenuOpen(false)}>Problema</a>
          <a href="#solucion" onClick={() => setMobileMenuOpen(false)}>Solución</a>
          <a href="#plataforma" onClick={() => setMobileMenuOpen(false)}>Plataforma</a>
          <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</a>
        </div>
        <button onClick={() => setView('auth')} className="btn btn-primary nav-btn">Registrarse</button>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Icons.Menu />
        </button>
      </div>
    </nav>
  );
}

function Hero({ setView }) {
  return (
    <section className="hero text-center" style={{ paddingBottom: '160px' }}>
      <video autoPlay loop muted playsInline className="hero-video-bg">
        <source src="/images/b_a_b_af_ec_e_e_b_c_d_b_e_b_mp_.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay"></div>
      <div className="hero-orbs"></div>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="hero-title reveal is-visible">
          Gestión Logística Bomberil <br /><span className="highlight">Inteligente y Escalable</span>
        </h1>
        <p className="hero-subtitle reveal is-visible delay-100">
          Transformando la infraestructura digital para un futuro seguro.
          Optimiza la gestión operativa y protege a tus voluntarios con un sistema
          integral, robusto y en tiempo real diseñado exclusivamente para bomberos.
        </p>
        <div className="flex justify-center gap-4 reveal is-visible delay-200">
          <button onClick={() => setView('auth')} className="btn btn-primary">Registrarse / Ingresar <Icons.ChevronRight /></button>
          <a href="#solucion" className="btn btn-secondary">Explorar Módulos</a>
        </div>
      </div>
    </section>
  );
}

function Problema() {
  const problems = [
    { title: "Falta de Trazabilidad", desc: "La información histórica se pierde con cada cambio de mando bianual al no existir un sistema estandarizado institucional.", icon: <Icons.Traceability /> },
    { title: "Incertidumbre Operativa", desc: "El mando no tiene visibilidad inmediata del estado real de herramientas, elevando el riesgo de fallas durante emergencias.", icon: <Icons.Uncertainty /> },
    { title: "Gestión Financiera Ineficiente", desc: "Sin inventario valorizado es imposible recuperar costos ante siniestros ni planificar compras basadas en stock crítico.", icon: <Icons.Finance /> },
    { title: "Riesgo en EPP", desc: "Sin control de vencimientos de Equipos de Protección Personal, los voluntarios operan con material fuera de norma.", icon: <Icons.Shield /> }
  ];
  return (
    <section id="problema" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">La gestión manual pone en riesgo vidas y patrimonio</h2>
        <p className="section-subtitle">Identificamos los puntos críticos que amenazan la operatividad y la seguridad de tu compañía.</p>
      </div>
      <div className="grid-4">
        {problems.map((p, i) => (
          <div className="card reveal" style={{ transitionDelay: `${(i + 1) * 0.1}s` }} key={i}>
            <div className="card-icon">{p.icon}</div>
            <h3 className="card-title">{p.title}</h3>
            <p className="card-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Solucion() {
  const modules = [
    { num: "01", tag: "Logística", title: "Inventario Georreferenciado", desc: "Stock visible por ubicación exacta (Bodega, Camioneta, Carros) con micro-gestión por gavetas. Atributos dinámicos por tipo de activo." },
    { num: "02", tag: "Operatividad", title: "Monitor de Estado Semáforo", desc: "Visualiza instantáneamente el estado operativo del material: En Servicio, Dañado, En Mantención o En Custodia/Hospital." },
    { num: "03", tag: "Seguridad", title: "Módulo EPP y Ciclo de Vida", desc: "Control de asignación individual de uniformes y cascos con alertas automáticas de vencimiento según normas ANB." },
    { num: "04", tag: "Administración", title: "Gestión Financiera", desc: "Costos de mercado actualizados para reportes de siniestralidad y recuperación ágil mediante pólizas de seguros." },
    { num: "05", tag: "Terreno", title: "Cierre Post-Emergencia", desc: "Formulario rápido post-incidente para reportar daños, consumibles usados o material que quedó retenido en hospitales." },
    { num: "06", tag: "Automatización", title: "Alertas y Reposición", desc: "Notificaciones push y SMS al Capitán cuando un insumo crítico (espuma, combustible, oxígeno) cae bajo el stock mínimo." }
  ];
  return (
    <section id="solucion" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">Seis módulos. Una plataforma.</h2>
        <p className="section-subtitle">SGLB centraliza todo el ciclo logístico para que te enfoques en lo que importa: salvar vidas.</p>
      </div>
      <div className="grid-3">
        {modules.map((m, i) => (
          <div className="card module-card reveal" style={{ transitionDelay: `${(i % 3 + 1) * 0.1}s` }} key={i}>
            <div className="module-num">{m.num}</div>
            <span className="module-tag">{m.tag}</span>
            <h3 className="card-title">{m.title}</h3>
            <p className="card-desc">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Semaforo() {
  return (
    <section className="section container reveal">
      <div className="semaforo-wrap">
        <div className="grid-2 items-center">
          <div>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Sistema Semáforo</h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 3rem 0' }}>Conoce el estado exacto de cada activo en tiempo real. Decisiones rápidas, operaciones seguras.</p>
            <div className="flex-col gap-6">
              <div className="status-item"><div className="status-dot green"></div><div className="status-content"><h4>🟢 En Servicio (Verde)</h4><p>Activo operativo, inspeccionado y listo para ser desplegado en la próxima emergencia.</p></div></div>
              <div className="status-item"><div className="status-dot red"></div><div className="status-content"><h4>🔴 Dañado (Rojo)</h4><p>Material inoperativo que requiere revisión técnica urgente o ha sido dado de baja.</p></div></div>
              <div className="status-item"><div className="status-dot yellow"></div><div className="status-content"><h4>🟡 En Mantención (Amarillo)</h4><p>El activo se encuentra actualmente en proceso de reparación o mantenimiento preventivo.</p></div></div>
              <div className="status-item"><div className="status-dot orange"></div><div className="status-content"><h4>🟠 En Custodia (Naranja)</h4><p>Activo dejado temporalmente en un recinto externo, como un centro de salud u hospital.</p></div></div>
            </div>
          </div>
          <div className="text-center" style={{ padding: '2rem' }}>
            <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%', border: '1px dashed var(--border)' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
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

function DashboardPreview() {
  return (
    <section id="plataforma" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">Control Total a un Clic</h2>
        <p className="section-subtitle">Una interfaz intuitiva y oscura, optimizada para reducir la fatiga visual y resaltar lo crítico.</p>
      </div>
      <div className="dash-preview reveal delay-100">
        <div className="dash-header">
          <div className="dash-dots"><div className="dash-dot" style={{ backgroundColor: '#ff5f56' }}></div><div className="dash-dot" style={{ backgroundColor: '#ffbd2e' }}></div><div className="dash-dot" style={{ backgroundColor: '#27c93f' }}></div></div>
          <div className="dash-title">SGLB - Dashboard Operativo</div>
        </div>
        <div className="dash-body">
          <div className="dash-sidebar">
            <div className="sidebar-item active"><Icons.Dashboard /> Dashboard</div>
            <div className="sidebar-item"><Icons.Inventory /> Inventario</div>
            <div className="sidebar-item"><Icons.Shield /> EPP & Ciclo Vida</div>
            <div className="sidebar-item"><Icons.AlertTriangle /> Emergencias</div>
            <div className="sidebar-item"><Icons.Finance /> Reportes</div>
            <div className="sidebar-item" style={{ marginTop: 'auto' }}><Icons.Settings /> Configuración</div>
          </div>
          <div className="dash-main">
            <div className="dash-kpis">
              <div className="kpi-card"><div className="kpi-label">Total Activos</div><div className="kpi-val text-cyan">247</div></div>
              <div className="kpi-card"><div className="kpi-label">En Servicio</div><div className="kpi-val text-green">198</div></div>
              <div className="kpi-card"><div className="kpi-label">Alertas EPP</div><div className="kpi-val text-red">4</div></div>
              <div className="kpi-card"><div className="kpi-label">En Custodia</div><div className="kpi-val text-ember">12</div></div>
            </div>
            <div className="dash-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead><tr><th>Activo</th><th>Categoría</th><th>Ubicación</th><th>Estado</th><th>Vencimiento</th></tr></thead>
                <tbody>
                  <tr><td>Manguera Ø 45mm — Seg. A</td><td>Material HID.</td><td>Carro 1 / Gav. 3</td><td><span className="status-badge badge-green">🟢 En Servicio</span></td><td>—</td></tr>
                  <tr><td>Casco Bombero — Vol. Contreras</td><td>EPP</td><td>Bodega / Armario 2</td><td><span className="status-badge badge-yellow">🟡 Por Vencer</span></td><td>15 días</td></tr>
                  <tr><td>Motobomba HONDA GX200</td><td>Motorizado</td><td>Carro 2</td><td><span className="status-badge badge-red">🔴 Dañado</span></td><td>—</td></tr>
                  <tr><td>Kit Espuma AFFF 200L</td><td>Consumible</td><td>Bodega Principal</td><td><span className="status-badge badge-orange">🟠 En Custodia</span></td><td>—</td></tr>
                  <tr><td>Traje de Aproximación</td><td>EPP</td><td>Carro 1</td><td><span className="status-badge badge-green">🟢 En Servicio</span></td><td>—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="section container">
      <div className="section-header reveal">
        <h2 className="section-title">Implementación sin Fricción</h2>
        <p className="section-subtitle">Transición rápida y asistida desde planillas Excel a una plataforma centralizada y robusta.</p>
      </div>
      <div className="steps-container">
        <div className="step-item reveal"><div className="step-num">01</div><div className="step-content"><h3>Onboarding Guiado</h3><p>El equipo de SYNETIX realiza el levantamiento inicial de tus datos y capacita al personal clave para una adopción rápida y sin estrés.</p></div></div>
        <div className="step-item reveal delay-100"><div className="step-num">02</div><div className="step-content"><h3>Digitalización Total</h3><p>Se codifican los activos, se configuran las alertas y se georreferencian los elementos según el layout de tu cuartel y carros.</p></div></div>
        <div className="step-item reveal delay-200"><div className="step-num">03</div><div className="step-content"><h3>Control Permanente</h3><p>El sistema entra en régimen. El mando tiene visibilidad 24/7 y la información se resguarda íntegra ante los futuros cambios de oficialidad.</p></div></div>
      </div>
    </section>
  );
}

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

function BodegaCard({ name, items, icon: Icon, active, onClick, onNameChange, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  let ComputedIcon = Icon;
  if (!ComputedIcon) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cuartel') || lowerName.includes('central')) ComputedIcon = Icons.Dashboard;
    else if (lowerName.includes('oficina') || lowerName.includes('guardia')) ComputedIcon = Icons.Shield;
    else if (lowerName.includes('carro') || lowerName.includes('ambulancia') || lowerName.includes('rescate')) ComputedIcon = Icons.Truck;
    else if (lowerName.includes('casino')) ComputedIcon = Icons.Finance;
    else ComputedIcon = Icons.Inventory;
  }

  return (
    <div
      onClick={!isEditing ? onClick : undefined}
      className={`relative flex flex-col items-center justify-center p-6 pt-10 pb-8 bg-dark-surface border rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:shadow-brand-cyan/10 ${active ? 'border-brand-cyan ring-1 ring-brand-cyan bg-brand-cyan/5' : 'border-dark-border hover:border-brand-cyan/30'}`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {!isEditing && onNameChange && (
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTempName(name); }} className="text-text-muted hover:text-brand-cyan transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        )}
        {!isEditing && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-text-muted hover:text-brand-red transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        )}
        <div className="flex items-center text-xs font-semibold text-text-muted bg-dark-bg px-2 py-1 rounded-md border border-dark-border shadow-sm">
          <svg className="w-3 h-3 mr-1 text-text-muted opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2-2z"></path></svg>
          {items}
        </div>
      </div>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${active ? 'bg-brand-cyan text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'bg-dark-bg text-text-muted border border-dark-border'}`}>
        <div className="w-6 h-6 flex items-center justify-center">
          <ComputedIcon />
        </div>
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2 w-full mt-1 px-4" onClick={e => e.stopPropagation()}>
          <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-dark-bg2 border border-brand-cyan rounded text-white focus:outline-none text-center rajdhani" />
          <button onClick={(e) => { e.stopPropagation(); onNameChange(tempName); setIsEditing(false); }} className="text-brand-green hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="text-brand-red hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
      ) : (
        <h3 className={`text-base font-semibold text-center rajdhani px-4 ${active ? 'text-brand-cyan' : 'text-text-main'}`}>{name}</h3>
      )}
    </div>
  );
}

function VehiculosView() {
  const [view, setView] = useState('list'); // list, add, detail
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  // Simulated data
  const vehiculosIniciales = [
    { id: 1, nombre: 'Carro Bomba (B-1)', patente: 'AB-12-34', tipo: 'Carro Bomba (Urbano)', modelo: 'Magirus Iveco 2018', estado: 'Operativo', observaciones: [], mantenciones: [] },
    { id: 2, nombre: 'Carro Rescate (R-1)', patente: 'CD-56-78', tipo: 'Carro Rescate Pesado', modelo: 'Spartan Metro Star 2020', estado: 'Operativo', observaciones: [], mantenciones: [] },
    { id: 3, nombre: 'Carro Hazmat (H-1)', patente: 'EF-90-12', tipo: 'Carro Especialidad Hazmat', modelo: 'Rosenbauer Commander 2015', estado: 'Operativo', observaciones: [], mantenciones: [] },
    { id: 4, nombre: 'Ambulancia (S-1)', patente: 'GH-34-56', tipo: 'Ambulancia Avanzada', modelo: 'Mercedes Benz Sprinter 2021', estado: 'Operativo', observaciones: [], mantenciones: [] },
    { id: 5, nombre: 'Carro Escala (Q-1)', patente: 'IJ-78-90', tipo: 'Carro Portaescalas', modelo: 'Pierce Arrow XT 2019', estado: 'Operativo', observaciones: [], mantenciones: [] },
    { id: 6, nombre: 'Carro Aljibe (Z-1)', patente: 'KL-12-34', tipo: 'Carro Aljibe', modelo: 'Scania P410 2022', estado: 'Operativo', observaciones: [], mantenciones: [] }
  ];

  const [vehiculos, setVehiculos] = useState(vehiculosIniciales);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '', patente: '', tipo: '', estado: 'Operativo', descripcion: ''
  });

  // Detail states
  const [isEditingPatente, setIsEditingPatente] = useState(false);
  const [tempPatente, setTempPatente] = useState('');

  const [showAddObs, setShowAddObs] = useState(false);
  const [newObs, setNewObs] = useState({ titulo: '', desc: '' });

  const [showAddMant, setShowAddMant] = useState(false);
  const [newMant, setNewMant] = useState({ titulo: '', desc: '' });

  const updateVehiculo = (updatedV) => {
    setVehiculos(vehiculos.map(v => v.id === updatedV.id ? updatedV : v));
    setSelectedVehiculo(updatedV);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newV = {
      id: Date.now(),
      nombre: formData.nombre || 'Nuevo Vehículo',
      patente: formData.patente || 'S/N',
      tipo: formData.tipo || 'Desconocido',
      modelo: formData.descripcion || 'Sin descripción',
      estado: formData.estado,
      observaciones: [],
      mantenciones: []
    };
    setVehiculos([...vehiculos, newV]);
    setView('list');
    setFormData({ nombre: '', patente: '', tipo: '', estado: 'Operativo', descripcion: '' });
  };

  if (view === 'list') {
    return (
      <div className="p-8 pb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-1 rajdhani tracking-wide">Parque Automotriz</h3>
            <p className="text-sm text-text-muted">Gestiona los vehículos, carros y ambulancias de la compañía.</p>
          </div>
          <button onClick={() => setView('add')} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
            Agregar vehículo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehiculos.map((v) => (
            <div
              key={v.id}
              onClick={() => {
                setSelectedVehiculo(v);
                setView('detail');
                setIsEditingPatente(false);
                setShowAddObs(false);
                setShowAddMant(false);
              }}
              className={`bg-dark-surface border rounded-xl cursor-pointer hover:shadow-lg hover:shadow-brand-cyan/5 transition-all flex flex-col items-center justify-center pt-8 pb-4 relative group overflow-hidden ${v.id === 1 ? 'border-brand-cyan ring-1 ring-brand-cyan' : 'border-dark-border hover:border-brand-cyan/50'}`}
            >
              {v.id === 1 && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-cyan flex items-center justify-center text-dark-bg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
              )}
              <div className={`w-20 h-20 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${v.id === 1 ? 'text-brand-cyan' : 'text-text-muted'}`}>
                <Icons.Truck />
              </div>
              <div className={`w-full py-3 px-4 text-center border-t ${v.id === 1 ? 'bg-brand-cyan/5 border-brand-cyan/20' : 'border-dark-border bg-dark-bg/50'}`}>
                <div className={`text-sm font-semibold mb-1 ${v.id === 1 ? 'text-brand-cyan' : 'text-white'}`}>{v.nombre}</div>
                <div className="text-xs text-text-muted">{v.modelo} - {v.patente}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'add') {
    return (
      <div className="p-8 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('list')} className="text-text-muted hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <h3 className="text-2xl font-semibold text-white rajdhani tracking-wide">Agregar Vehículo</h3>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-8">
          <form onSubmit={handleAddSubmit}>
            {/* Foto upload mock */}
            <div className="bg-dark-bg border border-dashed border-dark-border rounded-xl p-6 flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-full bg-dark-bg2 flex items-center justify-center border border-dark-border text-text-muted">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Foto del vehículo</h4>
                <p className="text-sm text-text-muted mb-3">Sube una imagen representativa del carro o ambulancia. (PNG, JPG)</p>
                <button type="button" className="px-4 py-2 text-xs font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors">
                  Seleccionar archivo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Nombre del Vehículo (Clave)</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="Ej: Carro Bomba (B-1)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Patente</label>
                <input type="text" value={formData.patente} onChange={e => setFormData({ ...formData, patente: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="Ej: AB-12-34" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Tipo de Vehículo</label>
                <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all appearance-none">
                  <option value="">Seleccionar tipo...</option>
                  <option value="Carro Bomba (Urbano)">Carro Bomba (Urbano)</option>
                  <option value="Carro Rescate Pesado">Carro Rescate Pesado</option>
                  <option value="Ambulancia Avanzada">Ambulancia Avanzada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Estado</label>
                <select value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all appearance-none">
                  <option value="Operativo">Operativo</option>
                  <option value="En Mantención">En Mantención</option>
                  <option value="Fuera de Servicio">Fuera de Servicio</option>
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-text-main mb-1.5">Descripción / Detalles</label>
              <textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-dark-bg2 border border-dark-border text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all min-h-[100px]" placeholder="Marca, modelo, año, capacidad, etc."></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
              <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 text-sm font-medium text-text-main bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-bg3 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-medium text-dark-bg bg-brand-cyan rounded-lg hover:bg-opacity-90 transition-colors shadow-[0_4px_15px_rgba(56,189,248,0.3)]">
                Crear vehículo
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedVehiculo) {
    const v = selectedVehiculo;
    return (
      <div className="p-8 max-w-5xl mx-auto pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-dark-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="text-text-muted hover:text-white flex items-center gap-2 text-sm font-medium transition-colors border-r border-dark-border pr-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Volver
            </button>
            <h3 className="text-xl font-bold text-white rajdhani">Detalle del Vehículo</h3>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            Editar
          </button>
        </div>

        {/* Main Info Card */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3 aspect-[4/3] bg-dark-bg border border-dashed border-dark-border rounded-lg flex flex-col items-center justify-center text-text-muted relative overflow-hidden group">
            {v.foto ? (
              <img src={v.foto} alt={v.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="opacity-30 mb-4 scale-150">
                <Icons.Truck />
              </div>
            )}
            <label className={`px-3 py-1.5 text-xs font-medium bg-dark-bg3 border border-dark-border rounded-md hover:text-white transition-colors flex items-center gap-2 cursor-pointer ${v.foto ? 'absolute bottom-4 opacity-0 group-hover:opacity-100' : 'relative'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {v.foto ? 'Cambiar foto' : 'Añadir foto'}
              <input type="file" hidden accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const url = URL.createObjectURL(e.target.files[0]);
                  updateVehiculo({ ...v, foto: url });
                }
              }} />
            </label>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-full text-xs font-bold uppercase tracking-wider">Estado: {v.estado}</span>
              <span className="text-brand-cyan text-xs font-medium">Material Mayor</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 rajdhani">{v.nombre}</h2>
            <p className="text-text-muted mb-8 leading-relaxed">
              Unidad principal de ataque y extinción de incendios estructurales. Equipado con cuerpo de bomba de alta y baja presión y estanque de 4.000 litros.
            </p>

            <div className="flex gap-6">
              <div className="bg-dark-bg border border-dark-border rounded-lg px-5 py-3 flex-1">
                <div className="text-xs text-text-muted mb-1">Tipo de Vehículo</div>
                <div className="text-sm font-semibold text-white">{v.tipo}</div>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg px-5 py-3 flex-1 flex flex-col justify-center">
                <div className="text-xs text-text-muted mb-1 flex justify-between items-center">
                  Patente
                  {!isEditingPatente && (
                    <button onClick={() => { setIsEditingPatente(true); setTempPatente(v.patente); }} className="hover:text-brand-cyan transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                  )}
                </div>
                {isEditingPatente ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input autoFocus type="text" value={tempPatente} onChange={e => setTempPatente(e.target.value)} className="w-full px-2 py-1 text-sm bg-dark-bg2 border border-brand-cyan rounded text-white focus:outline-none" />
                    <button onClick={() => { updateVehiculo({ ...v, patente: tempPatente }); setIsEditingPatente(false); }} className="text-brand-green hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
                    <button onClick={() => setIsEditingPatente(false)} className="text-brand-red hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-white">{v.patente}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Columns: Observaciones & Mantenciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Observaciones */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-dark-border pb-2">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                Observaciones
              </h4>
              <button onClick={() => setShowAddObs(!showAddObs)} className="text-xs font-medium text-text-muted hover:text-brand-cyan transition-colors flex items-center gap-1">
                <span>{showAddObs ? '-' : '+'}</span> {showAddObs ? 'Cancelar' : 'Agregar'}
              </button>
            </div>
            <div className="space-y-4">
              {showAddObs && (
                <div className="bg-dark-bg2 border border-brand-cyan/50 rounded-lg p-4 mb-4">
                  <input type="text" placeholder="Título de observación" value={newObs.titulo} onChange={e => setNewObs({ ...newObs, titulo: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan" />
                  <textarea placeholder="Detalle de la observación" value={newObs.desc} onChange={e => setNewObs({ ...newObs, desc: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan min-h-[80px]"></textarea>
                  <div className="flex justify-end">
                    <button onClick={() => {
                      if (!newObs.titulo || !newObs.desc) return;
                      const d = new Date();
                      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                      updateVehiculo({ ...v, observaciones: [{ fecha: dateStr, titulo: newObs.titulo, desc: newObs.desc }, ...v.observaciones] });
                      setShowAddObs(false);
                      setNewObs({ titulo: '', desc: '' });
                    }} className="px-3 py-1.5 bg-brand-cyan text-dark-bg text-xs font-bold rounded hover:opacity-90 transition-opacity">Guardar Observación</button>
                  </div>
                </div>
              )}
              {v.observaciones.map((obs, idx) => (
                <div key={idx} className="bg-dark-surface border border-dark-border rounded-lg p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-text-muted">{obs.fecha}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => updateVehiculo({ ...v, observaciones: v.observaciones.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-brand-red"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  </div>
                  <h5 className="text-sm font-semibold text-white mb-1">{obs.titulo}</h5>
                  <p className="text-sm text-text-muted leading-relaxed">{obs.desc}</p>
                </div>
              ))}
              {v.observaciones.length === 0 && !showAddObs && (
                <div className="text-center p-6 border border-dashed border-dark-border rounded-lg text-text-muted text-sm">
                  No hay observaciones registradas.
                </div>
              )}
            </div>
          </div>

          {/* Mantenciones */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-dark-border pb-2">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Mantenciones
              </h4>
              <button onClick={() => setShowAddMant(!showAddMant)} className="text-xs font-medium text-text-muted hover:text-brand-cyan transition-colors flex items-center gap-1">
                <span>{showAddMant ? '-' : '+'}</span> {showAddMant ? 'Cancelar' : 'Agregar'}
              </button>
            </div>
            <div className="space-y-4">
              {showAddMant && (
                <div className="bg-dark-bg2 border border-brand-cyan/50 rounded-lg p-4 mb-4">
                  <input type="text" placeholder="Título de mantención" value={newMant.titulo} onChange={e => setNewMant({ ...newMant, titulo: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan" />
                  <textarea placeholder="Detalle de la mantención" value={newMant.desc} onChange={e => setNewMant({ ...newMant, desc: e.target.value })} className="w-full px-3 py-2 mb-3 bg-dark-bg border border-dark-border rounded text-sm text-white focus:outline-none focus:border-brand-cyan min-h-[80px]"></textarea>
                  <div className="flex justify-end">
                    <button onClick={() => {
                      if (!newMant.titulo || !newMant.desc) return;
                      const d = new Date();
                      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                      updateVehiculo({ ...v, mantenciones: [{ fecha: dateStr, titulo: newMant.titulo, desc: newMant.desc }, ...v.mantenciones] });
                      setShowAddMant(false);
                      setNewMant({ titulo: '', desc: '' });
                    }} className="px-3 py-1.5 bg-brand-cyan text-dark-bg text-xs font-bold rounded hover:opacity-90 transition-opacity">Guardar Mantención</button>
                  </div>
                </div>
              )}
              {v.mantenciones.map((mant, idx) => (
                <div key={idx} className="bg-dark-surface border border-dark-border rounded-lg p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-text-muted">{mant.fecha}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => updateVehiculo({ ...v, mantenciones: v.mantenciones.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-brand-red"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  </div>
                  <h5 className="text-sm font-semibold text-white mb-1">{mant.titulo}</h5>
                  <p className="text-sm text-text-muted leading-relaxed">{mant.desc}</p>
                </div>
              ))}
              {v.mantenciones.length === 0 && !showAddMant && (
                <div className="text-center p-6 border border-dashed border-dark-border rounded-lg text-text-muted text-sm">
                  No hay mantenciones registradas.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return null;
}

function EppView({ eppData, setEppData }) {
  const [activeEppTab, setActiveEppTab] = useState('asignados');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Filtrar');

  const [editingEppId, setEditingEppId] = useState(null);
  const [editEppData, setEditEppData] = useState({});
  const [confirmEppAction, setConfirmEppAction] = useState(null);

  const filteredData = eppData.filter(item => {
    const textMatch = item.equipo.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                      item.codigo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                      item.asignadoA.toLowerCase().includes(filtroTexto.toLowerCase());
    const stateMatch = filtroEstado === 'Filtrar' || item.estado === filtroEstado;
    return textMatch && stateMatch;
  });

  return (
    <div className="p-8 flex flex-col h-full fade-in">
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button 
          onClick={() => setActiveEppTab('asignados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'asignados' ? 'bg-dark-bg3 border-dark-border text-white' : 'bg-transparent border-transparent text-text-muted hover:text-white'}`}
        >
          <svg className="w-4 h-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Asignados <span className="bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full text-xs font-bold ml-1">124</span>
        </button>
        <button 
          onClick={() => setActiveEppTab('no-asignados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeEppTab === 'no-asignados' ? 'bg-dark-bg3 border-dark-border text-white' : 'bg-transparent border-transparent text-text-muted hover:text-white'}`}
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          No asignados <span className="bg-dark-bg3 text-text-muted px-2 py-0.5 rounded-full text-xs font-bold border border-dark-border ml-1">18</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o voluntario..." 
            className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <div className="w-48 relative">
          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-2 bg-dark-surface border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none text-sm pl-10"
          >
            <option value="Filtrar">Filtrar</option>
            <option value="Operativo">Operativo</option>
            <option value="En Reparación">En Reparación</option>
          </select>
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          <svg className="w-4 h-4 absolute right-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* Table */}
      <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface shadow-lg flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-xs tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">EQUIPO</th>
                <th className="px-6 py-4 font-semibold">CÓDIGO ÚNICO</th>
                <th className="px-6 py-4 font-semibold">ASIGNADO A</th>
                <th className="px-6 py-4 font-semibold">FECHA ASIGNACIÓN</th>
                <th className="px-6 py-4 font-semibold">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredData.map(item => {
                const isEditing = editingEppId === item.id;
                return (
                <tr key={item.id} className="hover:bg-dark-bg3 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-text-muted border border-dark-border shadow-[0_0_10px_rgba(0,0,0,0.2)]">
                        <Icons.Shield className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-white">{item.equipo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted font-mono text-xs">{item.codigo}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-xs">
                        {item.inicial}
                      </div>
                      <span className="text-white">{item.asignadoA}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{item.fecha}</td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select 
                        value={editEppData.estado} 
                        onChange={e => setEditEppData({...editEppData, estado: e.target.value})}
                        className="bg-dark-bg border border-brand-cyan rounded text-sm text-white focus:outline-none px-2 py-1"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="En Reparación">En Reparación</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.estado === 'Operativo' ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {item.estado}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {isEditing ? (
                         <>
                           <button 
                             onClick={() => setConfirmEppAction({ type: 'edit', item: editEppData })}
                             className="text-brand-green hover:opacity-80 transition-opacity"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                           </button>
                           <button 
                             onClick={() => setEditingEppId(null)}
                             className="text-brand-red hover:opacity-80 transition-opacity"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                           </button>
                         </>
                      ) : (
                         <>
                           <button 
                             onClick={() => {
                               setEditingEppId(item.id);
                               setEditEppData({ ...item });
                             }}
                             className="text-text-muted hover:text-brand-cyan transition-colors"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                           </button>
                           <button 
                             onClick={() => setConfirmEppAction({ type: 'delete', item })}
                             className="text-text-muted hover:text-brand-red transition-colors"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                         </>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmEppAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 max-w-sm w-full shadow-2xl fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(232,55,42,0.1)]">
              {confirmEppAction.type === 'delete' ? (
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              ) : (
                <svg className="w-8 h-8 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 rajdhani">
              {confirmEppAction.type === 'delete' ? '¿Eliminar equipo?' : '¿Guardar cambios?'}
            </h3>
            <p className="text-text-muted mb-6 text-sm">
              {confirmEppAction.type === 'delete' 
                ? `Estás a punto de eliminar "${confirmEppAction.item.equipo}". Esta acción no se puede deshacer.`
                : `Estás a punto de modificar el estado de "${confirmEppAction.item.equipo}".`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmEppAction(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 hover:bg-dark-bg2 border border-dark-border rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (confirmEppAction.type === 'delete') {
                    setEppData(eppData.filter(e => e.id !== confirmEppAction.item.id));
                  } else {
                    setEppData(eppData.map(e => e.id === confirmEppAction.item.id ? confirmEppAction.item : e));
                    setEditingEppId(null);
                  }
                  setConfirmEppAction(null);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-lg ${
                  confirmEppAction.type === 'delete' 
                    ? 'bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 shadow-[0_4px_15px_rgba(232,55,42,0.3)]' 
                    : 'bg-gradient-to-r from-brand-cyan to-blue-500 hover:opacity-90 shadow-[0_4px_15px_rgba(56,189,248,0.3)]'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignEppModal({ onClose, onAssign }) {
  const [selectedVoluntario, setSelectedVoluntario] = useState("");
  const [searchEpp, setSearchEpp] = useState("");
  const [selectedEppIds, setSelectedEppIds] = useState([]);

  const voluntarios = [
    { id: 1, nombre: "Miguel Soto", cargo: "Bombero Activo", inicial: "M" },
    { id: 2, nombre: "Juan Pérez", cargo: "Teniente 1°", inicial: "J" },
    { id: 3, nombre: "Ana Rojas", cargo: "Bombero Activo", inicial: "A" }
  ];

  const eppDisponibles = [
    { id: 101, equipo: "Casco Estructural Gallet F1", codigo: "EPP-CAS-045", tipo: "Protección Cabeza", estado: "Operativo" },
    { id: 102, equipo: "Botas de Rescate Haix", codigo: "EPP-BOT-012", tipo: "Calzado", estado: "Operativo" },
    { id: 103, equipo: "Cota Estructural Lion", codigo: "EPP-COT-089", tipo: "Vestuario", estado: "Nuevo" },
    { id: 104, equipo: "Guantes Estructurales Seiz", codigo: "EPP-GUA-112", tipo: "Protección Manos", estado: "Operativo" }
  ];

  const filteredEpp = eppDisponibles.filter(item => 
    item.equipo.toLowerCase().includes(searchEpp.toLowerCase()) || 
    item.codigo.toLowerCase().includes(searchEpp.toLowerCase())
  );

  const toggleEpp = (id) => {
    setSelectedEppIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            <h3 className="text-lg font-bold text-white rajdhani tracking-wide">Asignar Equipo de Protección Personal</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Voluntario Select */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 rajdhani tracking-wide">Seleccionar Voluntario <span className="text-brand-red">*</span></label>
            <div className="relative">
              <select 
                value={selectedVoluntario}
                onChange={(e) => setSelectedVoluntario(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none transition-all"
              >
                <option value="">Seleccionar voluntario...</option>
                {voluntarios.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre} ({v.cargo})</option>
                ))}
              </select>
              <div className="absolute left-3 top-2.5 w-7 h-7 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-xs">
                {selectedVoluntario ? voluntarios.find(v => v.id.toString() === selectedVoluntario)?.inicial : '?'}
              </div>
              <svg className="w-4 h-4 absolute right-4 top-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* EPP List */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-white rajdhani tracking-wide">Seleccionar EPP disponibles <span className="text-brand-red">*</span></label>
              <span className="text-xs text-text-muted">{selectedEppIds.length} seleccionados</span>
            </div>
            
            <div className="relative mb-3">
              <svg className="w-4 h-4 absolute left-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                className="w-full pl-9 pr-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted"
                value={searchEpp}
                onChange={(e) => setSearchEpp(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredEpp.map(item => {
                const isSelected = selectedEppIds.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleEpp(item.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-brand-cyan/10 border-brand-cyan shadow-[0_0_10px_rgba(56,189,248,0.1)]' : 'bg-dark-bg border-dark-border hover:border-brand-cyan/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-cyan border-brand-cyan' : 'border-dark-border bg-dark-bg3'}`}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-dark-bg font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${isSelected ? 'text-brand-cyan' : 'text-white'}`}>{item.equipo}</div>
                        <div className="text-xs text-text-muted font-mono">{item.codigo}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-xs text-text-muted">{item.tipo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${item.estado === 'Nuevo' ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'}`}>
                        {item.estado}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredEpp.length === 0 && (
                <div className="text-center py-6 text-text-muted text-sm border border-dashed border-dark-border rounded-lg">
                  No se encontraron EPP con ese criterio.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-between items-center shrink-0">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver
          </button>
          <button 
            disabled={!selectedVoluntario || selectedEppIds.length === 0}
            onClick={() => {
              if (selectedVoluntario && selectedEppIds.length > 0) {
                const selectedItems = selectedEppIds.map(id => eppDisponibles.find(e => e.id === id));
                const voluntario = voluntarios.find(v => v.id.toString() === selectedVoluntario);
                
                const newAssignments = selectedItems.map(item => ({
                  id: Date.now() + Math.random(),
                  equipo: item.equipo,
                  codigo: item.codigo,
                  asignadoA: voluntario.nombre,
                  inicial: voluntario.inicial,
                  fecha: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
                  estado: item.estado
                }));

                onAssign(newAssignments);
                onClose();
              }
            }}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(59,130,246,0.4)] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Asignar ({selectedEppIds.length}) Equipos
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('bodegas');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [ubicaciones, setUbicaciones] = useState([
    { id: 1, name: 'Cuartel Central', items: 12 },
    { id: 2, name: 'Bodega de Materiales', items: 8 },
    { id: 3, name: 'Carro Bomba (B-1)', items: 6 },
    { id: 4, name: 'Carro Rescate (R-1)', items: 5 },
    { id: 5, name: 'Oficina Guardia', items: 2 },
    { id: 6, name: 'Casino', items: 1 }
  ]);
  const [catalogo, setCatalogo] = useState([
    { id: 1, nombre: 'Manguera 50mm', tipo: 'Extinción', valor: '$120.000', desechable: false, serializado: true, mantencion: true },
    { id: 2, nombre: 'Guantes de Rescate', tipo: 'EPP', valor: '$25.000', desechable: true, serializado: false, mantencion: false },
    { id: 3, nombre: 'Pitón neblinero', tipo: 'Extinción', valor: '$350.000', desechable: false, serializado: true, mantencion: true },
    { id: 4, nombre: 'Mascarilla N95', tipo: 'Médico', valor: '$1.500', desechable: true, serializado: false, mantencion: false },
    { id: 5, nombre: 'Motamoladora', tipo: 'Herramientas', valor: '$850.000', desechable: false, serializado: true, mantencion: true },
  ]);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({});
  const [confirmCatAction, setConfirmCatAction] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('Todos los tipos');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialData, setNewMaterialData] = useState({ nombre: '', tipo: '', nuevoTipo: '', valor: '' });
  const [activeUbicacion, setActiveUbicacion] = useState(null);
  const [unassignedItems, setUnassignedItems] = useState([]);
  const [showAddUbicacionModal, setShowAddUbicacionModal] = useState(false);
  const [newUbicacionName, setNewUbicacionName] = useState("");
  const [showAssignEppModal, setShowAssignEppModal] = useState(false);
  const [eppData, setEppData] = useState([
    { id: 1, equipo: 'Casco Estructural Gallet F1', codigo: 'EPP-CAS-001', asignadoA: 'Juan Pérez', inicial: 'J', fecha: '12 Oct 2023', estado: 'Operativo' },
    { id: 2, equipo: 'Cota Estructural Lion', codigo: 'EPP-COT-015', asignadoA: 'María González', inicial: 'M', fecha: '05 Nov 2023', estado: 'En Reparación' },
    { id: 3, equipo: 'Botas de Rescate Haix', codigo: 'EPP-BOT-042', asignadoA: 'Carlos Soto', inicial: 'C', fecha: '10 Ene 2024', estado: 'Operativo' },
    { id: 4, equipo: 'Guantes Estructurales Seiz', codigo: 'EPP-GUA-088', asignadoA: 'Ana Rojas', inicial: 'A', fecha: '22 Feb 2024', estado: 'Operativo' },
    { id: 5, equipo: 'Esclavina (Monja)', codigo: 'EPP-ESC-102', asignadoA: 'Luis Méndez', inicial: 'L', fecha: '01 Mar 2024', estado: 'Operativo' }
  ]);

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-text-main overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-dark-border bg-dark-surface z-20 relative flex-shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mr-4 md:mr-8" onClick={() => setView('landing')}>
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/images/logo.png" className="brand-logo" alt="SYNETIX" style={{ height: '32px' }} />
          </div>
          <span className="font-bold text-white tracking-tight rajdhani text-xl hidden md:block">SGLB</span>
        </div>

        {/* Center: Navigation Icons */}
        <nav className="flex-1 flex items-center justify-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveTab('inicio')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'inicio' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Dashboard /> <span className="hidden lg:inline">Inicio</span>
          </button>
          <button onClick={() => setActiveTab('bodegas')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'bodegas' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Inventory /> <span className="hidden lg:inline">Ubicaciones Principales</span>
          </button>
          <button onClick={() => setActiveTab('vehiculos')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'vehiculos' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Truck /> <span className="hidden lg:inline">Vehículos</span>
          </button>
          <button onClick={() => setActiveTab('catalogo')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'catalogo' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Traceability /> <span className="hidden lg:inline">Catálogo</span>
          </button>
          <button onClick={() => setActiveTab('epp')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'epp' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Shield /> <span className="hidden lg:inline">EPP</span>
          </button>
          <button onClick={() => setActiveTab('emergencias')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'emergencias' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.AlertTriangle /> <span className="hidden lg:inline">Emergencias</span>
          </button>
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-4 ml-4 md:ml-8 relative">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-dark-bg3 p-1.5 rounded-lg transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-white">Nicolás C.</div>
              <div className="text-xs text-brand-cyan">Capitán</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-dark-bg2 border border-brand-cyan flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(56,189,248,0.2)]">NC</div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-xl overflow-hidden z-50">
              <button
                onClick={() => setView('landing')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-red hover:bg-dark-bg3 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-dark-bg relative" onClick={() => showProfileMenu && setShowProfileMenu(false)}>
        {/* Sub Header (Actions specific to active tab) */}
        {activeTab !== 'vehiculos' && (
          <div className="flex justify-between items-center px-8 py-4 border-b border-dark-border bg-dark-bg2 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-brand-cyan border border-dark-border shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                {activeTab === 'catalogo' ? <Icons.Traceability /> : activeTab === 'epp' ? <Icons.Shield /> : <Icons.Inventory />}
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white rajdhani tracking-wide leading-tight">
                  {activeTab === 'bodegas' ? 'Ubicaciones Principales' : activeTab === 'catalogo' ? 'Catálogo de Materiales' : activeTab === 'epp' ? 'Equipos de Protección Personal (EPP)' : 'Dashboard'}
                </h2>
                {activeTab === 'epp' && <span className="text-xs text-text-muted mt-0.5">Controla la asignación y estado del equipamiento de los voluntarios</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'bodegas' && (
                <>
                  <button onClick={() => {
                    setNewUbicacionName("");
                    setShowAddUbicacionModal(true);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors shadow-[0_4px_15px_rgba(232,55,42,0.3)]">Agregar ubicación</button>
                </>
              )}
              {activeTab === 'catalogo' && (
                <>
                  <button className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Importar catálogo
                  </button>
                  <button onClick={() => {
                    setNewMaterialData({ nombre: '', tipo: '', nuevoTipo: '', valor: '' });
                    setShowAddMaterialModal(true);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                    <span>+</span> Agregar material
                  </button>
                </>
              )}
              {activeTab === 'epp' && (
                <button onClick={() => setShowAssignEppModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                  Asignar EPP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'bodegas' && (
            <div className="flex h-full">
              {/* Main Grid area */}
              <div className="flex-1 p-8 bg-dark-bg">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-1 rajdhani tracking-wide">Ubicaciones Principales</h3>
                  <p className="text-sm text-text-muted">Selecciona una ubicación principal para ver sus subdivisiones o asignar items directamente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ubicaciones.map(ubi => (
                    <BodegaCard
                      key={ubi.id}
                      name={ubi.name}
                      items={ubi.items}
                      active={activeUbicacion === ubi.id}
                      onClick={() => setActiveUbicacion(ubi.id)}
                      onNameChange={(newName) => {
                        setUbicaciones(ubicaciones.map(u => u.id === ubi.id ? { ...u, name: newName } : u));
                      }}
                      onDelete={() => {
                        if (window.confirm(`¿Estás seguro que deseas eliminar la ubicación "${ubi.name}"?`)) {
                          setUbicaciones(ubicaciones.filter(u => u.id !== ubi.id));
                          if (activeUbicacion === ubi.id) setActiveUbicacion(null);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalogo' && (
            <div className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted" 
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                  />
                </div>
                <div className="w-64 relative">
                  <select 
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-bg3 border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none text-sm"
                  >
                    <option value="Todos los tipos">Todos los tipos</option>
                    {Array.from(new Set(catalogo.map(item => item.tipo))).map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 absolute right-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface shadow-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-base">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nombre</th>
                      <th className="px-6 py-4 font-semibold">Tipo Material</th>
                      <th className="px-6 py-4 font-semibold">Valor Unitario</th>
                      <th className="px-6 py-4 font-semibold text-center">Desechable</th>
                      <th className="px-6 py-4 font-semibold text-center">Serializado</th>
                      <th className="px-6 py-4 font-semibold text-center">Mantención</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {(filtroTipo === 'Todos los tipos' ? catalogo : catalogo.filter(item => item.tipo === filtroTipo))
                      .filter(item => item.nombre.toLowerCase().includes(filtroNombre.toLowerCase()))
                      .map(item => {
                      const isEditing = editingCatId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-dark-bg3 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{item.nombre}</td>
                          <td className="px-6 py-4"><span className="px-2.5 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-full text-xs font-medium">{item.tipo}</span></td>
                          <td className="px-6 py-4 text-text-muted">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={editCatData.valor} 
                                onChange={e => {
                                  let rawValue = e.target.value.replace(/\D/g, '');
                                  if (rawValue === '') {
                                    setEditCatData({...editCatData, valor: ''});
                                  } else {
                                    const numValue = parseInt(rawValue, 10);
                                    setEditCatData({...editCatData, valor: '$' + numValue.toLocaleString('es-CL')});
                                  }
                                }}
                                className="w-full px-2 py-1 bg-dark-bg border border-brand-cyan rounded text-sm text-white focus:outline-none"
                              />
                            ) : item.valor}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                              <input 
                                type="checkbox" 
                                checked={editCatData.desechable} 
                                onChange={e => setEditCatData({...editCatData, desechable: e.target.checked})}
                                className="accent-brand-cyan w-4 h-4 cursor-pointer"
                              />
                            ) : (item.desechable ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="checkbox" 
                                 checked={editCatData.serializado} 
                                 onChange={e => setEditCatData({...editCatData, serializado: e.target.checked})}
                                 className="accent-brand-cyan w-4 h-4 cursor-pointer"
                               />
                            ) : (item.serializado ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="checkbox" 
                                 checked={editCatData.mantencion} 
                                 onChange={e => setEditCatData({...editCatData, mantencion: e.target.checked})}
                                 className="accent-brand-cyan w-4 h-4 cursor-pointer"
                               />
                            ) : (item.mantencion ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                               <>
                                 <button 
                                   onClick={() => setConfirmCatAction({ type: 'edit', id: item.id, data: editCatData })}
                                   className="text-brand-green hover:opacity-80 transition-opacity mr-3"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                 </button>
                                 <button 
                                   onClick={() => setEditingCatId(null)}
                                   className="text-brand-red hover:opacity-80 transition-opacity"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                 </button>
                               </>
                            ) : (
                               <>
                                 <button 
                                   onClick={() => {
                                     setEditingCatId(item.id);
                                     setEditCatData({ ...item });
                                   }}
                                   className="text-text-muted hover:text-brand-cyan transition-colors mr-3"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                 </button>
                                 <button 
                                   onClick={() => setConfirmCatAction({ type: 'delete', id: item.id })}
                                   className="text-text-muted hover:text-brand-red transition-colors"
                                 >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                 </button>
                               </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'vehiculos' && (
            <VehiculosView />
          )}

          {activeTab === 'epp' && (
            <EppView eppData={eppData} setEppData={setEppData} />
          )}

          {activeTab !== 'bodegas' && activeTab !== 'catalogo' && activeTab !== 'vehiculos' && activeTab !== 'epp' && (
            <div className="p-8 flex items-center justify-center h-full">
              <p className="text-text-muted text-lg">Contenido en construcción...</p>
            </div>
          )}
        </div>

        {showAddUbicacionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Nueva Ubicación</h3>
                <button onClick={() => setShowAddUbicacionModal(false)} className="text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-text-muted mb-2">Nombre de la ubicación</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                  placeholder="Ej. Carro 3, Bodega Central..."
                  value={newUbicacionName}
                  onChange={(e) => setNewUbicacionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newUbicacionName.trim()) {
                      const newId = Math.max(0, ...ubicaciones.map(u => u.id)) + 1;
                      setUbicaciones([...ubicaciones, { id: newId, name: newUbicacionName.trim(), items: 0 }]);
                      setShowAddUbicacionModal(false);
                    }
                  }}
                />
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setShowAddUbicacionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (newUbicacionName.trim()) {
                      const newId = Math.max(0, ...ubicaciones.map(u => u.id)) + 1;
                      setUbicaciones([...ubicaciones, { id: newId, name: newUbicacionName.trim(), items: 0 }]);
                      setShowAddUbicacionModal(false);
                    }
                  }}
                  disabled={!newUbicacionName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Ubicación
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmCatAction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${confirmCatAction.type === 'edit' ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' : 'bg-brand-red/10 text-brand-red border border-brand-red/20'}`}>
                  {confirmCatAction.type === 'edit' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white rajdhani">
                  {confirmCatAction.type === 'edit' ? 'Confirmar Cambios' : 'Eliminar Registro'}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-text-muted text-sm leading-relaxed">
                  {confirmCatAction.type === 'edit' 
                    ? '¿Estás seguro que deseas guardar los cambios realizados en este material?' 
                    : '¿Estás seguro que deseas eliminar este material del catálogo? Esta acción no se puede deshacer.'}
                </p>
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setConfirmCatAction(null)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmCatAction.type === 'edit') {
                      setCatalogo(catalogo.map(item => item.id === confirmCatAction.id ? confirmCatAction.data : item));
                      setEditingCatId(null);
                    } else if (confirmCatAction.type === 'delete') {
                      setCatalogo(catalogo.filter(item => item.id !== confirmCatAction.id));
                    }
                    setConfirmCatAction(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 ${confirmCatAction.type === 'edit' ? 'bg-brand-cyan shadow-[0_4px_15px_rgba(56,189,248,0.3)]' : 'bg-brand-red shadow-[0_4px_15px_rgba(232,55,42,0.3)]'}`}
                >
                  {confirmCatAction.type === 'edit' ? 'Guardar Cambios' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddMaterialModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Nuevo Material</h3>
                <button onClick={() => setShowAddMaterialModal(false)} className="text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Nombre del material</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. Esmeril Angular..."
                    value={newMaterialData.nombre}
                    onChange={(e) => setNewMaterialData({...newMaterialData, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Tipo de material</label>
                  <select
                    value={newMaterialData.tipo}
                    onChange={(e) => setNewMaterialData({...newMaterialData, tipo: e.target.value})}
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {Array.from(new Set(catalogo.map(item => item.tipo))).map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                    <option value="otro">+ Agregar nuevo tipo...</option>
                  </select>
                </div>
                {newMaterialData.tipo === 'otro' && (
                  <div>
                    <label className="block text-sm font-medium text-brand-cyan mb-2">Nuevo tipo de material</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-dark-bg border border-brand-cyan/50 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                      placeholder="Ej. Electrónico"
                      value={newMaterialData.nuevoTipo}
                      onChange={(e) => setNewMaterialData({...newMaterialData, nuevoTipo: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Valor Unitario</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. $15.000"
                    value={newMaterialData.valor}
                    onChange={(e) => {
                      let rawValue = e.target.value.replace(/\D/g, '');
                      if (rawValue === '') {
                        setNewMaterialData({...newMaterialData, valor: ''});
                      } else {
                        const numValue = parseInt(rawValue, 10);
                        setNewMaterialData({...newMaterialData, valor: '$' + numValue.toLocaleString('es-CL')});
                      }
                    }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const finalTipo = newMaterialData.tipo === 'otro' ? newMaterialData.nuevoTipo.trim() : newMaterialData.tipo;
                    if (newMaterialData.nombre.trim() && finalTipo) {
                      const newId = Math.max(0, ...catalogo.map(c => c.id)) + 1;
                      setCatalogo([{
                        id: newId,
                        nombre: newMaterialData.nombre.trim(),
                        tipo: finalTipo,
                        valor: newMaterialData.valor || '$0',
                        desechable: false,
                        serializado: false,
                        mantencion: false
                      }, ...catalogo]);
                      setShowAddMaterialModal(false);
                      setNewMaterialData({ nombre: '', tipo: '', nuevoTipo: '', valor: '' });
                    }
                  }}
                  disabled={!newMaterialData.nombre.trim() || (!newMaterialData.tipo) || (newMaterialData.tipo === 'otro' && !newMaterialData.nuevoTipo.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(232,55,42,0.3)]"
                >
                  Agregar Material
                </button>
              </div>
            </div>
          </div>
        )}

        {showAssignEppModal && (
          <AssignEppModal 
            onClose={() => setShowAssignEppModal(false)}
            onAssign={(newAssignments) => {
              setEppData(prev => [...newAssignments, ...prev]);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  return (
    <>
      <style>{styles}</style>
      {view === 'landing' && <Landing setView={setView} />}
      {view === 'auth' && <AuthView setView={setView} />}
      {view === 'dashboard' && <Dashboard setView={setView} />}
    </>
  );
}
