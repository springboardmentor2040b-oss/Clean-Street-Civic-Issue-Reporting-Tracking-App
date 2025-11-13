export async function api(path, { method = 'GET', body, token } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed (${res.status})`)
  }
  return res.json()
}

// Admin logs fetch
export async function fetchAdminLogs(token) {
  return api('/admin-logs', { token })
}

// Recent updates (logs) for all authenticated users
export async function fetchRecentUpdates(token) {
  return api('/admin-logs/recent', { token })
}

// Comments API helpers
export async function fetchComments(complaintId, token) {
  return api(`/comments/${complaintId}`, { token })
}

export async function postComment({ complaintId, token, content, parentId, file }) {
  const fd = new FormData()
  if (content) fd.append('content', content)
  if (parentId) fd.append('parent_id', parentId)
  if (file) fd.append('photo', file)
  return api(`/comments/${complaintId}`, { method: 'POST', body: fd, token })
}

export async function reactComment(commentId, action, token) {
  return api(`/comments/${commentId}/react`, { method: 'PATCH', body: { action }, token })
}
