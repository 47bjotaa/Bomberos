const API_URL = import.meta.env.VITE_API_URL || "https://api-staging-bomberos-afabenevecetgwhf.brazilsouth-01.azurewebsites.net";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error API: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

// --- AUTHENTICATION ---
export const authService = {
  login: async (email, password) => {
    const data = await apiFetch('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
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
    localStorage.removeItem('token');
  }
};
