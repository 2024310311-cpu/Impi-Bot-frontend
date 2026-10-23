export const REQUEST_TIMEOUT_MS = 120000;

export function checkedSearch(data) {
  const keys = ['peligro_alto', 'peligro_medio', 'peligro_bajo'];
  if (data?.consulta?.estado !== 'completada' || data?.consulta?.completa !== true ||
      !keys.every(key => Array.isArray(data?.resultados?.[key]))) {
    throw new Error('El buscador no confirmó una consulta completa. No se ha confirmado la disponibilidad de la marca.');
  }
  return data.resultados;
}

export function errorMessage(error) {
  if (error?.code === 'ECONNABORTED') return 'La consulta tardó demasiado. No se obtuvieron resultados; intenta nuevamente.';
  const detail = error?.response?.data?.detail;
  if (detail && typeof detail.message === 'string') return detail.message;
  if (Array.isArray(detail)) return 'Revisa la marca y la clase Niza (del 1 al 45).';
  if (error?.response) return 'El buscador no pudo completar la operación. Intenta nuevamente más tarde.';
  return error instanceof Error && !error?.isAxiosError ? error.message : 'No se pudo conectar con el buscador. Revisa la conexión e intenta nuevamente.';
}
