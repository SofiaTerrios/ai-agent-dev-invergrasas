const EMPRESA_ACTIVA_KEY = "invergrasas_empresa_activa";

// Empresa the user last worked with, remembered per browser.
export function getEmpresaActiva() {
  try {
    return localStorage.getItem(EMPRESA_ACTIVA_KEY);
  } catch {
    return null;
  }
}

export function setEmpresaActiva(empresaId: string) {
  try {
    localStorage.setItem(EMPRESA_ACTIVA_KEY, empresaId);
  } catch {
    // Storage unavailable (private mode): the choice is just not remembered
  }
}
