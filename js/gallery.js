document.addEventListener('DOMContentLoaded', () => {
  const tile = document.getElementById('moreAlbumTile');
  const modal = document.getElementById('galleryModal');
  if(!tile || !modal) return;
  const grid = document.getElementById('galleryGrid');

  async function loadPhotos(){
    grid.innerHTML = '<p class="muted">Loading photos…</p>';
    const photos = await getGalleryPhotos();
    if(!photos.length){ grid.innerHTML = '<p class="muted">No extra photos yet — check back soon.</p>'; return; }
    grid.innerHTML = photos.map(p => `
      <a href="${p.url}" target="_blank" rel="noopener">
        <img loading="lazy" src="${p.url}" alt="${p.caption || 'Hostel photo'}"><span class="cap">${p.caption || ''}</span>
      </a>`).join('');
  }
  tile.addEventListener('click', (e)=>{ e.preventDefault(); modal.classList.add('open'); loadPhotos(); });
  document.getElementById('galleryModalClose').addEventListener('click', ()=> modal.classList.remove('open'));
  modal.addEventListener('click', (e)=>{ if(e.target === modal) modal.classList.remove('open'); });
});
