import { useCallback, useEffect, useRef, useState } from 'react'
import { WORDS } from './words.js'

const MAX_LIVES = 3
const GROUND_HEIGHT = 48
const WORD_HEIGHT = 36
const POP_DURATION = 0.4

const randomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)]

const newGame = () => ({
  words: [],
  pops: [],
  nextId: 1,
  lives: MAX_LIVES,
  score: 0,
  correctChars: 0,
  mistakes: 0,
  elapsed: 0,
  spawnTimer: 0,
  lastTime: null,
})

const loadBest = () => {
  try {
    return Number(localStorage.getItem('word-rain-best')) || 0
  } catch {
    return 0
  }
}

export default function App() {
  const [status, setStatus] = useState('idle') // idle | playing | over
  const [typed, setTyped] = useState('')
  const [, setFrame] = useState(0)
  const [hit, setHit] = useState(false)
  const [miss, setMiss] = useState(false)
  const [best, setBest] = useState(loadBest)
  const game = useRef(newGame())
  const areaRef = useRef(null)
  const inputRef = useRef(null)

  const start = () => {
    game.current = newGame()
    setTyped('')
    setStatus('playing')
  }

  const flash = (setter) => {
    setter(true)
    setTimeout(() => setter(false), 300)
  }

  // Game loop
  useEffect(() => {
    if (status !== 'playing') return
    let raf

    const loop = (t) => {
      const g = game.current
      const dt = g.lastTime === null ? 0 : Math.min((t - g.lastTime) / 1000, 0.05)
      g.lastTime = t
      g.elapsed += dt

      // Spawn words faster as time goes on
      g.spawnTimer -= dt
      if (g.spawnTimer <= 0) {
        const text = randomWord()
        g.words.push({
          id: g.nextId++,
          text,
          x: 3 + Math.random() * 80,
          y: -WORD_HEIGHT,
          speed: Math.min(40 + g.elapsed * 1.2, 160) + Math.random() * 25,
        })
        g.spawnTimer = Math.max(0.7, 2.2 - g.elapsed * 0.02)
      }

      const floor = (areaRef.current?.clientHeight ?? 600) - GROUND_HEIGHT - WORD_HEIGHT
      let lost = 0
      g.words = g.words.filter((w) => {
        w.y += w.speed * dt
        if (w.y >= floor) {
          lost++
          return false
        }
        return true
      })
      g.pops = g.pops.filter((p) => g.elapsed - p.at < POP_DURATION)

      if (lost > 0) {
        g.lives = Math.max(0, g.lives - lost)
        flash(setHit)
        if (g.lives === 0) {
          setStatus('over')
          setBest((b) => {
            const nb = Math.max(b, g.score)
            try {
              localStorage.setItem('word-rain-best', String(nb))
            } catch {
              /* ignore */
            }
            return nb
          })
          return
        }
      }

      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [status])

  useEffect(() => {
    if (status === 'playing') inputRef.current?.focus()
  }, [status])

  // Start / restart with Enter from menus
  useEffect(() => {
    if (status === 'playing') return
    const onKey = (e) => {
      if (e.key === 'Enter') start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status])

  const submit = useCallback(() => {
    const g = game.current
    const word = typed.trim()
    if (!word) return
    // Remove the lowest (most urgent) matching word
    const matches = g.words.filter((w) => w.text === word)
    if (matches.length) {
      const target = matches.reduce((a, b) => (b.y > a.y ? b : a))
      g.words = g.words.filter((w) => w.id !== target.id)
      g.pops.push({ ...target, at: g.elapsed })
      g.score++
      g.correctChars += word.length + 1
    } else {
      g.mistakes++
      flash(setMiss)
    }
    setTyped('')
  }, [typed])

  const onKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const g = game.current
  const minutes = g.elapsed / 60
  const wpm = minutes > 0 ? Math.round(g.correctChars / 5 / minutes) : 0
  const level = 1 + Math.floor(g.elapsed / 20)

  return (
    <div className="app">
      <header className="hud">
        <div className="hearts" aria-label={`${g.lives} lives left`}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <span key={i} className={`heart ${i < g.lives ? '' : 'lost'}`}>
              ♥
            </span>
          ))}
        </div>
        <div className="stats">
          <span>Score <b>{g.score}</b></span>
          <span>WPM <b>{wpm}</b></span>
          <span>Level <b>{level}</b></span>
          <span>Best <b>{best}</b></span>
        </div>
      </header>

      <main
        ref={areaRef}
        className={`sky ${hit ? 'hit' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {g.words.map((w) => {
          const matching = typed && w.text.startsWith(typed)
          return (
            <div
              key={w.id}
              className={`word ${matching ? 'matching' : ''}`}
              style={{ left: `${w.x}%`, transform: `translateY(${w.y}px)` }}
            >
              {matching ? (
                <>
                  <span className="typed">{typed}</span>
                  {w.text.slice(typed.length)}
                </>
              ) : (
                w.text
              )}
            </div>
          )
        })}

        {g.pops.map((p) => (
          <div
            key={`pop-${p.id}`}
            className="word pop"
            style={{ left: `${p.x}%`, top: `${p.y}px` }}
          >
            {p.text}
          </div>
        ))}

        <div className="ground" style={{ height: GROUND_HEIGHT }} />

        {status === 'idle' && (
          <div className="overlay">
            <h1>Word Rain</h1>
            <p>Words fall from the sky. Type a word and press <kbd>Space</kbd> to clear it.</p>
            <p>If a word hits the ground you lose a heart. You have three.</p>
            <button onClick={start}>Start</button>
            <small>or press Enter</small>
          </div>
        )}

        {status === 'over' && (
          <div className="overlay">
            <h1>Game Over</h1>
            <div className="final">
              <div><b>{g.score}</b>words</div>
              <div><b>{wpm}</b>WPM</div>
              <div><b>{level}</b>level</div>
              <div><b>{g.mistakes}</b>mistakes</div>
            </div>
            {g.score > 0 && g.score >= best && <p className="record">New best!</p>}
            <button onClick={start}>Play again</button>
            <small>or press Enter</small>
          </div>
        )}
      </main>

      <footer className="controls">
        <input
          ref={inputRef}
          className={miss ? 'miss' : ''}
          value={typed}
          onChange={(e) => setTyped(e.target.value.replace(/\s/g, ''))}
          onKeyDown={onKeyDown}
          disabled={status !== 'playing'}
          placeholder={status === 'playing' ? 'Type here…' : ''}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </footer>
    </div>
  )
}
