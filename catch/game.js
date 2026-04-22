// ===== Pokemon Data =====
const POKEMON = [
  { name: 'Pikachu',    emoji: '⚡', color: '#FFD700', points: 10 },
  { name: 'Charmander', emoji: '🔥', color: '#FF6B35', points: 15 },
  { name: 'Squirtle',   emoji: '💧', color: '#4fc3f7', points: 15 },
  { name: 'Bulbasaur',  emoji: '🌿', color: '#66BB6A', points: 15 },
  { name: 'Jigglypuff', emoji: '🎵', color: '#F48FB1', points: 20 },
  { name: 'Snorlax',    emoji: '😴', color: '#9575CD', points: 25 },
  { name: 'Mewtwo',     emoji: '🌀', color: '#CE93D8', points: 50 },
  { name: 'Eevee',      emoji: '🦊', color: '#FFCC80', points: 20 },
  { name: 'Gengar',     emoji: '👻', color: '#7E57C2', points: 30 },
  { name: 'Magikarp',   emoji: '🐟', color: '#EF9A9A', points: 5  },
  { name: 'Lapras',     emoji: '🌊', color: '#80DEEA', points: 30 },
  { name: 'Psyduck',    emoji: '🦆', color: '#FFF176', points: 15 },
];

const BURST_EMOJIS = ['✨', '💫', '⭐', '🌟', '🎊', '🎉'];

// ===== Game State =====
let score = 0;
let caught = 0;
let timeLeft = 30;
let level = 1;
let timerInterval = null;
let spawnInterval = null;
let activePokemon = [];
let caughtSet = new Set();
let gameRunning = false;

// ===== DOM refs =====
const startScreen    = document.getElementById('start-screen');
const gameScreen     = document.getElementById('game-screen');
const resultScreen   = document.getElementById('result-screen');
const arena          = document.getElementById('arena');
const scoreEl        = document.getElementById('score');
const caughtEl       = document.getElementById('caught');
const timerEl        = document.getElementById('timer');
const levelBanner    = document.getElementById('level-banner');
const resultTitle    = document.getElementById('result-title');
const resultStars    = document.getElementById('result-stars');
const resultMsg      = document.getElementById('result-msg');
const caughtList     = document.getElementById('caught-list');
const pokeballCursor = document.getElementById('pokeball-cursor');

// ===== Touch detection =====
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

// ===== Pokeball cursor (desktop only) =====
if (!isTouchDevice()) {
  document.addEventListener('mousemove', (e) => {
    pokeballCursor.style.left = e.clientX + 'px';
    pokeballCursor.style.top  = e.clientY + 'px';
  });
} else {
  pokeballCursor.style.display = 'none';
}

// ===== Background stars (reduced count for mobile perf) =====
function createStars() {
  const count = isTouchDevice() ? 20 : 40;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'bg-star';
    star.textContent = '★';
    star.style.left = Math.random() * 100 + 'vw';
    star.style.top  = Math.random() * 100 + 'vh';
    star.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(star);
  }
}
createStars();

// ===== Start / Reset =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; caught = 0; timeLeft = 30; level = 1;
  activePokemon = [];
  caughtSet = new Set();

  // Reset arena but keep the pokeball cursor element intact
  arena.innerHTML = '';
  arena.appendChild(pokeballCursor);

  scoreEl.textContent   = '0';
  caughtEl.textContent  = '0';
  timerEl.textContent   = '30';
  timerEl.style.color   = '';       // reset timer color
  timerEl.style.animation = '';     // reset timer animation

  showScreen(gameScreen);
  gameRunning = true;

  clearInterval(timerInterval);
  clearTimeout(spawnInterval);

  timerInterval = setInterval(tick, 1000);
  scheduleSpawn();
  spawnPokemon(); // spawn one immediately
}

function showScreen(screen) {
  [startScreen, gameScreen, resultScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ===== Timer =====
function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;

  if (timeLeft <= 10) timerEl.style.color = '#ff4444';
  if (timeLeft <= 5) timerEl.style.animation = 'wobble 0.3s infinite';

  // Level up every 10 seconds caught milestone
  const newLevel = Math.floor(caught / 5) + 1;
  if (newLevel > level) {
    level = newLevel;
    showLevelBanner();
  }

  if (timeLeft <= 0) endGame();
}

// ===== Spawning =====
function spawnDelay() {
  // Faster spawns as level increases
  const base = Math.max(800, 2000 - level * 150);
  return base + Math.random() * 600;
}

function scheduleSpawn() {
  if (!gameRunning) return;
  spawnInterval = setTimeout(() => {
    if (gameRunning) {
      spawnPokemon();
      scheduleSpawn();
    }
  }, spawnDelay());
}

function spawnPokemon() {
  const pool = level >= 3
    ? POKEMON
    : POKEMON.filter(p => p.points <= 20);

  const poke = pool[Math.floor(Math.random() * pool.length)];

  const el = document.createElement('div');
  el.className = 'pokemon';
  el.textContent = poke.emoji;
  el.title = poke.name;
  el.dataset.name = poke.name;
  el.dataset.points = poke.points;

  // Random position (keep inside arena)
  const arenaRect = arena.getBoundingClientRect();
  const padding = 60;
  const x = padding + Math.random() * (arenaRect.width  - padding * 2);
  const y = padding + Math.random() * (arenaRect.height - padding * 2);
  el.style.left = x + 'px';
  el.style.top  = y + 'px';

  // Life duration — shorter at higher levels
  const life = Math.max(1500, 3500 - level * 200);

  // Use pointer events for unified mouse + touch, no double-fire
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    catchPokemon(el, poke, x, y);
  });

  arena.appendChild(el);
  activePokemon.push(el);

  // Auto-remove if not caught
  setTimeout(() => {
    if (el.parentNode && !el.classList.contains('caught')) {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }
  }, life);
}

// ===== Catch! =====
function catchPokemon(el, poke, x, y) {
  if (el.classList.contains('caught')) return;
  el.classList.add('caught');

  // Update state
  score += poke.points;
  caught++;
  caughtSet.add(poke.name);
  scoreEl.textContent  = score;
  caughtEl.textContent = caught;

  // Burst effect
  spawnBurst(x, y);
  spawnScorePopup(x, y, poke.points);

  // Sound via Web Audio
  playBeep(poke.points);

  // Remove after animation
  setTimeout(() => el.remove(), 500);
}

// ===== Visual Effects =====
function spawnBurst(x, y) {
  for (let i = 0; i < 3; i++) {
    const burst = document.createElement('div');
    burst.className = 'catch-burst';
    burst.textContent = BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)];
    burst.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
    burst.style.top  = y + 'px';
    arena.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }
}

function spawnScorePopup(x, y, pts) {
  const pop = document.createElement('div');
  pop.className = 'score-popup';
  pop.textContent = '+' + pts;
  pop.style.left = x + 'px';
  pop.style.top  = y + 'px';
  arena.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

function showLevelBanner() {
  levelBanner.textContent = '🚀 Level ' + level + '!';
  levelBanner.classList.remove('hidden');
  setTimeout(() => levelBanner.classList.add('hidden'), 1300);
}

// ===== Web Audio beeps =====
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playBeep(points) {
  try {
    const ctx  = getAudio();
    // iOS Safari requires explicit resume after user gesture
    if (ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Higher points = higher pitch
    osc.frequency.value = 300 + points * 8;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) { /* audio not supported */ }
}

// ===== End Game =====
function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  clearTimeout(spawnInterval);
  timerEl.style.animation = '';

  // Build result
  const stars = caught >= 15 ? '⭐⭐⭐' : caught >= 8 ? '⭐⭐' : caught >= 3 ? '⭐' : '';
  const msgs = [
    caught === 0  && 'Keep trying, you can do it! 💪',
    caught < 5    && 'Great start! Try again! 🌟',
    caught < 10   && 'Nice catching! 🎉',
    caught < 20   && 'Amazing! You\'re a Pokemon trainer! 🏆',
    caught >= 20  && 'LEGENDARY! You caught them all! 🎖️',
  ].find(Boolean) || 'Well done!';

  resultTitle.textContent = caught > 0 ? `You caught ${caught} Pokemon!` : `Oh no! None caught!`;
  resultStars.textContent = stars;
  resultMsg.textContent   = msgs;

  // Pokedex
  caughtList.innerHTML = '';
  [...caughtSet].forEach(name => {
    const poke = POKEMON.find(p => p.name === name);
    if (!poke) return;
    const badge = document.createElement('div');
    badge.className = 'caught-badge';
    badge.textContent = poke.emoji;
    badge.title = poke.name;
    caughtList.appendChild(badge);
  });

  showScreen(resultScreen);
}
