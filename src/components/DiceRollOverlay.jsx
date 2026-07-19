import { useState, useEffect } from 'react'

// A full-screen dice roll overlay: rapidly cycles random numbers on a die face
// for a short burst, then lands on the real result and holds briefly before
// closing. This replaces the old "small emoji swap" roll indicator with
// something that actually feels like watching randomness happen.
export default function DiceRollOverlay({ sides, finalResult, taskLabel, onComplete }) {
  const [displayValue, setDisplayValue] = useState(1)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let tick = 0
    const totalTicks = 12
    const interval = setInterval(() => {
      tick += 1
      if (tick >= totalTicks) {
        clearInterval(interval)
        setDisplayValue(finalResult)
        setSettled(true)
        setTimeout(onComplete, 550)
      } else {
        setDisplayValue(Math.floor(Math.random() * sides) + 1)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [sides, finalResult, onComplete])

  return (
    <div className="dice-overlay">
      <div className="dice-task-label">{taskLabel}</div>
      <div className={`dice-face ${settled ? 'settled' : 'spinning'}`}>
        <span>{displayValue}</span>
      </div>
      <div className="dice-die-label">d{sides}</div>
    </div>
  )
}
