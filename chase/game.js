// ===== Pokemon Chase =====
const POKEMON = [
  { emoji:'⚡', points:10 },{ emoji:'🔥', points:15 },{ emoji:'💧', points:15 },
  { emoji:'🌿', points:15 },{ emoji:'🎵', points:20 },{ emoji:'😴', points:25 },
  { emoji:'🌀', points:50 },{ emoji:'🦊', points:20 },{ emoji:'👻', points:30 },
  { emoji:'🐟', points:5  },{ emoji:'🌊', points:30 },{ emoji:'🦆', points:15 },
];

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let W, H, HUD_H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  HUD_H = document.getElementById('hud').offsetHeight || 56;
}
window.addEventListener('resize', () => { resize(); buildPokemon(); });

// ===== State =====
let score, caught, timeLeft, level, gameRunning;
let pokemons = [], particles = [];
let cursor = { x: -999, y: -999 };
let timerInterval, animFrame;
let bestScore = parseInt(localStorage.getItem('chase-best') || '0');

// ===== DOM =====
const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl      = document.getElementById('score');
const caughtEl     = document.getElementById('caught');
const timerEl      = document.getElementById('timer');

function showScreen(s) {
  [startScreen, gameScreen, resultScreen].forEach(x => x.classList.remove('active'));
  s.classList.add('active');
}

// ===== Touch / Mouse =====
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

function updateCursor(x, y) { cursor.x = x; cursor.y = y; }

canvas.addEventListener('mousemove', e => updateCursor(e.clientX, e.clientY));
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  updateCursor(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener('touchstart', e => {
  updateCursor(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

// ===== Pokemon AI =====
const POKE_RADIUS  = 28;
const FLEE_RADIUS  = 120;
const CATCH_RADIUS = 36;
const WALL_MARGIN  = 40;

function buildPokemon() {
  const count = Math.min(3 + level, 6);
  pokemons = [];
  for (let i = 0; i < count; i++) {
    const p = POKEMON[Math.floor(Math.random() * POKEMON.length)];
    pokemons.push({
      ...p,
      x: WALL_MARGIN + Math.random() * (W - WALL_MARGIN * 2),
      y: HUD_H + WALL_MARGIN + Math.random() * (H - HUD_H - WALL_MARGIN * 2),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      scared: false,
      catchProgress: 0,
    });
  }
}

function updatePokemon() {
  const speed     = 1.5 + level * 0.3;
  const fleeSpeed = 3.5 + level * 0.4;

  for (const p of pokemons) {
    const dx = p.x - cursor.x;
    const dy = p.y - cursor.y;
    const dist = Math.hypot(dx, dy);

    if (dist < FLEE_RADIUS) {
      // Flee from cursor
      p.scared = true;
      const angle = Math.atan2(dy, dx);
      p.vx += Math.cos(angle) * 0.8;
      p.vy += Math.sin(angle) * 0.8;
    } else {
      p.scared = false;
      // Wander
      p.vx += (Math.random() - 0.5) * 0.3;
      p.vy += (Math.random() - 0.5) * 0.3;
    }

    // Clamp speed
    const maxSpd = p.scared ? fleeSpeed : speed;
    const spd = Math.hypot(p.vx, p.vy);
    if (spd > maxSpd) { p.vx = p.vx / spd * maxSpd; p.vy = p.vy / spd * maxSpd; }

    p.x += p.vx;
    p.y += p.vy;

    // Bounce off walls
    if (p.x < WALL_MARGIN)     { p.x = WALL_MARGIN;     p.vx *= -1; }
    if (p.x > W - WALL_MARGIN) { p.x = W - WALL_MARGIN; p.vx *= -1; }
    if (p.y < HUD_H + WALL_MARGIN)   { p.y = HUD_H + WALL_MARGIN;   p.vy *= -1; }
    if (p.y > H - WALL_MARGIN) { p.y = H - WALL_MARGIN; p.vy *= -1; }

    // Cornered = catch
    const cornered = (p.x < WALL_MARGIN + 30 || p.x > W - WALL_MARGIN - 30 ||
                      p.y < HUD_H + WALL_MARGIN + 30 || p.y > H - WALL_MARGIN - 30)
                   && dist < CATCH_RADIUS * 2.5;

    if (cornered || dist < CATCH_RADIUS) {
      p.catchProgress = Math.min(1, p.catchProgress + 0.04);
    } else {
      p.catchProgress = Math.max(0, p.catchProgress - 0.02);
    }
  }
}

function checkCatch() {
  for (let i = pokemons.length - 1; i >= 0; i--) {
    if (pokemons[i].catchProgress >= 1) {
      const p = pokemons[i];
      score  += p.points;
      caught++;
      scoreEl.textContent  = score;
      caughtEl.textContent = caught;
      spawnParticles(p.x, p.y, '#FFD700');
      spawnText(p.x, p.y - 30, '+' + p.points);
      playBeep(300 + p.points * 5);
      pokemons.splice(i, 1);
      // Respawn after short delay
      setTimeout(() => { if (gameRunning) pokemons.push(newPokemon()); }, 1200);
    }
  }
}

function newPokemon() {
  const p = POKEMON[Math.floor(Math.random() * POKEMON.length)];
  return { ...p,
    x: WALL_MARGIN + Math.random() * (W - WALL_MARGIN * 2),
    y: HUD_H + WALL_MARGIN + Math.random() * (H - HUD_H - WALL_MARGIN * 2),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    scared: false, catchProgress: 0,
  };
}

// ===== Particles =====
function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i;
    particles.push({ x, y, vx: Math.cos(a)*3, vy: Math.sin(a)*3, life: 1, color, size: 5 });
  }
}
function spawnText(x, y, text) {
  particles.push({ type: 'text', x, y, vy: -1.5, life: 1, text, color: '#FFD700' });
}

// ===== Draw =====
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Cursor ring
  if (!isTouchDevice()) {
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, FLEE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,100,100,0.8)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, CATCH_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pokemon
  for (const p of pokemons) {
    // Catch progress arc
    if (p.catchProgress > 0) {
      ctx.strokeStyle = `rgba(100,255,100,${p.catchProgress})`;
      ctx.lineWidth   = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POKE_RADIUS + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.catchProgress);
      ctx.stroke();
    }

    // Scared shake
    const sx = p.scared ? (Math.random() - 0.5) * 3 : 0;
    ctx.font = `${POKE_RADIUS * 1.8}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, p.x + sx, p.y);

    // Sweat drops when scared
    if (p.scared) {
      ctx.font = '14px serif';
      ctx.fillText('💦', p.x + 20, p.y - 20);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.03;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    if (p.type === 'text') {
      p.y += p.vy;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.font = 'bold 22px Segoe UI, Arial'; ctx.textAlign = 'center';
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
    } else {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ===== Audio =====
let audioCtx = null;
function playBeep(freq) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    o.start(); o.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

// ===== Timer =====
function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 10) timerEl.style.color = '#ff4444';
  level = Math.floor(caught / 5) + 1;
  if (timeLeft <= 0) endGame();
}

// ===== Game Loop =====
function loop() {
  if (!gameRunning) return;
  updatePokemon();
  checkCatch();
  draw();
  animFrame = requestAnimationFrame(loop);
}

// ===== Start / End =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; caught = 0; timeLeft = 60; level = 1; gameRunning = true;
  particles = [];
  timerEl.style.color = '';
  scoreEl.textContent = caughtEl.textContent = '0';
  timerEl.textContent = '60';
  resize();
  buildPokemon();
  showScreen(gameScreen);
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  cancelAnimationFrame(animFrame);
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('chase-best', bestScore);
  }
  const stars = caught >= 20 ? '⭐⭐⭐' : caught >= 10 ? '⭐⭐' : caught >= 4 ? '⭐' : '';
  const msg   = caught < 3  ? 'Keep chasing! 💪'
              : caught < 10 ? 'Nice cornering! 🌟'
              : caught < 20 ? 'Great hunter! 🎉'
              : 'LEGENDARY TRAINER! 🏆';
  document.getElementById('result-title').textContent = `You caught ${caught} Pokemon!`;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent   = msg;
  document.getElementById('stat-score').textContent   = score;
  document.getElementById('stat-caught').textContent  = caught;
  document.getElementById('stat-best').textContent    = bestScore;
  showScreen(resultScreen);
}

resize();
