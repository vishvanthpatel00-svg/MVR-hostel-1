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
  function renderStudents(){
    const q = (document.getElementById('studentSearch').value || '').toLowerCase();
    const block = document.getElementById('blockFilter').value;
    let rows = getStudents();
    if(q) rows = rows.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.room.toLowerCase().includes(q));
    if(block) rows = rows.filter(s => s.block === block);
    document.getElementById('studentTable').innerHTML = rows.map(s => `
      <tr>
        <td class="idcell">${s.id}</td>
        <td><b>${s.name}</b><br><span class="muted">${s.course}</span></td>
        <td>${s.room}<br><span class="muted">${s.block} · ${s.sharing}</span></td>
        <td>${s.contact}</td>
        <td class="idcell">${maskAadhaar(s.aadhaar)}</td>
        <td>${isAway(s.id) ? '<span class="status-pill status-pending">Away</span>' : '<span class="status-pill status-approved">Present</span>'}</td>
      </tr>`).join('') || `<tr><td colspan="6" class="empty-state">No students match that search.</td></tr>`;
  }
  document.getElementById('studentSearch').addEventListener('input', renderStudents);
  document.getElementById('blockFilter').addEventListener('change', renderStudents);
  document.getElementById('exportStudents').addEventListener('click', ()=>{
    const csv = toCSV(getStudents(), [
      {label:'ID', get:s=>s.id}, {label:'Name', get:s=>s.name}, {label:'Course', get:s=>s.course},
      {label:'Block', get:s=>s.block}, {label:'Room', get:s=>s.room}, {label:'Sharing', get:s=>s.sharing},
      {label:'Contact', get:s=>s.contact}, {label:'Guardian', get:s=>s.guardian}, {label:'Aadhaar', get:s=>maskAadhaar(s.aadhaar)}
    ]);
    downloadCSV('mvr-students.csv', csv);
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
  renderStudents();
  renderHeadcount();
  renderReports();
  renderNoticesAdmin();
})();
