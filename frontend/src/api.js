const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro na requisição' }));
    throw new Error(err.error);
  }
  return res.json();
}

export const api = {
  saidas: {
    list: (status) => request(`/saidas${status ? `?status=${status}` : ''}`),
    status: () => request('/saidas/status'),
    get: (id) => request(`/saidas/${id}`),
    create: (data) => request('/saidas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/saidas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/saidas/${id}`, { method: 'DELETE' }),
  },
  documentos: {
    upload: async (saidaId, file) => {
      const form = new FormData();
      form.append('arquivo', file);
      const res = await fetch(`${BASE_URL}/saidas/${saidaId}/documentos`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro no upload' }));
        throw new Error(err.error);
      }
      return res.json();
    },
    delete: (id) => request(`/documentos/${id}`, { method: 'DELETE' }),
  },
  relatorio: (dataInicio, dataFim) => request(`/relatorio?data_inicio=${dataInicio}&data_fim=${dataFim}`),
};
