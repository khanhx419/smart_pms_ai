const API_BASE = '/api';

export const api = {
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  getLatest: async () => {
    const res = await fetch(`${API_BASE}/workflow/latest`);
    return res.json();
  },

  getBenchmarks: async () => {
    const res = await fetch(`${API_BASE}/benchmark`);
    return res.json();
  },

  runWorkflow: async (epic, governance_mode) => {
    const res = await fetch(`${API_BASE}/workflow/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epic, governance_mode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  createEventSource: () => {
    return new EventSource(`${API_BASE}/workflow/stream`);
  }
};
