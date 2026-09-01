(function(){
  const session = getSession();
  if(!session || session.role !== 'student'){
    window.location.href = 'login.html';
    return;
  }
  const student = getStudentById(session.id);
  if(!student){ clearSession(); window.location.href = 'login.html'; return; }

  /* ---- header / ID card ---- */
  const orDash = v => (v && String(v).trim()) ? v : '—';
  document.getElementById('studentGreeting').textContent = student.name.split(' ')[0];
  document.getElementById('idInitials').textContent = student.name.split(' ').map(n=>n[0]).join('').slice(0,2);
  document.getElementById('idName').textContent = student.name;
  document.getElementById('idId').textContent = student.id;
  document.getElementById('idRoom').innerHTML = `<b>${orDash(student.room)}</b>`;
  document.getElementById('idBlock').innerHTML = `<b>${orDash(student.block)}</b>`;
  document.getElementById('idSharing').innerHTML = `<b>${orDash(student.sharing)}</b>`;
  document.getElementById('idCourse').innerHTML = `<b>${orDash(student.course)}</b>`;

  document.getElementById('profCourse').textContent = orDash(student.course);
  document.getElementById('profJoined').textContent = orDash(student.joined);
  document.getElementById('profGuardian').textContent = orDash(student.guardian);
  document.getElementById('profContact').textContent = orDash(student.contact);
  document.getElementById('profAadhaar').textContent = maskAadhaar(student.aadhaar);
  document.getElementById('profRollNumber').textContent = orDash(student.rollNumber);
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    clearSession();
    window.location.href = 'index.html';
  });

  /* ---- tabs ---- */
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  const statusClass = s => 'status-' + s.toLowerCase();

  /* ---- presence: are you in the hostel? ---- */
  function renderPresence(){
    const box = document.getElementById('presenceBlock');
    const tabPill = document.getElementById('outingTabPill');
    const away = getAwayRecord(student.id);

    if(away){
      tabPill.textContent = 'Away';
      tabPill.className = 'status-pill status-pending';
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <span class="status-pill status-pending">Away</span>
          <span class="muted">Back by <b style="color:var(--ink)">${away.returnDate}</b> (${away.daysAway} day${away.daysAway==1?'':'s'})</span>
        </div>
        <button id="imBackBtn" class="btn btn-ink btn-sm" style="margin-top:16px;">I'm back</button>
      `;
      document.getElementById('imBackBtn').addEventListener('click', ()=>{
        markPresent(student.id);
        renderPresence();
      });
    } else {
      tabPill.textContent = 'Present';
      tabPill.className = 'status-pill status-approved';
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <span class="status-pill status-approved">Present</span>
          <button id="goingOutBtn" class="btn btn-outline btn-sm">Going out</button>
        </div>
        <div id="goingOutForm" style="display:none;margin-top:18px;max-width:360px;">
          <div class="field">
            <label for="goDays">How many days will you be away?</label>
            <input id="goDays" type="number" min="1" value="1" required>
          </div>
          <div class="field">
            <label for="goBack">When will you be back?</label>
            <input id="goBack" type="date" required>
          </div>
          <button id="goConfirm" class="btn btn-ink">I'm heading out</button>
        </div>
      `;
      document.getElementById('goingOutBtn').addEventListener('click', ()=>{
        document.getElementById('goingOutForm').style.display = 'block';
        document.getElementById('goingOutBtn').style.display = 'none';
      });
      document.getElementById('goConfirm').addEventListener('click', ()=>{
        const days = document.getElementById('goDays').value;
        const back = document.getElementById('goBack').value;
        if(!days || !back) return;
        markAway(student.id, days, back);
        renderPresence();
      });
    }
  }

  /* ---- reports ---- */
  function renderReports(){
    const list = getReportsFor(student.id);
    const box = document.getElementById('reportList');
    document.getElementById('reportCount').textContent = list.length;
    if(!list.length){ box.innerHTML = '<div class="empty-state">No reports submitted yet.</div>'; return; }
    box.innerHTML = list.map(r => `
      <div class="list-row">
        <div class="lr-main">
          <b>${r.category}</b>
          <span>${r.description}</span>
          ${r.remark ? `<span> · Warden note: ${r.remark}</span>` : ''}
        </div>
        <div class="lr-meta">
          <span class="status-pill ${statusClass(r.status)}">${r.status}</span><br>
          ${new Date(r.createdAt).toLocaleDateString()}
        </div>
      </div>`).join('');
  }
  document.getElementById('reportForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    addReport({
      studentId: student.id,
      category: document.getElementById('repCategory').value,
      description: document.getElementById('repDesc').value
    });
    e.target.reset();
    renderReports();
    document.getElementById('reportMsg').textContent = 'Sent to the hostel admin.';
    setTimeout(()=> document.getElementById('reportMsg').textContent = '', 4000);
  });

  /* ---- notices ---- */
  function renderNotices(){
    const box = document.getElementById('noticeList');
    box.innerHTML = getNotices().map(n => `
      <div class="n-item">
        <div class="notice-date">${n.date}</div>
        <div class="notice-body"><b>${n.title}</b><span>${n.body}</span></div>
      </div>`).join('');
  }

  renderPresence();
  renderReports();
  renderNotices();
})();
