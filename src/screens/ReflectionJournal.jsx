import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const QUESTIONS = [
  { key: 'accomplished', label: 'What did I accomplish today?' },
  { key: 'struggled', label: 'What did I struggle with?' },
  { key: 'grateful_for', label: 'What am I grateful for?' },
  { key: 'improve_tomorrow', label: 'What will I improve tomorrow?' },
]

export default function ReflectionJournal({ userId, onClose }) {
  const [answers, setAnswers] = useState({})
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function loadToday() {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('reflection_date', today)
        .maybeSingle()
      if (data) setAnswers(data)
      setLoading(false)
    }
    loadToday()
  }, [userId])

  async function loadHistory() {
    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('reflection_date', { ascending: false })
      .limit(14)
    setHistory(data || [])
    setShowHistory(true)
  }

  async function save() {
    setSaveState('saving')
    const today = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('daily_reflections').upsert({
      user_id: userId,
      reflection_date: today,
      accomplished: answers.accomplished || '',
      struggled: answers.struggled || '',
      grateful_for: answers.grateful_for || '',
      improve_tomorrow: answers.improve_tomorrow || '',
    }, { onConflict: 'user_id,reflection_date' })

    if (error) {
      setSaveState('idle')
      alert('Something went wrong saving — please try again.')
      return
    }
    setSaveState('saved')
    setTimeout(() => onClose(), 900) // brief confirmation, then close
  }

  if (loading) return null

  if (showHistory) {
    return (
      <div className="journal-overlay">
        <div className="journal-sheet">
          <div className="journal-header-row">
            <h2>Past Reflections</h2>
            <button className="secondary" onClick={() => setShowHistory(false)}>Back</button>
          </div>
          {history.length === 0 && <p className="journal-empty">No entries yet — write your first one!</p>}
          {history.map((entry) => (
            <div key={entry.id} className="history-entry">
              <div className="history-date">{new Date(entry.reflection_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              {entry.accomplished && <p><strong>Accomplished:</strong> {entry.accomplished}</p>}
              {entry.struggled && <p><strong>Struggled:</strong> {entry.struggled}</p>}
              {entry.grateful_for && <p><strong>Grateful for:</strong> {entry.grateful_for}</p>}
              {entry.improve_tomorrow && <p><strong>Improve:</strong> {entry.improve_tomorrow}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="journal-overlay">
      <div className="journal-sheet">
        <div className="journal-header-row">
          <h2>Evening Reflection</h2>
          <button className="secondary" onClick={loadHistory}>History</button>
        </div>
        {QUESTIONS.map((q) => (
          <div key={q.key} className="journal-question">
            <label>{q.label}</label>
            <textarea
              rows={2}
              value={answers[q.key] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="journal-actions">
          <button className="cta" disabled={saveState !== 'idle'} onClick={save}>
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? '✓ Saved!' : 'Save'}
          </button>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
