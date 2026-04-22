// ===== Pokemon Maze =====
const POKEMON = [
  { emoji:'⚡', points:10 },{ emoji:'🔥', points:15 },{ emoji:'💧', points:15 },
  { emoji:'🌿', points:15 },{ emoji:'🎵', points:20 },{ emoji:'😴', points:25 },
  { emoji:'🦊', points:20 },{ emoji:'👻', points:30 },{ emoji:'🐟', points:5 },
  { emoji:'🦆', points:15 },{ emoji:'🌊', points:30 },{ emoji:'🌀', points:50 },
];

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let W, H, HUD_H;

// Maze grid
const COLS = 11, ROWS = 11;
let CELL, OX, OY;
let maze = [], player = {}, pokemonList = [], particles = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  HUD_H = document.getElementById('hud').offsetHeight || 56;
  const availW = W - 20, availH = H - HUD_H - 20;
  CELL = Math.floor(Math.min(availW / COLS, availH / ROWS));
  OX   = Math.floor((W - COLS * CELL) / 2);
  OY   = HUD_H + Math.floor((H - HUD_H - ROWS * CELL) / 2);
}
window.addEventListener('resize', () => { resize(); });

// ===== State =====
let score, caught, timeLeft, level, gameRunning;
let timerInterval, animFrame, keys = {};

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

// ===== Maze Generation (Recursive Backtracker) =====
function generateMaze() {
  maze = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => ({
    top: true, right: true, bottom: true, left: true, visited: false
  })));

  function carve(r, c) {
    maze[r][c].visited = true;
    const dirs = shuffle([[-1,0,'top','bottom'],[1,0,'bottom','top'],[0,-1,'left','right'],[0,1,'right','left']]);
    for (const [dr, dc, wall, opp] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !maze[nr][nc].visited) {
        maze[r][c][wall]  = false;
        maze[nr][nc][opp] = false;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);
}

function shuffle(arr) {
  for (let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

// ===== Spawn Pokemon in maze =====
function spawnMazePokemon(count) {
  pokemonList = [];
  const positions = [];
  while (positions.length < count) {
    const r = Math.floor(Math.random()*ROWS);
    const c = Math.floor(Math.random()*COLS);
    if ((r > 1 || c > 1) && !positions.some(p => p.r===r && p.c===c)) {
      positions.push({r, c});
    }
  }
  positions.forEach(pos => {
    const p = POKEMON[Math.floor(Math.random()*POKEMON.length)];
    pokemonList.push({
      ...p, r: pos.r, c: pos.c,
      moveTimer: 0, moveInterval: Math.floor(40 + Math.random()*40),
    });
  });
}

// ===== Controls =====
window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

// D-pad buttons
function bindDpad(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('pointerdown',  () => { keys[key] = true; });
  btn.addEventListener('pointerup',    () => { keys[key] = false; });
  btn.addEventListener('pointerleave', () => { keys[key] = false; });
}
bindDpad('dpad-up',    'ArrowUp');
bindDpad('dpad-down',  'ArrowDown');
bindDpad('dpad-left',  'ArrowLeft');
bindDpad('dpad-right', 'ArrowRight');

// ===== Player movement (tile-based with animation) =====
let moveTimer = 0;
const MOVE_DELAY = 8; // frames between moves

function tryMove(dr, dc) {
  const r = player.r, c = player.c;
  if (dr === -1 && maze[r][c].top    && r > 0)       { player.r--; return true; }
  if (dr ===  1 && maze[r][c].bottom && r < ROWS-1)  { player.r++; return true; }
  if (dc === -1 && maze[r][c].left   && c > 0)       { player.c--; return true; }
  if (dc ===  1 && maze[r][c].right  && c < COLS-1)  { player.c++; return true; }
  return false;
}

// ===== Pokemon AI (random walk in maze) =====
function movePokemon(p) {
  const dirs = shuffle([[-1,0,'top'],[1,0,'bottom'],[0,-1,'left'],[0,1,'right']]);
  for (const [dr, dc, wall] of dirs) {
    const nr = p.r+dr, nc = p.c+dc;
    if (!maze[p.r][p.c][wall] && nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
      p.r = nr; p.c = nc; return;
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
function playBeep(freq) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if (audioCtx.state==='suspended') audioCtx.resume();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value=freq; o.type='sine';
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.3);
    o.start(); o.stop(audioCtx.currentTime+0.3);
  } catch(e) {}
}

// ===== Cell center in pixels =====
function cellXY(r, c) {
  return { x: OX + c*CELL + CELL/2, y: OY + r*CELL + CELL/2 };
}

// ===== Update =====
function update() {
  // Player move
  moveTimer++;
  if (moveTimer >= MOVE_DELAY) {
    let moved = false;
    if (keys['ArrowUp']    || keys['w'] || keys['W']) moved = tryMove(-1,  0);
    if (keys['ArrowDown']  || keys['s'] || keys['S']) moved = tryMove( 1,  0);
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) moved = tryMove( 0, -1);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) moved = tryMove( 0,  1);
    if (moved) moveTimer = 0;
  }

  // Pokemon move
  for (const p of pokemonList) {
    p.moveTimer++;
    const interval = Math.max(15, p.moveInterval - level * 3);
    if (p.moveTimer >= interval) { p.moveTimer = 0; movePokemon(p); }
  }

  // Catch collision
  for (let i = pokemonList.length - 1; i >= 0; i--) {
    const p = pokemonList[i];
    if (p.r === player.r && p.c === player.c) {
      score  += p.points;
      caught++;
      level   = Math.floor(caught / 3) + 1;
      scoreEl.textContent  = score;
      caughtEl.textContent = caught;
      const {x, y} = cellXY(p.r, p.c);
      spawnParticles(x, y, '#FFD700');
      spawnText(x, y - 20, '+' + p.points);
      playBeep(400 + p.points*5);
      pokemonList.splice(i, 1);
      setTimeout(() => { if (gameRunning) pokemonList.push(newMazePokemon()); }, 1500);
    }
  }

  // Particles
  for (let i = particles.length-1; i>=0; i--) {
    const p = particles[i]; p.life -= 0.03;
    if (p.type==='text') p.y += p.vy;
    else { p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; }
    if (p.life<=0) particles.splice(i,1);
  }
}

function newMazePokemon() {
  let r, c;
  do { r = Math.floor(Math.random()*ROWS); c = Math.floor(Math.random()*COLS); }
  while (r===player.r && c===player.c);
  const p = POKEMON[Math.floor(Math.random()*POKEMON.length)];
  return { ...p, r, c, moveTimer:0, moveInterval: Math.floor(30+Math.random()*40) };
}

// ===== Draw =====
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);

  // Maze cells
  ctx.strokeStyle = '#4a90d9'; ctx.lineWidth = 2;
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const x = OX + c*CELL, y = OY + r*CELL;
      const cell = maze[r][c];
      ctx.beginPath();
      if (cell.top)    { ctx.moveTo(x,      y);      ctx.lineTo(x+CELL, y); }
      if (cell.right)  { ctx.moveTo(x+CELL, y);      ctx.lineTo(x+CELL, y+CELL); }
      if (cell.bottom) { ctx.moveTo(x,      y+CELL); ctx.lineTo(x+CELL, y+CELL); }
      if (cell.left)   { ctx.moveTo(x,      y);      ctx.lineTo(x,      y+CELL); }
      ctx.stroke();
    }
  }

  // Pokemon
  const fs = Math.max(14, CELL * 0.7);
  ctx.font = `${fs}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  for (const p of pokemonList) {
    const {x, y} = cellXY(p.r, p.c);
    ctx.fillText(p.emoji, x, y);
  }

  // Player (Pokeball)
  const {x: px, y: py} = cellXY(player.r, player.c);
  ctx.font = `${fs}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🔮', px, py);

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type==='text') {
      ctx.font='bold 20px Segoe UI'; ctx.textAlign='center';
      ctx.fillStyle=p.color; ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
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

function loop() {
  if (!gameRunning) return;
  update(); draw();
  animFrame = requestAnimationFrame(loop);
}

// ===== Start / End =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
  score=0; caught=0; timeLeft=90; level=1; gameRunning=true;
  particles=[]; keys={}; moveTimer=0;
  timerEl.style.color='';
  scoreEl.textContent=caughtEl.textContent='0';
  timerEl.textContent='90';
  resize();
  generateMaze();
  player = { r:0, c:0 };
  spawnMazePokemon(3 + level);
  showScreen(gameScreen);
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
}

function endGame() {
  gameRunning=false; clearInterval(timerInterval); cancelAnimationFrame(animFrame);
  const stars = caught>=12?'⭐⭐⭐':caught>=6?'⭐⭐':caught>=2?'⭐':'';
  const msg   = caught<2  ? "Explore the maze! 💪"
              : caught<6  ? "Good maze runner! 🌟"
              : caught<12 ? "Amazing navigator! 🎉"
              : "MAZE MASTER! 🏆";
  document.getElementById('result-title').textContent=`You caught ${caught} Pokemon!`;
  document.getElementById('result-stars').textContent=stars;
  document.getElementById('result-msg').textContent=msg;
  document.getElementById('stat-score').textContent=score;
  document.getElementById('stat-caught').textContent=caught;
  showScreen(resultScreen);
}

resize();
