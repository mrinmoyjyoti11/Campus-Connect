// js/dashboard.js
// Connects admin.html, teacher.html, and student.html to the C++ backend

const BASE_URL = 'http://localhost:8080/api';

// ==================== SESSION ====================

function getToken() {
  return sessionStorage.getItem('campus_token') || localStorage.getItem('campus_token');
}
function getRole() {
  return sessionStorage.getItem('campus_role') || localStorage.getItem('campus_role');
}
function getUserId() {
  return sessionStorage.getItem('campus_userId') || localStorage.getItem('campus_userId');
}

// Redirect to login if not authenticated
(function guardPage() {
  const token = getToken();
  const role  = getRole();
  if (!token || !role) {
    window.location.href = 'index.html';
    return;
  }
  // Role-page mismatch guard
  const page = window.location.pathname.split('/').pop();
  if (page === 'admin.html'   && role !== 'admin')   window.location.href = 'index.html';
  if (page === 'teacher.html' && role !== 'teacher') window.location.href = 'index.html';
  if (page === 'student.html' && role !== 'student') window.location.href = 'index.html';
})();

// ==================== API HELPER ====================

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE_URL + path, opts);
  const data = await res.json();
  if (res.status === 401) { window.location.href = 'index.html'; return null; }
  return { ok: res.ok, status: res.status, data };
}

// ==================== LOGOUT ====================

async function logout() {
  await api('POST', '/logout');
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = 'index.html';
}

// ==================== TOAST NOTIFICATION ====================

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 12px 20px; border-radius: 8px; font-size: 14px;
    color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ==================== MODAL HELPER ====================

function openModal(html) {
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border-radius:12px; padding:28px; width:460px;
                max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      ${html}
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  const m = document.getElementById('modal-overlay');
  if (m) m.remove();
}

// ==================== ADMIN DASHBOARD ====================

async function initAdmin() {
  await loadAdminStats();
  await loadRecentStudents();
  setupAdminQuickActions();
  setupAdminNav();
}

async function loadAdminStats() {
  const [studentsRes, teachersRes, coursesRes] = await Promise.all([
    api('GET', '/students'),
    api('GET', '/teachers'),
    api('GET', '/courses'),
  ]);

  const statValues = document.querySelectorAll('.stat-value');
  if (studentsRes?.ok && statValues[0]) statValues[0].textContent = studentsRes.data.length;
  if (teachersRes?.ok && statValues[1]) statValues[1].textContent = teachersRes.data.length;
  if (coursesRes?.ok  && statValues[3]) statValues[3].textContent = coursesRes.data.length;
}

async function loadRecentStudents() {
  const res = await api('GET', '/students');
  if (!res?.ok) return;

  const tbody = document.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const recent = res.data.slice(-5).reverse(); // last 5 added
  recent.forEach(s => {
    const initials = s.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    tbody.innerHTML += `
      <tr>
        <td>
          <div class="table-user">
            <div class="user-avatar" style="width:32px;height:32px;font-size:12px;background:#dbeafe;color:#2563eb;">${initials}</div>
            <span>${s.name}</span>
          </div>
        </td>
        <td>Student</td>
        <td>${s.department || '-'}</td>
        <td><span class="badge success">Active</span></td>
      </tr>
    `;
  });
}

function setupAdminQuickActions() {
  const actionCards = document.querySelectorAll('.action-card');
  if (actionCards[0]) actionCards[0].onclick = () => showAddStudentModal();
  if (actionCards[1]) actionCards[1].onclick = () => showAddTeacherModal();
  if (actionCards[2]) actionCards[2].onclick = () => showAddCourseModal();

  // "Add New" button in header
  const addBtn = document.querySelector('.btn.btn-primary');
  if (addBtn) addBtn.onclick = () => showAddStudentModal();
}

function setupAdminNav() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const label = item.querySelector('span')?.textContent?.trim();
      if (label === 'Students') showStudentsPanel();
      if (label === 'Teachers') showTeachersPanel();
      if (label === 'Courses')  showCoursesPanel();
    });
  });
}

// ---- Add Student Modal ----
function showAddStudentModal() {
  openModal(`
    <h3 style="margin:0 0 20px;font-size:18px;">Add New Student</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <input id="m-name" placeholder="Full Name" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-email" placeholder="Email" type="email" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-pass" placeholder="Password" type="password" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-dept" placeholder="Department (e.g. CSE)" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-sem" placeholder="Semester (1-8)" type="number" min="1" max="8" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button onclick="submitAddStudent()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;font-weight:500;">Add Student</button>
      </div>
    </div>
  `);
}

async function submitAddStudent() {
  const name = document.getElementById('m-name').value.trim();
  const email = document.getElementById('m-email').value.trim();
  const pass = document.getElementById('m-pass').value;
  const dept = document.getElementById('m-dept').value.trim();
  const sem = parseInt(document.getElementById('m-sem').value);

  if (!name || !email || !pass || !dept || !sem) {
    showToast('Please fill all fields', 'error'); return;
  }
  const res = await api('POST', '/students', { name, email, password: pass, department: dept, semester: sem });
  if (res?.ok) {
    showToast(`Student added! ID: ${res.data.id}`);
    closeModal();
    loadAdminStats();
    loadRecentStudents();
  } else {
    showToast(res?.data?.error || 'Failed to add student', 'error');
  }
}

// ---- Add Teacher Modal ----
function showAddTeacherModal() {
  openModal(`
    <h3 style="margin:0 0 20px;font-size:18px;">Add New Teacher</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <input id="m-name" placeholder="Full Name" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-email" placeholder="Email" type="email" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-pass" placeholder="Password" type="password" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-dept" placeholder="Department" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-desig" placeholder="Designation (e.g. Professor)" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-office" placeholder="Office Room (optional)" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button onclick="submitAddTeacher()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#22c55e;color:#fff;cursor:pointer;font-weight:500;">Add Teacher</button>
      </div>
    </div>
  `);
}

async function submitAddTeacher() {
  const name  = document.getElementById('m-name').value.trim();
  const email = document.getElementById('m-email').value.trim();
  const pass  = document.getElementById('m-pass').value;
  const dept  = document.getElementById('m-dept').value.trim();
  const desig = document.getElementById('m-desig').value.trim();
  const office= document.getElementById('m-office').value.trim();

  if (!name || !email || !pass || !dept || !desig) {
    showToast('Please fill all required fields', 'error'); return;
  }
  const res = await api('POST', '/teachers', { name, email, password: pass, department: dept, designation: desig, office });
  if (res?.ok) {
    showToast(`Teacher added! ID: ${res.data.id}`);
    closeModal();
    loadAdminStats();
  } else {
    showToast(res?.data?.error || 'Failed to add teacher', 'error');
  }
}

// ---- Add Course Modal ----
function showAddCourseModal() {
  openModal(`
    <h3 style="margin:0 0 20px;font-size:18px;">Create New Course</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <input id="m-name" placeholder="Course Name" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-dept" placeholder="Department" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-credits" placeholder="Credits (1-6)" type="number" min="1" max="6" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-cap" placeholder="Max Capacity (default 50)" type="number" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button onclick="submitAddCourse()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#f59e0b;color:#fff;cursor:pointer;font-weight:500;">Create Course</button>
      </div>
    </div>
  `);
}

async function submitAddCourse() {
  const name    = document.getElementById('m-name').value.trim();
  const dept    = document.getElementById('m-dept').value.trim();
  const credits = parseInt(document.getElementById('m-credits').value) || 3;
  const capacity= parseInt(document.getElementById('m-cap').value) || 50;

  if (!name || !dept) { showToast('Name and department are required', 'error'); return; }
  const res = await api('POST', '/courses', { name, department: dept, credits, capacity });
  if (res?.ok) {
    showToast(`Course created! ID: ${res.data.id}`);
    closeModal();
    loadAdminStats();
  } else {
    showToast(res?.data?.error || 'Failed to create course', 'error');
  }
}

// ---- Students Panel ----
async function showStudentsPanel() {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>All Students</h2><div id="students-list">Loading...</div></div>`;

  const res = await api('GET', '/students');
  if (!res?.ok) { document.getElementById('students-list').textContent = 'Failed to load.'; return; }

  const list = document.getElementById('students-list');
  if (res.data.length === 0) { list.innerHTML = '<p>No students yet.</p>'; return; }

  list.innerHTML = `
    <div style="margin-bottom:16px;">
      <button onclick="showAddStudentModal()" style="padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">+ Add Student</button>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">ID</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Name</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Email</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Department</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Semester</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">GPA</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${res.data.map(s => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px;font-size:13px;color:#64748b;">${s.id}</td>
            <td style="padding:12px;font-weight:500;">${s.name}</td>
            <td style="padding:12px;font-size:13px;">${s.email}</td>
            <td style="padding:12px;">${s.department || '-'}</td>
            <td style="padding:12px;">${s.semester || '-'}</td>
            <td style="padding:12px;">${parseFloat(s.gpa || 0).toFixed(2)}</td>
            <td style="padding:12px;">
              <button onclick="removeStudent('${s.id}')" style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function removeStudent(id) {
  if (!confirm('Remove this student?')) return;
  const res = await api('DELETE', `/students/${id}`);
  if (res?.ok) { showToast('Student removed'); showStudentsPanel(); }
  else showToast(res?.data?.error || 'Failed', 'error');
}

// ---- Courses Panel ----
async function showCoursesPanel() {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>All Courses</h2><div id="courses-list">Loading...</div></div>`;

  const [coursesRes, teachersRes] = await Promise.all([
    api('GET', '/courses'),
    api('GET', '/teachers')
  ]);
  if (!coursesRes?.ok) { document.getElementById('courses-list').textContent = 'Failed to load.'; return; }

  // Build a teacher lookup map: id -> name
  const teacherMap = {};
  if (teachersRes?.ok) {
    teachersRes.data.forEach(t => { teacherMap[t.id] = t.name; });
  }

  const list = document.getElementById('courses-list');
  if (coursesRes.data.length === 0) {
    list.innerHTML = '<p>No courses yet.</p><button onclick="showAddCourseModal()" style="padding:10px 20px;background:#f59e0b;color:#fff;border:none;border-radius:8px;cursor:pointer;">+ Create Course</button>';
    return;
  }

  list.innerHTML = `
    <div style="margin-bottom:16px;">
      <button onclick="showAddCourseModal()" style="padding:10px 20px;background:#f59e0b;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">+ Create Course</button>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">ID</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Name</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Department</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Credits</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Enrolled</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Teacher</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${coursesRes.data.map(c => {
          const teacherName = c.teacherId && teacherMap[c.teacherId]
            ? teacherMap[c.teacherId]
            : '<span style="color:#94a3b8;font-size:12px;">Not assigned</span>';
          return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px;font-size:13px;color:#64748b;">${c.id}</td>
              <td style="padding:12px;font-weight:500;">${c.name}</td>
              <td style="padding:12px;">${c.department}</td>
              <td style="padding:12px;">${c.credits}</td>
              <td style="padding:12px;">${c.enrolled}/${c.maxCapacity}</td>
              <td style="padding:12px;font-size:13px;">${teacherName}</td>
              <td style="padding:12px;display:flex;gap:6px;flex-wrap:wrap;">
                <button onclick="showAssignTeacherModal('${c.id}', '${c.name}')"
                  style="padding:6px 12px;background:#dbeafe;color:#2563eb;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                  Assign Teacher
                </button>
                <button onclick="showCourseStudents('${c.id}', '${c.name}')"
                  style="padding:6px 12px;background:#dcfce7;color:#16a34a;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                  View Students
                </button>
                <button onclick="removeCourse('${c.id}')"
                  style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                  Remove
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

async function removeCourse(id) {
  if (!confirm('Remove this course?')) return;
  const res = await api('DELETE', `/courses/${id}`);
  if (res?.ok) { showToast('Course removed'); showCoursesPanel(); }
  else showToast(res?.data?.error || 'Failed', 'error');
}

// ---- Assign Teacher Modal ----
async function showAssignTeacherModal(courseId, courseName) {
  // Load teachers to show in a dropdown
  const res = await api('GET', '/teachers');
  const teachers = res?.ok ? res.data : [];

  openModal(`
    <h3 style="margin:0 0 6px;font-size:18px;">Assign Teacher</h3>
    <p style="font-size:13px;color:#64748b;margin:0 0 20px;">Course: <strong>${courseName}</strong> (${courseId})</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="font-size:13px;color:#64748b;display:block;margin-bottom:6px;">Select Teacher</label>
        <select id="m-teacher-select" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
          <option value="">-- Choose a teacher --</option>
          ${teachers.map(t => `
            <option value="${t.id}">${t.name} — ${t.department} (${t.id})</option>
          `).join('')}
        </select>
      </div>
      <p style="font-size:12px;color:#94a3b8;margin:0;">
        Don't see the teacher? <a href="#" onclick="closeModal();showAddTeacherModal();" style="color:#3b82f6;">Add a new teacher first</a>
      </p>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button onclick="submitAssignTeacher('${courseId}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;font-weight:500;">Assign</button>
      </div>
    </div>
  `);
}

async function submitAssignTeacher(courseId) {
  const teacherId = document.getElementById('m-teacher-select').value;
  if (!teacherId) { showToast('Please select a teacher', 'error'); return; }

  const res = await api('POST', `/courses/${courseId}/teacher`, { teacherId });
  if (res?.ok) {
    showToast('Teacher assigned successfully!');
    closeModal();
    showCoursesPanel(); // Refresh to show updated teacher name
  } else {
    showToast(res?.data?.error || 'Failed to assign teacher', 'error');
  }
}

// ---- View Students in Course (for admin) ----
async function showCourseStudents(courseId, courseName) {
  const [coursesRes, studentsRes] = await Promise.all([
    api('GET', '/courses'),
    api('GET', '/students')
  ]);

  const course = coursesRes?.data?.find(c => c.id === courseId);
  const enrolledIds = course?.students || [];
  const allStudents = studentsRes?.data || [];
  const enrolled = allStudents.filter(s => enrolledIds.includes(s.id));

  openModal(`
    <h3 style="margin:0 0 6px;font-size:18px;">Enrolled Students</h3>
    <p style="font-size:13px;color:#64748b;margin:0 0 16px;">Course: <strong>${courseName}</strong> — ${enrolled.length} student(s)</p>
    <div style="max-height:300px;overflow-y:auto;">
      ${enrolled.length === 0
        ? '<p style="color:#94a3b8;font-size:14px;text-align:center;padding:20px 0;">No students enrolled yet.</p>'
        : `<table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #e2e8f0;">ID</th>
                <th style="padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #e2e8f0;">Name</th>
                <th style="padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #e2e8f0;">Department</th>
              </tr>
            </thead>
            <tbody>
              ${enrolled.map(s => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 12px;font-size:12px;color:#64748b;">${s.id}</td>
                  <td style="padding:8px 12px;font-size:13px;font-weight:500;">${s.name}</td>
                  <td style="padding:8px 12px;font-size:13px;">${s.department || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
      }
    </div>
    <div style="margin-top:16px;text-align:right;">
      <button onclick="closeModal()" style="padding:10px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Close</button>
    </div>
  `);
}

// ---- Teachers Panel ----
async function showTeachersPanel() {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>All Teachers</h2><div id="teachers-list">Loading...</div></div>`;

  const res = await api('GET', '/teachers');
  if (!res?.ok) { document.getElementById('teachers-list').textContent = 'Failed to load.'; return; }

  const list = document.getElementById('teachers-list');
  list.innerHTML = `
    <div style="margin-bottom:16px;">
      <button onclick="showAddTeacherModal()" style="padding:10px 20px;background:#22c55e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">+ Add Teacher</button>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">ID</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Name</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Email</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Department</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Designation</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${res.data.map(t => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px;font-size:13px;color:#64748b;">${t.id}</td>
            <td style="padding:12px;font-weight:500;">${t.name}</td>
            <td style="padding:12px;font-size:13px;">${t.email}</td>
            <td style="padding:12px;">${t.department || '-'}</td>
            <td style="padding:12px;">${t.designation || '-'}</td>
            <td style="padding:12px;">
              <button onclick="removeTeacher('${t.id}')" style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function removeTeacher(id) {
  if (!confirm('Remove this teacher?')) return;
  const res = await api('DELETE', `/teachers/${id}`);
  if (res?.ok) { showToast('Teacher removed'); showTeachersPanel(); }
  else showToast(res?.data?.error || 'Failed', 'error');
}

// ==================== STUDENT DASHBOARD ====================

async function initStudent() {
  const userId = getUserId();
  const res = await api('GET', `/students/${userId}`);
  if (!res?.ok) return;

  const s = res.data;

  // Update name in header
  const h1 = document.querySelector('.header-title h1');
  if (h1) h1.textContent = `Welcome back, ${s.name.split(' ')[0]}!`;

  // Update sidebar
  const userName = document.querySelector('.user-name');
  const userRole = document.querySelector('.user-role');
  const userAvatar = document.querySelector('.user-avatar');
  if (userName) userName.textContent = s.name;
  if (userRole) userRole.textContent = s.department || 'Student';
  if (userAvatar) userAvatar.textContent = s.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

  // Update stat cards
  const statValues = document.querySelectorAll('.stat-value');
  if (statValues[0]) statValues[0].textContent = s.courses?.length || 0;
  if (statValues[1]) statValues[1].textContent = parseFloat(s.gpa || 0).toFixed(2);

  // Load grades and courses
  await loadStudentGrades(userId);
  await loadStudentCourses(s.courses || []);

  // Update Pending Assignments stat (statValues[2])
  const courseIds = s.courses || [];
  if (statValues[2]) {
    if (courseIds.length) {
      const allAssignments = await fetchAssignmentsForCourses(courseIds);
      const today = new Date(); today.setHours(0,0,0,0);
      const pending = allAssignments.filter(a => new Date(a.dueDate) >= today).length;
      statValues[2].textContent = pending;
      const badge = document.querySelector('.nav-badge');
      if (badge) badge.textContent = pending;
    } else {
      statValues[2].textContent = 0;
    }
  }

  // Update Attendance Rate stat (statValues[3])
  if (statValues[3]) {
    if (courseIds.length) {
      const summary = await getStudentAttendanceSummary(userId, courseIds);
      let totalClasses = 0, totalPresent = 0;
      courseIds.forEach(cid => {
        totalClasses += summary[cid]?.total || 0;
        totalPresent += summary[cid]?.present || 0;
      });
      const rate = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
      statValues[3].textContent = rate + '%';
    } else {
      statValues[3].textContent = '0%';
    }
  }

  // Load dashboard preview cards
  await loadStudentDashboardAssignments(courseIds);
  await loadStudentDashboardAttendance(userId, courseIds);

  setupStudentNav(s);
}

async function loadStudentGrades(userId) {
  const res = await api('GET', `/grades/${userId}`);
  if (!res?.ok) return;

  const gradeItems = document.querySelectorAll('.card')[2]?.querySelectorAll('.list-item');
  if (!gradeItems) return;

  const grades = res.data.grades || {};
  const courseIds = Object.keys(grades);

  // Update recent grades card with real data
  const gradesCard = document.querySelectorAll('.card')[2];
  if (!gradesCard) return;

  const body = gradesCard.querySelector('.card-body');
  if (courseIds.length === 0) {
    body.innerHTML = '<p style="color:#94a3b8;font-size:14px;padding:8px 0;">No grades yet.</p>';
    return;
  }

  body.innerHTML = courseIds.slice(0, 4).map(cid => {
    const g = grades[cid];
    const letter = g >= 3.7 ? 'A' : g >= 3.3 ? 'A-' : g >= 3.0 ? 'B+' : g >= 2.7 ? 'B' : g >= 2.0 ? 'C' : 'D';
    const color  = g >= 3.0 ? '#22c55e' : g >= 2.0 ? '#2563eb' : '#ef4444';
    return `
      <div class="list-item">
        <div class="list-content">
          <div class="list-title">${cid}</div>
        </div>
        <div class="list-meta">
          <div class="list-value" style="color:${color};">${letter}</div>
          <div class="list-label">GPA: ${g.toFixed(1)}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadStudentCourses(courseIds) {
  if (!courseIds.length) return;
  const res = await api('GET', '/courses');
  if (!res?.ok) return;

  const myCourses = res.data.filter(c => courseIds.includes(c.id));
  const courseCard = document.querySelectorAll('.card')[0];
  if (!courseCard) return;

  const body = courseCard.querySelector('.card-body');
  if (myCourses.length === 0) {
    body.innerHTML = '<p style="color:#94a3b8;font-size:14px;">No courses enrolled yet.</p>';
    return;
  }

  const colors = ['#dbeafe/#2563eb', '#dcfce7/#22c55e', '#fef3c7/#f59e0b', '#fee2e2/#ef4444'];
  body.innerHTML = myCourses.slice(0, 4).map((c, i) => {
    const [bg, fg] = colors[i % colors.length].split('/');
    return `
      <div class="list-item">
        <div class="list-icon" style="background:${bg};color:${fg};">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
        </div>
        <div class="list-content">
          <div class="list-title">${c.name}</div>
          <div class="list-subtitle">${c.department} · ${c.credits} credits</div>
          <div class="progress-bar"><div class="progress-fill blue" style="width:${Math.round(Math.random()*60+30)}%;"></div></div>
        </div>
        <div class="list-meta"><div class="list-value">${c.enrolled}/${c.maxCapacity}</div></div>
      </div>
    `;
  }).join('');
}

function setupStudentNav(student) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const label = item.querySelector('span')?.textContent?.trim();
      if (label === 'Grades')      showStudentGradesPanel(student);
      if (label === 'My Courses')  showEnrollPanel(student);
      if (label === 'Attendance')  showStudentAttendancePanel(student);
      if (label === 'Assignments') showStudentAssignmentsPanel(student);
    });
  });
}

async function showStudentGradesPanel(student) {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>My Grades</h2><div id="grades-panel">Loading...</div></div>`;

  const res = await api('GET', `/grades/${student.id}`);
  const panel = document.getElementById('grades-panel');
  if (!res?.ok) { panel.textContent = 'Failed to load grades.'; return; }

  const grades = res.data.grades || {};
  const gpa = parseFloat(res.data.gpa || 0).toFixed(2);

  panel.innerHTML = `
    <div style="background:#f0fdf4;padding:16px;border-radius:10px;margin-bottom:20px;display:inline-block;">
      <span style="font-size:14px;color:#166534;">Cumulative GPA: </span>
      <span style="font-size:24px;font-weight:700;color:#16a34a;">${gpa}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Course ID</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Grade (GPA)</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Letter</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(grades).map(([cid, g]) => {
          const letter = g >= 3.7?'A':g >= 3.3?'A-':g >= 3.0?'B+':g >= 2.7?'B':g >= 2.0?'C':'D';
          const color  = g >= 3.0?'#22c55e':g >= 2.0?'#2563eb':'#ef4444';
          return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px;">${cid}</td>
            <td style="padding:12px;">${g.toFixed(2)}</td>
            <td style="padding:12px;font-weight:700;color:${color};">${letter}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="3" style="padding:16px;color:#94a3b8;">No grades recorded yet.</td></tr>'}
      </tbody>
    </table>
  `;
}

async function showEnrollPanel(student) {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>Available Courses</h2><div id="enroll-panel">Loading...</div></div>`;

  const res = await api('GET', '/courses');
  const panel = document.getElementById('enroll-panel');
  if (!res?.ok) { panel.textContent = 'Failed to load.'; return; }

  panel.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Course</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Department</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Credits</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Spots</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${res.data.map(c => {
          const enrolled = (student.courses || []).includes(c.id);
          const full = c.enrolled >= c.maxCapacity;
          return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px;font-weight:500;">${c.name}</td>
            <td style="padding:12px;">${c.department}</td>
            <td style="padding:12px;">${c.credits}</td>
            <td style="padding:12px;">${c.maxCapacity - c.enrolled} left</td>
            <td style="padding:12px;">
              ${enrolled
                ? `<button onclick="dropCourse('${c.id}')" style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Drop</button>`
                : full
                  ? `<span style="color:#94a3b8;font-size:12px;">Full</span>`
                  : `<button onclick="enrollCourse('${c.id}')" style="padding:6px 12px;background:#dbeafe;color:#2563eb;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Enroll</button>`
              }
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

async function enrollCourse(courseId) {
  const res = await api('POST', `/courses/${courseId}/enroll`, { studentId: getUserId() });
  if (res?.ok) { showToast('Enrolled successfully!'); initStudent(); }
  else showToast(res?.data?.error || 'Enrollment failed', 'error');
}

async function dropCourse(courseId) {
  if (!confirm('Drop this course?')) return;
  const res = await api('DELETE', `/courses/${courseId}/enroll/${getUserId()}`);
  if (res?.ok) { showToast('Course dropped'); initStudent(); }
  else showToast(res?.data?.error || 'Failed', 'error');
}

// ==================== TEACHER DASHBOARD ====================

async function initTeacher() {
  const userId = getUserId();
  const res = await api('GET', '/teachers');
  if (!res?.ok) return;

  const teacher = res.data.find(t => t.id === userId);
  if (!teacher) return;

  // Update UI with real name
  const h1 = document.querySelector('.header-title h1');
  if (h1) h1.textContent = `Good morning, ${teacher.name}!`;

  const userName   = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  const userAvatar = document.querySelector('.user-avatar');
  if (userName)   userName.textContent   = teacher.name;
  if (userRoleEl) userRoleEl.textContent = teacher.department + ' Dept.';
  if (userAvatar) userAvatar.textContent = teacher.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

  // Update stats
  const statValues = document.querySelectorAll('.stat-value');
  if (statValues[0]) statValues[0].textContent = teacher.courses?.length || 0;

  await loadTeacherCourses(teacher);
  setupTeacherNav(teacher);
}

async function loadTeacherCourses(teacher) {
  const coursesRes = await api('GET', '/courses');
  if (!coursesRes?.ok) return;

  const myCourses = coursesRes.data.filter(c => (teacher.courses || []).includes(c.id));

  const statValues = document.querySelectorAll('.stat-value');
  let totalStudents = myCourses.reduce((sum, c) => sum + c.enrolled, 0);
  if (statValues[1]) statValues[1].textContent = totalStudents;

  // Update Today's Classes card
  const classCard = document.querySelector('.card');
  if (!classCard) return;
  const body = classCard.querySelector('.card-body');
  if (myCourses.length === 0) {
    body.innerHTML = '<p style="color:#94a3b8;font-size:14px;">No courses assigned yet.</p>';
    return;
  }

  body.innerHTML = myCourses.map(c => `
    <div class="class-card">
      <div class="class-info">
        <h4>${c.id} - ${c.name}</h4>
        <p>${c.department} · ${c.credits} credits</p>
        <div class="class-meta">
          <span>${c.enrolled} students</span>
          <button onclick="showGradeModal('${c.id}')" style="padding:4px 10px;background:#dbeafe;color:#2563eb;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Assign Grade</button>
        </div>
      </div>
    </div>
  `).join('');
}

function showGradeModal(courseId) {
  openModal(`
    <h3 style="margin:0 0 20px;font-size:18px;">Assign Grade</h3>
    <p style="font-size:13px;color:#64748b;margin-bottom:16px;">Course: ${courseId}</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <input id="m-sid" placeholder="Student ID (e.g. STU1001)" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-grade" placeholder="Grade (0.0 - 4.0)" type="number" step="0.1" min="0" max="4" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button onclick="submitGrade('${courseId}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;font-weight:500;">Assign</button>
      </div>
    </div>
  `);
}

async function submitGrade(courseId) {
  const studentId = document.getElementById('m-sid').value.trim();
  const grade     = parseFloat(document.getElementById('m-grade').value);

  if (!studentId || isNaN(grade)) { showToast('Fill all fields', 'error'); return; }
  const res = await api('POST', '/grades', { studentId, courseId, grade });
  if (res?.ok) { showToast('Grade assigned!'); closeModal(); }
  else showToast(res?.data?.error || 'Failed', 'error');
}

function setupTeacherNav(teacher) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const label = item.querySelector('span')?.textContent?.trim();
      if (label === 'Grading')     showGradingPanel(teacher);
      if (label === 'Attendance')  showAttendancePanel(teacher);
      if (label === 'Assignments') showAssignmentsPanel(teacher);
    });
  });
}

async function showGradingPanel(teacher) {
  const body = document.querySelector('.content-body');
  body.innerHTML = `
    <div style="padding:20px;">
      <h2>Assign Grades</h2>
      <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin-top:16px;">
        <input id="g-sid" placeholder="Student ID" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
        <select id="g-cid" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
          <option value="">Select Course</option>
          ${(teacher.courses || []).map(cid => `<option value="${cid}">${cid}</option>`).join('')}
        </select>
        <input id="g-grade" placeholder="Grade (0.0 - 4.0)" type="number" step="0.1" min="0" max="4" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
        <button onclick="submitGradePanel()" style="padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:500;">Assign Grade</button>
      </div>
    </div>
  `;
}

async function submitGradePanel() {
  const studentId = document.getElementById('g-sid').value.trim();
  const courseId  = document.getElementById('g-cid').value;
  const grade     = parseFloat(document.getElementById('g-grade').value);

  if (!studentId || !courseId || isNaN(grade)) { showToast('Fill all fields', 'error'); return; }
  const res = await api('POST', '/grades', { studentId, courseId, grade });
  if (res?.ok) showToast('Grade assigned successfully!');
  else showToast(res?.data?.error || 'Failed', 'error');
}

// ==================== ATTENDANCE (stored in backend DB via API) ====================

// Cache of already-fetched attendance for current sheet: { "courseId_studentId_date": "present"|"absent" }
let _attendanceSheetCache = {};

async function fetchCourseAttendance(courseId, date) {
  const res = await api('GET', `/attendance/${courseId}/${date}`);
  _attendanceSheetCache = {};
  if (res?.ok && res.data.records) {
    res.data.records.forEach(r => {
      _attendanceSheetCache[`${courseId}_${r.studentId}_${date}`] = r.status;
    });
  }
}

function getAttendanceCached(courseId, studentId, date) {
  return _attendanceSheetCache[`${courseId}_${studentId}_${date}`] || 'not-marked';
}

async function markAttendanceAPI(courseId, studentId, date, status) {
  const res = await api('POST', '/attendance', { courseId, studentId, date, status });
  if (res?.ok) {
    _attendanceSheetCache[`${courseId}_${studentId}_${date}`] = status;
    showToast(`Marked ${status}`);
    renderAttendanceSheet(courseId, date);
  } else {
    showToast(res?.data?.error || 'Failed to mark attendance', 'error');
  }
}

async function getStudentAttendanceSummary(studentId, courseIds) {
  const res = await api('GET', `/attendance/student/${studentId}`);
  const summary = {};
  courseIds.forEach(cid => { summary[cid] = { total: 0, present: 0, percent: 0 }; });
  if (!res?.ok || !res.data.attendance) return summary;
  const att = res.data.attendance;
  courseIds.forEach(cid => {
    if (!att[cid]) return;
    const dates  = Object.keys(att[cid]);
    const total   = dates.length;
    const present = dates.filter(d => att[cid][d] === 'present').length;
    summary[cid]  = { total, present, percent: total > 0 ? Math.round((present / total) * 100) : 0 };
  });
  return summary;
}

// ==================== ASSIGNMENTS (stored in backend DB via API) ====================

async function fetchAssignmentsForCourses(courseIds) {
  if (!courseIds.length) return [];
  // Fetch assignments for each course in parallel
  const results = await Promise.all(
    courseIds.map(cid => api('GET', `/assignments?courseId=${cid}`))
  );
  const all = [];
  results.forEach(res => { if (res?.ok && Array.isArray(res.data)) all.push(...res.data); });
  // Deduplicate by id
  const seen = new Set();
  return all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
}

// ==================== TEACHER ATTENDANCE PANEL ====================

async function showAttendancePanel(teacher) {
  const body = document.querySelector('.content-body');
  const coursesRes = await api('GET', '/courses');
  const myCourses = coursesRes?.data?.filter(c => (teacher.courses||[]).includes(c.id)) || [];

  if (myCourses.length === 0) {
    body.innerHTML = `<div style="padding:20px;"><h2>Attendance</h2><p style="color:#94a3b8;">No courses assigned yet.</p></div>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  body.innerHTML = `
    <div style="padding:20px;">
      <h2>Mark Attendance</h2>
      <div style="display:flex;align-items:center;gap:12px;margin:16px 0;">
        <label style="font-size:14px;color:#64748b;">Course:</label>
        <select id="att-course" onchange="loadAttendanceSheet()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
          ${myCourses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <label style="font-size:14px;color:#64748b;">Date:</label>
        <input type="date" id="att-date" value="${today}" onchange="loadAttendanceSheet()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
        <button onclick="loadAttendanceSheet()" style="padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Load</button>
      </div>
      <div id="attendance-sheet">Click Load to view students</div>
    </div>
  `;

  // Auto load
  await loadAttendanceSheet();
}

async function loadAttendanceSheet() {
  const courseId = document.getElementById('att-course')?.value;
  const date     = document.getElementById('att-date')?.value;
  const sheet    = document.getElementById('attendance-sheet');
  if (!courseId || !date || !sheet) return;

  sheet.innerHTML = '<p style="color:#64748b;font-size:14px;">Loading...</p>';

  // Fetch enrolled students and existing attendance records in parallel
  const [coursesRes, studentsRes] = await Promise.all([
    api('GET', '/courses'),
    api('GET', '/students')
  ]);

  const course   = coursesRes?.data?.find(c => c.id === courseId);
  const enrolled = (studentsRes?.data || []).filter(s => (course?.students || []).includes(s.id));

  if (enrolled.length === 0) {
    sheet.innerHTML = '<p style="color:#94a3b8;font-size:14px;margin-top:12px;">No students enrolled in this course.</p>';
    return;
  }

  // Load existing attendance for this course+date from the backend
  await fetchCourseAttendance(courseId, date);
  renderAttendanceSheet(courseId, date, enrolled);
}

// Separate render function so markAttendanceAPI can re-render without re-fetching students
let _lastEnrolled = [];
function renderAttendanceSheet(courseId, date, enrolled) {
  if (enrolled) _lastEnrolled = enrolled;
  else enrolled = _lastEnrolled;

  const sheet = document.getElementById('attendance-sheet');
  if (!sheet) return;

  sheet.innerHTML = `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Student</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">ID</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Status</th>
          <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Mark</th>
        </tr>
      </thead>
      <tbody>
        ${enrolled.map(s => {
          const status    = getAttendanceCached(courseId, s.id, date);
          const isPresent = status === 'present';
          const isAbsent  = status === 'absent';
          return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px;font-weight:500;">${s.name}</td>
              <td style="padding:12px;font-size:13px;color:#64748b;">${s.id}</td>
              <td style="padding:12px;">
                <span style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;
                  background:${isPresent ? '#dcfce7' : isAbsent ? '#fee2e2' : '#f1f5f9'};
                  color:${isPresent ? '#16a34a' : isAbsent ? '#ef4444' : '#64748b'};">
                  ${isPresent ? 'Present' : isAbsent ? 'Absent' : 'Not Marked'}
                </span>
              </td>
              <td style="padding:12px;display:flex;gap:6px;">
                <button onclick="markAttendanceAPI('${courseId}','${s.id}','${date}','present')"
                  style="padding:6px 12px;background:#dcfce7;color:#16a34a;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                  Present
                </button>
                <button onclick="markAttendanceAPI('${courseId}','${s.id}','${date}','absent')"
                  style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                  Absent
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div style="margin-top:16px;display:flex;align-items:center;gap:12px;">
      <button onclick="markAllAttendance('${courseId}','${date}','present')"
        style="padding:10px 20px;background:#dcfce7;color:#16a34a;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;">
        Mark All Present
      </button>
      <button onclick="markAllAttendance('${courseId}','${date}','absent')"
        style="padding:10px 20px;background:#fee2e2;color:#ef4444;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;">
        Mark All Absent
      </button>
      <span style="font-size:13px;color:#94a3b8;">Changes are saved automatically.</span>
    </div>
  `;
}

async function markAllAttendance(courseId, date, status) {
  const students = _lastEnrolled;
  if (!students.length) return;
  await Promise.all(students.map(s =>
    api('POST', '/attendance', { courseId, studentId: s.id, date, status })
      .then(() => { _attendanceSheetCache[`${courseId}_${s.id}_${date}`] = status; })
  ));
  showToast(`All students marked ${status}`);
  renderAttendanceSheet(courseId, date);
}

// ==================== TEACHER ASSIGNMENTS PANEL ====================

async function showAssignmentsPanel(teacher) {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>Assignments</h2><p style="color:#64748b;font-size:14px;">Loading...</p></div>`;

  const assignments = await fetchAssignmentsForCourses(teacher.courses || []);

  body.innerHTML = `
    <div style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>Assignments</h2>
        <button onclick="showCreateAssignmentModal()" style="padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">+ Create Assignment</button>
      </div>
      ${assignments.length === 0
        ? '<p style="color:#94a3b8;">No assignments created yet. Click the button above to create one.</p>'
        : `<table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Title</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Course</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Due Date</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(a => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:12px;font-weight:500;">${a.title}</td>
                  <td style="padding:12px;font-size:13px;">${a.courseId}</td>
                  <td style="padding:12px;font-size:13px;">${a.dueDate}</td>
                  <td style="padding:12px;">
                    <button onclick="deleteAssignment('${a.id}')" style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
      }
    </div>
  `;
}

function showCreateAssignmentModal() {
  openModal(`
    <h3 style="margin:0 0 20px;font-size:18px;">Create Assignment</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <input id="m-asgn-title" placeholder="Assignment Title" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <input id="m-asgn-course" placeholder="Course ID (e.g. CRS101)" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <textarea id="m-asgn-desc" placeholder="Description" rows="3" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;resize:vertical;"></textarea>
      <input id="m-asgn-due" type="date" style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button onclick="submitCreateAssignment()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;font-weight:500;">Create</button>
      </div>
    </div>
  `);
}

async function submitCreateAssignment() {
  const title    = document.getElementById('m-asgn-title').value.trim();
  const courseId = document.getElementById('m-asgn-course').value.trim();
  const desc     = document.getElementById('m-asgn-desc').value.trim();
  const dueDate  = document.getElementById('m-asgn-due').value;

  if (!title || !courseId || !dueDate) { showToast('Fill all required fields', 'error'); return; }

  const res = await api('POST', '/assignments', { courseId, title, description: desc, dueDate });
  if (res?.ok) {
    showToast('Assignment created!');
    closeModal();
    const teacherId = getUserId();
    const teacherRes = await api('GET', '/teachers');
    const teacher = teacherRes?.data?.find(t => t.id === teacherId);
    if (teacher) showAssignmentsPanel(teacher);
  } else {
    showToast(res?.data?.error || 'Failed to create assignment', 'error');
  }
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  const res = await api('DELETE', `/assignments/${id}`);
  if (res?.ok) {
    showToast('Assignment deleted');
    const teacherId = getUserId();
    const teacherRes = await api('GET', '/teachers');
    const teacher = teacherRes?.data?.find(t => t.id === teacherId);
    if (teacher) showAssignmentsPanel(teacher);
  } else {
    showToast(res?.data?.error || 'Failed to delete', 'error');
  }
}

// ==================== STUDENT ATTENDANCE VIEW ====================

async function showStudentAttendancePanel(student) {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>My Attendance</h2><p style="color:#64748b;font-size:14px;">Loading...</p></div>`;

  const courseIds = student.courses || [];
  const summary   = await getStudentAttendanceSummary(student.id, courseIds);

  const panel = document.querySelector('.content-body');
  panel.innerHTML = `
    <div style="padding:20px;">
      <h2>My Attendance</h2>
      ${courseIds.length === 0
        ? '<p style="color:#94a3b8;margin-top:12px;">You are not enrolled in any courses yet.</p>'
        : `<table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Course</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Classes Held</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Present</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${courseIds.map(cid => {
                const s = summary[cid] || { total: 0, present: 0, percent: 0 };
                const color = s.percent >= 75 ? '#16a34a' : s.percent >= 50 ? '#f59e0b' : '#ef4444';
                return `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px;font-weight:500;">${cid}</td>
                    <td style="padding:12px;">${s.total}</td>
                    <td style="padding:12px;">${s.present}</td>
                    <td style="padding:12px;">
                      <span style="font-weight:600;color:${color};">${s.percent}%</span>
                      <div style="margin-top:4px;background:#f1f5f9;border-radius:4px;height:6px;width:120px;">
                        <div style="background:${color};width:${s.percent}%;height:6px;border-radius:4px;"></div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>`
      }
    </div>
  `;
}

// ==================== STUDENT ASSIGNMENTS VIEW ====================

async function showStudentAssignmentsPanel(student) {
  const body = document.querySelector('.content-body');
  body.innerHTML = `<div style="padding:20px;"><h2>My Assignments</h2><p style="color:#64748b;font-size:14px;">Loading...</p></div>`;

  const courseIds     = student.courses || [];
  const myAssignments = await fetchAssignmentsForCourses(courseIds);
  const today         = new Date();

  document.querySelector('.content-body').innerHTML = `
    <div style="padding:20px;">
      <h2>My Assignments</h2>
      ${myAssignments.length === 0
        ? '<p style="color:#94a3b8;margin-top:12px;">No assignments posted yet.</p>'
        : `<table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Title</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Course</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Description</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Due Date</th>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${myAssignments.map(a => {
                const due  = new Date(a.dueDate);
                const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                const status = diff < 0
                  ? `<span style="background:#fee2e2;color:#ef4444;padding:3px 8px;border-radius:12px;font-size:12px;">Overdue</span>`
                  : diff === 0
                    ? `<span style="background:#fef3c7;color:#f59e0b;padding:3px 8px;border-radius:12px;font-size:12px;">Due Today</span>`
                    : `<span style="background:#dbeafe;color:#2563eb;padding:3px 8px;border-radius:12px;font-size:12px;">${diff} days left</span>`;
                return `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px;font-weight:500;">${a.title}</td>
                    <td style="padding:12px;font-size:13px;">${a.courseId}</td>
                    <td style="padding:12px;font-size:13px;color:#64748b;">${a.description || '-'}</td>
                    <td style="padding:12px;font-size:13px;">${a.dueDate}</td>
                    <td style="padding:12px;">${status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>`
      }
    </div>
  `;
}

// ==================== STUDENT DASHBOARD PREVIEW CARDS ====================

async function loadStudentDashboardAssignments(courseIds) {
  const body = document.getElementById('student-assignments-body');
  if (!body) return;
  if (!courseIds.length) {
    body.innerHTML = '<p style="color:#94a3b8;font-size:14px;">No assignments yet.</p>';
    return;
  }
  const allAssignments = await fetchAssignmentsForCourses(courseIds);
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = allAssignments
    .filter(a => new Date(a.dueDate) >= today)
    .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);
  if (!upcoming.length) {
    body.innerHTML = '<p style="color:#94a3b8;font-size:14px;">No pending assignments.</p>';
    return;
  }
  body.innerHTML = upcoming.map(a => {
    const diff = Math.ceil((new Date(a.dueDate) - today) / (1000*60*60*24));
    const color = diff === 0 ? '#f59e0b' : diff <= 3 ? '#ef4444' : '#2563eb';
    return `<div class="list-item">
      <div class="list-content">
        <div class="list-title">${a.title}</div>
        <div class="list-subtitle">${a.courseId}</div>
      </div>
      <div class="list-meta">
        <div class="list-value" style="color:${color};font-size:12px;">${diff === 0 ? 'Due Today' : diff + 'd left'}</div>
      </div>
    </div>`;
  }).join('');
}

async function loadStudentDashboardAttendance(studentId, courseIds) {
  const body = document.getElementById('student-attendance-body');
  if (!body) return;
  if (!courseIds.length) {
    body.innerHTML = '<p style="color:#94a3b8;font-size:14px;">No attendance records yet.</p>';
    return;
  }
  const summary = await getStudentAttendanceSummary(studentId, courseIds);
  const rows = courseIds.slice(0,4).map(cid => {
    const s = summary[cid] || { total:0, present:0, percent:0 };
    const color = s.percent >= 75 ? '#16a34a' : s.percent >= 50 ? '#f59e0b' : '#ef4444';
    return `<div class="list-item">
      <div class="list-content">
        <div class="list-title">${cid}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${s.percent}%;background:${color};"></div></div>
      </div>
      <div class="list-meta">
        <div class="list-value" style="color:${color};font-weight:600;">${s.percent}%</div>
        <div class="list-label">${s.present}/${s.total}</div>
      </div>
    </div>`;
  }).join('');
  body.innerHTML = rows || '<p style="color:#94a3b8;font-size:14px;">No records yet.</p>';
}

// ==================== ROUTER ====================

const page = window.location.pathname.split('/').pop();
if      (page === 'admin.html'   || page === 'admin-dashboard.html')   initAdmin();
else if (page === 'student.html' || page === 'student-dashboard.html') initStudent();
else if (page === 'teacher.html' || page === 'teacher-dashboard.html') initTeacher();