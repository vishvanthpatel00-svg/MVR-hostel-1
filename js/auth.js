/* Login page logic — tabs between Student and Admin (Warden) login */
(function(){
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin@123';

  const tabs = document.querySelectorAll('.login-tabs button');
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const roleField = document.getElementById('roleField');
  const demoBox = document.getElementById('demoBox');
  let role = 'student';

  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      role = btn.dataset.role;
      roleField.textContent = role === 'admin' ? 'Warden / Admin sign in' : 'Student sign in';
      demoBox.innerHTML = role === 'admin'
        ? 'Demo login — username <b>admin</b>, password <b>admin@123</b>'
        : 'Demo login — username <b>arjun101</b>, password <b>hostel@123</b>';
      errorBox.classList.remove('show');
    });
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if(role === 'admin'){
      if(u.trim() === ADMIN_USER && p === ADMIN_PASS){
        setSession('admin', 'admin');
        window.location.href = 'admin.html';
      } else {
        errorBox.textContent = "That username or password doesn't match a warden account.";
        errorBox.classList.add('show');
      }
      return;
    }

    const student = findStudentByLogin(u, p);
    if(student){
      setSession('student', student.id);
      window.location.href = 'student-dashboard.html';
    } else {
      errorBox.textContent = "That username or password doesn't match a student record. Check with the warden if you've forgotten yours.";
      errorBox.classList.add('show');
    }
  });
})();
