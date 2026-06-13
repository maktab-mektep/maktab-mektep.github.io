document.getElementById('participants-toggle').addEventListener('click', () => {
  const toggle = document.getElementById('participants-toggle');
  const list = document.getElementById('participants-list');
  const isOpen = toggle.classList.toggle('open');
  list.style.display = isOpen ? 'block' : 'none';
});

fetch('participants.md')
  .then(r => r.text())
  .then(md => {
    const container = document.getElementById('participants-list');
    const names = md.split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.replace('- ', ''));
    container.innerHTML = `<div class="participant">${names.join(', ')}</div>`;
  });
