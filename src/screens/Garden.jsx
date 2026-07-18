import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getTierForCompletions, getTreeState, calculateVitalityFromCompletions } from '../lib/gameLogic'
import ReflectionJournal from './ReflectionJournal'
import ReminderToggle from '../components/ReminderToggle'

const STAT_META = {
  faith: { label: 'Faith', emoji: '🙏' },
  wisdom: { label: 'Wisdom', emoji: '📚' },
  strength: { label: 'Strength', emoji: '💪' },
  discipline: { label: 'Discipline', emoji: '🎯' },
  stewardship: { label: 'Steward', emoji: '💰' },
  character: { label: 'Character', emoji: '❤️' },
}

export default function Garden({ userId, onNavigate }) {
  const [stats, setStats] = useState({})
  const [treeState, setTreeState] = useState({ tier: 'healthy', modifier: 0, label: 'Healthy' })
  const [vitalityPct, setVitalityPct] = useState(50)
  const [loading, setLoading] = useState(true)
  const [showJournal, setShowJournal] = useState(false)

  useEffect(() => { load() }, [userId])

  async function load() {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10)
    const [{ data: statsRows }, { data: taskDefs }, { data: windowCompletions }] = await Promise.all([
      supabase.from('stats').select('*').eq('user_id', userId),
      supabase.from('task_definitions').select('*'),
      supabase.from('task_completions').select('task_id, completed_date').eq('user_id', userId).gte('completed_date', tenDaysAgo),
    ])

    const statsMap = {}
    ;(statsRows || []).forEach((s) => { statsMap[s.stat_key] = s })
    setStats(statsMap)

    if (taskDefs) {
      const taskDefsById = {}
      taskDefs.forEach((t) => { taskDefsById[t.id] = t })
      const vitality = calculateVitalityFromCompletions(windowCompletions || [], taskDefsById, 7)
      setVitalityPct(Math.round(vitality * 100))
      setTreeState(getTreeState(vitality))
    }

    setLoading(false)
  }

  if (loading) return <div className="loading-screen">Walking into the garden...</div>

  return (
    <div className="game-frame">
      <div className="scene garden-scene">
        <div className="sunburst" />
        <div className="ground" />
      </div>

      <div className="tree-shadow" />
      <div className="tree-wrap">
        <TreeIllustration tier={treeState.tier} />
      </div>

      <div className="hud">
        <div className="statusbar">
          <span>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
        </div>

        <div className="stage-banner">
          <div className="ribbon-tab green">
            <div className="eyebrow">Your Foundation</div>
            <h1>The Garden</h1>
          </div>
        </div>

        <div className="spacer" />

        <div className="side-arrow left" onClick={() => onNavigate('left')}>
          <div className="arrow-pill">←</div>
          <div className="lbl">Arena</div>
        </div>
        <div className="side-arrow right" onClick={() => onNavigate('right')}>
          <div className="arrow-pill">→</div>
          <div className="lbl">Garage</div>
        </div>

        <div className="status-float">
          <div className="state">🌿 {treeState.label}</div>
          <div className="sub">
            {treeState.modifier >= 0 ? '+' : ''}{treeState.modifier} to every roll — rooted in the last 7 days
          </div>
        </div>

        <div className="vitality-dock">
          <div className="vit-top"><span className="n">ROOTED VITALITY</span><span className="v">{vitalityPct}%</span></div>
          <div className="vit-outer"><div className="vit-inner" style={{ width: `${vitalityPct}%` }} /></div>
        </div>

        <div className="sheet">
          <div className="stat-grid">
            {Object.entries(STAT_META).map(([key, meta]) => {
              const stat = stats[key] || { completions_total: 0 }
              const tierInfo = getTierForCompletions(stat.completions_total)
              return (
                <div key={key} className="stat-chip">
                  <div className="emo">{meta.emoji}</div>
                  <div className="lbl">{meta.label}</div>
                  <div className="tier">{tierInfo.name}</div>
                </div>
              )
            })}
          </div>

          <button className="cta green" onClick={() => setShowJournal(true)}>
            📖 Reflect &amp; Journal Today
          </button>
          <div style={{ padding: '10px 20px 0', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <ReminderToggle />
            <button className="reminder-toggle" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        </div>
      </div>

      {showJournal && <ReflectionJournal userId={userId} onClose={() => setShowJournal(false)} />}
    </div>
  )
}

function TreeIllustration({ tier }) {
  // visual variation by tree tier — dry/wilting trees show fewer blossoms, duller foliage
  const showBlossoms = tier === 'healthy' || tier === 'flourishing'
  const foliageOpacity = tier === 'dry' ? 0.5 : tier === 'wilting' ? 0.75 : 1

  return (
    <svg viewBox="0 0 220 330" fill="none" style={{ opacity: foliageOpacity }}>
      <path d="M104 330 L100 220 C96 200 108 190 110 220 L108 330 Z" fill="#5a3a22" stroke="#3a2414" strokeWidth="2"/>
      <path d="M100 260 C80 250 66 230 70 210" stroke="#3a2414" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M112 250 C130 240 146 218 142 198" stroke="#3a2414" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <ellipse cx="110" cy="120" rx="100" ry="88" fill="#2f7d4c"/>
      <ellipse cx="60" cy="150" rx="60" ry="56" fill="#3a8f5a"/>
      <ellipse cx="165" cy="145" rx="62" ry="58" fill="#3a8f5a"/>
      <ellipse cx="110" cy="70" rx="70" ry="62" fill="#4da869"/>
      <ellipse cx="80" cy="100" rx="34" ry="30" fill="#5fc078" opacity="0.7"/>
      <ellipse cx="150" cy="95" rx="30" ry="26" fill="#5fc078" opacity="0.7"/>
      {showBlossoms && (
        <>
          <circle cx="70" cy="80" r="5" fill="#ffe08a"/>
          <circle cx="140" cy="65" r="5" fill="#ffe08a"/>
          <circle cx="165" cy="110" r="5" fill="#ffe08a"/>
          <circle cx="55" cy="130" r="5" fill="#ffe08a"/>
          <circle cx="120" cy="150" r="5" fill="#ffe08a"/>
        </>
      )}
    </svg>
  )
}
