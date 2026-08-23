/* ============================================================
   MVR DULUX BOYS HOSTEL — data layer
   --------------------------------------------------------------
   DEMO DATA STORE. Everything here lives in the browser's
   localStorage so the site is fully functional the moment you
   open it — no server needed to try it out. Open the Student
   Portal and the Admin Portal in two tabs of the SAME browser
   and you'll see presence / reports flow between them live,
   because they share one localStorage.

   IMPORTANT — before this goes live with real student data:
   localStorage lives only in one browser on one device, and the
   demo passwords below are stored in plain text in this file,
   visible to anyone who views the page source. That's fine for
   a demo, not for a real hostel roll with real students. See
   README.md for how to swap this file for a real backend
   (Supabase, the same approach used on srimedhaedu.in) without
   touching any other page.

   AADHAAR NUMBERS — extra caution:
   Each student record below includes a demo Aadhaar number.
   This is a sensitive Indian government ID number. This site
   never displays the full number anywhere in the UI — every
   screen and CSV export only ever shows maskAadhaar()'s output
   (last 4 digits). Do NOT add code that prints the raw
   `aadhaar` field to the page. Before using this with real
   students' real Aadhaar numbers, this needs a real backend
   with encryption at rest and proper access control — a static
   client-side site with plaintext localStorage is not a safe
   place to hold real government ID numbers, full stop.
   ============================================================ */

const DB_KEYS = {
  students: 'mvr_students',
  presence: 'mvr_presence',
  reports:  'mvr_reports',
  notices:  'mvr_notices',
  session:  'mvr_session'
};

const SEED_STUDENTS = [
  {
    id: 'MVR24-101',
    username: 'arjun101',
    password: 'hostel@123',
    name: 'Arjun Reddy',
    course: 'B.Tech ECE, II Year',
    block: 'A Block',
    room: 'A-204',
    sharing: '4-Sharing',
    joined: '2025-06-14',
    guardian: 'S. Reddy (father) · 9876543210',
    contact: '9000011101',
    aadhaar: '482156709124',
    bloodGroup: 'B+'
  },
  {
    id: 'MVR24-102',
    username: 'karthik102',
    password: 'hostel@123',
    name: 'Karthik Rao',
    course: 'B.Tech CSE, III Year',
    block: 'B Block',
    room: 'B-311',
    sharing: '5-Sharing',
    joined: '2024-07-02',
    guardian: 'M. Rao (father) · 9876501234',
    contact: '9000011102',
    aadhaar: '739021458867',
    bloodGroup: 'O+'
  },
  {
    id: 'MVR24-103',
    username: 'sameer103',
    password: 'hostel@123',
    name: 'Sameer Khan',
    course: 'B.Tech Mechanical, I Year',
    block: 'C Block',
    room: 'C-108',
    sharing: '8-Sharing',
    joined: '2026-06-20',
    guardian: 'A. Khan (father) · 9876512345',
    contact: '9000011103',
    aadhaar: '615478932045',
    bloodGroup: 'A+'
  }
];

const SEED_NOTICES = [
  { date: '2026-08-20', title: 'Mess menu updated for the week', body: 'Friday dinner changed to paneer butter masala. Full menu on the notice board outside the mess hall.' },
  { date: '2026-08-18', title: 'Water tank cleaning — B Block', body: 'B Block water supply will pause 10 AM–1 PM on Aug 24 for scheduled tank cleaning.' },
  { date: '2026-08-12', title: 'Mark yourself before you leave', body: 'Please use the "Going out" button whenever you will miss a mess meal — it helps us cook the right quantity.' }
];

function seedIfEmpty(key, seed){
  if(!localStorage.getItem(key)){
    localStorage.setItem(key, JSON.stringify(seed));
  }
}
function initDB(){
  seedIfEmpty(DB_KEYS.students, SEED_STUDENTS);
  seedIfEmpty(DB_KEYS.presence, []);
  seedIfEmpty(DB_KEYS.reports, []);
  seedIfEmpty(DB_KEYS.notices, SEED_NOTICES);
}
initDB();

function readStore(key){ try{ return JSON.parse(localStorage.getItem(key)) || []; }catch(e){ return []; } }
function writeStore(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

/* ---------- students ---------- */
function getStudents(){ return readStore(DB_KEYS.students); }
function findStudentByLogin(username, password){
  return getStudents().find(s => s.username.toLowerCase() === username.trim().toLowerCase() && s.password === password);
}
function getStudentById(id){ return getStudents().find(s => s.id === id); }

/* Never render the raw aadhaar field — always go through this. */
function maskAadhaar(number){
  if(!number) return '—';
  const digits = String(number).replace(/\s+/g,'');
  return 'XXXX XXXX ' + digits.slice(-4);
}

/* ---------- presence (headcount for the mess, not a permission system) ---------- */
// A student with no entry here is simply "Present". An entry means "Away"
// until the stored return date, at which point they press "I'm back" and
// the entry is removed.
function getAwayRecord(studentId){
  return readStore(DB_KEYS.presence).find(p => p.studentId === studentId) || null;
}
function isAway(studentId){ return !!getAwayRecord(studentId); }
function markAway(studentId, daysAway, returnDate){
  const all = readStore(DB_KEYS.presence).filter(p => p.studentId !== studentId);
  all.push({ studentId, daysAway: Number(daysAway), returnDate, since: new Date().toISOString() });
  writeStore(DB_KEYS.presence, all);
}
function markPresent(studentId){
  const all = readStore(DB_KEYS.presence).filter(p => p.studentId !== studentId);
  writeStore(DB_KEYS.presence, all);
}
function getHeadcount(){
  const students = getStudents();
  const away = readStore(DB_KEYS.presence);
  const awayIds = new Set(away.map(a => a.studentId));
  const awayList = away.map(a => ({ ...a, student: getStudentById(a.studentId) })).filter(a => a.student);
  return {
    total: students.length,
    present: students.length - awayIds.size,
    away: awayIds.size,
    awayList
  };
}

/* ---------- reports ---------- */
function getReports(){ return readStore(DB_KEYS.reports).sort((a,b)=> b.createdAt.localeCompare(a.createdAt)); }
function getReportsFor(studentId){ return getReports().filter(r => r.studentId === studentId); }
function addReport(entry){
  const all = readStore(DB_KEYS.reports);
  const rec = {
    id: 'RPT-' + Date.now().toString(36).toUpperCase(),
    status: 'Submitted',
    createdAt: new Date().toISOString(),
    remark: '',
    ...entry
  };
  all.push(rec);
  writeStore(DB_KEYS.reports, all);
  return rec;
}
function updateReportStatus(id, status, remark){
  const all = readStore(DB_KEYS.reports);
  const rec = all.find(r => r.id === id);
  if(rec){ rec.status = status; rec.remark = remark || rec.remark; }
  writeStore(DB_KEYS.reports, all);
}

/* ---------- notices ---------- */
function getNotices(){ return readStore(DB_KEYS.notices).sort((a,b)=> b.date.localeCompare(a.date)); }
function addNotice(entry){
  const all = readStore(DB_KEYS.notices);
  all.push({ date: new Date().toISOString().slice(0,10), ...entry });
  writeStore(DB_KEYS.notices, all);
}

/* ---------- session ---------- */
function setSession(role, id){ sessionStorage.setItem(DB_KEYS.session, JSON.stringify({ role, id })); }
function getSession(){ try{ return JSON.parse(sessionStorage.getItem(DB_KEYS.session)); }catch(e){ return null; } }
function clearSession(){ sessionStorage.removeItem(DB_KEYS.session); }

/* ---------- csv export ---------- */
function toCSV(rows, columns){
  const head = columns.map(c=>c.label).join(',');
  const body = rows.map(r => columns.map(c => {
    let v = c.get(r); v = (v===undefined||v===null) ? '' : String(v).replace(/"/g,'""');
    return /[,"\n]/.test(v) ? `"${v}"` : v;
  }).join(',')).join('\n');
  return head + '\n' + body;
}
function downloadCSV(filename, csv){
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
