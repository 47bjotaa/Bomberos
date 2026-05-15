const API_URL = import.meta.env.VITE_API_URL || "https://api-staging-bomberos-afabenevecetgwhf.brazilsouth-01.azurewebsites.net";

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.history.replaceState({}, '', '/login');
    window.dispatchEvent(new Event('popstate'));
  }
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      redirectToLogin();
    }

    let errorMessage = `Error API: ${response.status}`;
    const errorText = await response.text().catch(() => "");
    if (errorText) {
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.title || errorData.detail || errorData.error || errorText;
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
    }
    throw new Error(errorMessage);
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
  login: async (rut, password) => {
    const data = await apiFetch('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ rut, password }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      // Guardar información del perfil para mostrar en la interfaz
      const userInfo = {
        idUsuario: data.idUsuario,
        idCompania: data.idCompania,
        cargo: data.cargo,
        permisos: data.permisos || [],
        email: data.email
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
    return data;
  },
  register: async (userData) => {
    // userData expects { idCuerpoBomberos, nombreCompania, rutUsuario, emailUsuario, password, nombreBombero, telefonoBombero, rol }
    const data = await apiFetch('/api/Companias/registrar-compania', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  },
  logout: () => {
    clearSession();
  }
};
