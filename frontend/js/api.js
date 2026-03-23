/**
 * StudyFlow API Service
 * Handles all HTTP communication with the Java Spring Boot backend.
 * Base URL: http://localhost:8080/api
 */

const API = (() => {
  const BASE = 'http://localhost:8080/api';

  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(`${BASE}${path}`, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      if (res.status === 204) return null;
      return res.json();
    } catch (e) {
      // Fallback to localStorage if backend unavailable (demo mode)
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        console.warn('[API] Backend unavailable – using localStorage demo mode');
        return LOCAL.request(method, path, body);
      }
      throw e;
    }
  }

  return {
    // Subjects
    subjects: {
      getAll: () => request('GET', '/subjects'),
      getById: (id) => request('GET', `/subjects/${id}`),
      create: (data) => request('POST', '/subjects', data),
      update: (id, data) => request('PUT', `/subjects/${id}`, data),
      delete: (id) => request('DELETE', `/subjects/${id}`),
    },
    // Tasks
    tasks: {
      getAll: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/tasks${q ? '?' + q : ''}`);
      },
      getById: (id) => request('GET', `/tasks/${id}`),
      create: (data) => request('POST', '/tasks', data),
      update: (id, data) => request('PUT', `/tasks/${id}`, data),
      toggleComplete: (id) => request('PATCH', `/tasks/${id}/toggle`),
      delete: (id) => request('DELETE', `/tasks/${id}`),
    },
    // Study Sessions
    sessions: {
      getAll: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request('GET', `/sessions${q ? '?' + q : ''}`);
      },
      create: (data) => request('POST', '/sessions', data),
      update: (id, data) => request('PUT', `/sessions/${id}`, data),
      delete: (id) => request('DELETE', `/sessions/${id}`),
    },
    // Stats
    stats: {
      getSummary: () => request('GET', '/stats/summary'),
      getWeeklyActivity: () => request('GET', '/stats/weekly'),
    }
  };
})();


/**
 * LOCAL — localStorage demo mode
 * Used when the Java backend is not running.
 * Mirrors the same REST interface with in-memory/localStorage storage.
 */
const LOCAL = (() => {
  const KEY = 'studyflow_data';
  
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { subjects: [], tasks: [], sessions: [] };
    } catch { return { subjects: [], tasks: [], sessions: [] }; }
  }
  
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  
  function nextId(arr) {
    return arr.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1;
  }

  function request(method, path, body) {
    const data = load();
    const seg = path.replace(/^\//, '').split('/');
    const resource = seg[0];  // subjects, tasks, sessions
    const id = seg[1] ? parseInt(seg[1]) : null;
    const action = seg[2] || null;

    const arr = data[resource] || [];
    let result;

    if (method === 'GET') {
      if (id) {
        result = arr.find(x => x.id === id) || null;
      } else if (path.startsWith('/stats/summary')) {
        const tasks = data.tasks || [];
        const sessions = data.sessions || [];
        // Calculate streak: consecutive days with sessions, ending with most recent
        const dates = [...new Set(sessions.map(s => s.date))].sort();
        let streak = 0;
        if (dates.length > 0) {
          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const lastDate = dates[dates.length - 1];
          if (lastDate === today || lastDate === yesterday) {
            let current = new Date(lastDate);
            while (dates.includes(current.toISOString().slice(0, 10))) {
              streak++;
              current.setDate(current.getDate() - 1);
            }
          }
        }
        result = {
          subjects: (data.subjects || []).length,
          tasksDone: tasks.filter(t => t.completed).length,
          tasksPending: tasks.filter(t => !t.completed).length,
          streak: streak
        };
      } else if (path.startsWith('/stats/weekly')) {
        // Return last 7 days activity (sessions count)
        const sessions = data.sessions || [];
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          days.push({ date: ds, count: sessions.filter(s => s.date === ds).length });
        }
        result = days;
      } else {
        result = arr;
      }
    } else if (method === 'POST') {
      const item = { ...body, id: nextId(arr), createdAt: new Date().toISOString() };
      arr.push(item);
      data[resource] = arr;
      save(data);
      result = item;
    } else if (method === 'PUT') {
      const idx = arr.findIndex(x => x.id === id);
      if (idx !== -1) { arr[idx] = { ...arr[idx], ...body }; data[resource] = arr; save(data); result = arr[idx]; }
    } else if (method === 'PATCH' && action === 'toggle') {
      const idx = arr.findIndex(x => x.id === id);
      if (idx !== -1) {
        arr[idx].completed = !arr[idx].completed;
        arr[idx].completedAt = arr[idx].completed ? new Date().toISOString() : null;
        data[resource] = arr; save(data); result = arr[idx];
      }
    } else if (method === 'DELETE') {
      data[resource] = arr.filter(x => x.id !== id);
      save(data);
      result = null;
    }

    return Promise.resolve(result);
  }

  return { request };
})();