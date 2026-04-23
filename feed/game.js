// ===== Pokemon Feed =====
const POKEMON = [
  { emoji: '⚡', food: '🍎' },
  { emoji: '🔥', food: '🌶' },
  { emoji: '💧', food: '🧊' },
];

const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl      = document.getElementById('score');
const caughtEl     = document.getElementById('caught');
const timerEl      = document.getElementById('timer');
const canvas       = document.getElementById('game-canvas');
const ctx          = canvas.getContext('2d');

let score = 0, fed = 0, timeLeft = 60, gameRunning = false, level = 1;
let timerInterval, rafId;
let foods = [];
let lastSpawn = 0;
let audioCtx = null;

const POKE_SIZE = 60;
const FOOD_SIZE = 44;
const POKE_Y_RATIO = 0.85;

let pokemons = [];

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  layoutPokemons();
}

function layoutPokemons() {
  const n = POKEMON.length;
  pokemons = POKEMON.map((p, i) => ({
    ...p,
    x: canvas.width * (i + 1) / (n + 1),
    y: canvas.height * POKE_Y_RATIO,
    eating: 0,
  }));
}

window.addEventListener('resize', resize);

function showScreen(s) {
  [startScreen, gameScreen, resultScreen].forEach(x => x.classList.remove('active'));
  s.classList.add('active');
}

function playBeep(freq, type = 'sine', dur = 0.15) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function spawnFood() {
  const p = POKEMON[Math.floor(Math.random() * POKEMON.length)];
  const speed = 80 + level * 20; // px per second
  foods.push({
    emoji: p.food,
    matchEmoji: p.emoji,
    x: canvas.width * (0.1 + Math.random() * 0.8),
    y: -FOOD_SIZE,
    speed,
  });
}

let lastTime = 0;
function gameLoop(ts) {
  if (!gameRunning) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.1);
  lastTime = ts;

  // Spawn food
  const spawnInterval = Math.max(600, 1800 - level * 150);
  if (ts - lastSpawn > spawnInterval) {
    spawnFood();
    lastSpawn = ts;
  }

  // Update food positions
  foods.forEach(f => { f.y += f.speed * dt; });
  // Remove food that hit the bottom
  foods = foods.filter(f => {
    if (f.y > canvas.height + FOOD_SIZE) {
      playBeep(200, 'sawtooth', 0.2);
      return false;
    }
    return true;
  });

  draw();
  rafId = requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grass strip at bottom
  ctx.fillStyle = '#81c784';
  ctx.fillRect(0, canvas.height * POKE_Y_RATIO - 20, canvas.width, canvas.height);

  // Draw pokemon
  ctx.font = `${POKE_SIZE}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  pokemons.forEach(p => {
    const scale = p.eating > 0 ? 1.3 : 1.0;
    p.eating = Math.max(0, p.eating - 0.05);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillText(p.emoji, 0, 0);
    ctx.restore();
  });

  // Draw falling food
  ctx.font = `${FOOD_SIZE}px serif`;
  foods.forEach(f => {
    ctx.fillText(f.emoji, f.x, f.y);
  });
}

function handleClick(cx, cy) {
  if (!gameRunning) return;
  // Check if any food item was clicked
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    const dx = cx - f.x;
    const dy = cy - f.y;
    if (Math.sqrt(dx * dx + dy * dy) < FOOD_SIZE) {
      // Find matching pokemon
      const poke = pokemons.find(p => p.emoji === f.matchEmoji);
      if (poke) {
        score += 10;
        fed++;
        level = Math.floor(fed / 10) + 1;
        scoreEl.textContent = score;
        caughtEl.textContent = fed;
        poke.eating = 1;
        playBeep(500 + fed * 10, 'sine', 0.2);
      }
      foods.splice(i, 1);
      return;
    }
  }
}

canvas.addEventListener('mousedown', e => {
  const r = canvas.getBoundingClientRect();
  handleClick(e.clientX - r.left, e.clientY - r.top);
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const t = e.touches[0];
  handleClick(t.clientX - r.left, t.clientY - r.top);
}, { passive: false });

function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 10) timerEl.style.color = '#ff4444';
  if (timeLeft <= 0) endGame();
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; fed = 0; timeLeft = 60; level = 1; gameRunning = true;
  timerEl.style.color = '';
  scoreEl.textContent = '0';
  caughtEl.textContent = '0';
  timerEl.textContent = '60';
  foods = [];
  lastSpawn = 0;
  lastTime = 0;
  resize();
  showScreen(gameScreen);
  clearInterval(timerInterval);
  cancelAnimationFrame(rafId);
  timerInterval = setInterval(tick, 1000);
  rafId = requestAnimationFrame(ts => { lastTime = ts; gameLoop(ts); });
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  cancelAnimationFrame(rafId);
  const stars = fed >= 30 ? '⭐⭐⭐' : fed >= 15 ? '⭐⭐' : '⭐';
  document.getElementById('result-title').textContent = `You fed ${fed} Pokemon!`;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent = fed >= 30 ? 'MASTER CHEF! 🏆' : 'Yummy! 🌟';
  document.getElementById('stat-score').textContent = score;
  document.getElementById('stat-caught').textContent = fed;
  showScreen(resultScreen);
}
