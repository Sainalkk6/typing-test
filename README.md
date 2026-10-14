# Word Rain

A typing game where words fall from the sky. Type each word and press **Space** to clear it before it hits the ground.

## How to play

- Words fall from the top of the screen.
- Type a word and press **Space** (or **Enter**) to remove it.
- Words matching what you've typed so far are highlighted.
- If a word touches the ground, you lose a heart. You have **3 hearts** — lose them all and it's game over.
- The game speeds up over time: words fall faster and spawn more often as the level increases.

Your score, WPM, level and best score are shown at the top. Your best score is saved in the browser.

## Getting started

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal (usually http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  App.jsx    Game logic and UI
  App.css    Styles
  words.js   Word list
  main.jsx   Entry point
```

## Customizing

- **Words** — edit the list in `src/words.js`.
- **Hearts** — change `MAX_LIVES` in `src/App.jsx`.
- **Fall speed** — adjust `Math.min(40 + g.elapsed * 1.2, 160)` in `src/App.jsx`.
- **Spawn rate** — adjust `Math.max(0.7, 2.2 - g.elapsed * 0.02)` in `src/App.jsx`.

## Built with

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
