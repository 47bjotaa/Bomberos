import { getAppUrl } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || "https://api.cuartelamigo.cl";
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60 * 1000;
let refreshRequest = null;

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessTokenExpiresAt');
  localStorage.removeItem('refreshTokenExpiresAt');
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    const loginUrl = getAppUrl('/login');
    if (loginUrl.startsWith('http')) {
      window.location.replace(loginUrl);
      return;
    }

    window.history.replaceState({}, '', loginUrl);
    window.dispatchEvent(new Event('popstate'));
  }
};

const saveSessionTokens = (data) => {
  if (!data?.token || !data?.refreshToken) {
    throw new Error('La respuesta de autenticacion no incluye ambos tokens.');
  }

  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);

  if (data.accessTokenExpiresAt) {
    localStorage.setItem('accessTokenExpiresAt', data.accessTokenExpiresAt);
  } else {
    localStorage.removeItem('accessTokenExpiresAt');
  }

  if (data.refreshTokenExpiresAt) {
    localStorage.setItem('refreshTokenExpiresAt', data.refreshTokenExpiresAt);
  } else {
    localStorage.removeItem('refreshTokenExpiresAt');
  }
};

const getJwtExpiration = (token) => {
  try {
    const rawPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const encodedPayload = rawPayload.padEnd(Math.ceil(rawPayload.length / 4) * 4, '=');
    const payload = JSON.parse(window.atob(encodedPayload));
    return payload.exp ? Number(payload.exp) * 1000 : null;
  } catch {
    return null;
  }
};

const getAccessTokenExpiration = (token) => {
  const storedExpiration = localStorage.getItem('accessTokenExpiresAt');
  const parsedExpiration = storedExpiration ? new Date(storedExpiration).getTime() : NaN;

  return Number.isNaN(parsedExpiration) ? getJwtExpiration(token) : parsedExpiration;
};

const accessTokenNeedsRefresh = (token) => {
  if (!token || !localStorage.getItem('refreshToken')) return false;

  const expiration = getAccessTokenExpiration(token);
  return expiration !== null && expiration <= Date.now() + ACCESS_TOKEN_REFRESH_MARGIN_MS;
};

const readApiError = async (response) => {
  let errorMessage = `Error API: ${response.status}`;
  const errorText = await response.text().catch(() => "");
  if (!errorText) return errorMessage;

  try {
    const errorData = JSON.parse(errorText);
    errorMessage = errorData.message || errorData.mensaje || errorData.title || errorData.detail || errorData.error || errorText;
    if (errorData.errors) {
      const errorDetails = Array.isArray(errorData.errors)
        ? errorData.errors
        : Object.values(errorData.errors).flat();

      if (errorDetails.length > 0) {
        errorMessage = `${errorMessage}: ${errorDetails.join(' ')}`;
      }
    }
  } catch {
    errorMessage = errorText;
  }

  return errorMessage;
};

const refreshAccessToken = async () => {
  if (refreshRequest) return refreshRequest;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    clearSession();
    redirectToLogin();
    throw new Error('La sesión expiró. Inicia sesión nuevamente.');
  }

  refreshRequest = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await response.json();
      saveSessionTokens(data);
      return data.token;
    } catch (error) {
      clearSession();
      redirectToLogin();
      throw error;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
};

export const apiFetch = async (endpoint, options = {}) => {
  const { skipAuth = false, responseType = 'auto', retryAfterRefresh = true, ...fetchOptions } = options;
  let token = localStorage.getItem('token');

  if (!skipAuth && retryAfterRefresh && accessTokenNeedsRefresh(token)) {
    token = await refreshAccessToken();
  }

  const isFormData = fetchOptions.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...fetchOptions.headers,
  };

  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && !skipAuth && retryAfterRefresh) {
      await refreshAccessToken();
      return apiFetch(endpoint, { ...options, retryAfterRefresh: false });
    }

    if (response.status === 401 && !skipAuth) {
      clearSession();
      redirectToLogin();
    }

    const error = new Error(await readApiError(response));
    error.status = response.status;
    throw error;
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// --- AUTHENTICATION ---
export const authService = {
  getSubscriptionPlans: async ({ soloActivos = true } = {}) => {
    const params = new URLSearchParams({ soloActivos: String(soloActivos) });
    return apiFetch(`/api/Suscripciones/planes?${params.toString()}`, {
      skipAuth: true,
    });
  },
  login: async (rut, password, turnstileToken) => {
    const data = await apiFetch('/api/Auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ rut, password, turnstileToken }),
    });
    if (data.token && data.refreshToken) {
      saveSessionTokens(data);
      // Guardar información del perfil para mostrar en la interfaz
      const userInfo = {
        idUsuario: data.idUsuario,
        idCompania: data.idCompania,
        idRol: data.idRol || data.rolId,
        cargo: data.cargo,
        permisos: data.permisos || [],
        email: data.email,
        suscripcion: data.suscripcion || data.Suscripcion || data.subscription || null,
        suscripcionActual: data.suscripcionActual || data.SuscripcionActual || null,
        SuscripcionActual: data.SuscripcionActual || data.suscripcionActual || null,
        codigoSuscripcion: data.codigoSuscripcion || data.CodigoSuscripcion || data.suscripcionCodigo || data.SuscripcionCodigo || data.subscriptionCode || data.SubscriptionCode || data.planCode || data.PlanCode || data.codigoPlan || data.CodigoPlan,
        codigoPlan: data.codigoPlan || data.CodigoPlan || data.planCodigo || data.PlanCodigo,
        plan: data.plan || data.Plan || null,
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
    return data;
  },
  register: async (userData) => {
    // userData expects { idCuerpoBomberos, nombreCompania, rutUsuario, emailUsuario, password, nombreBombero, telefonoBombero, rol }
    const data = await apiFetch('/api/Companias/registrar-compania', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(userData),
    });
    return data;
  },
  recoverPassword: async (rut) => {
    const data = await apiFetch('/api/Auth/recuperar-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ rut }),
    });
    return data;
  },
  resetPassword: async ({ token, passwordNueva, confirmarPasswordNueva }) => {
    const data = await apiFetch('/api/Auth/restablecer-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ token, passwordNueva, confirmarPasswordNueva }),
    });
    return data;
  },
  logout: () => {
    clearSession();
  }
};
