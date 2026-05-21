import { useState, useEffect, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { authService } from '../services/api';
import { cuerposBomberos } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { Icons } from '../components/ui/Icons';

const authPathByMode = {
  login: '/login',
  register: '/register',
  recover: '/recuperar-password',
  reset: '/restablecer-password',
};

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

function AuthView({ initialMode = 'register' }) {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cuerpoSearch, setCuerpoSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    rut: '',
    password: '',
    confirmPassword: '',
    passwordNueva: '',
    confirmarPasswordNueva: '',
    nombre: '',
    telefono: '',
    correo: '',
    cuartel: '',
    cuerpoBomberos: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const formatRut = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);

    if (digits.length <= 1) {
      return digits;
    }

    return `${digits.slice(0, -1)}-${digits.slice(-1)}`;
  };

  const navigateToMode = (nextMode) => {
    const nextPath = authPathByMode[nextMode] || '/login';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setMode(nextMode);
    setStep(1);
    setErrors({});
    setSuccessMessage('');
    setTurnstileToken('');
    setTurnstileKey(key => key + 1);
  };

  useEffect(() => {
    setMode(initialMode);
    setErrors({});
    setSuccessMessage('');
    setTurnstileToken('');
    setTurnstileKey(key => key + 1);
  }, [initialMode]);

  const validate = () => {
    const newErrors = {};
    const rutRegex = /^[0-9]+-[0-9]{1}$/;

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
    } else if (mode === 'login') {
      if (!formData.rut) newErrors.rut = "Obligatorio";
      if (!formData.password) newErrors.password = "Obligatorio";
      if (!TURNSTILE_SITE_KEY) newErrors.turnstile = "Falta configurar Turnstile.";
      else if (!turnstileToken) newErrors.turnstile = "Completa la verificación.";
    } else if (mode === 'recover') {
      if (!formData.rut) newErrors.rut = "Obligatorio";
      else if (!rutRegex.test(formData.rut)) newErrors.rut = "Inválido";
    } else if (mode === 'reset') {
      const token = new URLSearchParams(window.location.search).get("token");

      if (!token) newErrors.token = "El enlace de restablecimiento no incluye un token válido.";
      if (!formData.passwordNueva) newErrors.passwordNueva = "Obligatorio";
      if (!formData.confirmarPasswordNueva) newErrors.confirmarPasswordNueva = "Obligatorio";
      else if (formData.passwordNueva !== formData.confirmarPasswordNueva) {
        newErrors.confirmarPasswordNueva = "Las contraseñas no coinciden";
      }
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
    if (!validate()) return;

    if (mode === 'recover') {
      setIsSubmitting(true);
      setSuccessMessage('');
      try {
        await authService.recoverPassword(formData.rut);
        setSuccessMessage("Si el RUT existe, enviaremos un correo con el enlace para restablecer tu contraseña.");
      } catch (error) {
        setErrors(prev => ({ ...prev, api: error.message || "Error al solicitar la recuperación de contraseña." }));
        console.error("Error API Recuperar Password:", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      setSuccessMessage('');
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        await authService.resetPassword({
          token,
          passwordNueva: formData.passwordNueva,
          confirmarPasswordNueva: formData.confirmarPasswordNueva,
        });
        setSuccessMessage("Contraseña restablecida correctamente. Ya puedes iniciar sesión.");
        window.setTimeout(() => {
          navigateToMode('login');
        }, 1500);
      } catch (error) {
        setErrors(prev => ({ ...prev, api: error.message || "Error al restablecer la contraseña." }));
        console.error("Error API Restablecer Password:", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (validate()) {
      if (mode === 'login') {
        setIsSubmitting(true);
        try {
          const res = await authService.login(formData.rut, formData.password, turnstileToken);
          console.log("Login exitoso", res);
          window.location.href = "/dashboard";
        } catch (error) {
          setErrors(prev => ({ ...prev, api: error.message || "Error al iniciar sesión." }));
          console.error("Error API Login:", error);
          setTurnstileToken('');
          setTurnstileKey(key => key + 1);
        } finally {
          setIsSubmitting(false);
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
          window.location.href = "/dashboard";
        } catch (error) {
          setErrors(prev => ({ ...prev, api: error.message || "Error al intentar crear la cuenta en la base de datos." }));
          console.error("Error API Registro:", error);
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'rut' ? formatRut(value) : value;

    setFormData({ ...formData, [name]: nextValue });
    if (successMessage) {
      setSuccessMessage('');
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
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

  if (mode === 'recover') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 relative">
        <div className="absolute top-8 right-8">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        </div>
        <div className="bg-dark-surface rounded-xl shadow-lg border border-dark-border p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2 rajdhani">Recuperar contraseña</h2>
            <p className="text-text-muted text-sm">Ingresa el RUT de tu cuenta para recibir el enlace por correo</p>
          </div>
          {errors.api && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.api}</div>}
          {successMessage && <div className="p-3 mb-4 bg-brand-green/10 border border-brand-green/30 rounded text-brand-green text-sm text-center">{successMessage}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">RUT</label>
              <input type="text" name="rut" value={formData.rut} onChange={handleChange} inputMode="numeric" autoComplete="username" className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors" placeholder="12345678-9" />
              {errors.rut && <p className="text-brand-red text-xs mt-1">{errors.rut}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all mt-6 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-text-muted">
            <button onClick={() => navigateToMode('login')} className="text-brand-cyan font-medium hover:text-text-main transition-colors">Volver a iniciar sesión</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 relative">
        <div className="absolute top-8 right-8">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        </div>
        <div className="bg-dark-surface rounded-xl shadow-lg border border-dark-border p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2 rajdhani">Restablecer contraseña</h2>
            <p className="text-text-muted text-sm">Crea una nueva contraseña para recuperar el acceso</p>
          </div>
          {errors.token && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.token}</div>}
          {errors.api && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.api}</div>}
          {successMessage && <div className="p-3 mb-4 bg-brand-green/10 border border-brand-green/30 rounded text-brand-green text-sm text-center">{successMessage}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Nueva contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="passwordNueva" 
                  value={formData.passwordNueva} 
                  onChange={handleChange} 
                  autoComplete="new-password" 
                  className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors pr-12" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                >
                  {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.passwordNueva && <p className="text-brand-red text-xs mt-1">{errors.passwordNueva}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Confirmar nueva contraseña</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmarPasswordNueva" 
                  value={formData.confirmarPasswordNueva} 
                  onChange={handleChange} 
                  autoComplete="new-password" 
                  className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors pr-12" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                >
                  {showConfirmPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmarPasswordNueva && <p className="text-brand-red text-xs mt-1">{errors.confirmarPasswordNueva}</p>}
            </div>
            <button type="submit" disabled={isSubmitting || Boolean(successMessage)} className="w-full bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all mt-6 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
              {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-text-muted">
            <button onClick={() => navigateToMode('login')} className="text-brand-cyan font-medium hover:text-text-main transition-colors">Ir a iniciar sesión</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 relative">
        <div className="absolute top-8 right-8">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle" 
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        </div>
        <div className="bg-dark-surface rounded-xl shadow-lg border border-dark-border p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2 rajdhani">Iniciar Sesión</h2>
            <p className="text-text-muted text-sm">Ingresa tus credenciales para acceder</p>
          </div>
          {errors.api && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.api}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">RUT</label>
              <input type="text" name="rut" value={formData.rut} onChange={handleChange} inputMode="numeric" autoComplete="username" className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors" placeholder="12345678-9" />
              {errors.rut && <p className="text-brand-red text-xs mt-1">{errors.rut}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-colors pr-12" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                >
                  {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-brand-red text-xs mt-1">{errors.password}</p>}
            </div>
            <div className="text-right">
              <button type="button" onClick={() => navigateToMode('recover')} className="text-brand-cyan text-sm font-medium hover:text-text-main transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div>
              {TURNSTILE_SITE_KEY ? (
                <Turnstile
                  key={turnstileKey}
                  siteKey={TURNSTILE_SITE_KEY}
                  options={{ theme: theme === 'light' ? 'light' : 'dark' }}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setErrors(prev => ({ ...prev, turnstile: null }));
                  }}
                  onExpire={() => {
                    setTurnstileToken('');
                    setErrors(prev => ({ ...prev, turnstile: 'La verificación expiró. Inténtalo nuevamente.' }));
                  }}
                  onError={() => {
                    setTurnstileToken('');
                    setErrors(prev => ({ ...prev, turnstile: 'No se pudo completar la verificación.' }));
                  }}
                />
              ) : (
                <p className="text-brand-red text-xs">Falta configurar Turnstile.</p>
              )}
              {errors.turnstile && <p className="text-brand-red text-xs mt-1">{errors.turnstile}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all mt-6 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
              {isSubmitting ? 'Ingresando...' : 'Iniciar Sesion'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-text-muted">
            ¿No tienes una cuenta? <button onClick={() => navigateToMode('register')} className="text-brand-cyan font-medium hover:text-text-main transition-colors">Regístrate</button>
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
        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-50">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle" 
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        </div>
        <div className="w-full max-w-5xl flex justify-center">
          <div className={`grid gap-8 items-start w-full ${step === 1 ? 'xl:grid-cols-[320px_minmax(0,512px)] justify-center' : 'grid-cols-[minmax(0,512px)] justify-center'}`}>
            
            {/* Info Card Column */}
            {step === 1 && (
              <div className="hidden xl:block w-full mt-[208px]">
                <div className="bg-dark-bg2 border border-dark-border rounded-2xl p-6 text-left font-sans shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <h3 className="text-brand-cyan text-[1.1rem] font-semibold mb-3">Registro de Compañía</h3>
                  <div className="text-text-muted text-[0.95rem] leading-relaxed">
                    <p className="pb-4 border-b border-dark-border">
                      Para registrar una nueva compañía en la plataforma debes ser el <strong className="text-text-main font-semibold">administrador</strong> o tener autorización.
                    </p>
                    <p className="pt-4">
                      Si eres voluntario y tu compañía aún no utiliza el sistema, <strong className="text-text-main font-semibold">comunica a tu superior</strong> sobre CuartelAmigo para que puedan unirse.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Column */}
            <div className="w-full flex flex-col mx-auto max-w-md xl:max-w-none">
              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-[var(--color-text-main)] mb-3 rajdhani">
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
              {step === 1 && <h3 className="text-lg font-semibold text-text-main mb-6 rajdhani">Datos Personales</h3>}
              {errors.api && <div className="p-3 mb-4 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red text-sm text-center">{errors.api}</div>}

            <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(e); }}>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Nombre completo</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="Ej. Juan Pérez" />
                    {errors.nombre && <p className="text-brand-red text-sm mt-1">{errors.nombre}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">RUT</label>
                      <input type="text" name="rut" value={formData.rut} onChange={handleChange} inputMode="numeric" autoComplete="username" className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="12345678-9" />
                      {errors.rut && <p className="text-brand-red text-sm mt-1">{errors.rut}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Teléfono</label>
                      <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="+56 9 1234 5678" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Email</label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="juan@ejemplo.com" />
                    {errors.correo && <p className="text-brand-red text-sm mt-1">{errors.correo}</p>}
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button type="button" onClick={handleNext} className="bg-dark-bg3 border border-dark-border hover:bg-dark-bg2 text-text-main text-lg font-medium py-3 px-8 rounded-xl transition-colors">
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Nombre de la compañía</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                      </div>
                      <input type="text" name="cuartel" value={formData.cuartel} onChange={handleChange} className="w-full pl-12 pr-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all" placeholder="Ej: Primera Compañía de Bomberos" />
                    </div>
                    {errors.cuartel && <p className="text-brand-red text-sm mt-1">{errors.cuartel}</p>}
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Cuerpo de Bomberos</label>
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
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all cursor-pointer"
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
                                  className={`px-5 py-3 text-base cursor-pointer transition-colors ${formData.cuerpoBomberos == c.idCuerpoBomberos ? 'bg-brand-cyan/10 text-white font-medium' : 'text-text-main hover:bg-dark-bg/80 hover:text-text-main'}`}
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
                    <button type="button" onClick={handleNext} className="bg-dark-bg3 border border-dark-border hover:bg-dark-bg2 text-text-main text-lg font-medium py-3 px-8 rounded-xl transition-colors">
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all pr-12" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                      >
                        {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-brand-red text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-[var(--color-text-main)] mb-2">Confirmar contraseña</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-lg bg-dark-bg2 border border-dark-border text-inherit placeholder:text-text-muted text-base focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all pr-12" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                      >
                        {showConfirmPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                      </button>
                    </div>
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
                    <button type="submit" className="bg-gradient-to-r from-brand-red to-brand-ember hover:opacity-90 text-text-main text-lg font-medium py-3 px-8 rounded-xl transition-all shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                      Completar Registro
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-text-muted font-medium">
            ¿Ya tienes una cuenta? <button onClick={() => navigateToMode('login')} className="text-brand-cyan hover:text-text-main transition-colors">Inicia sesión</button>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

export default AuthView;
