import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getRestorationStage } from '../lib/gameLogic'
import StatusBar from '../components/StatusBar'

const STAGE_VERSES = {
  1: '"He will renew a right spirit within me" — Psalm 51:10',
  2: '"Behold, I am doing a new thing" — Isaiah 43:19',
  3: '"Whoever is faithful in little is faithful in much" — Luke 16:10',
  4: '"Let us not grow weary of doing good" — Galatians 6:9',
  5: '"He who began a good work in you will carry it on to completion" — Philippians 1:6',
  6: '"She is clothed in strength and dignity" — Proverbs 31:25',
}

export default function Garage({ userId, onNavigate }) {
  const [goal, setGoal] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadGoal() }, [userId])

  async function loadGoal() {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
    setGoal(data && data.length > 0 ? data[0] : null)
    setLoading(false)
  }

  async function logContribution(e) {
    e.preventDefault()
    if (!goal || !amount) return
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) return

    setSubmitting(true)
    await supabase.from('goal_contributions').insert({ goal_id: goal.id, user_id: userId, amount: value })
    await supabase.from('goals').update({ current_amount: goal.current_amount + value }).eq('id', goal.id)
    setAmount('')
    await loadGoal()
    setSubmitting(false)
  }

  if (loading) return <div className="loading-screen">Opening the garage...</div>
  if (!goal) return <div className="screen">No active restoration project yet. Add a goal in Supabase to get started.</div>

  const stage = getRestorationStage(goal.current_amount, goal.target_amount)

  return (
    <div className="game-frame">
      <div className="scene garage-scene">
        <div className="roof-light" />
        <div className="floor" />
      </div>

      <div className="car-shadow" />
      <div className="car-photo-stage">
        <img src={`/car-stages/stage${stage.stage}.png`} alt={`${goal.title} — ${stage.label}`} />
        <div className="stage-tag">{Math.round(stage.pct)}% Restored · {stage.label}</div>
      </div>

      <div className="hud">
        <StatusBar>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</StatusBar>

        <div className="stage-banner">
          <div className="ribbon-tab blue">
            <div className="eyebrow">Stewardship Project</div>
            <h1>{goal.title}</h1>
          </div>
        </div>

        <div className="spacer" />

        <div className="side-arrow left" onClick={() => onNavigate('left')}>
          <div className="arrow-pill">←</div>
          <div className="lbl">Arena</div>
        </div>

        <div className="status-float dark">
          <div className="state">🔧 {stage.label}</div>
          <div className="sub">{STAGE_VERSES[stage.stage]}</div>
        </div>

        <div className="fund-dock">
          <div className="fund-top">
            <span className="n">RESTORATION FUND</span>
            <span className="v">${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}</span>
          </div>
          <div className="fund-outer"><div className="fund-inner" style={{ width: `${stage.pct}%` }} /></div>
        </div>

        <div className="sheet">
          <div className="stage-track">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={`stage-dot ${n <= stage.stage ? 'filled' : ''}`} />
            ))}
          </div>
          <div className="stage-labels">
            <span>RUST</span><span>FRAME</span><span>ENGINE</span><span>INTERIOR</span><span>PAINT</span><span>DONE</span>
          </div>

          <form onSubmit={logContribution} className="contribution-form">
            <input
              type="number"
              placeholder="Amount saved ($)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="cta gold" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : '💰 Log Contribution'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
