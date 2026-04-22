// ===== Pokemon Data =====
const POKEMON = [
  { name: 'Magikarp',   emoji: '🐟', points: 5  },
  { name: 'Pikachu',    emoji: '⚡', points: 10 },
  { name: 'Charmander', emoji: '🔥', points: 15 },
  { name: 'Squirtle',   emoji: '💧', points: 15 },
  { name: 'Bulbasaur',  emoji: '🌿', points: 15 },
  { name: 'Psyduck',    emoji: '🦆', points: 15 },
  { name: 'Jigglypuff', emoji: '🎵', points: 20 },
  { name: 'Eevee',      emoji: '🦊', points: 20 },
  { name: 'Snorlax',    emoji: '😴', points: 25 },
  { name: 'Gengar',     emoji: '👻', points: 30 },
  { name: 'Lapras',     emoji: '🌊', points: 30 },
  { name: 'Mewtwo',     emoji: '🌀', points: 50 },
];

// Bomb — catching this loses a life
const BOMB = { name: 'Bomb', emoji: '💣', points: 0, isBomb: true };

// ===== Canvas Setup =====
const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');

let W, H, HUD_H;
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  HUD_H = document.getElementById('hud').offsetHeight || 56;
  if (basket) {
    basket.y = H - basket.h - 20 - (isTouchDevice() ? 100 : 10);
    basket.x = Math.min(Math.max(basket.x, 0), W - basket.w);
  }
}
window.addEventListener('resize', resize);

// ===== Game State =====
let score, lives, level, totalCaught, totalMissed;
let fallers = [];
let particles = [];
let basket;
let gameRunning = false;
let animFrame = null;
let spawnTimer = 0;
let spawnInterval = 120; // frames between spawns
let keys = {};

// ===== DOM =====
const startScreen   = document.getElementById('start-screen');
const gameScreen    = document.getElementById('game-screen');
const resultScreen  = document.getElementById('result-screen');
const scoreEl       = document.getElementById('score');
const livesEl       = document.getElementById('lives-display');
const levelEl       = document.getElementById('level');
const resultTitle   = document.getElementById('result-title');
const resultStars   = document.getElementById('result-stars');
const resultMsg     = document.getElementById('result-msg');
const statScore     = document.getElementById('stat-score');
const statCaught    = document.getElementById('stat-caught');
const statMissed    = document.getElementById('stat-missed');

// ===== Touch detection =====
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

// ===== Basket =====
function makeBasket() {
  const bw = Math.min(120, W * 0.28);
  return {
    x: W / 2 - bw / 2,
    y: H - bw * 0.6 - 20 - (isTouchDevice() ? 100 : 10),
    w: bw,
    h: bw * 0.55,
    speed: W * 0.012,
    emoji: '🧺',
  };
}

// ===== Screens =====
function showScreen(screen) {
  [startScreen, gameScreen, resultScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ===== Start =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; lives = 3; level = 1; totalCaught = 0; totalMissed = 0;
  fallers = []; particles = [];
  spawnTimer = 0;
  spawnInterval = 120;
  keys = {};

  resize();
  basket = makeBasket();

  updateHUD();
  showScreen(gameScreen);
  gameRunning = true;

  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
}

// ===== HUD =====
function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.textContent = '❤️'.repeat(lives) || '💔';
}

// ===== Spawn =====
function spawnFaller() {
  const pool = level >= 3 ? [...POKEMON, BOMB] : POKEMON.filter(p => p.points <= 20);
  const poke  = Math.random() < (level >= 3 ? 0.15 : 0) ? BOMB : pool[Math.floor(Math.random() * pool.length)];
  const size  = Math.min(52, W * 0.12);
  const x     = size + Math.random() * (W - size * 2);
  const baseSpeed = 2.5 + level * 0.4;
  const speed = baseSpeed + Math.random() * 1.5;

  fallers.push({ ...poke, x, y: HUD_H - size, size, speed, opacity: 1 });
}

// ===== Controls =====

// Keyboard
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

// Mouse
window.addEventListener('mousemove', e => {
  if (!gameRunning || !basket) return;
  basket.x = e.clientX - basket.w / 2;
});

// Touch swipe
let touchStartX = null;
window.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!gameRunning || !basket || touchStartX === null) return;
  const dx = e.touches[0].clientX - touchStartX;
  basket.x += dx;
  touchStartX = e.touches[0].clientX;
}, { passive: true });

// On-screen buttons
let leftHeld = false, rightHeld = false;

function holdBtn(btn, flag) {
  btn.addEventListener('pointerdown',  () => { flag === 'left' ? leftHeld  = true : rightHeld  = true; });
  btn.addEventListener('pointerup',    () => { flag === 'left' ? leftHeld  = false : rightHeld = false; });
  btn.addEventListener('pointerleave', () => { flag === 'left' ? leftHeld  = false : rightHeld = false; });
}
holdBtn(document.getElementById('btn-left'),  'left');
holdBtn(document.getElementById('btn-right'), 'right');

// ===== Particles =====
function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 1,
      color,
      size: 4 + Math.random() * 4,
    });
  }
}

function spawnScorePopup(x, y, text, color = '#FFD700') {
  particles.push({ type: 'text', x, y, vy: -2, life: 1, text, color });
}

// ===== Audio =====
let audioCtx = null;
function playSound(freq, type = 'sine', duration = 0.25) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

// ===== Main Loop =====
function loop() {
  if (!gameRunning) return;
  update();
  draw();
  animFrame = requestAnimationFrame(loop);
}

function update() {
  // Move basket via keyboard / buttons
  if (keys['ArrowLeft'] || keys['a'] || keys['A'] || leftHeld)  basket.x -= basket.speed;
  if (keys['ArrowRight'] || keys['d'] || keys['D'] || rightHeld) basket.x += basket.speed;
  basket.x = Math.max(0, Math.min(W - basket.w, basket.x));

  // Spawn
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnFaller();
    // Gradually speed up spawning
    spawnInterval = Math.max(40, spawnInterval - 1);
  }

  // Move fallers
  for (let i = fallers.length - 1; i >= 0; i--) {
    const f = fallers[i];
    f.y += f.speed;

    // Caught?
    const bx = basket.x, by = basket.y, bw = basket.w, bh = basket.h;
    if (
      f.x + f.size * 0.4 > bx &&
      f.x - f.size * 0.4 < bx + bw &&
      f.y + f.size * 0.5 > by &&
      f.y - f.size * 0.3 < by + bh
    ) {
      fallers.splice(i, 1);
      if (f.isBomb) {
        lives--;
        updateHUD();
        spawnParticles(f.x, f.y, '#ff4444', 10);
        spawnScorePopup(f.x, f.y - 20, '-LIFE!', '#ff4444');
        playSound(150, 'sawtooth', 0.4);
        if (lives <= 0) { endGame(); return; }
      } else {
        score += f.points;
        totalCaught++;
        // Level up every 10 catches
        const newLevel = Math.floor(totalCaught / 10) + 1;
        if (newLevel > level) { level = newLevel; spawnScorePopup(W/2, H/2 - 40, '🚀 LEVEL UP!', '#FFD700'); }
        updateHUD();
        spawnParticles(f.x, f.y, '#FFD700', 8);
        spawnScorePopup(f.x, f.y - 20, '+' + f.points);
        playSound(400 + f.points * 6, 'sine', 0.2);
      }
      continue;
    }

    // Missed — hit the ground
    if (f.y > H + f.size) {
      fallers.splice(i, 1);
      if (!f.isBomb) {
        lives--;
        totalMissed++;
        updateHUD();
        spawnScorePopup(f.x, H - 60, 'MISS!', '#ff8888');
        playSound(200, 'triangle', 0.3);
        if (lives <= 0) { endGame(); return; }
      }
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.03;
    if (p.type === 'text') { p.y += p.vy; }
    else { p.x += p.vx; p.y += p.vy; p.vy += 0.15; }
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Fallers
  for (const f of fallers) {
    ctx.globalAlpha = f.opacity;
    ctx.font = `${f.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, f.x, f.y);
  }

  // Basket
  ctx.globalAlpha = 1;
  ctx.font = `${basket.h * 1.3}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(basket.emoji, basket.x + basket.w / 2, basket.y + basket.h / 2);

  // Ground line (subtle)
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - (isTouchDevice() ? 110 : 10));
  ctx.lineTo(W, H - (isTouchDevice() ? 110 : 10));
  ctx.stroke();

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type === 'text') {
      ctx.font = 'bold 22px Segoe UI, Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// ===== End Game =====
function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animFrame);

  const stars = totalCaught >= 20 ? '⭐⭐⭐' : totalCaught >= 10 ? '⭐⭐' : totalCaught >= 4 ? '⭐' : '';
  const msg = totalCaught === 0    ? "Don't give up! Try again! 💪"
            : totalCaught < 5     ? "Good start! Keep practicing! 🌟"
            : totalCaught < 15    ? "Great catching! 🎉"
            : totalCaught < 25    ? "Amazing trainer! 🏆"
            : "LEGENDARY! You're a master! 🎖️";

  resultTitle.textContent = lives <= 0 ? 'Game Over! 💔' : "Time's Up!";
  resultStars.textContent = stars;
  resultMsg.textContent   = msg;
  statScore.textContent   = score;
  statCaught.textContent  = totalCaught;
  statMissed.textContent  = totalMissed;

  showScreen(resultScreen);
}

// ===== Init =====
resize();
