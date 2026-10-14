/*
 * API adapter for the interpreter functionality.
 *
 * The UI does not hard-code backend implementation details. If your existing
 * Django API uses different URLs, change them here only.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const interpreterApi = {
  getDashboard: () => request('/interpreter/dashboard/'),
  getRequests: () => request('/interpreter/requests/'),
  getRequest: (id) => request(`/interpreter/requests/${id}/`),
  acceptRequest: (id) => request(`/interpreter/requests/${id}/accept/`, { method: 'POST' }),
  declineRequest: (id) => request(`/interpreter/requests/${id}/decline/`, { method: 'POST' }),
  getAvailability: () => request('/interpreter/availability/'),
  updateAvailability: (payload) =>
    request('/interpreter/availability/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateLiveStatus: (available) =>
    request('/interpreter/status/', {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }),
  // inside the existing interpreterApi object / exports
  getAvailability: () => {
    return api.get('/interpreter/availability');
  },
  updateAvailability: (data) => {
    return api.put('/interpreter/availability', data);
  },
  updateLiveStatus: (isLive) => {
    return api.put('/interpreter/live-status', { isLive });
  },
};
