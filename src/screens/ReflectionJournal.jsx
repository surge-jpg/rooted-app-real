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
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadToday() {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('reflection_date', today)
        .maybeSingle()
      if (data) {
        setAnswers(data)
        setSaved(true)
      }
      setLoading(false)
    }
    loadToday()
  }, [userId])

  async function save() {
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('daily_reflections').upsert({
      user_id: userId,
      reflection_date: today,
      accomplished: answers.accomplished || '',
      struggled: answers.struggled || '',
      grateful_for: answers.grateful_for || '',
      improve_tomorrow: answers.improve_tomorrow || '',
    }, { onConflict: 'user_id,reflection_date' })
    setSaved(true)
  }

  if (loading) return null

  return (
    <div className="journal-overlay">
      <div className="journal-sheet">
        <h2>Evening Reflection</h2>
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
          <button className="cta" onClick={save}>{saved ? 'Update' : 'Save'}</button>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
