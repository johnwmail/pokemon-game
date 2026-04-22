// ===== Pokemon Herding =====
const POKEMON = [
  { emoji:'⚡', points:10 },{ emoji:'🔥', points:15 },{ emoji:'💧', points:15 },
  { emoji:'🌿', points:15 },{ emoji:'🎵', points:20 },{ emoji:'😴', points:25 },
  { emoji:'🦊', points:20 },{ emoji:'👻', points:30 },{ emoji:'🐟', points:5 },
  { emoji:'🦆', points:15 },{ emoji:'🌊', points:30 },{ emoji:'🌀', points:50 },
];

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let W, H, HUD_H;
const PEN = { w: 100, h: 100 }; // set in resize
let pen = {};

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  HUD_H = document.getElementById('hud').offsetHeight || 56;
  pen = { x: W - 130, y: H - 130, w: 110, h: 110 };
}
window.addEventListener('resize', resize);

// ===== State =====
let score, caught, timeLeft, level, gameRunning;
let pokemons = [], particles = [];
let lasso = { drawing: false, points: [], closed: false };
let timerInterval, animFrame;

// ===== DOM =====
const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl  = document.getElementById('score');
const caughtEl = document.getElementById('caught');
const timerEl  = document.getElementById('timer');

function showScreen(s) {
  [startScreen, gameScreen, resultScreen].forEach(x => x.classList.remove('active'));
  s.classList.add('active');
}

// ===== Lasso drawing =====
function startDraw(x, y) { lasso = { drawing: true, points: [{x,y}], closed: false }; }
function continueDraw(x, y) {
  if (!lasso.drawing) return;
  const last = lasso.points[lasso.points.length - 1];
  if (Math.hypot(x - last.x, y - last.y) > 8) lasso.points.push({x, y});
}
function endDraw() {
  if (!lasso.drawing || lasso.points.length < 6) { lasso.drawing = false; lasso.points = []; return; }
  lasso.drawing = false;
  lasso.closed  = true;
  checkHerding();
  setTimeout(() => { lasso = { drawing: false, points: [], closed: false }; }, 600);
}

canvas.addEventListener('mousedown',  e => startDraw(e.clientX, e.clientY));
canvas.addEventListener('mousemove',  e => continueDraw(e.clientX, e.clientY));
canvas.addEventListener('mouseup',    () => endDraw());
canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); continueDraw(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
canvas.addEventListener('touchend',   () => endDraw());

// ===== Point-in-polygon =====
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ===== Herding check =====
function checkHerding() {
  if (lasso.points.length < 6) return;
  let herded = 0;
  for (let i = pokemons.length - 1; i >= 0; i--) {
    const p = pokemons[i];
    if (p.herded) continue;
    if (pointInPoly(p.x, p.y, lasso.points)) {
      // Direct to pen
      p.targetX = pen.x + pen.w / 2;
      p.targetY = pen.y + pen.h / 2;
      p.herding = true;
      herded++;
    }
  }
  if (herded > 0) playBeep(350, 'sine', 0.2);
}

// ===== Pokemon AI =====
function buildPokemon() {
  pokemons = [];
  const count = 6 + level;
  for (let i = 0; i < Math.min(count, 10); i++) {
    pokemons.push(newPokemon());
  }
}

function newPokemon() {
  const p = POKEMON[Math.floor(Math.random() * POKEMON.length)];
  return { ...p,
    x: 60 + Math.random() * (W - 200),
    y: HUD_H + 60 + Math.random() * (H - HUD_H - 200),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    herding: false, herded: false,
    targetX: null, targetY: null,
  };
}

function updatePokemon() {
  for (const p of pokemons) {
    if (p.herded) continue;
    if (p.herding && p.targetX !== null) {
      const dx = p.targetX - p.x, dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        // In pen!
        p.herded = true;
        score  += p.points;
        caught++;
        scoreEl.textContent  = score;
        caughtEl.textContent = caught;
        level = Math.floor(caught / 5) + 1;
        spawnParticles(p.x, p.y, '#FFD700');
        spawnText(p.x, p.y - 30, '+' + p.points);
        playBeep(400 + p.points * 5);
        // Respawn a new one
        setTimeout(() => { if (gameRunning) pokemons.push(newPokemon()); }, 2000);
      } else {
        p.x += (dx / dist) * 4;
        p.y += (dy / dist) * 4;
      }
    } else {
      // Wander
      p.vx += (Math.random() - 0.5) * 0.4;
      p.vy += (Math.random() - 0.5) * 0.4;
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 2) { p.vx = p.vx / spd * 2; p.vy = p.vy / spd * 2; }
      p.x += p.vx; p.y += p.vy;
      // Bounce
      if (p.x < 30)     { p.x = 30;     p.vx *= -1; }
      if (p.x > W - 30) { p.x = W - 30; p.vx *= -1; }
      if (p.y < HUD_H + 30) { p.y = HUD_H + 30; p.vy *= -1; }
      if (p.y > H - 30) { p.y = H - 30;  p.vy *= -1; }
    }
  }
}

// ===== Particles =====
function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI*2/8)*i;
    particles.push({ x, y, vx:Math.cos(a)*3, vy:Math.sin(a)*3, life:1, color, size:5 });
  }
}
function spawnText(x, y, text) {
  particles.push({ type:'text', x, y, vy:-1.5, life:1, text, color:'#FFD700' });
}

// ===== Audio =====
let audioCtx = null;
function playBeep(freq, type='sine', dur=0.25) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if (audioCtx.state==='suspended') audioCtx.resume();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value=freq; o.type=type;
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
    o.start(); o.stop(audioCtx.currentTime+dur);
  } catch(e) {}
}

// ===== Draw =====
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Grass background
  const grad = ctx.createLinearGradient(0,HUD_H,0,H);
  grad.addColorStop(0,'#1a3a1a'); grad.addColorStop(1,'#0d1f0d');
  ctx.fillStyle = grad; ctx.fillRect(0, HUD_H, W, H - HUD_H);

  // Pen
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(pen.x, pen.y, pen.w, pen.h);
  ctx.setLineDash([]);
  ctx.font = '2rem serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🏠', pen.x + pen.w/2, pen.y + pen.h/2);

  // Lasso
  if (lasso.points.length > 1) {
    ctx.strokeStyle = lasso.closed ? 'rgba(100,255,100,0.8)' : 'rgba(255,215,0,0.8)';
    ctx.lineWidth   = 3; ctx.setLineDash([6,3]);
    ctx.beginPath();
    ctx.moveTo(lasso.points[0].x, lasso.points[0].y);
    lasso.points.forEach(p => ctx.lineTo(p.x, p.y));
    if (lasso.closed) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    // Fill when closed
    if (lasso.closed) {
      ctx.fillStyle = 'rgba(100,255,100,0.1)';
      ctx.fill();
    }
  }

  // Pokemon
  for (const p of pokemons) {
    if (p.herded) continue;
    ctx.font = '2rem serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha = p.herding ? 0.7 : 1;
    ctx.fillText(p.emoji, p.x, p.y);
    if (p.herding) {
      ctx.font = '0.9rem serif';
      ctx.fillText('💨', p.x + 20, p.y - 16);
    }
    ctx.globalAlpha = 1;
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.03;
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type==='text') {
      p.y += p.vy;
      ctx.font='bold 22px Segoe UI'; ctx.textAlign='center';
      ctx.fillStyle=p.color; ctx.fillText(p.text, p.x, p.y);
    } else {
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.1;
      ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
    }
    if (p.life <= 0) particles.splice(i,1);
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

function loop() {
  if (!gameRunning) return;
  updatePokemon(); draw();
  animFrame = requestAnimationFrame(loop);
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score=0; caught=0; timeLeft=60; level=1; gameRunning=true;
  particles=[]; lasso={ drawing:false, points:[], closed:false };
  timerEl.style.color='';
  scoreEl.textContent=caughtEl.textContent='0';
  timerEl.textContent='60';
  resize(); buildPokemon();
  showScreen(gameScreen);
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
}

function endGame() {
  gameRunning=false; clearInterval(timerInterval); cancelAnimationFrame(animFrame);
  const stars = caught>=15?'⭐⭐⭐':caught>=8?'⭐⭐':caught>=3?'⭐':'';
  const msg   = caught<3 ? "Draw bigger circles! 💪"
              : caught<8 ? "Nice herding! 🌟"
              : caught<15? "Fantastic rancher! 🎉"
              : "LEGENDARY RANCHER! 🏆";
  document.getElementById('result-title').textContent=`You herded ${caught} Pokemon!`;
  document.getElementById('result-stars').textContent=stars;
  document.getElementById('result-msg').textContent=msg;
  document.getElementById('stat-score').textContent=score;
  document.getElementById('stat-caught').textContent=caught;
  showScreen(resultScreen);
}

resize();
