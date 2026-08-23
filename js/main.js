/* Shared UI behaviors — notice ticker, gallery lightbox, FAQ accordion */
document.addEventListener('DOMContentLoaded', ()=>{

  /* ---- notice ticker (visitor.html reads live notices if data.js is loaded) ---- */
  const track = document.querySelector('.ticker-track');
  if(track && typeof getNotices === 'function'){
    const items = getNotices().slice(0,5).map(n => `<span>&#9679; ${n.title}</span>`).join('');
    track.innerHTML = items + items; // duplicate for seamless loop
  }

  /* ---- photo lightbox ---- */
  const lightbox = document.getElementById('lightbox');
  if(lightbox){
    const lbImg = lightbox.querySelector('img');
    const lbCap = lightbox.querySelector('.lb-cap');
    const links = Array.from(document.querySelectorAll('.album a'));
    let idx = 0;

    function show(i){
      idx = (i + links.length) % links.length;
      const a = links[idx];
      lbImg.src = a.href;
      lbCap.textContent = a.dataset.caption || '';
      lightbox.classList.add('open');
    }
    links.forEach((a,i)=>{
      a.addEventListener('click', (e)=>{ e.preventDefault(); show(i); });
    });
    lightbox.querySelector('.lb-close').addEventListener('click', ()=> lightbox.classList.remove('open'));
    lightbox.querySelector('.lb-prev').addEventListener('click', ()=> show(idx-1));
    lightbox.querySelector('.lb-next').addEventListener('click', ()=> show(idx+1));
    lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) lightbox.classList.remove('open'); });
    document.addEventListener('keydown', (e)=>{
      if(!lightbox.classList.contains('open')) return;
      if(e.key === 'Escape') lightbox.classList.remove('open');
      if(e.key === 'ArrowRight') show(idx+1);
      if(e.key === 'ArrowLeft') show(idx-1);
    });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item .faq-q').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      btn.closest('.faq-item').classList.toggle('open');
    });
  });

  /* ---- mobile nav toggle ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', ()=> navLinks.classList.toggle('open'));
  }
});
