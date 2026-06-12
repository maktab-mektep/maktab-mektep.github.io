fetch('schedule.md')
  .then(r => r.text())
  .then(md => {
    const container = document.getElementById('schedule');
    const lines = md.split('\n');
    let html = '';
    let inDay = false;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (inDay) html += '</div>';
        const title = line.replace('## ', '').toUpperCase();
        html += `<div class="day-block"><hr><h2 class="day-title">${title}</h2>`;
        inDay = true;
      } else if (line.startsWith('- ')) {
        const content = line.replace('- ', '');
        const sep = content.indexOf(' | ');
        if (sep === -1) continue;
        const time = content.slice(0, sep);
        const title = content.slice(sep + 3);
        html += `<div class="event-row"><span class="event-time">${time}</span><span class="event-title">${title}</span></div>`;
      }
    }
    if (inDay) html += '</div>';
    container.innerHTML = html;
  });
