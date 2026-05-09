// ===== Pokemon Jump =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H, HUD_H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  HUD_H = document.getElementById('hud').offsetHeight || 56;
}
window.addEventListener('resize', resize);

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives-display');
const timerEl = document.getElementById('timer');

let score, hits, lives, timeLeft, gameRunning, level;
let animFrame, timerInterval;
let audioCtx = null;
let bestScore = parseInt(localStorage.getItem('jump-best')) || 0;

const player = { x: 100, y: 0, w: 40, h: 40, vy: 0, jump: -15, gravity: 0.8, isGrounded: false, invincible: 0 };
let obstacles = [];
let particles = [];
let spawnTimer = 0;
let spawnInterval = 90;
let groundOffset = 0;

function showScreen(s) {
  [startScreen, gameScreen, resultScreen].forEach(x => x.classList.remove('active'));
  s.classList.add('active');
}

function playBeep(freq, type='sine', dur=0.15) {
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

// ===== Jump input: only fire on the canvas or jump button, not on UI buttons =====
function doJump() {
  if (!gameRunning) return;
  if (player.isGrounded) {
    player.vy = player.jump;
    player.isGrounded = false;
    playBeep(400, 'sine', 0.2);
  }
}

window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); doJump(); }
});

// Only catch pointerdown on the canvas itself — NOT window
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  doJump();
});

const jumpBtn = document.getElementById('jump-btn');
if (jumpBtn) {
  jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); doJump(); });
}

function spawnObstacle() {
  // Occasional double-obstacle for challenge
  const double = level >= 3 && Math.random() < 0.3;
  obstacles.push({
    x: W,
    y: H - 60,
    w: 30,
    h: 30,
    passed: false,
    emoji: '🪨'
  });
  if (double) {
    obstacles.push({
      x: W + 90,
      y: H - 60,
      w: 30,
      h: 30,
      passed: false,
      emoji: '🪨'
    });
  }
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i;
    particles.push({ x, y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 1, color, size: 5 });
  }
}

function spawnText(x, y, text, color) {
  particles.push({ type: 'text', x, y, vy: -2, life: 1, text, color });
}

function updateLives() {
  livesEl.textContent = '';
  for (let i = 0; i < 3; i++) {
    livesEl.textContent += i < lives ? '❤️' : '💔';
  }
}

function update() {
  // Invincibility countdown
  if (player.invincible > 0) player.invincible--;

  player.vy += player.gravity;
  player.y += player.vy;
  
  const groundY = H - 60;
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.isGrounded = true;
  }
  
  const speed = 5 + level * 1;
  groundOffset = (groundOffset + speed) % 40; // scrolling ground dots
  
  // Timer-based spawn
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
    spawnInterval = Math.max(45, 90 - level * 5);
  }
  
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= speed;
    
    // Collision — only if not invincible
    if (player.invincible <= 0 &&
        player.x < obs.x + obs.w && player.x + player.w > obs.x &&
        player.y < obs.y + obs.h && player.y + player.h > obs.y) {
      hits++;
      lives--;
      player.invincible = 60; // 1 second of invincibility at 60fps
      playBeep(200, 'sawtooth', 0.3);
      obstacles.splice(i, 1);

      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff4444');
      spawnText(player.x, player.y - 10, '-❤️', '#ff4444');

      updateLives();
      if (lives <= 0) { endGame(); return; }
      continue;
    }
    
    if (obs.x + obs.w < player.x && !obs.passed) {
      obs.passed = true;
      score += 10;
      level = Math.floor(score / 100) + 1;
      scoreEl.textContent = score;
      playBeep(600 + level * 10, 'sine', 0.1);
      spawnText(player.x + 30, player.y - 10, '+10', '#FFD700');
    }
    
    if (obs.x + obs.w < 0) obstacles.splice(i, 1);
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.03;
    if (p.type === 'text') {
      p.y += p.vy;
    } else {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1;
    }
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H - 60);
  sky.addColorStop(0, '#1a1a4e');
  sky.addColorStop(0.5, '#2a4a7f');
  sky.addColorStop(1, '#4a90d9');
  ctx.fillStyle = sky;
  ctx.fillRect(0, HUD_H, W, H - 60 - HUD_H);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '2rem serif';
  ctx.textAlign = 'left';
  for (let cx = 0; cx < W; cx += 280) {
    ctx.fillText('☁️', ((cx - groundOffset * 0.3) % (W + 100) + W + 100) % (W + 100) - 50, HUD_H + 80);
  }
  ctx.textAlign = 'start';

  // Ground
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, H - 60, W, 60);
  // Ground texture
  ctx.fillStyle = '#388E3C';
  for (let gx = -groundOffset; gx < W; gx += 40) {
    ctx.fillRect(gx + 10, H - 55, 4, 4);
    ctx.fillRect(gx + 25, H - 48, 4, 4);
    ctx.fillRect(gx + 5, H - 40, 4, 4);
  }

  // Player — blink when invincible
  if (player.invincible <= 0 || Math.floor(player.invincible / 4) % 2 === 0) {
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'start';
    ctx.fillText('⚡', player.x, player.y + 35);
  }

  // Obstacles
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'start';
  for (const obs of obstacles) {
    ctx.fillText(obs.emoji, obs.x, obs.y + 25);
  }

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
  ctx.textAlign = 'start';
}

function loop() {
  if (!gameRunning) return;
  update();
  draw();
  animFrame = requestAnimationFrame(loop);
}

function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 10) timerEl.style.color = '#ff4444';
  if (timeLeft <= 0) endGame();
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; hits = 0; lives = 3; timeLeft = 60; level = 1; gameRunning = true;
  obstacles = []; particles = [];
  spawnTimer = 0;
  spawnInterval = 90;
  groundOffset = 0;
  player.y = H - 60 - player.h;
  player.vy = 0;
  player.invincible = 0;
  player.isGrounded = false;
  
  timerEl.style.color = '';
  scoreEl.textContent = '0';
  updateLives();
  timerEl.textContent = '60';
  
  resize();
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
    localStorage.setItem('jump-best', bestScore);
  }
  
  const stars = hits === 0 ? '⭐⭐⭐' : hits <= 3 ? '⭐⭐' : '⭐';
  let msg;
  if (lives <= 0) {
    msg = hits <= 1 ? 'Ouch! Try again! 💪' : hits <= 3 ? 'Almost there! 🌟' : 'Keep trying! 💪';
  } else {
    msg = hits === 0 ? 'PERFECT RUN! 🏆' : 'Good jumping! 🌟';
  }
  
  document.getElementById('result-title').textContent = lives <= 0 ? 'Game Over! 💔' : "Time's up!";
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent = msg;
  document.getElementById('stat-score').textContent = score;
  document.getElementById('stat-hits').textContent = hits;
  document.getElementById('stat-best').textContent = bestScore;
  
  showScreen(resultScreen);
}

resize();