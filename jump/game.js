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
const caughtEl = document.getElementById('caught');
const timerEl = document.getElementById('timer');

let score, hits, timeLeft, gameRunning, level;
let animFrame, timerInterval;
let audioCtx = null;
let bestScore = parseInt(localStorage.getItem('jump-best') || '0');

const player = { x: 100, y: 0, w: 40, h: 40, vy: 0, jump: -15, gravity: 0.8, isGrounded: false };
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 90; // frames between spawns

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

function doJump() {
  if (!gameRunning) return;
  if (player.isGrounded) {
    player.vy = player.jump;
    player.isGrounded = false;
    playBeep(400, 'sine', 0.2);
  }
}

window.addEventListener('keydown', e => { if (e.code === 'Space') doJump(); });
window.addEventListener('pointerdown', e => {
  if (e.target.id !== 'jump-btn') doJump();
});

const jumpBtn = document.getElementById('jump-btn');
if (jumpBtn) {
  jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); doJump(); });
}

function spawnObstacle() {
  obstacles.push({
    x: W,
    y: H - 60,
    w: 30,
    h: 30,
    passed: false,
    emoji: '🪨'
  });
}

function update() {
  player.vy += player.gravity;
  player.y += player.vy;
  
  const groundY = H - 60;
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.isGrounded = true;
  }
  
  const speed = 5 + level * 1;
  
  // Timer-based spawn (prevents clustering)
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
    spawnInterval = Math.max(45, 90 - level * 5);
  }
  
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= speed;
    
    // Collision
    if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
        player.y < obs.y + obs.h && player.y + player.h > obs.y) {
      hits++;
      caughtEl.textContent = hits;
      playBeep(200, 'sawtooth', 0.3);
      obstacles.splice(i, 1);
      continue;
    }
    
    if (obs.x + obs.w < player.x && !obs.passed) {
      obs.passed = true;
      score += 10;
      level = Math.floor(score / 100) + 1;
      scoreEl.textContent = score;
      playBeep(600 + level*10, 'sine', 0.1);
    }
    
    if (obs.x + obs.w < 0) obstacles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  
  // Ground
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, H - 60, W, 60);
  
  // Player
  ctx.font = '40px sans-serif';
  ctx.fillText('⚡', player.x, player.y + 35);
  
  // Obstacles
  ctx.font = '30px sans-serif';
  for (const obs of obstacles) {
    ctx.fillText(obs.emoji, obs.x, obs.y + 25);
  }
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
  score = 0; hits = 0; timeLeft = 60; level = 1; gameRunning = true;
  obstacles = [];
  spawnTimer = 0;
  spawnInterval = 90;
  player.y = H - 60 - player.h;
  player.vy = 0;
  
  timerEl.style.color = '';
  scoreEl.textContent = '0';
  caughtEl.textContent = '0';
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
  
  const stars = hits === 0 ? '⭐⭐⭐' : hits < 5 ? '⭐⭐' : '⭐';
  const msg = hits === 0 ? "PERFECT RUN! 🏆" : "Good jumping! 🌟";
  
  document.getElementById('result-title').textContent = "Time's up!";
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent = msg;
  document.getElementById('stat-score').textContent = score;
  document.getElementById('stat-caught').textContent = hits;
  document.getElementById('stat-best').textContent = bestScore;
  
  showScreen(resultScreen);
}

resize();