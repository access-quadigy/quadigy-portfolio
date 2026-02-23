const API_BASE = process.env.REACT_APP_API_BASE || '/api';

function buildUrl(path) {
  const base = API_BASE.replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${base}/${p}`;
}

function adminHeaderValues() {
  return {
    'x-admin-user': process.env.REACT_APP_ADMIN_USER || '',
    'x-admin-pass': process.env.REACT_APP_ADMIN_PASS || '',
  };
}

export async function apiFetchProjects() {
  const res = await fetch(buildUrl('projects'));
  if (!res.ok) throw new Error('Failed to fetch projects');
  return await res.json();
}

export async function apiCreateProject(payload) {
  const res = await fetch(buildUrl('projects'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaderValues(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to create project');
  return data;
}

export async function apiUpdateProject(id, payload) {
  const res = await fetch(buildUrl(`projects/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaderValues(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to update project');
  return data;
}

export async function apiDeleteProject(id) {
  const res = await fetch(buildUrl(`projects/${id}`), {
    method: 'DELETE',
    headers: {
      ...adminHeaderValues(),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to delete project');
  return data;
}
