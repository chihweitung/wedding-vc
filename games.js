(() => {
  'use strict';

  const MEMORY_PHOTOS = [
    { src: 'photos/wedding-01.jpg', zh: '經典浪漫', en: 'Classic Romance' },
    { src: 'photos/wedding-03.jpg', zh: '微風漫步', en: 'Breeze Walk' },
    { src: 'photos/wedding-05.jpg', zh: '陽光笑靨', en: 'Sunlit Smile' },
    { src: 'photos/wedding-06.jpg', zh: '執手相伴', en: 'Hand in Hand' },
    { src: 'photos/wedding-08.jpg', zh: '星光絮語', en: 'Quiet Whisper' },
    { src: 'photos/wedding-09.jpg', zh: '十二年四季', en: 'Twelve Seasons' },
  ];

  const PUZZLE_PHOTOS = [
    { id: 'p1', src: 'photos/wedding-01.jpg', zh: '照片 1', en: 'Photo 1' },
    { id: 'p2', src: 'photos/wedding-05.jpg', zh: '照片 2', en: 'Photo 2' },
    { id: 'p3', src: 'photos/wedding-08.jpg', zh: '照片 3', en: 'Photo 3' },
  ];

  const STORAGE_KEYS = {
    memory: 'te_game_memory_best_v1',
    catch: 'te_game_catch_best_v1',
    puzzle: 'te_game_puzzle_best_v1',
  };

  function getLang() {
    return document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
  }

  function safeReadBest(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function safeWriteBest(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_e) {
      // Ignore private browsing storage restrictions
    }
  }

  function triggerWeddingPetals() {
    const btn = document.getElementById('celebrate-btn');
    if (btn && typeof btn.click === 'function') {
      btn.click();
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  const COPY = {
    zh: {
      entryTitle: '暖身小遊戲',
      entrySub: '婚紗翻牌・接住捧花・3×3 婚紗拼圖',
      cardEyebrow: 'WEDDING MINI-GAMES · 3 GAMES',
      cardDesc: '婚紗照翻牌記憶、20 秒接住捧花挑戰與 3×3 婚紗拼圖，等上菜一起同樂！',
      cardCta: '開啟暖身小遊戲 →',
      footerBtn: '🎮 小遊戲',
      modalEyebrow: 'WEDDING MINI-GAMES · 暖身同樂',
      modalTitle: '婚禮暖身小遊戲',
      modalCloseAria: '關閉小遊戲視窗',
      tabMemory: '💍 婚紗翻牌',
      tabCatch: '💐 接住捧花',
      tabPuzzle: '🧩 3×3 拼圖',
      moves: '步數',
      time: '時間',
      score: '分數',
      combo: '連擊',
      best: '最佳紀錄',
      bestNone: '尚無紀錄',
      restart: '重新開始',
      memoryIntro: '翻開卡片配對 6 組 Tom & Eunice 婚紗照！',
      memoryWin: (m, s, isNew) =>
        `🎉 太棒了！只用 ${m} 步、${s} 秒完成全部配對！${isNew ? ' 🏆 刷新個人紀錄！' : ''}`,
      memoryBestFmt: (b) => `${b.moves} 步 / ${b.sec} 秒`,
      catchIntro: '左右滑動接住捧花、戒指與黑膠，閃開陽明山小雨滴！',
      catchStart: '▶ 開始 20 秒挑戰',
      catchRetry: '🔄 再挑戰一次',
      catchBestFmt: (b) => `${b.score} 分`,
      catchTitles: [
        { min: 260, label: '👑 陽明山最強捧花獵人' },
        { min: 180, label: '💐 浪漫接花達人' },
        { min: 100, label: '🥂 派對氛圍製造機' },
        { min: 0, label: '🌹 優雅散步賓客' },
      ],
      catchResult: (sc, title, isNew) =>
        `${title} — 獲得 ${sc} 分！${isNew ? ' 🏆 新紀錄！' : ''}`,
      puzzleIntro: '點擊空格旁的拼塊滑動復原婚紗照（每局皆保證有解）。',
      puzzlePeek: '👀 偷看原圖',
      puzzleHint: '🔢 編號提示',
      puzzleWin: (m, s, isNew) =>
        `✨ 完美拼出幸福瞬間！（${m} 步 / ${s} 秒）${isNew ? ' 🏆 新紀錄！' : ''}`,
      puzzleBestFmt: (b) => `${b.moves} 步 / ${b.sec} 秒`,
      puzzleCaption: 'Tom & Eunice · 2026.11.29',
    },
    en: {
      entryTitle: 'Wedding Mini-Games',
      entrySub: 'Photo Match · Catch Bouquet · 3×3 Puzzle',
      cardEyebrow: 'WEDDING MINI-GAMES · 3 GAMES',
      cardDesc: 'Photo memory match, 20s bouquet catch challenge, and 3×3 wedding photo puzzle!',
      cardCta: 'Play Mini-Games →',
      footerBtn: '🎮 Mini-Games',
      modalEyebrow: 'WEDDING MINI-GAMES · WARM-UP PLAY',
      modalTitle: 'Wedding Mini-Games',
      modalCloseAria: 'Close mini-games modal',
      tabMemory: '💍 Photo Match',
      tabCatch: '💐 Catch Bouquet',
      tabPuzzle: '🧩 3×3 Puzzle',
      moves: 'Moves',
      time: 'Time',
      score: 'Score',
      combo: 'Combo',
      best: 'Best',
      bestNone: 'None yet',
      restart: 'Restart',
      memoryIntro: 'Flip cards to match all 6 pairs of Tom & Eunice wedding photos!',
      memoryWin: (m, s, isNew) =>
        `🎉 Wonderful! Matched all pairs in ${m} moves & ${s}s!${isNew ? ' 🏆 New Best!' : ''}`,
      memoryBestFmt: (b) => `${b.moves} moves / ${b.sec}s`,
      catchIntro: 'Slide left & right to catch bouquets, rings & vinyls—dodge the raindrops!',
      catchStart: '▶ Start 20s Challenge',
      catchRetry: '🔄 Play Again',
      catchBestFmt: (b) => `${b.score} pts`,
      catchTitles: [
        { min: 260, label: '👑 Ultimate Bouquet Champion' },
        { min: 180, label: '💐 Romantic Catch Pro' },
        { min: 100, label: '🥂 Party Vibe Master' },
        { min: 0, label: '🌹 Chill Garden Guest' },
      ],
      catchResult: (sc, title, isNew) =>
        `${title} — Scored ${sc} pts!${isNew ? ' 🏆 New Best!' : ''}`,
      puzzleIntro: 'Tap a tile next to the empty space to restore the wedding photo.',
      puzzlePeek: '👀 Peek Photo',
      puzzleHint: '🔢 Tile Numbers',
      puzzleWin: (m, s, isNew) =>
        `✨ Picture perfect! (${m} moves / ${s}s)${isNew ? ' 🏆 New Best!' : ''}`,
      puzzleBestFmt: (b) => `${b.moves} moves / ${b.sec}s`,
      puzzleCaption: 'Tom & Eunice · 2026.11.29',
    },
  };

  function L() {
    return COPY[getLang()];
  }

  // Modal & Tab state
  let modalEl = null;
  let stageEl = null;
  let activeGame = 'memory';
  let tabButtons = {};
  let modalEyebrowEl = null;
  let modalTitleEl = null;
  let modalCloseBtn = null;

  // Cleanup hook for currently running game timers / rAF
  let activeCleanup = null;

  function stopActiveGame() {
    if (typeof activeCleanup === 'function') {
      activeCleanup();
      activeCleanup = null;
    }
  }

  function syncEntryCopy() {
    const c = L();
    const tEl = document.getElementById('countdown-games-title');
    const sEl = document.getElementById('countdown-games-sub');
    const fEl = document.getElementById('footer-games-btn');
    const ceEl = document.getElementById('games-card-eyebrow');
    const ctEl = document.getElementById('games-card-title');
    const cdEl = document.getElementById('games-card-desc');
    const ccEl = document.getElementById('games-card-cta');
    if (tEl) tEl.textContent = c.entryTitle;
    if (sEl) sEl.textContent = c.entrySub;
    if (fEl) fEl.textContent = c.footerBtn;
    if (ceEl) ceEl.textContent = c.cardEyebrow;
    if (ctEl) ctEl.textContent = c.entryTitle;
    if (cdEl) cdEl.textContent = c.cardDesc;
    if (ccEl) ccEl.textContent = c.cardCta;
    if (modalEyebrowEl) modalEyebrowEl.textContent = c.modalEyebrow;
    if (modalTitleEl) modalTitleEl.textContent = c.modalTitle;
    if (modalCloseBtn) modalCloseBtn.setAttribute('aria-label', c.modalCloseAria);
    if (tabButtons.memory) tabButtons.memory.textContent = c.tabMemory;
    if (tabButtons.catch) tabButtons.catch.textContent = c.tabCatch;
    if (tabButtons.puzzle) tabButtons.puzzle.textContent = c.tabPuzzle;
  }

  // =========================================================================
  // GAME 1: 婚紗照翻牌記憶配對 (Memory Match)
  // =========================================================================
  function mountMemoryGame(container) {
    const c = L();
    container.replaceChildren();

    const intro = createEl('p', 'wg-intro', c.memoryIntro);
    const statsBar = createEl('div', 'wg-stats-bar');
    const movesStat = createEl('span', 'wg-stat-pill');
    const timeStat = createEl('span', 'wg-stat-pill');
    const bestStat = createEl('span', 'wg-stat-pill is-best');
    statsBar.append(movesStat, timeStat, bestStat);

    const grid = createEl('div', 'wg-memory-grid');
    const banner = createEl('div', 'wg-result-banner hidden');
    const actions = createEl('div', 'wg-actions-row');
    const restartBtn = createEl('button', 'secondary-btn wg-action-btn', `🔄 ${c.restart}`);
    restartBtn.type = 'button';
    actions.append(restartBtn);

    container.append(intro, statsBar, grid, banner, actions);

    let deck = [];
    let flipped = [];
    let matchedCount = 0;
    let moves = 0;
    let seconds = 0;
    let locked = false;
    let timerId = null;
    let flipBackTimer = null;

    function updateStats() {
      const cc = L();
      movesStat.textContent = `${cc.moves}: ${moves}`;
      timeStat.textContent = `${cc.time}: ${seconds}s`;
      const b = safeReadBest(STORAGE_KEYS.memory);
      bestStat.textContent = `${cc.best}: ${b ? cc.memoryBestFmt(b) : cc.bestNone}`;
    }

    function clearTimers() {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
      if (flipBackTimer) {
        window.clearTimeout(flipBackTimer);
        flipBackTimer = null;
      }
    }

    function startTimerIfNeeded() {
      if (timerId) return;
      timerId = window.setInterval(() => {
        if (document.hidden) return;
        seconds += 1;
        updateStats();
      }, 1000);
    }

    function shuffle(arr) {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
      }
      return copy;
    }

    function initRound() {
      clearTimers();
      flipped = [];
      matchedCount = 0;
      moves = 0;
      seconds = 0;
      locked = false;
      banner.classList.add('hidden');
      banner.textContent = '';

      const pairs = MEMORY_PHOTOS.flatMap((photo, idx) => [
        { pairId: idx, src: photo.src, label: photo[getLang()] },
        { pairId: idx, src: photo.src, label: photo[getLang()] },
      ]);
      deck = shuffle(pairs);

      grid.replaceChildren();
      deck.forEach((item, idx) => {
        const cardBtn = createEl('button', 'wg-mem-card');
        cardBtn.type = 'button';
        cardBtn.dataset.index = String(idx);
        cardBtn.setAttribute('aria-label', `${item.label}`);

        const inner = createEl('span', 'wg-mem-inner');
        const back = createEl('span', 'wg-mem-face wg-mem-back');
        const seal = createEl('span', 'wg-mem-seal', 'T&E');
        back.append(seal);

        const front = createEl('span', 'wg-mem-face wg-mem-front');
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.label;
        img.loading = 'eager';
        img.decoding = 'async';
        front.append(img);

        inner.append(back, front);
        cardBtn.append(inner);

        cardBtn.addEventListener('click', () => {
          if (locked) return;
          if (cardBtn.classList.contains('is-flipped') || cardBtn.classList.contains('is-matched')) {
            return;
          }
          startTimerIfNeeded();
          cardBtn.classList.add('is-flipped');
          flipped.push({ idx, item, el: cardBtn });

          if (flipped.length === 2) {
            moves += 1;
            updateStats();
            const [a, b] = flipped;
            if (a.item.pairId === b.item.pairId) {
              a.el.classList.add('is-matched');
              b.el.classList.add('is-matched');
              flipped = [];
              matchedCount += 1;
              if (matchedCount === MEMORY_PHOTOS.length) {
                clearTimers();
                const prev = safeReadBest(STORAGE_KEYS.memory);
                const isNew =
                  !prev ||
                  moves < prev.moves ||
                  (moves === prev.moves && seconds < prev.sec);
                if (isNew) {
                  safeWriteBest(STORAGE_KEYS.memory, { moves, sec: seconds });
                }
                updateStats();
                banner.textContent = L().memoryWin(moves, seconds, isNew);
                banner.classList.remove('hidden');
                triggerWeddingPetals();
              }
            } else {
              locked = true;
              flipBackTimer = window.setTimeout(() => {
                a.el.classList.remove('is-flipped');
                b.el.classList.remove('is-flipped');
                flipped = [];
                locked = false;
              }, 680);
            }
          }
        });

        grid.append(cardBtn);
      });
      updateStats();
    }

    restartBtn.addEventListener('click', initRound);
    initRound();

    activeCleanup = () => {
      clearTimers();
    };
  }

  // =========================================================================
  // GAME 2: 接住捧花 20 秒挑戰 (Catch the Bouquet)
  // =========================================================================
  function mountCatchGame(container) {
    const c = L();
    container.replaceChildren();

    const intro = createEl('p', 'wg-intro', c.catchIntro);
    const statsBar = createEl('div', 'wg-stats-bar');
    const scoreStat = createEl('span', 'wg-stat-pill');
    const timeStat = createEl('span', 'wg-stat-pill');
    const bestStat = createEl('span', 'wg-stat-pill is-best');
    statsBar.append(scoreStat, timeStat, bestStat);

    const canvasWrap = createEl('div', 'wg-catch-wrap');
    const canvas = document.createElement('canvas');
    canvas.className = 'wg-catch-canvas';
    const W = 340;
    const H = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');

    const overlay = createEl('div', 'wg-catch-overlay');
    const overlayMsg = createEl('p', 'wg-catch-overlay-msg', c.catchIntro);
    const startBtn = createEl('button', 'primary-btn wg-start-btn', c.catchStart);
    startBtn.type = 'button';
    overlay.append(overlayMsg, startBtn);

    canvasWrap.append(canvas, overlay);
    container.append(intro, statsBar, canvasWrap);

    const ITEM_TYPES = [
      { emoji: '💐', pts: 25, speed: 155, weight: 2 },
      { emoji: '💍', pts: 20, speed: 175, weight: 2 },
      { emoji: '💿', pts: 15, speed: 145, weight: 2 },
      { emoji: '🌹', pts: 10, speed: 130, weight: 4 },
      { emoji: '🌧️', pts: -10, speed: 165, weight: 3, bad: true },
    ];
    const GOOD_POOL = ITEM_TYPES.filter((it) => !it.bad).flatMap((it) => Array(it.weight).fill(it));
    const RAIN_ITEM = ITEM_TYPES.find((it) => it.bad);
    const FEVER_BONUS_ITEM = { emoji: '👑', pts: 40, speed: 225, bad: false };

    let running = false;
    let rafId = null;
    let lastTs = 0;
    let remainingSec = 20;
    let score = 0;
    let combo = 0;
    let basketX = W / 2;
    const basketW = 68;
    const basketY = H - 34;
    let items = [];
    let popups = [];
    let spawnAcc = 0;
    let keyDir = 0;
    let currentPhase = 1;
    let phaseBannerText = '';
    let phaseBannerLife = 0;

    function getDifficultyProfile(remSec) {
      const elapsed = 20 - remSec;
      const progress = Math.max(0, Math.min(1, elapsed / 20));
      if (remSec <= 6) {
        return {
          phase: 3,
          spawnInterval: 0.27,
          speedMult: 1.48 + (6 - remSec) * 0.04,
          rainChance: 0.34,
          swayAmp: 46,
          feverBonusChance: 0.14,
        };
      }
      if (remSec <= 13) {
        return {
          phase: 2,
          spawnInterval: 0.37,
          speedMult: 1.2 + progress * 0.25,
          rainChance: 0.28,
          swayAmp: 24,
          feverBonusChance: 0,
        };
      }
      return {
        phase: 1,
        spawnInterval: 0.5,
        speedMult: 0.96 + progress * 0.25,
        rainChance: 0.2,
        swayAmp: 0,
        feverBonusChance: 0,
      };
    }

    function updateStats() {
      const cc = L();
      scoreStat.textContent = `${cc.score}: ${score}${combo >= 3 ? ` 🔥×${combo}` : ''}`;
      timeStat.textContent = `${cc.time}: ${Math.ceil(remainingSec)}s`;
      const b = safeReadBest(STORAGE_KEYS.catch);
      bestStat.textContent = `${cc.best}: ${b ? cc.catchBestFmt(b) : cc.bestNone}`;
    }

    function drawFrame() {
      if (!ctx) return;
      const isDark = document.documentElement.dataset.theme === 'dark';
      ctx.save();
      ctx.scale(dpr, dpr);

      // Soft botanical sky backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      if (isDark) {
        grad.addColorStop(0, currentPhase === 3 ? '#261d24' : '#18261e');
        grad.addColorStop(1, '#111a14');
      } else {
        grad.addColorStop(0, currentPhase === 3 ? '#fdf4f2' : '#fdfaf4');
        grad.addColorStop(1, '#f4ede4');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Level / Phase badge (top-right inside canvas)
      if (running) {
        const badgeLabel =
          currentPhase === 3 ? 'Lv.3 🔥' : currentPhase === 2 ? 'Lv.2 ⚡' : 'Lv.1 🌿';
        ctx.fillStyle = isDark ? 'rgba(22,34,27,0.75)' : 'rgba(255,253,249,0.82)';
        ctx.beginPath();
        ctx.roundRect(W - 76, 10, 66, 24, 12);
        ctx.fill();
        ctx.fillStyle = currentPhase === 3 ? '#c95656' : isDark ? '#8cb99a' : '#446c50';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLabel, W - 43, 22);
      }

      // Subtle horizon line
      ctx.strokeStyle = isDark ? 'rgba(163,198,172,0.16)' : 'rgba(110,134,116,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, H - 16);
      ctx.lineTo(W - 16, H - 16);
      ctx.stroke();

      // Falling items
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '26px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        ctx.fillText(it.emoji, it.x, it.y);
      }

      // Catcher basket (T&E pill tray)
      const bx = basketX - basketW / 2;
      const by = basketY - 14;
      ctx.fillStyle = isDark ? '#5cb88a' : '#446c50';
      ctx.beginPath();
      ctx.roundRect(bx, by, basketW, 28, 14);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#dfa0a9' : '#c57f89';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fffdf9';
      ctx.font = '600 13px Georgia, serif';
      ctx.fillText('T & E', basketX, basketY + 1);

      // Phase transition banner
      if (phaseBannerLife > 0 && phaseBannerText) {
        ctx.globalAlpha = Math.min(1, phaseBannerLife * 1.6);
        ctx.fillStyle = isDark ? 'rgba(20, 30, 23, 0.85)' : 'rgba(255, 253, 249, 0.92)';
        ctx.beginPath();
        ctx.roundRect(W / 2 - 115, 48, 230, 30, 15);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#dfa0a9' : '#c57f89';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = isDark ? '#f3f6f3' : '#27352b';
        ctx.font = '700 13px "Noto Sans TC", Inter, sans-serif';
        ctx.fillText(phaseBannerText, W / 2, 63);
        ctx.globalAlpha = 1;
      }

      // Score popups
      ctx.font = '700 14px Inter, sans-serif';
      for (let i = 0; i < popups.length; i++) {
        const p = popups[i];
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.bad ? '#c95656' : isDark ? '#8cb99a' : '#397550';
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function finishRound() {
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      const prev = safeReadBest(STORAGE_KEYS.catch);
      const isNew = !prev || score > prev.score;
      if (isNew && score > 0) {
        safeWriteBest(STORAGE_KEYS.catch, { score });
      }
      updateStats();
      const cc = L();
      const tier = cc.catchTitles.find((t) => score >= t.min) || cc.catchTitles[cc.catchTitles.length - 1];
      overlayMsg.textContent = cc.catchResult(score, tier.label, isNew);
      startBtn.textContent = cc.catchRetry;
      overlay.classList.remove('hidden');
      if (score >= 120) triggerWeddingPetals();
    }

    function tick(ts) {
      if (!running) return;
      if (document.hidden) {
        lastTs = ts;
        rafId = window.requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      remainingSec = Math.max(0, remainingSec - dt);
      const prof = getDifficultyProfile(remainingSec);
      if (prof.phase !== currentPhase) {
        currentPhase = prof.phase;
        const isEn = getLang() === 'en';
        if (currentPhase === 2) {
          phaseBannerText = isEn ? '⚡ Wind Picking Up! Faster!' : '⚡ 陽明山起風了・速度加快！';
          phaseBannerLife = 1.6;
        } else if (currentPhase === 3) {
          phaseBannerText = isEn ? '🔥 Final Rush! Watch for 👑 +40!' : '🔥 最後衝刺！搶接 👑 +40 分！';
          phaseBannerLife = 1.8;
        }
      }
      if (phaseBannerLife > 0) {
        phaseBannerLife = Math.max(0, phaseBannerLife - dt);
      }

      if (keyDir !== 0) {
        basketX = Math.max(basketW / 2 + 6, Math.min(W - basketW / 2 - 6, basketX + keyDir * 310 * dt));
      }

      spawnAcc += dt;
      if (spawnAcc >= prof.spawnInterval) {
        spawnAcc = 0;
        const r = Math.random();
        let tpl;
        if (prof.feverBonusChance > 0 && r < prof.feverBonusChance) {
          tpl = FEVER_BONUS_ITEM;
        } else if (r < prof.feverBonusChance + prof.rainChance) {
          tpl = RAIN_ITEM;
        } else {
          tpl = GOOD_POOL[Math.floor(Math.random() * GOOD_POOL.length)];
        }
        const swayDir = Math.random() < 0.5 ? -1 : 1;
        items.push({
          emoji: tpl.emoji,
          pts: tpl.pts,
          bad: Boolean(tpl.bad),
          x: 24 + Math.random() * (W - 48),
          y: -14,
          vy: (tpl.speed + Math.random() * 42) * prof.speedMult,
          vx: prof.swayAmp ? swayDir * (14 + Math.random() * prof.swayAmp) : 0,
        });
      }

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;
        if (it.vx) {
          it.x += it.vx * dt;
          if (it.x < 18 || it.x > W - 18) {
            it.vx *= -1;
            it.x = Math.max(18, Math.min(W - 18, it.x));
          }
        }
        const caught =
          it.y >= basketY - 22 &&
          it.y <= basketY + 14 &&
          Math.abs(it.x - basketX) <= basketW / 2 + 12;
        if (caught) {
          if (it.bad) {
            score = Math.max(0, score + it.pts);
            combo = 0;
            popups.push({ text: `${it.pts}`, x: it.x, y: basketY - 24, life: 1, bad: true });
          } else {
            combo += 1;
            const bonus = combo >= 5 ? 5 : 0;
            const gained = it.pts + bonus;
            score += gained;
            popups.push({ text: `+${gained}`, x: it.x, y: basketY - 24, life: 1, bad: false });
          }
          items.splice(i, 1);
        } else if (it.y > H + 24) {
          items.splice(i, 1);
        }
      }

      for (let i = popups.length - 1; i >= 0; i--) {
        popups[i].y -= 36 * dt;
        popups[i].life -= 1.5 * dt;
        if (popups[i].life <= 0) popups.splice(i, 1);
      }

      updateStats();
      drawFrame();

      if (remainingSec <= 0) {
        finishRound();
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function moveFromClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const relX = ((clientX - rect.left) / rect.width) * W;
      basketX = Math.max(basketW / 2 + 6, Math.min(W - basketW / 2 - 6, relX));
      if (!running) drawFrame();
    }

    const onPointer = (e) => {
      moveFromClientX(e.clientX);
    };
    const onTouch = (e) => {
      if (e.touches && e.touches[0]) {
        moveFromClientX(e.touches[0].clientX);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyDir = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyDir = 1;
    };
    const onKeyUp = (e) => {
      if (
        (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && keyDir === -1
      ) keyDir = 0;
      if (
        (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && keyDir === 1
      ) keyDir = 0;
    };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    startBtn.addEventListener('click', () => {
      score = 0;
      combo = 0;
      remainingSec = 20;
      items = [];
      popups = [];
      spawnAcc = 0;
      currentPhase = 1;
      phaseBannerText = '';
      phaseBannerLife = 0;
      basketX = W / 2;
      overlay.classList.add('hidden');
      running = true;
      lastTs = performance.now();
      updateStats();
      rafId = window.requestAnimationFrame(tick);
    });

    updateStats();
    drawFrame();

    activeCleanup = () => {
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
      canvas.removeEventListener('touchmove', onTouch);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  // =========================================================================
  // GAME 3: 婚紗 3×3 滑塊拼圖 (3×3 Photo Sliding Puzzle)
  // =========================================================================
  function mountPuzzleGame(container) {
    const c = L();
    container.replaceChildren();

    const intro = createEl('p', 'wg-intro', c.puzzleIntro);

    const photoPicker = createEl('div', 'wg-photo-picker');
    let selectedPhoto = PUZZLE_PHOTOS[0];
    const pickerBtns = PUZZLE_PHOTOS.map((p) => {
      const b = createEl('button', 'wg-picker-btn', p[getLang()]);
      b.type = 'button';
      if (p.id === selectedPhoto.id) b.classList.add('is-active');
      b.addEventListener('click', () => {
        selectedPhoto = p;
        pickerBtns.forEach((btn, idx) => {
          btn.classList.toggle('is-active', PUZZLE_PHOTOS[idx].id === p.id);
        });
        initPuzzle();
      });
      photoPicker.append(b);
      return b;
    });

    const statsBar = createEl('div', 'wg-stats-bar');
    const movesStat = createEl('span', 'wg-stat-pill');
    const timeStat = createEl('span', 'wg-stat-pill');
    const bestStat = createEl('span', 'wg-stat-pill is-best');
    statsBar.append(movesStat, timeStat, bestStat);

    const boardWrap = createEl('div', 'wg-puzzle-wrap');
    const board = createEl('div', 'wg-puzzle-board');
    const peekImg = document.createElement('img');
    peekImg.className = 'wg-puzzle-peek hidden';
    peekImg.alt = 'Reference wedding photo';
    const polaroidCaption = createEl('p', 'wg-polaroid-caption hidden', c.puzzleCaption);
    boardWrap.append(board, peekImg, polaroidCaption);

    const banner = createEl('div', 'wg-result-banner hidden');

    const actions = createEl('div', 'wg-actions-row');
    const peekBtn = createEl('button', 'secondary-btn wg-action-btn', c.puzzlePeek);
    peekBtn.type = 'button';
    const hintBtn = createEl('button', 'secondary-btn wg-action-btn', c.puzzleHint);
    hintBtn.type = 'button';
    const restartBtn = createEl('button', 'secondary-btn wg-action-btn', `🔄 ${c.restart}`);
    restartBtn.type = 'button';
    actions.append(peekBtn, hintBtn, restartBtn);

    container.append(intro, photoPicker, statsBar, boardWrap, banner, actions);

    let tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let moves = 0;
    let seconds = 0;
    let solved = false;
    let showHints = true;
    let timerId = null;
    let peekTimer = null;

    function clearTimers() {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
      if (peekTimer) {
        window.clearTimeout(peekTimer);
        peekTimer = null;
      }
    }

    function updateStats() {
      const cc = L();
      movesStat.textContent = `${cc.moves}: ${moves}`;
      timeStat.textContent = `${cc.time}: ${seconds}s`;
      const b = safeReadBest(STORAGE_KEYS.puzzle);
      bestStat.textContent = `${cc.best}: ${b ? cc.puzzleBestFmt(b) : cc.bestNone}`;
    }

    function getNeighbors(idx) {
      const r = Math.floor(idx / 3);
      const col = idx % 3;
      const out = [];
      if (r > 0) out.push(idx - 3);
      if (r < 2) out.push(idx + 3);
      if (col > 0) out.push(idx - 1);
      if (col < 2) out.push(idx + 1);
      return out;
    }

    function isSolvedState(arr) {
      for (let i = 0; i < 9; i++) {
        if (arr[i] !== i) return false;
      }
      return true;
    }

    function generateSolvableBoard() {
      const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      let blankIdx = 8;
      let prevBlank = -1;
      for (let step = 0; step < 54; step++) {
        const neighbors = getNeighbors(blankIdx).filter((n) => n !== prevBlank);
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
        arr[blankIdx] = arr[pick];
        arr[pick] = 8;
        prevBlank = blankIdx;
        blankIdx = pick;
      }
      if (isSolvedState(arr)) {
        // Ensure never starts already solved
        const n = getNeighbors(blankIdx)[0];
        arr[blankIdx] = arr[n];
        arr[n] = 8;
      }
      return arr;
    }

    function startTimerIfNeeded() {
      if (timerId) return;
      timerId = window.setInterval(() => {
        if (document.hidden) return;
        seconds += 1;
        updateStats();
      }, 1000);
    }

    function renderBoard() {
      board.replaceChildren();
      board.classList.toggle('is-solved', solved);
      tiles.forEach((tileId, posIdx) => {
        const isBlank = tileId === 8 && !solved;
        const btn = createEl('button', `wg-puzzle-tile${isBlank ? ' is-blank' : ''}`);
        btn.type = 'button';
        btn.disabled = isBlank || solved;

        if (!isBlank) {
          const origRow = Math.floor(tileId / 3);
          const origCol = tileId % 3;
          btn.style.backgroundImage = `url("${selectedPhoto.src}")`;
          btn.style.backgroundPosition = `${origCol * 50}% ${origRow * 50}%`;
          if (showHints && !solved) {
            const num = createEl('span', 'wg-tile-num', String(tileId + 1));
            btn.append(num);
          }
          btn.addEventListener('click', () => {
            if (solved) return;
            const blankPos = tiles.indexOf(8);
            if (!getNeighbors(blankPos).includes(posIdx)) return;
            startTimerIfNeeded();
            tiles[blankPos] = tiles[posIdx];
            tiles[posIdx] = 8;
            moves += 1;
            if (isSolvedState(tiles)) {
              solved = true;
              clearTimers();
              const prev = safeReadBest(STORAGE_KEYS.puzzle);
              const isNew =
                !prev ||
                moves < prev.moves ||
                (moves === prev.moves && seconds < prev.sec);
              if (isNew) {
                safeWriteBest(STORAGE_KEYS.puzzle, { moves, sec: seconds });
              }
              polaroidCaption.classList.remove('hidden');
              banner.textContent = L().puzzleWin(moves, seconds, isNew);
              banner.classList.remove('hidden');
              triggerWeddingPetals();
            }
            updateStats();
            renderBoard();
          });
        }
        board.append(btn);
      });
    }

    function initPuzzle() {
      clearTimers();
      moves = 0;
      seconds = 0;
      solved = false;
      peekImg.src = selectedPhoto.src;
      peekImg.classList.add('hidden');
      polaroidCaption.classList.add('hidden');
      banner.classList.add('hidden');
      banner.textContent = '';
      tiles = generateSolvableBoard();
      updateStats();
      renderBoard();
    }

    peekBtn.addEventListener('click', () => {
      if (solved) return;
      const showing = !peekImg.classList.contains('hidden');
      if (peekTimer) {
        window.clearTimeout(peekTimer);
        peekTimer = null;
      }
      if (showing) {
        peekImg.classList.add('hidden');
      } else {
        peekImg.classList.remove('hidden');
        peekTimer = window.setTimeout(() => {
          peekImg.classList.add('hidden');
        }, 2200);
      }
    });

    hintBtn.addEventListener('click', () => {
      showHints = !showHints;
      hintBtn.classList.toggle('is-active', showHints);
      renderBoard();
    });
    hintBtn.classList.add('is-active');

    restartBtn.addEventListener('click', initPuzzle);
    initPuzzle();

    activeCleanup = () => {
      clearTimers();
    };
  }

  // =========================================================================
  // MODAL SHELL & LIFECYCLE
  // =========================================================================
  function selectTab(gameKey) {
    activeGame = gameKey;
    stopActiveGame();
    Object.entries(tabButtons).forEach(([k, btn]) => {
      const isAct = k === gameKey;
      btn.classList.toggle('is-active', isAct);
      btn.setAttribute('aria-selected', String(isAct));
    });
    if (!stageEl) return;
    if (gameKey === 'memory') mountMemoryGame(stageEl);
    else if (gameKey === 'catch') mountCatchGame(stageEl);
    else mountPuzzleGame(stageEl);
  }

  function ensureModal() {
    if (modalEl) return modalEl;
    const c = L();

    modalEl = createEl('div', 'wg-modal hidden');
    modalEl.id = 'wedding-games-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'wg-modal-title');

    const dialog = createEl('div', 'wg-dialog');

    const header = createEl('div', 'wg-header');
    const titleBox = createEl('div', 'wg-title-box');
    modalEyebrowEl = createEl('span', 'wg-eyebrow', c.modalEyebrow);
    modalTitleEl = createEl('h2', 'wg-title', c.modalTitle);
    modalTitleEl.id = 'wg-modal-title';
    titleBox.append(modalEyebrowEl, modalTitleEl);

    modalCloseBtn = createEl('button', 'wg-close-btn', '✕');
    modalCloseBtn.type = 'button';
    modalCloseBtn.setAttribute('aria-label', c.modalCloseAria);
    modalCloseBtn.addEventListener('click', closeModal);
    header.append(titleBox, modalCloseBtn);

    const tabsRow = createEl('div', 'wg-tabs');
    tabsRow.setAttribute('role', 'tablist');

    [
      ['memory', c.tabMemory],
      ['catch', c.tabCatch],
      ['puzzle', c.tabPuzzle],
    ].forEach(([key, label]) => {
      const btn = createEl('button', 'wg-tab-btn', label);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.addEventListener('click', () => selectTab(key));
      tabButtons[key] = btn;
      tabsRow.append(btn);
    });

    stageEl = createEl('div', 'wg-stage');

    dialog.append(header, tabsRow, stageEl);
    modalEl.append(dialog);

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    document.body.append(modalEl);
    return modalEl;
  }

  function openModal(initialGame = 'memory') {
    ensureModal();
    syncEntryCopy();
    modalEl.classList.remove('hidden');
    document.body.classList.add('wg-modal-open');
    selectTab(initialGame);
  }

  function closeModal() {
    stopActiveGame();
    if (modalEl) modalEl.classList.add('hidden');
    document.body.classList.remove('wg-modal-open');
  }

  function initWeddingGames() {
    const countdownBtn = document.getElementById('countdown-games-btn');
    const hubCardBtn = document.getElementById('choose-games-card');
    const footerBtn = document.getElementById('footer-games-btn');
    if (countdownBtn) {
      countdownBtn.addEventListener('click', () => openModal(activeGame));
    }
    if (hubCardBtn) {
      hubCardBtn.addEventListener('click', () => openModal(activeGame));
    }
    if (footerBtn) {
      footerBtn.addEventListener('click', () => openModal(activeGame));
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl && !modalEl.classList.contains('hidden')) {
        closeModal();
      }
    });

    const langObserver = new MutationObserver(() => {
      syncEntryCopy();
      if (modalEl && !modalEl.classList.contains('hidden')) {
        selectTab(activeGame);
      }
    });
    langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-lang'],
    });

    syncEntryCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeddingGames);
  } else {
    initWeddingGames();
  }
})();
