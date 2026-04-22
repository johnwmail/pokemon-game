// ===== Pokemon Fishing =====
const POKEMON = [
  { emoji:'🐟', points:5,  speed:1.5 },
  { emoji:'⚡', points:10, speed:2.0 },
  { emoji:'🔥', points:15, speed:2.2 },
  { emoji:'💧', points:15, speed:2.0 },
  { emoji:'🌿', points:15, speed:1.8 },
  { emoji:'🦆', points:15, speed:2.5 },
  { emoji:'🎵', points:20, speed:2.8 },
  { emoji:'🦊', points:20, speed:3.0 },
  { emoji:'😴', points:25, speed:1.2 },
  { emoji:'👻', points:30, speed:3.5 },
  { emoji:'🌊', points:30, speed:2.8 },
  { emoji:'🌀', points:50, speed:4.0 },
];

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let W, H, HUD_H, WATER_Y;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  HUD_H  = document.getElementById('hud').offsetHeight || 56;
  WATER_Y = HUD_H + (H - HUD_H) * 0.38;
}
window.addEventListener('resize', resize);

// ===== State =====
let score, caught, timeLeft, level, gameRunning;
let fishes = [], particles = [];
let rod = { x: 0, cast: false, lineY: 0, hookY: 0, hooking: false, hookTimer: 0 };
let timerInterval, animFrame;
let rodX = 0; // follows mouse/touch on sky

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

// ===== Controls =====
function cast(x) {
  if (!gameRunning) return;
  if (!rod.cast) {
    rodX     = x;
    rod.cast = true;
    rod.lineY = WATER_Y - 10;
    rod.hookY = WATER_Y + 10;
    rod.hooking = false;
    playBeep(300, 'sine', 0.15);
  } else {
    rod.cast = false; // reel in
  }
}

canvas.addEventListener('click',      e => cast(e.clientX));
canvas.addEventListener('touchstart', e => { cast(e.touches[0].clientX); }, { passive: true });
window.addEventListener('keydown', e => { if (e.code === 'Space') cast(rodX || W/2); });
canvas.addEventListener('mousemove', e => { if (!rod.cast) rodX = e.clientX; });

// ===== Fish =====
function spawnFish() {
  const pool = level >= 3 ? POKEMON : POKEMON.filter(p => p.points <= 25);
  const p    = pool[Math.floor(Math.random() * pool.length)];
  const fromLeft = Math.random() < 0.5;
  fishes.push({
    ...p,
    x: fromLeft ? -60 : W + 60,
    y: WATER_Y + 30 + Math.random() * (H - WATER_Y - 80),
    dir: fromLeft ? 1 : -1,
    hooked: false, hookProgress: 0,
    wobble: 0,
  });
}

let spawnTimer = 0, spawnInterval = 90;

// ===== Particles =====
function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i;
    particles.push({ x, y, vx: Math.cos(a)*3, vy: Math.sin(a)*3, life: 1, color, size: 5 });
  }
}
function spawnText(x, y, text) {
  particles.push({ type:'text', x, y, vy:-1.5, life:1, text, color:'#FFD700' });
}

// ===== Audio =====
let audioCtx = null;
function playBeep(freq, type='sine', dur=0.25) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(e) {}
}

// ===== Update =====
function update() {
  // Spawn fish
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnFish();
    spawnInterval = Math.max(45, spawnInterval - 2);
  }

  // Move fish
  for (let i = fishes.length - 1; i >= 0; i--) {
    const f = fishes[i];
    if (f.hooked) {
      // Reel up
      f.y -= 4 + level;
      f.x  = rodX;
      f.wobble = Math.sin(Date.now() * 0.02) * 8;
      if (f.y < WATER_Y - 20) {
        // Caught!
        score  += f.points;
        caught++;
        level   = Math.floor(caught / 5) + 1;
        scoreEl.textContent  = score;
        caughtEl.textContent = caught;
        spawnParticles(f.x, WATER_Y, '#FFD700');
        spawnText(f.x, WATER_Y - 30, '+' + f.points);
        playBeep(400 + f.points * 6);
        fishes.splice(i, 1);
        rod.cast = false;
        continue;
      }
    } else {
      f.x += f.dir * (f.speed + level * 0.3);
      f.wobble = Math.sin(Date.now() * 0.005 + f.x * 0.02) * 4;
      // Off screen
      if (f.x < -80 || f.x > W + 80) { fishes.splice(i, 1); continue; }

      // Hook collision
      if (rod.cast) {
        const dx = Math.abs(f.x - rodX);
        const dy = Math.abs(f.y - rod.hookY);
        if (dx < 30 && dy < 30) {
          f.hooked = true;
          playBeep(500, 'triangle', 0.2);
        }
      }
    }
  }

  // Sink hook
  if (rod.cast && !fishes.some(f => f.hooked)) {
    rod.hookY = Math.min(rod.hookY + 3, H - 20);
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.03;
    if (p.type === 'text') { p.y += p.vy; }
    else { p.x += p.vx; p.y += p.vy; p.vy += 0.1; }
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ===== Draw =====
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Sky
  const skyGrad = ctx.createLinearGradient(0, HUD_H, 0, WATER_Y);
  skyGrad.addColorStop(0, '#1a1a4e');
  skyGrad.addColorStop(1, '#2a4a7f');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, HUD_H, W, WATER_Y - HUD_H);

  // Water
  const waterGrad = ctx.createLinearGradient(0, WATER_Y, 0, H);
  waterGrad.addColorStop(0, '#0d4f8f');
  waterGrad.addColorStop(1, '#051a3a');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, WATER_Y, W, H - WATER_Y);

  // Water shimmer line
  ctx.strokeStyle = 'rgba(100,200,255,0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 8) {
    const y = WATER_Y + Math.sin(x * 0.05 + Date.now() * 0.002) * 4;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fisher person
  ctx.font = '2.2rem serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🧑', rodX, WATER_Y - 40);

  // Rod line
  if (rod.cast) {
    ctx.strokeStyle = 'rgba(255,255,200,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodX, WATER_Y - 20);
    ctx.lineTo(rodX, rod.hookY);
    ctx.stroke();
    ctx.font = '1.4rem serif';
    ctx.fillText('🪝', rodX, rod.hookY);
  } else {
    ctx.font = '1rem serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.font = '14px Segoe UI';
    ctx.fillText(window.matchMedia('(pointer:coarse)').matches ? 'Tap to cast!' : 'Click or Space to cast!', rodX, WATER_Y - 68);
  }

  // Fish
  for (const f of fishes) {
    ctx.save();
    ctx.translate(f.x, f.y + f.wobble);
    if (f.dir < 0) ctx.scale(-1, 1);
    ctx.font = '2rem serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, 0, 0);
    ctx.restore();
    if (f.hooked) {
      ctx.font = '1rem serif'; ctx.textAlign = 'center';
      ctx.fillText('😱', f.x + 24, f.y + f.wobble - 16);
    }
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type === 'text') {
      ctx.font = 'bold 22px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ===== Timer =====
function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 10) timerEl.style.color = '#ff4444';
  if (timeLeft <= 0) endGame();
}

// ===== Loop =====
function loop() {
  if (!gameRunning) return;
  update(); draw();
  animFrame = requestAnimationFrame(loop);
}

// ===== Start / End =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; caught = 0; timeLeft = 60; level = 1; gameRunning = true;
  fishes = []; particles = [];
  rod = { cast: false, hookY: 0, hooking: false };
  spawnTimer = 0; spawnInterval = 90;
  timerEl.style.color = '';
  scoreEl.textContent = caughtEl.textContent = '0';
  timerEl.textContent = '60';
  resize(); rodX = W / 2;
  showScreen(gameScreen);
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
}

function endGame() {
  gameRunning = false; clearInterval(timerInterval); cancelAnimationFrame(animFrame);
  const stars = caught >= 15 ? '⭐⭐⭐' : caught >= 8 ? '⭐⭐' : caught >= 3 ? '⭐' : '';
  const msg   = caught < 3  ? "The fish got away! Try again! 🎣"
              : caught < 8  ? "Nice fishing! 🌟"
              : caught < 15 ? "Great angler! 🎉"
              : "Master Fisher! 🏆";
  document.getElementById('result-title').textContent = `You caught ${caught} Pokemon!`;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent   = msg;
  document.getElementById('stat-score').textContent   = score;
  document.getElementById('stat-caught').textContent  = caught;
  showScreen(resultScreen);
}

resize();
