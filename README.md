# Pokemon Games

**Play it live:** [johnwmail.github.io/pokemon-game](https://johnwmail.github.io/pokemon-game)

A collection of fun Pokemon browser games for kids (ages 5–8), built with vanilla HTML/CSS/JS for [Poki.com](https://poki.com). No frameworks, no build step. All games support both **mobile (iOS/Android)** and **desktop**.

---

## Games

| # | Game | Description | Controls | Time |
|---|------|-------------|----------|------|
| 1 | [Pokemon Catch!](catch/) | Tap Pokemon before they run away | Touch / Click | 30s |
| 2 | [Pokemon Drop!](drop/) | Move a basket to catch falling Pokemon | Mouse · Arrow keys · Swipe · D-pad | Lives |
| 3 | [Pokemon Chase!](chase/) | Corner fleeing Pokemon against the wall | Mouse / Touch drag | 60s |
| 4 | [Pokemon Fishing!](fishing/) | Cast a line to hook swimming Pokemon | Click · Space · Tap | 60s |
| 5 | [Pokemon Herding!](herding/) | Draw a circle to herd Pokemon into the pen | Click drag / Touch drag | 60s |
| 6 | [Pokemon Maze!](maze/) | Navigate a Pokeball through a maze to catch Pokemon | Arrow keys · WASD · D-pad | 90s |
| 7 | [Pokemon Match!](match/) | Flip the cards and find the matching Pokemon pairs | Mouse / Touch | 60s |
| 8 | [Pokemon Feed!](feed/) | Tap the falling food to feed the matching Pokemon | Mouse / Touch | 60s |
| 9 | [Pokemon Jump!](jump/) | Run and jump over obstacles to collect points | Spacebar · Tap | 60s |
| 7 | [Pokemon Match!](match/) | Flip the cards and find the matching Pokemon pairs | Mouse / Touch | 60s |
| 8 | [Pokemon Feed!](feed/) | Tap the falling food to feed the matching Pokemon | Mouse / Touch | 60s |
| 9 | [Pokemon Jump!](jump/) | Run and jump over obstacles to collect points | Spacebar · Tap | 60s |

---

## How to Play Each Game

### 1. Pokemon Catch! 🎯
Pokemon pop up randomly on screen. **Tap or click** them before they disappear.
- Each Pokemon is worth different points
- Rarer Pokemon appear at higher levels (every 5 catches = level up)
- 30 second round — how many can you catch?

### 2. Pokemon Drop! 🧺
Pokemon fall from the sky. Move your basket left and right to catch them.
- **Desktop:** Mouse or ← → arrow keys
- **Mobile:** Swipe left/right or use the on-screen ◀ ▶ buttons
- 3 lives — miss a Pokemon or catch a 💣 bomb and you lose a life
- Level up every 10 catches — Pokemon fall faster!

### 3. Pokemon Chase! 🏃
Pokemon run away from your cursor or finger. Chase them into corners to catch them.
- **Desktop:** Move the mouse to herd Pokemon
- **Mobile:** Drag your finger to chase
- A green arc around the Pokemon shows catch progress — keep them cornered!
- 60 second round — level up every 5 catches

### 4. Pokemon Fishing! 🎣
Pokemon swim left and right underwater. Cast your line at the right moment to hook one.
- **Desktop:** Click anywhere or press **Space** to cast/reel in
- **Mobile:** Tap to cast / tap again to reel in
- Rarer Pokemon swim faster — timing is key!
- 60 second round

### 5. Pokemon Herding! 🌿
Pokemon wander freely on a grass field. Draw a circle (lasso) around them to send them into the pen in the corner.
- **Desktop:** Click and drag to draw the lasso circle
- **Mobile:** Touch and drag to draw
- The more Pokemon inside your circle, the better!
- 60 second round — level up every 5 catches

### 6. Pokemon Maze! 🌀
A new maze is generated each game. Navigate your Pokeball 🔮 through corridors to intercept moving Pokemon.
- **Desktop:** Arrow keys or WASD
- **Mobile:** On-screen D-pad (bottom right)
- Pokemon also move through the maze — intercept them!
- 90 second round — Pokemon move faster at higher levels

### 7. Pokemon Match! 🃏
A memory card matching game where you flip cards to find Pokemon pairs.
- **Desktop/Mobile:** Tap / Click to flip a card
- Match all 6 pairs before the 60 second timer runs out

### 8. Pokemon Feed! 🍎
A sorting game where you tap falling food to feed the matching hungry Pokemon at the bottom.
- **Desktop/Mobile:** Tap / Click the food as it falls
- The game speeds up as you feed more Pokemon

### 9. Pokemon Jump! 🏃
An endless runner platformer where you jump over obstacles to survive.
- **Desktop/Mobile:** Tap anywhere or press Spacebar to jump
- Points increase the further you run without hitting a rock

---

## Star Ratings

| Stars | Catch | Drop | Chase | Fishing | Herding | Maze |
|-------|-------|------|-------|---------|---------|------|
| ⭐    | 3+    | 4+   | 4+    | 3+      | 3+      | 2+   |
| ⭐⭐  | 8+    | 10+  | 10+   | 8+      | 8+      | 6+   |
| ⭐⭐⭐| 15+   | 20+  | 20+   | 15+     | 15+     | 12+  |

---

## Mobile Support

All games are fully tested for mobile:

| Feature | Implementation |
|---------|---------------|
| Touch events | `pointerdown` / `touchmove` — no double-fire |
| iOS safe area | `env(safe-area-inset-*)` + `viewport-fit=cover` |
| iOS 100vh bug | `-webkit-fill-available` |
| iOS Audio | `AudioContext.resume()` on user gesture |
| Hover effects | Wrapped in `@media (hover: hover)` |
| D-pad / buttons | Shown only on `@media (pointer: coarse)` |
| Tap targets | Minimum 44px touch areas |

---

## Project Structure

```
pokemon-game/
├── index.html        # Hub / game selection page
├── style.css         # Hub styles
├── shared.css        # Shared styles across all games
├── hub.js            # Hub card animations
├── catch/            # Pokemon Catch game
│   ├── index.html
│   ├── style.css
│   └── game.js
├── drop/             # Pokemon Drop game
│   ├── index.html
│   ├── style.css
│   └── game.js
├── chase/            # Pokemon Chase game
│   ├── index.html
│   ├── style.css
│   └── game.js
├── fishing/          # Pokemon Fishing game
│   ├── index.html
│   ├── style.css
│   └── game.js
├── herding/          # Pokemon Herding game
│   ├── index.html
│   ├── style.css
│   └── game.js
├── maze/             # Pokemon Maze game
│   ├── index.html
│   ├── style.css
│   └── game.js
└── README.md
```

---

## Running Locally

Open `index.html` in any modern browser — no server or build step required.

```bash
open index.html       # macOS
start index.html      # Windows
xdg-open index.html   # Linux
```

---

## Adding a New Game

1. Create a new subfolder (e.g. `newgame/`)
2. Add `index.html`, `style.css` (import `../shared.css`), `game.js`
3. Include `<a href="../" id="hub-link">🏠</a>` back-link
4. Add a new game card in the root `index.html`

---

## Tech Stack

- **Vanilla HTML / CSS / JavaScript** — no frameworks, no build tools
- **Canvas API** — used for Drop, Chase, Fishing, Herding, Maze
- **Web Audio API** — sound feedback on all games
- **CSS animations** — all visual effects
- **Pointer Events API** — unified mouse + touch input
