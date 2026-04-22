// ===== Pokemon Match =====
const POKEMON = [
  { emoji:'⚡', points:10 },{ emoji:'🔥', points:15 },{ emoji:'💧', points:15 },
  { emoji:'🌿', points:15 },{ emoji:'🎵', points:20 },{ emoji:'😴', points:25 },
  { emoji:'🦊', points:20 },{ emoji:'👻', points:30 },{ emoji:'🐟', points:5 },
  { emoji:'🦆', points:15 },{ emoji:'🌊', points:30 },{ emoji:'🌀', points:50 },
];

const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl      = document.getElementById('score');
const caughtEl     = document.getElementById('caught');
const timerEl      = document.getElementById('timer');
const board        = document.getElementById('game-board');

let score, pairs, timeLeft, gameRunning;
let timerInterval;
let cards = [];
let firstCard = null, secondCard = null, lockBoard = false;
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

function shuffle(arr) {
  for(let i = arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildBoard() {
  board.innerHTML = '';
  // 6 pairs for 12 cards total
  const deck = shuffle([...POKEMON]).slice(0, 6);
  const cardData = shuffle([...deck, ...deck]);
  
  cardData.forEach((p, i) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.name = p.emoji;
    card.dataset.points = p.points;
    card.dataset.idx = i;
    
    const inner = document.createElement('div');
    inner.classList.add('card-inner');
    
    const front = document.createElement('div');
    front.classList.add('card-front');
    
    const back = document.createElement('div');
    back.classList.add('card-back');
    back.textContent = p.emoji;
    
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    
    card.addEventListener('click', () => flipCard(card));
    board.appendChild(card);
  });
}

function flipCard(card) {
  if (lockBoard) return;
  if (card === firstCard) return;
  if (card.classList.contains('matched')) return;

  card.classList.add('flipped');
  playBeep(400 + Math.random()*200);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.dataset.name === secondCard.dataset.name;

  if (isMatch) {
    const pts = parseInt(firstCard.dataset.points);
    score += pts;
    pairs++;
    scoreEl.textContent = score;
    caughtEl.textContent = pairs;
    playBeep(600 + pts*10, 'sine', 0.3);
    
    disableCards();
    
    if (pairs === 6) {
      setTimeout(endGame, 500); // Win condition
    }
  } else {
    unflipCards();
  }
}

function disableCards() {
  firstCard.classList.add('matched');
  secondCard.classList.add('matched');
  resetBoard();
}

function unflipCards() {
  lockBoard = true;
  playBeep(200, 'sawtooth', 0.2);
  setTimeout(() => {
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');
    resetBoard();
  }, 800);
}

function resetBoard() {
  [firstCard, secondCard, lockBoard] = [null, null, false];
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
  score = 0; pairs = 0; timeLeft = 60; gameRunning = true;
  timerEl.style.color = '';
  scoreEl.textContent = '0';
  caughtEl.textContent = '0';
  timerEl.textContent = '60';
  buildBoard();
  resetBoard();
  showScreen(gameScreen);
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  const stars = pairs === 6 ? '⭐⭐⭐' : pairs >= 3 ? '⭐⭐' : '⭐';
  const msg = pairs === 6 ? "PERFECT MEMORY! 🏆" : "Keep practicing! 🌟";
  
  document.getElementById('result-title').textContent = pairs === 6 ? 'You Matched Them All!' : `You found ${pairs} pairs!`;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent = msg;
  document.getElementById('stat-score').textContent = score;
  document.getElementById('stat-caught').textContent = pairs;
  
  showScreen(resultScreen);
}