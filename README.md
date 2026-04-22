# Pokemon Games

**Play it live:** [johnwmail.github.io/pokemon-game](https://johnwmail.github.io/pokemon-game)

A collection of fun Pokemon browser games for kids (ages 5–8), built with vanilla HTML/CSS/JS for [Poki.com](https://poki.com). No frameworks, no build step.

---

## Games

| Game | Description | Status |
|------|-------------|--------|
| [Pokemon Catch!](catch/) | Tap Pokemon before they run away — 30 second rounds | ✅ Live |
| Pokemon Drop! | Catch falling Pokemon with your basket | 🚧 Coming soon |

---

## Project Structure

```
pokemon-game/
├── index.html      # Hub / game selection page
├── style.css       # Hub styles
├── hub.js          # Hub interactions
├── catch/          # Pokemon Catch game
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

1. Create a new subfolder (e.g. `drop/`)
2. Add `index.html`, `style.css`, `game.js` inside it
3. Include a `<a href="../">🏠</a>` back-link to the hub
4. Add a new game card in the root `index.html`
