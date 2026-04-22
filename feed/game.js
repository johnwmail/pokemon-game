// ===== Pokemon Feed =====
const POKEMON = [
  { emoji: '⚡', food: '🍎', color: '#ffeb3b' },
  { emoji: '🔥', food: '🌶️', color: '#ff5722' },
  { emoji: '💧', food: '🧊', color: '#03a9f4' }
];

const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl      = document.getElementById('score');
const caughtEl     = document.getElementById('caught');
const timerEl      = document.getElementById('timer');
const gameArea     = document.getElementById('game-area');
const pokeZone     = document.getElementById('pokemon-zone');

let score = 0, fed = 0, timeLeft = 60, gameRunning = false, level = 1;
let timerInterval, spawnInterval;
let foods = [];
let audioCtx = null;

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

function buildPokemon() {
  pokeZone.innerHTML = '';
  POKEMON.forEach(p => {
    const el = document.createElement('div');
    el.classList.add('hungry-poke');
    el.textContent = p.emoji;
    el.dataset.food = p.food;
    pokeZone.appendChild(el);
  });
}

function spawnFood() {
  if (!gameRunning) return;
  const p = POKEMON[Math.floor(Math.random() * POKEMON.length)];
  const food = document.createElement('div');
  food.classList.add('food-item');
  food.textContent = p.food;
  food.style.left = `${10 + Math.random() * 80}%`;
  
  // Animation duration depends on level
  const dur = Math.max(2, 6 - level * 0.5);
  food.style.animationDuration = `${dur}s`;

  food.addEventListener('mousedown', (e) => {
    e.preventDefault();
    feedPokemon(p.food, food);
  });
  food.addEventListener('touchstart', (e) => {
    e.preventDefault();
    feedPokemon(p.food, food);
  }, {passive: false});

  gameArea.appendChild(food);
  foods.push(food);

  setTimeout(() => {
    if (food.parentNode) {
      food.remove();
      foods = foods.filter(f => f !== food);
      playBeep(200, 'sawtooth', 0.2); // Missed
    }
  }, dur * 1000);
}

function feedPokemon(foodType, foodEl) {
  if (!gameRunning) return;
  foodEl.remove();
  foods = foods.filter(f => f !== foodEl);
  
  const pokeEl = Array.from(pokeZone.children).find(el => el.dataset.food === foodType);
  if (pokeEl) {
    score += 10;
    fed++;
    level = Math.floor(fed / 10) + 1;
    scoreEl.textContent = score;
    caughtEl.textContent = fed;
    
    playBeep(500 + fed * 10, 'sine', 0.2);
    pokeEl.classList.add('eating');
    setTimeout(() => pokeEl.classList.remove('eating'), 300);
  }
}

function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 10) timerEl.style.color = '#ff4444';
  if (timeLeft <= 0) endGame();
}

function loop() {
  if (!gameRunning) return;
  spawnFood();
  const nextSpawn = Math.max(500, 2000 - level * 200);
  spawnInterval = setTimeout(loop, nextSpawn);
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score = 0; fed = 0; timeLeft = 60; level = 1; gameRunning = true;
  timerEl.style.color = '';
  scoreEl.textContent = '0';
  caughtEl.textContent = '0';
  timerEl.textContent = '60';
  gameArea.innerHTML = '';
  foods = [];
  buildPokemon();
  showScreen(gameScreen);
  clearInterval(timerInterval);
  clearTimeout(spawnInterval);
  timerInterval = setInterval(tick, 1000);
  loop();
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  clearTimeout(spawnInterval);
  const stars = fed >= 30 ? '⭐⭐⭐' : fed >= 15 ? '⭐⭐' : '⭐';
  const msg = fed >= 30 ? "MASTER CHEF! 🏆" : "Yummy! 🌟";
  
  document.getElementById('result-title').textContent = `You fed ${fed} times!`;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent = msg;
  document.getElementById('stat-score').textContent = score;
  document.getElementById('stat-caught').textContent = fed;
  
  showScreen(resultScreen);
}