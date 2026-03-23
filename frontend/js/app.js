// ─── Helpers ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── State ───────────────────────────────────────────────────────────────────
const State = {
  subjects: [],
  tasks: [],
  sessions: [],
  stats: {},
  selectedSubjectColor: '#6C63FF',
  timer: {
    interval: null,
    seconds: 25 * 60,
    totalSeconds: 25 * 60,
    running: false,
    mode: 'pomodoro',
    pomodoroCount: parseInt(localStorage.getItem('sf_pomodoros') || '0'),
  }
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const tc = $('toastContainer');
  if (!tc) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'i' };
  el.innerHTML = `<span style="font-weight:700">${icons[type] || 'i'}</span> ${msg}`;
  tc.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id) { const el = $(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $(id); if (el) el.classList.remove('open'); }

// ─── Date helpers ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function today() { return new Date().toISOString().slice(0, 10); }
function getDayOfWeek(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function navigateTo(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = $(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = {
    dashboard: 'Dashboard', subjects: 'Subjects', tasks: 'Tasks',
    schedule: 'Study Schedule', timer: 'Focus Timer', progress: 'Progress'
  };
  if ($('pageTitle')) $('pageTitle').textContent = titles[page] || page;

  const refreshMap = {
    dashboard: refreshDashboard,
    subjects: renderSubjects,
    tasks: renderTasks,
    schedule: renderSchedule,
    timer: refreshTimer,
    progress: renderProgress
  };
  if (refreshMap[page]) refreshMap[page]();

  const sidebar = $('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

// ─── Load all data ─────────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const [subjects, tasks, sessions, stats] = await Promise.all([
      API.subjects.getAll(),
      API.tasks.getAll(),
      API.sessions.getAll(),
      API.stats.getSummary(),
    ]);
    State.subjects  = subjects  || [];
    State.tasks     = tasks     || [];
    State.sessions  = sessions  || [];
    State.stats     = stats     || {};
    populateSubjectDropdowns();
    refreshDashboard();
  } catch (e) {
    toast('Could not load data: ' + e.message, 'error');
  }
}

function populateSubjectDropdowns() {
  ['taskSubject', 'taskSubjectFilter', 'sessionSubject'].forEach(id => {
    const el = $(id);
    if (!el) return;
    const val = el.value;
    while (el.options.length > 1) el.remove(1);
    State.subjects.forEach(s => el.add(new Option(s.name, s.id)));
    el.value = val;
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function refreshDashboard() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  if ($('greetingTime'))     $('greetingTime').textContent     = greet;

  const name = localStorage.getItem('sf_username') || 'Scholar';
  if ($('greetingName'))     $('greetingName').textContent     = name;
  if ($('sidebarUserName'))  $('sidebarUserName').textContent  = name;
  if ($('userAvatar'))       $('userAvatar').textContent       = name[0].toUpperCase();

  const done    = State.tasks.filter(t => t.completed).length;
  const pending = State.tasks.filter(t => !t.completed).length;
  if ($('statSubjects'))     $('statSubjects').textContent     = State.subjects.length;
  if ($('statTasksDone'))    $('statTasksDone').textContent    = done;
  if ($('statTasksPending')) $('statTasksPending').textContent = pending;
  if ($('statStreak'))       $('statStreak').textContent       = State.stats.streak || 0;

  const todayTasks = State.tasks
    .filter(t => !t.completed && (t.dueDate === today() || !t.dueDate))
    .slice(0, 5);
  const dashTasks = $('dashboardTasks');
  if (dashTasks) {
    dashTasks.innerHTML = todayTasks.length
      ? todayTasks.map(t => taskItemHTML(t, true)).join('')
      : '<div class="empty-state">No tasks due today 🎉</div>';
  }

  const upcoming = State.sessions
    .filter(s => s.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 4);
  const dashSched = $('dashboardSchedule');
  if (dashSched) {
    dashSched.innerHTML = upcoming.length
      ? upcoming.map(s => {
          const sub = State.subjects.find(x => x.id == s.subjectId);
          return `<div class="schedule-item">
            <div class="schedule-dot" style="background:${sub?.color || '#6C63FF'}"></div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${sub?.name || 'Unknown'}</div>
              <div class="schedule-time">${formatDate(s.date)} · ${s.startTime}–${s.endTime}</div>
            </div>
          </div>`;
        }).join('')
      : '<div class="empty-state">No upcoming sessions.</div>';
  }
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
function renderSubjects() {
  const grid = $('subjectsGrid');
  if (!grid) return;
  if (!State.subjects.length) {
    grid.innerHTML = '<div class="empty-state full-width">No subjects yet. Create your first subject!</div>';
    return;
  }
  grid.innerHTML = State.subjects.map(s => {
    const subTasks = State.tasks.filter(t => t.subjectId == s.id);
    const done     = subTasks.filter(t => t.completed).length;
    const pct      = subTasks.length ? Math.round((done / subTasks.length) * 100) : 0;
    return `<div class="subject-card" style="--subject-color:${s.color || '#6C63FF'}">
      <div class="subject-name">${s.name}</div>
      <div class="subject-desc">${s.description || 'No description'}</div>
      <div class="subject-stats">
        <div class="subject-stat"><strong>${subTasks.length}</strong>Tasks</div>
        <div class="subject-stat"><strong>${done}</strong>Done</div>
      </div>
      <div class="subject-progress-bar">
        <div class="subject-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="subject-actions">
        <button class="btn-secondary btn-sm" onclick="editSubject(${s.id})">Edit</button>
        <button class="btn-secondary btn-sm btn-danger" onclick="deleteSubject(${s.id})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function saveSubject() {
  const id   = $('subjectId').value;
  const name = $('subjectName').value.trim();
  if (!name) { toast('Subject name is required', 'error'); return; }
  const payload = { name, description: $('subjectDesc').value.trim(), color: State.selectedSubjectColor };
  try {
    if (id) {
      const updated = await API.subjects.update(parseInt(id), payload);
      const idx = State.subjects.findIndex(s => s.id == id);
      if (idx !== -1) State.subjects[idx] = updated;
      toast('Subject updated!', 'success');
    } else {
      const created = await API.subjects.create(payload);
      State.subjects.push(created);
      toast('Subject created!', 'success');
    }
    closeModal('subjectModal');
    populateSubjectDropdowns();
    renderSubjects();
    refreshDashboard();
  } catch (e) { toast(e.message, 'error'); }
}

function editSubject(id) {
  const s = State.subjects.find(x => x.id === id);
  if (!s) return;
  $('subjectId').value   = s.id;
  $('subjectName').value = s.name;
  $('subjectDesc').value = s.description || '';
  State.selectedSubjectColor = s.color || '#6C63FF';
  $$('.color-opt').forEach(el => el.classList.toggle('selected', el.dataset.color === State.selectedSubjectColor));
  $('subjectModalTitle').textContent = 'Edit Subject';
  openModal('subjectModal');
}

async function deleteSubject(id) {
  if (!confirm('Delete this subject?')) return;
  try {
    await API.subjects.delete(id);
    State.subjects = State.subjects.filter(s => s.id !== id);
    populateSubjectDropdowns();
    renderSubjects();
    toast('Subject deleted', 'info');
  } catch (e) { toast(e.message, 'error'); }
}

function openAddSubject() {
  $('subjectId').value   = '';
  $('subjectName').value = '';
  $('subjectDesc').value = '';
  State.selectedSubjectColor = '#6C63FF';
  $$('.color-opt').forEach(el => el.classList.toggle('selected', el.dataset.color === '#6C63FF'));
  $('subjectModalTitle').textContent = 'Add Subject';
  openModal('subjectModal');
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
function taskItemHTML(task, compact = false) {
  const sub      = State.subjects.find(s => s.id == task.subjectId);
  const subColor = sub?.color || '#6C63FF';
  return `<div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">${task.completed ? '✓' : ''}</div>
    <div class="task-body">
      <div class="task-title-text">${task.title}</div>
      <div class="task-meta">
        ${sub ? `<span class="task-subject-tag" style="background:${subColor}22;color:${subColor}">${sub.name}</span>` : ''}
        ${task.dueDate ? `<span class="task-due">📅 ${formatDate(task.dueDate)}</span>` : ''}
        <span class="priority-badge priority-${task.priority || 'MEDIUM'}">${task.priority || 'MEDIUM'}</span>
      </div>
    </div>
    ${!compact ? `<div class="task-actions">
      <button class="btn-secondary btn-sm" onclick="editTask(${task.id})">Edit</button>
      <button class="btn-secondary btn-sm btn-danger" onclick="deleteTask(${task.id})">✕</button>
    </div>` : ''}
  </div>`;
}

function renderTasks() {
  const container     = $('tasksContainer');
  if (!container) return;
  const statusFilter  = $('taskFilter')?.value || 'all';
  const subjectFilter = $('taskSubjectFilter')?.value || 'all';
  let filtered = [...State.tasks];
  if (statusFilter  === 'pending')   filtered = filtered.filter(t => !t.completed);
  if (statusFilter  === 'completed') filtered = filtered.filter(t => t.completed);
  if (subjectFilter !== 'all')       filtered = filtered.filter(t => String(t.subjectId) === subjectFilter);
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate)      return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });
  container.innerHTML = filtered.length
    ? filtered.map(t => taskItemHTML(t)).join('')
    : '<div class="empty-state">No tasks found.</div>';
}

async function toggleTask(id) {
  try {
    const updated = await API.tasks.toggleComplete(id);
    const idx = State.tasks.findIndex(t => t.id === id);
    if (idx !== -1) State.tasks[idx] = updated;
    renderTasks();
    refreshDashboard();
    toast(updated.completed ? 'Task completed! 🎉' : 'Task reopened', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveTask() {
  const id    = $('taskId').value;
  const title = $('taskTitle').value.trim();
  if (!title) { toast('Task title is required', 'error'); return; }
  const subjectValue = $('taskSubject').value;
  if (!subjectValue) { toast('Subject is required', 'error'); return; }
  const payload = {
    title,
    subjectId: parseInt(subjectValue),
    dueDate:   $('taskDue').value || null,
    priority:  $('taskPriority').value,
    notes:     $('taskNotes').value.trim()
  };
  try {
    if (id) {
      const updated = await API.tasks.update(parseInt(id), payload);
      const idx = State.tasks.findIndex(t => t.id == id);
      if (idx !== -1) State.tasks[idx] = updated;
      toast('Task updated!', 'success');
    } else {
      const created = await API.tasks.create(payload);
      State.tasks.push(created);
      toast('Task added!', 'success');
    }
    closeModal('taskModal');
    renderTasks();
    refreshDashboard();
    refreshTimerTaskSelect();
  } catch (e) { toast(e.message, 'error'); }
}

function editTask(id) {
  const t = State.tasks.find(x => x.id === id);
  if (!t) return;
  $('taskId').value       = t.id;
  $('taskTitle').value    = t.title;
  $('taskSubject').value  = t.subjectId || '';
  $('taskDue').value      = t.dueDate   || '';
  $('taskPriority').value = t.priority  || 'MEDIUM';
  $('taskNotes').value    = t.notes     || '';
  $('taskModalTitle').textContent = 'Edit Task';
  openModal('taskModal');
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await API.tasks.delete(id);
    State.tasks = State.tasks.filter(t => t.id !== id);
    renderTasks();
    refreshDashboard();
    toast('Task deleted', 'info');
  } catch (e) { toast(e.message, 'error'); }
}

function openAddTask() {
  $('taskId').value       = '';
  $('taskTitle').value    = '';
  $('taskSubject').value  = '';
  $('taskDue').value      = today();
  $('taskPriority').value = 'MEDIUM';
  $('taskNotes').value    = '';
  $('taskModalTitle').textContent = 'Add Task';
  openModal('taskModal');
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
function renderSchedule() {
  const grid = $('weekGrid');
  if (!grid) return;
  const days      = [];
  const now       = new Date();
  const dayOfWeek = now.getDay();
  const monday    = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const todayStr = today();
  grid.innerHTML = days.map(d => {
    const ds           = d.toISOString().slice(0, 10);
    const dayName      = d.toLocaleDateString('en', { weekday: 'short' });
    const dayNum       = d.getDate();
    const isToday      = ds === todayStr;
    const daySessions  = State.sessions
      .filter(s => s.date === ds)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const sessionsHTML = daySessions.map(s => {
      const sub   = State.subjects.find(x => x.id == s.subjectId);
      const color = sub?.color || '#6C63FF';
      return `<div class="session-block" style="border-left-color:${color};background:${color}18" onclick="editSession(${s.id})">
        <div class="session-time">${s.startTime}–${s.endTime}</div>
        <div class="session-name">${sub?.name || 'Study'}</div>
      </div>`;
    }).join('');
    return `<div class="day-col ${isToday ? 'today' : ''}">
      <div class="day-header">
        <div class="day-name">${dayName}</div>
        <div class="day-date">${dayNum}</div>
      </div>
      <div class="day-sessions">${sessionsHTML}</div>
    </div>`;
  }).join('');
}

async function saveSession() {
  const id        = $('sessionId').value;
  const subjectId = $('sessionSubject').value;
  const date      = $('sessionDate').value;
  const startTime = $('sessionStart').value;
  const endTime   = $('sessionEnd').value;
  if (!subjectId || !date || !startTime || !endTime) {
    toast('Please fill all required fields', 'error'); return;
  }
  if (startTime >= endTime) { toast('End time must be after start time', 'error'); return; }
  const payload = {
    subjectId: parseInt(subjectId), date, startTime, endTime,
    notes: $('sessionNotes').value.trim()
  };
  try {
    if (id) {
      const updated = await API.sessions.update(parseInt(id), payload);
      const idx = State.sessions.findIndex(s => s.id == id);
      if (idx !== -1) State.sessions[idx] = updated;
      toast('Session updated!', 'success');
    } else {
      const created = await API.sessions.create(payload);
      State.sessions.push(created);
      toast('Session added!', 'success');
    }
    closeModal('sessionModal');
    renderSchedule();
    refreshDashboard();
  } catch (e) { toast(e.message, 'error'); }
}

function editSession(id) {
  const s = State.sessions.find(x => x.id === id);
  if (!s) return;
  $('sessionId').value      = s.id;
  $('sessionSubject').value = s.subjectId;
  $('sessionDate').value    = s.date;
  $('sessionStart').value   = s.startTime;
  $('sessionEnd').value     = s.endTime;
  $('sessionNotes').value   = s.notes || '';
  $('sessionModalTitle').textContent = 'Edit Session';
  openModal('sessionModal');
}

function openAddSession() {
  $('sessionId').value      = '';
  $('sessionSubject').value = '';
  $('sessionDate').value    = today();
  $('sessionStart').value   = '';
  $('sessionEnd').value     = '';
  $('sessionNotes').value   = '';
  $('sessionModalTitle').textContent = 'Add Study Session';
  openModal('sessionModal');
}

// ─── Timer ────────────────────────────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 88;

function refreshTimer() {
  if ($('pomodoroCount')) $('pomodoroCount').textContent = State.timer.pomodoroCount;
  refreshTimerTaskSelect();
  updateTimerDisplay();
}

function refreshTimerTaskSelect() {
  const sel = $('timerTaskSelect');
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  State.tasks.filter(t => !t.completed).forEach(t => sel.add(new Option(t.title, t.id)));
}

function updateTimerDisplay() {
  const t = State.timer;
  const m = Math.floor(t.seconds / 60).toString().padStart(2, '0');
  const s = (t.seconds % 60).toString().padStart(2, '0');
  if ($('timerTime')) $('timerTime').textContent = `${m}:${s}`;
  const ring = $('ringProgress');
  if (ring) {
    const progress = (t.totalSeconds - t.seconds) / t.totalSeconds;
    ring.style.strokeDasharray  = CIRCUMFERENCE;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  }
}

function setTimerMode(minutes, modeEl) {
  if (State.timer.running) stopTimer();
  $$('.mode-btn').forEach(b => b.classList.remove('active'));
  modeEl.classList.add('active');
  State.timer.seconds      = minutes * 60;
  State.timer.totalSeconds = minutes * 60;
  updateTimerDisplay();
}

function startTimer() {
  if (State.timer.running) { stopTimer(); return; }
  State.timer.running = true;
  if ($('timerStart')) $('timerStart').textContent = '⏸ Pause';
  State.timer.interval = setInterval(() => {
    State.timer.seconds--;
    updateTimerDisplay();
    if (State.timer.seconds <= 0) { stopTimer(); onTimerEnd(); }
  }, 1000);
}

function stopTimer() {
  clearInterval(State.timer.interval);
  State.timer.running = false;
  if ($('timerStart')) $('timerStart').textContent = '▶ Start';
}

function resetTimer() {
  stopTimer();
  State.timer.seconds = State.timer.totalSeconds;
  updateTimerDisplay();
}

function onTimerEnd() {
  if (State.timer.mode === 'pomodoro') {
    State.timer.pomodoroCount++;
    localStorage.setItem('sf_pomodoros', State.timer.pomodoroCount);
    if ($('pomodoroCount')) $('pomodoroCount').textContent = State.timer.pomodoroCount;
    toast('🍅 Pomodoro complete! Take a break.', 'success');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('StudyFlow', { body: 'Pomodoro complete!' });
    }
  } else {
    toast('⏰ Break over! Back to work.', 'info');
  }
  resetTimer();
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function renderProgress() {
  const pb = $('subjectProgress');
  if (pb) {
    pb.innerHTML = !State.subjects.length
      ? '<div class="empty-state">Add subjects to track progress</div>'
      : State.subjects.map(s => {
          const subTasks = State.tasks.filter(t => t.subjectId == s.id);
          const done     = subTasks.filter(t => t.completed).length;
          const pct      = subTasks.length ? Math.round((done / subTasks.length) * 100) : 0;
          return `<div class="progress-item">
            <div class="progress-info">
              <span>${s.name}</span>
              <span class="progress-pct">${done}/${subTasks.length} · ${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${s.color || 'var(--accent)'}"></div>
            </div>
          </div>`;
        }).join('');
  }
  renderWeeklyChart();
}

async function renderWeeklyChart() {
  const chart = $('weeklyChart');
  if (!chart) return;
  try {
    const data = await API.stats.getWeeklyActivity();
    const max  = Math.max(...data.map(d => d.count), 1);
    chart.innerHTML = data.map(d => {
      const pct   = Math.round((d.count / max) * 100);
      const label = getDayOfWeek(d.date);
      return `<div class="week-bar-wrap">
        <div class="week-bar" style="height:${Math.max(pct, 5)}%"></div>
        <div class="week-day-label">${label}</div>
      </div>`;
    }).join('');
  } catch (e) {
    chart.innerHTML = '<div class="empty-state" style="width:100%">No data</div>';
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
function initializeApp() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  $$('.nav-item').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); navigateTo(item.dataset.page); });
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('card-link') && e.target.dataset.page) {
      e.preventDefault();
      navigateTo(e.target.dataset.page);
    }
  });

  const menuToggle = $('menuToggle');
  if (menuToggle) menuToggle.addEventListener('click', () => $('sidebar').classList.toggle('open'));

  const quickAddBtn = $('quickAddBtn');
  if (quickAddBtn) quickAddBtn.addEventListener('click', () => { openAddTask(); navigateTo('tasks'); });

  const addSubjectBtn = $('addSubjectBtn');
  if (addSubjectBtn) addSubjectBtn.addEventListener('click', openAddSubject);

  const saveSubjectBtn = $('saveSubjectBtn');
  if (saveSubjectBtn) saveSubjectBtn.addEventListener('click', saveSubject);

  const addTaskBtn = $('addTaskBtn');
  if (addTaskBtn) addTaskBtn.addEventListener('click', openAddTask);

  const saveTaskBtn = $('saveTaskBtn');
  if (saveTaskBtn) saveTaskBtn.addEventListener('click', saveTask);

  const taskFilter = $('taskFilter');
  if (taskFilter) taskFilter.addEventListener('change', renderTasks);

  const taskSubjectFilter = $('taskSubjectFilter');
  if (taskSubjectFilter) taskSubjectFilter.addEventListener('change', renderTasks);

  const addSessionBtn = $('addSessionBtn');
  if (addSessionBtn) addSessionBtn.addEventListener('click', openAddSession);

  const saveSessionBtn = $('saveSessionBtn');
  if (saveSessionBtn) saveSessionBtn.addEventListener('click', saveSession);

  $$('.modal-close, .btn-secondary[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
  });

  $$('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      State.selectedSubjectColor = opt.dataset.color;
    });
  });

  const timerStart = $('timerStart');
  if (timerStart) timerStart.addEventListener('click', startTimer);

  const timerReset = $('timerReset');
  if (timerReset) timerReset.addEventListener('click', resetTimer);

  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.timer.mode = btn.dataset.mode;
      setTimerMode(parseInt(btn.dataset.minutes), btn);
    });
  });

  const ring = $('ringProgress');
  if (ring) {
    ring.style.strokeDasharray  = CIRCUMFERENCE;
    ring.style.strokeDashoffset = 0;
  }

  loadAll();
}

// ─── Globals for inline onclick handlers ──────────────────────────────────────
window.toggleTask    = toggleTask;
window.editTask      = editTask;
window.deleteTask    = deleteTask;
window.editSubject   = editSubject;
window.deleteSubject = deleteSubject;
window.editSession   = editSession;
window.initializeApp = initializeApp;

// ─── Auto-start if no auth layer present ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('loginContainer')) {
    initializeApp();
  }
});
