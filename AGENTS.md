# AI Agent Coding Guidelines (AGENTS.md)

This file contains context, architectural rules, and guidelines for AI coding assistants working on this repository. 

## Project Overview & Target Audience
- **Core Concept:** A lightweight, zero-dependency collection of web-based mini-games built entirely with Vanilla HTML, CSS, and JavaScript.
- **Target Audience:** All games are designed specifically for **young children (ages 5-8 years old)**. Gameplay, UI, and instructions must be highly intuitive, forgiving, visually engaging, and avoid overly complex rules.
- **Platform Support:** Every game **MUST** seamlessly support both **mobile devices (touch)** and **desktop devices (mouse/keyboard)**.

## Architecture & Structure
- The root directory acts as the game hub (`index.html`, `style.css`, `hub.js`).
- Each mini-game lives in its own dedicated sub-folder (e.g., `/catch`, `/maze`, `/fishing`).
- A standard game folder strictly contains:
  - `index.html`: The markup and `<canvas>` container.
  - `style.css`: Game-specific styling.
  - `game.js`: The core game logic.

## Tech Stack & Constraints
- **JavaScript:** Vanilla ES6+. **Do not use frameworks** (React, Vue, etc.) or bundlers (Webpack, Vite).
- **Rendering:** HTML5 `<canvas>` API for 2D drawing or direct DOM manipulation.
- **Styling:** Vanilla CSS. Use Flexbox/Grid for layout. 
- **Assets:** Use Emojis (⚡, 🐟, 🎯) and Canvas drawing primitives. Avoid adding external image dependencies to keep the project lightweight.
- **Audio:** Use the Web Audio API for procedurally generated beeps and sound effects. Do not add `.mp3` or `.wav` files.

## Coding Conventions
1. **Zero Dependencies:** Do not add npm packages, CDN links, or external libraries unless explicitly requested by the user.
2. **Cross-Platform Inputs:** All games must gracefully handle **touch events** (`touchstart`, `touchmove`, etc.) for mobile and **mouse/keyboard** inputs for desktop. Provide on-screen controls (D-pad/buttons) where keyboard input is the primary desktop method.
3. **Responsive Design:** Handle screen resizing gracefully using `window.addEventListener('resize', ...)`. Re-calculate Canvas dimensions and bounding boxes dynamically.
4. **Game Loop:** Use `requestAnimationFrame` for physics and rendering loops. 
5. **State Management:** Keep each game's logic entirely isolated to its own `game.js`. Games typically flow through three states: Start Screen → Game Screen → Result Screen.

## Standard Workflow for New Games
When instructed to create a new game:
1. Create a new directory (e.g., `/my-game`).
2. Scaffold `index.html`, `style.css`, and `game.js` following the patterns of existing games (like `/chase` or `/drop`).
3. Add a new game card to the main hub in the root `index.html`.
4. Ensure the new game includes standard elements like a score counter, a timer, and a restart button.