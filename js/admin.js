(function(){
  const session = getSession();
  if(!session || session.role !== 'admin'){
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    clearSession();
    window.location.href = 'index.html';
  });

  const statusClass = s => 'status-' + s.toLowerCase();

  /* ---- tabs ---- */
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  /* ---- stats ---- */
  function renderStats(){
    const students = getStudents();
    const reports = getReports();
    const hc = getHeadcount();
    document.getElementById('statStudents').textContent = students.length;
    document.getElementById('statPresent').textContent = hc.present;
    document.getElementById('statAway').textContent = hc.away;
    document.getElementById('statOpenReports').textContent = reports.filter(r=>r.status!=='Resolved').length;
  }

  /* ---- students table ---- */
  function populateRoomFilter(){
    const sel = document.getElementById('roomFilter');
    const current = sel.value;
    const rooms = [...new Set(getStudents().map(s => s.room).filter(Boolean))]
      .sort((a,b)=> a.localeCompare(b, undefined, {numeric:true}));
    sel.innerHTML = '<option value="">All rooms</option>' + rooms.map(r => `<option>${r}</option>`).join('');
    if(rooms.includes(current)) sel.value = current;
  }
  function renderStudents(){
    const q = (document.getElementById('studentSearch').value || '').toLowerCase();
    const room = document.getElementById('roomFilter').value;
    let rows = getStudents();
    if(q) rows = rows.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.room.toLowerCase().includes(q));
    if(room) rows = rows.filter(s => s.room === room);
    document.getElementById('studentTable').innerHTML = rows.map(s => `
      <tr>
        <td class="idcell">${s.id}</td>
        <td><b>${s.name}</b><br><span class="muted">${s.course || '—'}</span>
          ${s.loginReady ? '' : '<br><span class="login-pill pending">Needs mobile / login</span>'}
          ${s.registerNote ? `<br><span class="muted" style="font-size:.72rem;">⚠ ${s.registerNote}</span>` : ''}
        </td>
        <td>${s.room}<br><span class="muted">${[s.block, s.sharing].filter(Boolean).join(' · ') || '—'}</span></td>
        <td>${s.contact || '—'}</td>
        <td class="idcell">${maskAadhaar(s.aadhaar)}</td>
        <td>${isAway(s.id) ? '<span class="status-pill status-pending">Away</span>' : '<span class="status-pill status-approved">Present</span>'}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-outline" data-edit="${s.id}">Edit</button>
            <button class="btn btn-sm btn-outline" data-delete="${s.id}">Remove</button>
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="7" class="empty-state">No students match that search.</td></tr>`;

    document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=> openStudentModal(b.dataset.edit)));
    document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click', ()=>{
      const s = getStudentById(b.dataset.delete);
      if(!s) return;
      if(confirm(`Remove ${s.name} (Room ${s.room}) from the hostel roster? This can't be undone.`)){
        deleteStudent(s.id);
        populateRoomFilter();
        renderStudents();
        renderStats();
        renderHeadcount();
      }
    }));
  }
  document.getElementById('studentSearch').addEventListener('input', renderStudents);
  document.getElementById('roomFilter').addEventListener('change', renderStudents);
  document.getElementById('exportStudents').addEventListener('click', ()=>{
    const csv = toCSV(getStudents(), [
      {label:'ID', get:s=>s.id}, {label:'Name', get:s=>s.name}, {label:'Course', get:s=>s.course},
      {label:'Block', get:s=>s.block}, {label:'Room', get:s=>s.room}, {label:'Sharing', get:s=>s.sharing},
      {label:'Contact', get:s=>s.contact}, {label:'Guardian', get:s=>s.guardian}, {label:'Aadhaar', get:s=>maskAadhaar(s.aadhaar)}
    ]);
    downloadCSV('mvr-students.csv', csv);
  });

  /* ---- add / edit student modal ---- */
  const studentModal = document.getElementById('studentModal');
  const studentForm = document.getElementById('studentForm');

  function openStudentModal(id){
    const s = id ? getStudentById(id) : null;
    document.getElementById('studentModalTitle').textContent = s ? `Edit ${s.name}` : 'Add student';
    document.getElementById('sfId').value = s ? s.id : '';
    document.getElementById('sfName').value = s ? s.name : '';
    document.getElementById('sfRoom').value = s ? s.room : '';
    document.getElementById('sfContact').value = s ? s.contact : '';
    document.getElementById('sfUsername').value = s ? s.username : '';
    document.getElementById('sfPassword').value = s ? s.password : '';
    document.getElementById('sfJoined').value = s ? s.joined : new Date().toISOString().slice(0,10);
    document.getElementById('sfCourse').value = s ? s.course : '';
    document.getElementById('sfSharing').value = s ? s.sharing : '';
    document.getElementById('sfGuardian').value = s ? s.guardian : '';
    document.getElementById('sfBloodGroup').value = s ? s.bloodGroup : '';
    document.getElementById('sfRollNumber').value = s ? s.rollNumber : '';
    document.getElementById('sfAadhaar').value = s ? s.aadhaar : '';
    document.getElementById('sfNote').value = s ? s.registerNote : '';
    studentModal.classList.add('open');
  }
  function closeStudentModal(){ studentModal.classList.remove('open'); studentForm.reset(); }

  document.getElementById('addStudentBtn').addEventListener('click', ()=> openStudentModal(null));
  document.getElementById('studentModalClose').addEventListener('click', closeStudentModal);
  document.getElementById('studentModalCancel').addEventListener('click', closeStudentModal);
  studentModal.addEventListener('click', (e)=>{ if(e.target === studentModal) closeStudentModal(); });

  studentForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const id = document.getElementById('sfId').value;
    const contact = document.getElementById('sfContact').value.trim();
    const usernameInput = document.getElementById('sfUsername').value.trim();
    const payload = {
      name: document.getElementById('sfName').value.trim(),
      room: document.getElementById('sfRoom').value.trim(),
      contact,
      username: usernameInput || contact,
      password: document.getElementById('sfPassword').value.trim(),
      joined: document.getElementById('sfJoined').value,
      course: document.getElementById('sfCourse').value.trim(),
      sharing: document.getElementById('sfSharing').value.trim(),
      guardian: document.getElementById('sfGuardian').value.trim(),
      bloodGroup: document.getElementById('sfBloodGroup').value.trim(),
      rollNumber: document.getElementById('sfRollNumber').value.trim(),
      aadhaar: document.getElementById('sfAadhaar').value.trim(),
      registerNote: document.getElementById('sfNote').value.trim()
    };
    if(id){
      updateStudent(id, payload);
    }else{
      addStudent(payload);
    }
    closeStudentModal();
    populateRoomFilter();
    renderStudents();
    renderStats();
    renderHeadcount();
  });

  /* ---- headcount (read-only — this replaces the old outing-approval queue) ---- */
  function renderHeadcount(){
    const hc = getHeadcount();
    document.getElementById('headcountSummary').textContent =
      `${hc.present} of ${hc.total} students are in the hostel right now. ${hc.away} away.`;
    document.getElementById('headcountTable').innerHTML = hc.awayList.map(a => `
      <tr>
        <td><b>${a.student.name}</b><br><span class="muted">${a.student.id}</span></td>
        <td>${a.student.room} · ${a.student.block}</td>
        <td>${a.daysAway} day${a.daysAway==1?'':'s'}</td>
        <td>${a.returnDate}</td>
      </tr>`).join('') || `<tr><td colspan="4" class="empty-state">Nobody's marked away right now — everyone's in.</td></tr>`;
  }
  document.getElementById('exportPresence').addEventListener('click', ()=>{
    const hc = getHeadcount();
    const awayIds = new Set(hc.awayList.map(a=>a.studentId));
    const rows = getStudents().map(s => {
      const rec = hc.awayList.find(a=>a.studentId===s.id);
      return { student: s.name, status: awayIds.has(s.id) ? 'Away' : 'Present', daysAway: rec?rec.daysAway:'', returnDate: rec?rec.returnDate:'' };
    });
    const csv = toCSV(rows, [
      {label:'Student', get:r=>r.student}, {label:'Status', get:r=>r.status},
      {label:'Days away', get:r=>r.daysAway}, {label:'Return date', get:r=>r.returnDate}
    ]);
    downloadCSV('mvr-headcount.csv', csv);
  });

  /* ---- reports table ---- */
  function renderReports(){
    const nameFor = id => (getStudentById(id) || {}).name || id;
    const roomFor = id => { const s = getStudentById(id); return s ? `${s.room} · ${s.block}` : ''; };
    const rows = getReports();
    document.getElementById('reportTable').innerHTML = rows.map(r => `
      <tr>
        <td class="idcell">${r.id}</td>
        <td><b>${nameFor(r.studentId)}</b><br><span class="muted">${roomFor(r.studentId)}</span></td>
        <td>${r.category}</td>
        <td>${r.description}</td>
        <td><span class="status-pill ${statusClass(r.status)}">${r.status}</span></td>
        <td>
          <div class="row-actions">
            ${r.status!=='Resolved' ? `
              <button class="btn btn-sm btn-ink" data-review="${r.id}">Mark reviewing</button>
              <button class="btn btn-sm btn-outline" data-resolve="${r.id}">Mark resolved</button>
            ` : `<span class="muted">${r.remark || '—'}</span>`}
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="6" class="empty-state">No reports submitted yet.</td></tr>`;

    document.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click', ()=>{
      updateReportStatus(b.dataset.review, 'Reviewing', '');
      renderReports(); renderStats();
    }));
    document.querySelectorAll('[data-resolve]').forEach(b=>b.addEventListener('click', ()=>{
      const note = prompt('Note on how this was resolved?') || 'Resolved';
      updateReportStatus(b.dataset.resolve, 'Resolved', note);
      renderReports(); renderStats();
    }));
  }

  /* ---- notices ---- */
  function renderNoticesAdmin(){
    document.getElementById('adminNoticeList').innerHTML = getNotices().map(n => `
      <div class="n-item"><div class="notice-date">${n.date}</div>
        <div class="notice-body"><b>${n.title}</b><span>${n.body}</span></div></div>`).join('');
  }
  document.getElementById('noticeForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    addNotice({ title: document.getElementById('noticeTitle').value, body: document.getElementById('noticeBody').value });
    e.target.reset();
    renderNoticesAdmin();
  });

  renderStats();
  populateRoomFilter();
  renderStudents();
  renderHeadcount();
  renderReports();
  renderNoticesAdmin();
})();
