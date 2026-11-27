// Renderers turn markdown text into a panel's HTML content.
const renderers = {
  // Blank-line-separated paragraphs.
  paragraphs(md, panel) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const linkify = s => esc(s).replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, text, url) => `<a href="${url}" target="_blank" rel="noopener">${text}</a>`
    );
    md.trim().split(/\n\s*\n/).forEach((para, i) => {
      const p = document.createElement('p');
      p.className = 'about-text';
      if (i > 0) p.style.marginLeft = (i * 100) + 'px';
      p.innerHTML = linkify(para.trim());
      panel.appendChild(p);
    });
  },

  // A thumbnail grid that opens a fullscreen lightbox carousel on click.
  gallery(md, panel) {
    const imgs = md.trim().split('\n').map(s => s.trim()).filter(Boolean);
    if (!imgs.length) return;

    // Horizontal filmstrip of thumbnails, browsed with arrow buttons.
    const scroller = document.createElement('div');
    scroller.className = 'gallery-scroller';

    const strip = document.createElement('div');
    strip.className = 'gallery-strip';
    imgs.forEach((src, idx) => {
      const thumb = document.createElement('img');
      thumb.className = 'gallery-thumb';
      thumb.src = src;
      thumb.alt = '';
      thumb.loading = 'lazy';
      thumb.addEventListener('click', () => open(idx));
      const classify = () => {
        if (thumb.naturalWidth > thumb.naturalHeight) thumb.classList.add('landscape');
      };
      if (thumb.complete && thumb.naturalWidth) classify();
      else thumb.addEventListener('load', classify);
      strip.appendChild(thumb);
    });

    const left = document.createElement('button');
    left.className = 'carousel-nav carousel-prev strip-nav';
    left.setAttribute('aria-label', 'Scroll left');

    const right = document.createElement('button');
    right.className = 'carousel-nav carousel-next strip-nav';
    right.setAttribute('aria-label', 'Scroll right');

    // Below 1000px each thumb fills the viewport, so page by a full image.
    const step = () => window.innerWidth <= 1000 ? strip.clientWidth : Math.max(strip.clientWidth * 0.8, 200);
    left.addEventListener('click', () => strip.scrollBy({ left: -step(), behavior: 'smooth' }));
    right.addEventListener('click', () => strip.scrollBy({ left: step(), behavior: 'smooth' }));

    scroller.append(left, strip, right);
    panel.appendChild(scroller);

    // Fullscreen lightbox (built once, reused).
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `
      <button class="lightbox-close" aria-label="Close">×</button>
      <button class="carousel-nav carousel-prev" aria-label="Previous photo"></button>
      <img class="lightbox-img" alt="">
      <button class="carousel-nav carousel-next" aria-label="Next photo"></button>
      <div class="lightbox-counter"></div>`;
    const bigImg = box.querySelector('.lightbox-img');
    const counter = box.querySelector('.lightbox-counter');
    let i = 0;

    const show = n => {
      i = (n + imgs.length) % imgs.length;
      bigImg.src = imgs[i];
      counter.textContent = `${i + 1} / ${imgs.length}`;
    };
    const open = n => { show(n); box.classList.add('open'); };
    const close = () => box.classList.remove('open');

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.carousel-prev').addEventListener('click', () => show(i - 1));
    box.querySelector('.carousel-next').addEventListener('click', () => show(i + 1));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'ArrowRight') show(i + 1);
    });
    document.body.appendChild(box);
  },

  // A placeholder video area with a big play button, then paragraphs below.
  film(md, panel) {
    const placeholder = document.createElement('div');
    placeholder.className = 'film-placeholder';
    const play = document.createElement('button');
    play.className = 'play-button';
    play.setAttribute('aria-label', 'Play film');
    placeholder.appendChild(play);
    panel.appendChild(placeholder);
    this.paragraphs(md, panel);
  },

  // Gratitude text followed by the partner logos image.
  partners(md, panel) {
    this.paragraphs(md, panel);
    const img = document.createElement('img');
    img.id = 'partner-logos';
    img.src = 'logos.png';
    img.alt = 'Partner logos';
    panel.appendChild(img);
  },

  // Two columns marked by COL1: / COL2: in the source.
  columns(md, panel) {
    const pick = marker => (md.split(marker)[1] || '').split(/^COL\d:/m)[0].trim();
    ['COL1:', 'COL2:'].forEach((marker, i) => {
      const col = document.createElement('div');
      col.className = 'col' + (i + 1);
      col.textContent = pick(marker);
      panel.appendChild(col);
    });
  },

  // Day-by-day programme with time | title rows.
  schedule(md, panel) {
    let html = '';
    let inDay = false;
    for (const line of md.split('\n')) {
      if (line.startsWith('## ')) {
        if (inDay) html += '</div>';
        const title = line.replace('## ', '').toUpperCase();
        const dateMatch = title.match(/(\d+)\.(\d+)/);
        let pastClass = '';
        if (dateMatch) {
          const today = new Date();
          const eventDate = new Date(today.getFullYear(), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
          eventDate.setHours(23, 59, 59);
          if (eventDate < today) pastClass = ' past';
        }
        html += `<div class="day-block${pastClass}">${inDay ? '<hr>' : ''}<h2 class="day-title">${title}</h2>`;
        inDay = true;
      } else if (line.startsWith('- ')) {
        const content = line.replace('- ', '');
        const sep = content.indexOf(' | ');
        if (sep === -1) continue;
        html += `<div class="event-row"><span class="event-time">${content.slice(0, sep)}</span><span class="event-title">${content.slice(sep + 3)}</span></div>`;
      }
    }
    if (inDay) html += '</div>';
    panel.innerHTML = html;
  },
};

document.querySelectorAll('.accordion-panel').forEach(panel => {
  const toggle = panel.previousElementSibling;
  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('open');
    panel.classList.toggle('open', isOpen);
  });

  const src = panel.dataset.src;
  if (!src) return;
  fetch(src)
    .then(r => r.text())
    .then(md => renderers[panel.dataset.render](md, panel));
});

// Spook the butterfly: hover it and it flutters off, then drifts back.
const butterfly = document.getElementById('butterfly2');
if (butterfly) {
  let away = false;
  butterfly.addEventListener('mouseenter', () => {
    if (away) return;
    away = true;
    butterfly.classList.remove('back');
    butterfly.classList.add('flew');
    setTimeout(() => {
      butterfly.classList.remove('flew');
      butterfly.classList.add('back');
      setTimeout(() => {
        butterfly.classList.remove('back');
        away = false;
      }, 1800);
    }, 4000);
  });
}

