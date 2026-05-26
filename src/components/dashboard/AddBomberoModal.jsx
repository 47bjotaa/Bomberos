import { useState } from 'react';
import { apiFetch } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { getThemePalette } from '../../utils/themePalette';

const INITIAL_FORM_DATA = {
  nombre: '',
  rut: '',
  email: '',
  cargo: '',
};

const normalizeRut = (rut) => rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();

const isValidRut = (rut) => {
  const normalizedRut = normalizeRut(rut);
  const match = normalizedRut.match(/^(\d{1,8})-?([\dK])$/);
  if (!match) return false;

  const [, digits, verifier] = match;
  let sum = 0;
  let multiplier = 2;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += Number(digits[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const result = 11 - (sum % 11);
  const expectedVerifier = result === 11 ? '0' : result === 10 ? 'K' : String(result);
  return verifier === expectedVerifier;
};

function AddBomberoModal({ onClose, onAdded }) {
  const { theme } = useTheme();
  const palette = getThemePalette(theme);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = Object.values(formData).every(value => value.trim());

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'nombre') {
      // Allow only letters, spaces, Spanish accents, hyphens, and apostrophes
      const cleanValue = value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]/g, '');
      setFormData(current => ({ ...current, nombre: cleanValue }));
    } else if (name === 'rut') {
      let clean = value.replace(/[^0-9kK-]/g, '');
      if (clean.includes('-')) {
        const parts = clean.split('-');
        const body = parts[0].replace(/[^0-9]/g, '').slice(0, 8);
        const dv = parts.slice(1).join('').replace(/[^0-9kK]/g, '').slice(0, 1).toUpperCase();
        clean = dv ? `${body}-${dv}` : `${body}-`;
      } else {
        clean = clean.replace(/[^0-9kK]/g, '');
        if (clean.length > 8) {
          const body = clean.slice(0, -1).slice(0, 8);
          const dv = clean.slice(-1).toUpperCase();
          clean = `${body}-${dv}`;
        } else {
          clean = clean.toUpperCase();
        }
      }
      setFormData(current => ({ ...current, rut: clean }));
    } else {
      setFormData(current => ({ ...current, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || saving) return;

    const normalizedRut = normalizeRut(formData.rut);
    if (!isValidRut(normalizedRut)) {
      setError('Ingresa un RUT valido, incluyendo su digito verificador.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiFetch('/api/bomberos', {
        method: 'POST',
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          rut: normalizedRut,
          email: formData.email.trim(),
          cargo: formData.cargo.trim(),
        }),
      });
      await onAdded?.();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo agregar el bombero.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="themed-ui fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: palette.overlay }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl" style={{ background: palette.surface, borderColor: palette.border, color: palette.text }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: palette.border }}>
          <div>
            <h3 className="rajdhani text-xl font-bold">Agregar bombero</h3>
            <p className="mt-1 text-sm" style={{ color: palette.muted }}>Registra un nuevo integrante del cuartel.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-dark-bg3 hover:text-white disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Nombre <span className="text-brand-red">*</span></span>
            <input
              autoFocus
              required
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2.5 outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
              style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
              placeholder="Ej: Camila Soto"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">RUT <span className="text-brand-red">*</span></span>
              <input
                required
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                inputMode="text"
                className="w-full rounded-lg border px-4 py-2.5 outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
                style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
                placeholder="12345678-5"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Cargo <span className="text-brand-red">*</span></span>
              <select
                required
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2.5 outline-none transition-all focus:border-brand-cyan"
                style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
              >
                <option value="" disabled>Seleccionar cargo</option>
                <option value="Administrador">Administrador</option>
                <option value="Bombero">Bombero</option>
                <option value="Voluntario">Voluntario</option>
                <option value="Capitan">Capitan</option>
                <option value="Teniente">Teniente</option>
                <option value="Ayudante">Ayudante</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email <span className="text-brand-red">*</span></span>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-2.5 outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan"
              style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
              placeholder="bombero@correo.cl"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t pt-5" style={{ borderColor: palette.border }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-dark-bg3 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: palette.border }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Agregar bombero'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBomberoModal;
