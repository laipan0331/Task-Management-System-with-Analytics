// ===== HELPER FUNCTIONS =====
function fetchWithError(url, options = {}) {
  return fetch(url, options)
    .catch(() => Promise.reject({ error: 'network-error' }))
    .then(response => {
      if(!response.ok) {
        return response.json().then(err => Promise.reject(err));
      }
      return response.json();
    });
}

// ===== SESSION =====
export function fetchSession() {
  return fetchWithError('/api/session');
}

export function fetchLogin(username) {
  return fetchWithError('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
}

export function fetchLogout() {
  return fetchWithError('/api/session', {
    method: 'DELETE',
  });
}

// ===== USERS =====
export function fetchRegister(username, fullName, email) {
  return fetchWithError('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, fullName, email }),
  });
}

export function fetchUsers() {
  return fetchWithError('/api/users');
}

// ===== PROJECTS =====
export function fetchProjects() {
  return fetchWithError('/api/projects');
}

export function fetchCreateProject(projectData) {
  return fetchWithError('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
}

export function fetchUpdateProject(projectId, updates) {
  return fetchWithError(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export function fetchDeleteProject(projectId) {
  return fetchWithError(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });
}

// ===== TASKS =====
export function fetchTasks(filters = {}) {
  const params = new URLSearchParams();
  if(filters.projectId) params.append('projectId', filters.projectId);
  if(filters.status) params.append('status', filters.status);
  if(filters.priority) params.append('priority', filters.priority);
  
  const url = `/api/tasks${params.toString() ? '?' + params.toString() : ''}`;
  return fetchWithError(url);
}

export function fetchCreateTask(task) {
  return fetchWithError('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
}

export function fetchUpdateTask(taskId, updates) {
  return fetchWithError(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export function fetchDeleteTask(taskId) {
  return fetchWithError(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export function fetchSubtasks(taskId) {
  return fetchWithError(`/api/tasks/${taskId}/subtasks`);
}

// ===== COMMENTS =====
export function fetchComments(taskId) {
  return fetchWithError(`/api/tasks/${taskId}/comments`);
}

export function fetchCreateComment(taskId, content, parentCommentId = null) {
  return fetchWithError(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentCommentId }),
  });
}

// ===== ANALYTICS =====
export function fetchAnalytics() {
  return fetchWithError('/api/analytics/user');
}
