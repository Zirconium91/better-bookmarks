// Apply the saved theme before the page is painted.
(function () {
    try {
      // Load theme
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');

      // Load accent color before paint to avoid flashing
      var savedSettings = localStorage.getItem('dashboard-settings-v1');
      if (savedSettings) {
        var s = JSON.parse(savedSettings);
        if (s.accent) document.documentElement.setAttribute('data-accent', s.accent);
        document.documentElement.dataset.showSearch = s.showSearch !== false;
      }
    } catch (e) {
      document.documentElement.dataset.theme = 'dark';
    }
  })();

// Initialise controls only after the page markup is ready.
document.addEventListener("DOMContentLoaded", () => {
/* ---- Global Settings State ---- */
  let settings = {
    noBlur: false,
    showSearch: true,
    waveSpeed: 'medium',
    accent: 'blue'
  };

  try {
    const savedSettings = localStorage.getItem('dashboard-settings-v1');
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }
  } catch (e) {}

  settings.showSearch = settings.showSearch !== false;

  const speeds = { slow: 10, medium: 30, fast: 70 };
  if (!(settings.waveSpeed in speeds)) {
    settings.waveSpeed = settings.waveSpeed <= 15 ? 'slow' : settings.waveSpeed >= 60 ? 'fast' : 'medium';
  }

  function saveSettings() {
    try {
      localStorage.setItem('dashboard-settings-v1', JSON.stringify(settings));
    } catch (e) {}
  }

  function applySettings() {
    document.documentElement.dataset.showSearch = settings.showSearch;
    document.querySelector('.search-container').hidden = !settings.showSearch;
    document.getElementById('setting-search').checked = settings.showSearch;
    document.body.classList.toggle('no-blur', settings.noBlur);
    document.getElementById('setting-blur').checked = settings.noBlur;
    document.getElementById('setting-speed').value = settings.waveSpeed;
    
    // Apply accent color
    document.documentElement.setAttribute('data-accent', settings.accent);
    document.querySelectorAll('.accent-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.color === settings.accent);
    });
  }
  applySettings();

  /* ---- Theme Toggle ---- */
  (function () {
    var root = document.documentElement;
    var btn  = document.getElementById('theme-toggle');

    function render() {
      var isDark = root.dataset.theme === 'dark';
      btn.textContent = isDark ? '☀' : '☾';
      var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
    render();

    btn.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      render();
    });
  })();

  /* ---- Keyboard Shortcuts ---- */
  document.addEventListener('keydown', function(e) {
    var searchInput = document.getElementById('web-search');
    var bookmarkDialog = document.getElementById('bookmark-dialog');
    var settingsDialog = document.getElementById('settings-dialog');
    
    if (!settings.showSearch || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || bookmarkDialog.open || settingsDialog.open) {
      return;
    }

    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  /* ---- Bookmark Data & Logic ---- */
  const grid = document.getElementById('dashboard-grid');
  const datalist = document.getElementById('group-list');
  const status = document.getElementById('status');
  function readSaved(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function persist(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { status.textContent = 'Changes work for this session, but could not be saved in this browser.'; }
  }
  let bookmarks = readSaved('dashboard-bookmarks-v2', []);
  if (!Array.isArray(bookmarks)) bookmarks = [];
  bookmarks = bookmarks.filter(b => b && ['name', 'url', 'group'].every(k => typeof b[k] === 'string'));
  let groupOrder = readSaved('dashboard-group-order-v1', []);
  if (!Array.isArray(groupOrder)) groupOrder = [];
  function action(label, text, kind) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row-action';
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.dataset.action = kind;
    return button;
  }
  function updateMoveButtons() {
    [...grid.children].forEach((section, index) => {
      section.querySelector('[data-action="previous"]').disabled = index === 0;
      section.querySelector('[data-action="next"]').disabled = index === grid.children.length - 1;
    });
  }
  function renderDashboard() {
    const grouped = new Map();
    bookmarks.forEach((bookmark, index) => {
      if (!grouped.has(bookmark.group)) grouped.set(bookmark.group, []);
      grouped.get(bookmark.group).push({ bookmark, index });
    });
    groupOrder = [...new Set([...groupOrder.filter(g => grouped.has(g)), ...grouped.keys()])];
    const fragment = document.createDocumentFragment();
    datalist.replaceChildren();
    for (const group of groupOrder) {
      const section = document.createElement('section');
      section.dataset.group = group;
      const heading = document.createElement('div');
      heading.className = 'section-heading';
      const title = document.createElement('h2');
      title.textContent = group;
      title.draggable = true;
      title.title = 'Drag to move this section, or use the arrow buttons';
      heading.append(title, action('Move section earlier', '←', 'previous'), action('Move section later', '→', 'next'));
      section.append(heading);
      for (const { bookmark, index } of grouped.get(group)) {
        const row = document.createElement('div');
        row.className = 'link-row';
        row.dataset.index = index;
        const link = document.createElement('a');
        // Keep stored labels as text and prevent executable bookmark URLs.
        try { if (['http:', 'https:', 'file:', 'ftp:', 'mailto:'].includes(new URL(bookmark.url).protocol)) link.href = bookmark.url; } catch {}
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = bookmark.name;
        row.append(link, action('Edit ' + bookmark.name, '✎', 'edit'), action('Delete ' + bookmark.name, '×', 'delete'));
        section.append(row);
      }
      fragment.append(section);
      const option = document.createElement('option');
      option.value = group;
      datalist.append(option);
    }
    grid.replaceChildren(fragment);
    updateMoveButtons();
  }
  function saveOrder() {
    groupOrder = [...grid.children].map(s => s.dataset.group);
    persist('dashboard-group-order-v1', groupOrder);
    updateMoveButtons();
  }
  const bookmarkDialog = document.getElementById('bookmark-dialog');
  const bookmarkForm = document.getElementById('bookmark-form');
  const nameInput = document.getElementById('bm-name');
  const urlInput = document.getElementById('bm-url');
  const groupInput = document.getElementById('bm-group');
  let editingIndex = null;
  function openBookmark(index = null) {
    editingIndex = index;
    bookmarkForm.reset();
    urlInput.setCustomValidity('');
    if (index !== null) {
      const b = bookmarks[index];
      nameInput.value = b.name;
      urlInput.value = b.url;
      groupInput.value = b.group;
    }
    bookmarkForm.querySelector('h2').textContent = index === null ? 'New Bookmark' : 'Edit Bookmark';
    bookmarkForm.querySelector('[type="submit"]').textContent = index === null ? 'Add Bookmark' : 'Save Changes';
    bookmarkDialog.showModal();
  }
  document.getElementById('add-btn').addEventListener('click', () => openBookmark());
  document.getElementById('cancel-btn').addEventListener('click', () => bookmarkDialog.close());
  urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));
  bookmarkForm.addEventListener('submit', e => {
    e.preventDefault();
    const bookmark = { name: nameInput.value.trim(), url: urlInput.value.trim(), group: groupInput.value.trim() };
    if (!bookmark.name || !bookmark.group) return;
    try {
      if (!['http:', 'https:', 'file:', 'ftp:', 'mailto:'].includes(new URL(bookmark.url).protocol)) throw Error();
    } catch {
      urlInput.setCustomValidity('Enter a valid web, file, FTP, or email URL.');
      urlInput.reportValidity();
      return;
    }
    if (editingIndex === null) bookmarks.push(bookmark);
    else bookmarks[editingIndex] = bookmark;
    persist('dashboard-bookmarks-v2', bookmarks);
    renderDashboard();
    saveOrder();
    bookmarkDialog.close();
  });
  grid.addEventListener('click', e => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const section = button.closest('section');
    const kind = button.dataset.action;
    if (kind === 'previous' || kind === 'next') {
      const neighbor = kind === 'previous' ? section.previousElementSibling : section.nextElementSibling;
      if (!neighbor) return;
      grid.insertBefore(section, kind === 'previous' ? neighbor : neighbor.nextElementSibling);
      saveOrder();
      button.focus();
      return;
    }
    const index = Number(button.closest('.link-row').dataset.index);
    if (kind === 'edit') openBookmark(index);
    else if (confirm(`Delete "${bookmarks[index].name}"?`)) {
      bookmarks.splice(index, 1);
      persist('dashboard-bookmarks-v2', bookmarks);
      renderDashboard();
      saveOrder();
    }
  });
  let dragged = null, dropTarget = null;
  function clearDrag() {
    dragged?.classList.remove('dragging');
    dropTarget?.classList.remove('drop-target');
    dragged = dropTarget = null;
  }
  grid.addEventListener('dragstart', e => {
    if (!e.target.matches('.section-heading h2')) { e.preventDefault(); return; }
    dragged = e.target.closest('section');
    dragged.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragged.dataset.group);
  });
  grid.addEventListener('dragover', e => {
    if (!dragged) return;
    const target = e.target.closest('section');
    if (!target || target === dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== target) {
      dropTarget?.classList.remove('drop-target');
      dropTarget = target;
      target.classList.add('drop-target');
    }
  });
  grid.addEventListener('drop', e => {
    if (!dragged) return;
    e.preventDefault();
    const target = e.target.closest('section');
    if (target && target !== dragged) {
      const sections = [...grid.children];
      grid.insertBefore(dragged, sections.indexOf(dragged) < sections.indexOf(target) ? target.nextElementSibling : target);
      saveOrder();
    }
    clearDrag();
  });
  grid.addEventListener('dragend', clearDrag);

  const settingsDialog = document.getElementById('settings-dialog');
  const settingsBtn = document.getElementById('settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings');

  settingsBtn.addEventListener('click', () => {
    settingsDialog.showModal();
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsDialog.close();
  });

  /* ---- Settings Inputs Logic ---- */
  document.getElementById('setting-search').addEventListener('change', (e) => {
    settings.showSearch = e.target.checked;
    saveSettings();
    applySettings();
  });

  document.getElementById('setting-blur').addEventListener('change', (e) => {
    settings.noBlur = e.target.checked;
    saveSettings();
    applySettings();
  });

  document.getElementById('setting-speed').addEventListener('change', (e) => {
    settings.waveSpeed = e.target.value;
    saveSettings();
    window.dispatchEvent(new Event('wave-settings-change'));
  });

  document.querySelectorAll('.accent-swatch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      settings.accent = e.target.dataset.color;
      saveSettings();
      applySettings();
    });
  });

  renderDashboard();

  /* ---- Animated Psychedelic Wave Background ---- */
  (function () {
    var canvas = document.getElementById('waves');
    var ctx = canvas.getContext('2d');
    var root = document.documentElement;
    // Decorative canvas: bound pixel cost and keep one cancellable frame owner.
    var w, h, t = 0;
    var frameId = null, lastTime = null, dirty = true;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var bgColor, lineColor;
    var frameInterval = 1000 / 30;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      var scale = Math.min(window.devicePixelRatio || 1, 1,
                           Math.sqrt(1200000 / (w * h)));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    if (!ctx) return;

    // Helper to convert hex to rgba
    function getAccentColor(alpha) {
      var style = getComputedStyle(document.documentElement);
      var hex = style.getPropertyValue('--accent').trim();
      if (hex.startsWith('#')) {
        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
      }
      return `rgba(120,174,237,${alpha})`; // Fallback
    }

    function drawFrame() {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const spacing = 45;
      const slope = 0.6;
      // Warp bounds: +/-60 horizontally, +/-120 vertically.
      const minX = -80, maxX = w + 80;
      const start_i = Math.floor((-140 - maxX * slope) / spacing);
      const end_i = Math.ceil((h + 140 - minX * slope) / spacing);

      for (let i = start_i; i < end_i; i++) {
        ctx.beginPath();
        const y_base = i * spacing;

        for (let x = minX; x <= maxX + 24; x += 24) {
          const y_line = x * slope + y_base;
          
          const warpX = Math.sin(y_line * 0.008 + t * 0.6) * 60;
          const warpY = 
              Math.sin(x * 0.006 + y_line * 0.004 + t * 0.8) * 80 +
              Math.sin(x * 0.01 - y_line * 0.002 + t * 1.2) * 40;

          const x_final = x + warpX;
          const y_final = y_line + warpY;

          if (x === minX) ctx.moveTo(x_final, y_final);
          else ctx.lineTo(x_final, y_final);
        }
        ctx.stroke();
      }
    }

    function animate() {
      return speeds[settings.waveSpeed] > 0 && !motion.matches &&
        !bookmarkDialog.open && !settingsDialog.open;
    }

    function schedule() {
      if (frameId === null && !document.hidden && (dirty || animate())) {
        frameId = requestAnimationFrame(loop);
      }
    }

    function loop(now) {
      frameId = null;
      if (document.hidden) return;
      var moving = animate();
      var elapsed = lastTime === null ? 0 : now - lastTime;
      if (dirty || lastTime === null || elapsed >= frameInterval - 0.5) {
        if (moving && lastTime !== null) {
          t += Math.min(elapsed, 100) * speeds[settings.waveSpeed] * 0.00003;
        }
        drawFrame();
        dirty = false;
        lastTime = now;
      }
      if (!moving) lastTime = null;
      schedule();
    }

    function refresh() {
      dirty = true;
      lastTime = null;
      schedule();
    }

    function updateColors() {
      var isDark = root.dataset.theme === 'dark';
      bgColor = isDark ? '#242424' : '#f6f5f4';
      lineColor = getAccentColor(isDark ? 0.15 : 0.08);
      refresh();
    }

    new MutationObserver(updateColors).observe(root, {
      attributes: true, attributeFilter: ['data-theme', 'data-accent']
    });
    var dialogObserver = new MutationObserver(refresh);
    [bookmarkDialog, settingsDialog].forEach(dialog =>
      dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    window.addEventListener('resize', () => { resize(); refresh(); });
    window.addEventListener('wave-settings-change', refresh);
    motion.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      lastTime = null;
      if (!document.hidden) refresh();
    });
    resize();
    updateColors();
  })();
}, { once: true });
