import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  getTierForCompletions,
  rollDie,
  applyTreeModifier,
  getTreeState,
  calculateVitalityFromCompletions,
} from '../lib/gameLogic'
import SeasonDefeatScreen from './SeasonDefeatScreen'
import BossCreature from '../components/BossCreature'

export default function BossArena({ userId, onNavigate, createdAt }) {
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState({})
  const [recentCompletions, setRecentCompletions] = useState([])
  const [stats, setStats] = useState({})
  const [season, setSeason] = useState(null)
  const [treeState, setTreeState] = useState({ tier: 'healthy', modifier: 0, label: 'Healthy' })
  const [loading, setLoading] = useState(true)
  const [showDefeat, setShowDefeat] = useState(false)
  const [rolling, setRolling] = useState(null)

  useEffect(() => { loadArenaData() }, [userId])

  async function loadArenaData() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10)

    const [{ data: taskDefs }, { data: todaysCompletions }, { data: windowCompletions }, { data: statsRows }, { data: activeSeason }] =
      await Promise.all([
        supabase.from('task_definitions').select('*'),
        supabase.from('task_completions').select('*').eq('user_id', userId).eq('completed_date', today),
        supabase.from('task_completions').select('task_id, completed_date').eq('user_id', userId).gte('completed_date', tenDaysAgo),
        supabase.from('stats').select('*').eq('user_id', userId),
        supabase.from('seasons').select('*').eq('user_id', userId).is('defeated_at', null).order('season_number', { ascending: false }).limit(1).maybeSingle(),
      ])

    setTasks(taskDefs || [])
    const completionMap = {}
    ;(todaysCompletions || []).forEach((c) => { completionMap[c.task_id] = c })
    setCompletions(completionMap)
    setRecentCompletions(windowCompletions || [])

    const statsMap = {}
    ;(statsRows || []).forEach((s) => { statsMap[s.stat_key] = s })
    setStats(statsMap)
    setSeason(activeSeason || null)

    if (taskDefs) {
      const taskDefsById = {}
      taskDefs.forEach((t) => { taskDefsById[t.id] = t })
      const vitality = calculateVitalityFromCompletions(windowCompletions || [], taskDefsById, 7)
      setTreeState(getTreeState(vitality))
    }

    setLoading(false)
  }

  async function completeTask(task) {
    if (completions[task.id] || !season) return
    setRolling(task.id)

    const stat = stats[task.stat_key] || { completions_total: 0, stat_key: task.stat_key }
    const tierInfo = getTierForCompletions(stat.completions_total)
    const rawRoll = rollDie(tierInfo.die)
    const finalDamage = applyTreeModifier(rawRoll, treeState.modifier)
    const today = new Date().toISOString().slice(0, 10)

    await new Promise((r) => setTimeout(r, 550))

    await supabase.from('task_completions').insert({
      user_id: userId, task_id: task.id, completed_date: today,
      die_result: rawRoll, damage_dealt: finalDamage,
    })

    await supabase.from('stats').upsert({
      user_id: userId, stat_key: task.stat_key,
      completions_total: stat.completions_total + 1,
      tier: getTierForCompletions(stat.completions_total + 1).tier,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,stat_key' })

    const newHP = Math.max(0, season.hp_current - finalDamage)
    await supabase.from('seasons').update({ hp_current: newHP }).eq('id', season.id)

    if (newHP === 0) {
      await supabase.from('seasons').update({ defeated_at: new Date().toISOString() }).eq('id', season.id)
      setRolling(null)
      setShowDefeat(true)
      return
    }

    setRolling(null)
    loadArenaData()
  }

  function handleDefeatComplete(newSeason) {
    setShowDefeat(false)
    setSeason(newSeason)
    loadArenaData()
  }

  if (loading) return <div className="loading-screen">Entering the arena...</div>

  if (showDefeat && season) {
    return (
      <SeasonDefeatScreen
        userId={userId}
        defeatedSeason={season}
        statsArray={Object.values(stats)}
        onComplete={handleDefeatComplete}
      />
    )
  }

  const hpPct = season ? Math.round((season.hp_current / season.hp_max) * 100) : 0
  const dayNumber = createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1)
    : 1

  return (
    <div className="game-frame">
      <div className="scene boss-scene">
        <div className="stars" />
        <div className="ground-glow" />
      </div>

      <BossCreature hpPct={hpPct} />

      <div className="hud">
        <div className="statusbar">
          <span>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          <span>DAY {dayNumber}</span>
        </div>

        <div className="top-row">
          <div className="capsule-stack">
            <div className="capsule">
              <div className="orb gold">⚔️</div>
              <div className="txt">Season {season?.season_number ?? '—'}</div>
            </div>
            <div className="capsule">
              <div className="orb green">🌳</div>
              <div className="txt">{treeState.label}<small>TREE STATE</small></div>
            </div>
          </div>
        </div>

        <div className="stage-banner">
          <div className="ribbon-tab">
            <div className="eyebrow">Boss Battle</div>
            <h1>{season?.boss_name || 'No active season'}</h1>
          </div>
        </div>

        <div className="spacer" />

        <div className="side-arrow left" onClick={() => onNavigate('left')}>
          <div className="arrow-pill">←</div>
          <div className="lbl">Garden</div>
        </div>
        <div className="side-arrow right" onClick={() => onNavigate('right')}>
          <div className="arrow-pill">→</div>
          <div className="lbl">Garage</div>
        </div>

        <div className="hp-dock">
          <div className="hp-skull">💀</div>
          <div className="hp-col">
            <div className="hp-top">
              <span className="n">SHADOW HP</span>
              <span className="v">{season?.hp_current ?? 0} / {season?.hp_max ?? 0}</span>
            </div>
            <div className="hp-outer"><div className="hp-inner" style={{ width: `${hpPct}%` }} /></div>
          </div>
        </div>
        <div className="buff-float">
          ✦ {treeState.label} — {treeState.modifier >= 0 ? '+' : ''}{treeState.modifier} to every roll today
        </div>

        <div className="sheet">
          <div className="quest-strip">
            {tasks.map((task) => {
              const done = !!completions[task.id]
              const isRolling = rolling === task.id
              const stat = stats[task.stat_key] || { completions_total: 0 }
              const tierInfo = getTierForCompletions(stat.completions_total)
              return (
                <button
                  key={task.id}
                  className={`qcard ${done ? 'done' : ''} ${isRolling ? 'rolling' : ''}`}
                  onClick={() => completeTask(task)}
                  disabled={done || isRolling}
                >
                  {done && <div className="check">✓</div>}
                  <div className="emo">{isRolling ? '🎲' : task.emoji}</div>
                  <div className="lbl">{task.label}</div>
                  <div className="die">
                    {done ? `+${completions[task.id].damage_dealt}` : `d${tierInfo.die}`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
