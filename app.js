// YouTube Ultra Studio Web Client

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentMode = 'single';
  let matrixClicks = 0;
  let activeMacro = '--no-playlist -f "bv*+ba/b" --embed-thumbnail';

  // --- 1. Interactive HTML5 Background Canvas ---
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  for (let i = 0; i < 45; ++i) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.5 + 1
    });
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, width, height);

    // Dynamic wave
    ctx.beginPath();
    const time = Date.now() * 0.0015;
    ctx.moveTo(0, height * 0.85);
    for (let x = 0; x < width; x += 15) {
      const y = height * 0.85 + Math.sin(x * 0.005 + time) * 25 + Math.cos(x * 0.01 + time * 1.5) * 15;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Floating particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(renderCanvas);
  }
  renderCanvas();

  // --- 2. Tab Navigation ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');

      if (target === 'tab-player') {
        loadMediaLibrary();
      }
    });
  });

  // --- 3. Theme Switcher ---
  const themePills = document.querySelectorAll('.theme-pill');
  themePills.forEach(pill => {
    pill.addEventListener('click', () => {
      themePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      document.body.className = pill.dataset.theme;
    });
  });

  // --- 4. Mode Selection ---
  const modeCards = document.querySelectorAll('.mode-card');
  const boxQuality = document.getElementById('boxQuality');
  const boxAudio = document.getElementById('boxAudio');
  const boxChannel = document.getElementById('boxChannel');

  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentMode = card.dataset.mode;

      boxQuality.classList.toggle('hidden', currentMode === 'audio');
      boxAudio.classList.toggle('hidden', currentMode !== 'audio');
      boxChannel.classList.toggle('hidden', currentMode !== 'channel');
    });
  });

  // --- 5. Clipboard Paste & Clear ---
  const urlInput = document.getElementById('urlInput');
  document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      urlInput.value = text;
    } catch (e) {
      alert('Clipboard access denied. Please paste manually.');
    }
  });

  document.getElementById('btnClear').addEventListener('click', () => {
    urlInput.value = '';
  });

  // --- 6. Real-time Events (SSE) from Backend ---
  const progStatus = document.getElementById('progStatus');
  const progSpeed = document.getElementById('progSpeed');
  const progressBar = document.getElementById('progressBar');
  const terminalBody = document.getElementById('terminalBody');
  const btnStart = document.getElementById('btnStartDownload');
  const btnCancel = document.getElementById('btnCancelDownload');

  function appendTerminalLog(msg, type = 'log') {
    const line = document.createElement('p');
    line.className = `term-line ${type}`;
    line.textContent = msg;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  const evtSource = new EventSource('/api/events');
  evtSource.onmessage = e => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'start') {
        progStatus.textContent = 'Connecting to YouTube servers...';
        progressBar.style.width = '5%';
        btnStart.disabled = true;
        btnCancel.disabled = false;
        appendTerminalLog(data.message, 'prompt');
      } else if (data.type === 'progress') {
        progressBar.style.width = `${data.percent}%`;
        progStatus.textContent = `Downloading (${data.percent}% of ${data.size})`;
        progSpeed.textContent = `Speed: ${data.speed} | ETA: ${data.eta}`;
      } else if (data.type === 'log') {
        appendTerminalLog(data.message, 'log');
      } else if (data.type === 'finish') {
        btnStart.disabled = false;
        btnCancel.disabled = true;
        if (data.success) {
          progressBar.style.width = '100%';
          progStatus.textContent = 'Download Complete! Media saved.';
          appendTerminalLog('[+] Finished successfully! All chunks muxed.', 'success');
        } else {
          progStatus.textContent = data.message || 'Operation finished.';
          appendTerminalLog(`[!] Finished with code ${data.code}`, 'error');
        }
      }
    } catch (err) {}
  };

  // Trigger Download via REST
  btnStart.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    const payload = {
      url: url,
      mode: currentMode,
      quality: document.getElementById('selQuality').value,
      audioFormat: document.getElementById('selAudioFmt').value,
      maxVideos: document.getElementById('inpMaxVids').value,
      embedThumb: document.getElementById('chkThumb').checked,
      embedMeta: document.getElementById('chkMeta').checked
    };

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to start download');
      }
    } catch (err) {
      alert('Network error connecting to localhost server.');
    }
  });

  // Cancel Download
  btnCancel.addEventListener('click', async () => {
    await fetch('/api/cancel', { method: 'POST' });
  });

  document.getElementById('btnClearLogs').addEventListener('click', () => {
    terminalBody.innerHTML = '';
  });

  // --- 7. Media Player & Library ---
  const fileList = document.getElementById('fileList');
  const mainVideo = document.getElementById('mainVideo');
  const noVideoMsg = document.getElementById('noVideoMsg');
  const currentPlayingTitle = document.getElementById('currentPlayingTitle');
  const currentPlayingSize = document.getElementById('currentPlayingSize');
  const selSpeed = document.getElementById('selSpeed');

  async function loadMediaLibrary() {
    fileList.innerHTML = '<p class="loading-text">Scanning downloads directory...</p>';
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      fileList.innerHTML = '';

      if (!data.files || data.files.length === 0) {
        fileList.innerHTML = '<p class="loading-text">No media files found in Downloads folder.</p>';
        return;
      }

      data.files.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <div>
            <div class="file-name">${file.isAudio ? '🎵' : '📹'} ${file.name}</div>
            <div class="file-meta">${file.sizeMb} MB</div>
          </div>
          <button class="player-btn">Play ▶</button>
        `;
        item.addEventListener('click', () => {
          playMedia(file.name, file.sizeMb);
        });
        fileList.appendChild(item);
      });
    } catch (e) {
      fileList.innerHTML = '<p class="loading-text">Could not load library.</p>';
    }
  }

  function playMedia(filename, sizeMb) {
    const streamUrl = `/api/stream/${encodeURIComponent(filename)}`;
    mainVideo.src = streamUrl;
    noVideoMsg.style.display = 'none';
    currentPlayingTitle.textContent = filename;
    currentPlayingSize.textContent = `${sizeMb} MB`;
    mainVideo.playbackRate = parseFloat(selSpeed.value);
    mainVideo.play();
  }

  selSpeed.addEventListener('change', () => {
    if (mainVideo) {
      mainVideo.playbackRate = parseFloat(selSpeed.value);
    }
  });

  document.getElementById('btnFullscreen').addEventListener('click', () => {
    if (mainVideo.requestFullscreen) mainVideo.requestFullscreen();
  });

  document.getElementById('btnCopyEmbed').addEventListener('click', () => {
    if (!mainVideo.src) {
      alert('No media loaded to embed');
      return;
    }
    const embedHtml = `<iframe src="${window.location.origin}${new URL(mainVideo.src).pathname}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedHtml);
    alert('Embed iframe code copied to clipboard!');
  });

  document.getElementById('btnRefreshLibrary').addEventListener('click', loadMediaLibrary);

  // --- 8. 10,000 Buttons Macro Matrix ---
  const matrixGrid = document.getElementById('matrixGrid');
  const matrixSearch = document.getElementById('matrixSearch');
  const activeMacroCode = document.getElementById('activeMacroCode');
  const matrixClickCount = document.getElementById('matrixClickCount');
  const catPills = document.querySelectorAll('.cat-pill');

  const TOTAL_MACROS = 10000;
  const macroButtonsData = [];
  const resOptions = ['8K 4320p', '4K 2160p', '2K 1440p', '1080p 60fps', '720p', '480p'];
  const audioOptions = ['MP3 320k', 'FLAC Lossless', 'WAV Master', 'AAC 256k', 'OPUS 510k'];
  const codecOptions = ['AV1 Codec', 'VP9.2 Profile', 'H.264 High', 'HEVC H.265', 'ProRes'];

  for (let i = 1; i <= TOTAL_MACROS; ++i) {
    let cat = 'general';
    let label = '';
    let arg = '';
    const m = (i - 1) % 10;

    if (m === 0 || m === 1) {
      cat = 'resolution';
      const r = resOptions[(i / 2) % resOptions.length];
      label = `[${String(i).padStart(5, '0')}] ${r}`;
      arg = `-f "bestvideo[height<=${(i % 6 + 1) * 240}]+bestaudio/best"`;
    } else if (m === 2 || m === 3) {
      cat = 'audio';
      const a = audioOptions[(i / 2) % audioOptions.length];
      label = `[${String(i).padStart(5, '0')}] ${a}`;
      arg = `-x --audio-format ${i % 2 === 0 ? 'mp3' : 'flac'} --audio-quality 0`;
    } else if (m === 4 || m === 5) {
      cat = 'codec';
      const c = codecOptions[(i / 2) % codecOptions.length];
      label = `[${String(i).padStart(5, '0')}] ${c}`;
      arg = `--vcodec ${c.split(' ')[0].toLowerCase()}`;
    } else if (m === 6 || m === 7) {
      cat = 'channel';
      const lim = (i % 30 + 1) * 5;
      label = `[${String(i).padStart(5, '0')}] Limit ${lim} vids`;
      arg = `--yes-playlist --max-downloads ${lim}`;
    } else {
      label = `[${String(i).padStart(5, '0')}] Fast Mux #${i}`;
      arg = `--embed-thumbnail --add-metadata --no-mtime`;
    }

    macroButtonsData.push({ id: i, label, cat, arg });
  }

  let activeCatFilter = 'all';
  let searchTerm = '';

  function renderMatrix() {
    matrixGrid.innerHTML = '';
    const filtered = macroButtonsData.filter(item => {
      const matchCat = activeCatFilter === 'all' || item.cat === activeCatFilter;
      const matchSearch = searchTerm === '' || item.label.toLowerCase().includes(searchTerm) || item.arg.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });

    // Render slice for performance
    const renderLimit = Math.min(filtered.length, 600);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < renderLimit; ++i) {
      const item = filtered[i];
      const btn = document.createElement('button');
      btn.className = 'matrix-btn';
      btn.textContent = item.label;
      btn.title = item.arg;
      btn.addEventListener('click', () => {
        matrixClicks++;
        matrixClickCount.textContent = matrixClicks;
        activeMacro = item.arg;
        activeMacroCode.textContent = activeMacro;
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 400);
        appendTerminalLog(`[Matrix Click #${item.id}] Activated macro: ${item.arg}`, 'prompt');
      });
      fragment.appendChild(btn);
    }
    matrixGrid.appendChild(fragment);
  }
  renderMatrix();

  matrixSearch.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderMatrix();
  });

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCatFilter = pill.dataset.cat;
      renderMatrix();
    });
  });

  document.getElementById('btnInjectMacro').addEventListener('click', () => {
    alert(`Macro injected into Downloader queue: ${activeMacro}`);
  });
});
