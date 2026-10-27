const API_URL = import.meta.env.VITE_BASE_API_URL;

export async function loginApi(formData) {
  const url = `${API_URL}/api/v1/auth/token/`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (response.status !== 200) {
    throw new Error("Usuario o contraseña incorrecta");
  }

  return await response.json();
}

// Datos del usuario logueado (endpoint protegido de Django)
export async function getMeApi(token) {
  const url = `${API_URL}/api/v1/auth/me/`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Token vencido o inválido: se rechaza para no guardar una sesión falsa
  if (!response.ok) {
    throw new Error("Sesión no válida");
  }

  return await response.json();
}

// Registro de usuarios nuevos (endpoint público de Django)
export async function registerApi(formData) {
  const url = `${API_URL}/api/v1/auth/register/`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    // Django devuelve los errores así: { campo: ["mensaje", ...] }
    let mensaje = "No se pudo crear la cuenta";
    try {
      const errores = await response.json();
      const lista = Object.values(errores).flat();
      if (lista.length > 0) mensaje = lista.join(" ");
    } catch {
      // si la respuesta no es JSON, se queda el mensaje genérico
    }
    throw new Error(mensaje);
  }

  return await response.json();
}
