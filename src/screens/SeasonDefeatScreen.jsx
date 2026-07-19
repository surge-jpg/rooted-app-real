import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { SEASON_DEFEAT_VERSES, buildNextSeasonPayload } from '../lib/gameLogic'

export default function SeasonDefeatScreen({ userId, defeatedSeason, statsArray, onComplete }) {
  const [note, setNote] = useState('')
  const [step, setStep] = useState('reveal') // reveal -> reflect -> rewards
  const [saving, setSaving] = useState(false)

  const verse = SEASON_DEFEAT_VERSES[defeatedSeason.theme_stat_key] || SEASON_DEFEAT_VERSES.discipline

  async function submitReflection() {
    setSaving(true)

    // 1. save the reflection note on the defeated season
    await supabase
      .from('seasons')
      .update({ reflection_note: note })
      .eq('id', defeatedSeason.id)

    // 2. create the next season
    const nextSeasonPayload = buildNextSeasonPayload({
      userId,
      previousSeasonNumber: defeatedSeason.season_number,
      statsArray,
      reflectionNote: note,
    })
    const { data: newSeason } = await supabase
      .from('seasons')
      .insert(nextSeasonPayload)
      .select()
      .single()

    setSaving(false)
    setStep('rewards')
    setTimeout(() => onComplete(newSeason), 2400)
  }

  if (step === 'reveal') {
    return (
      <div className="defeat-screen reveal">
        <div className="defeat-boss-fade">
          <p className="defeat-eyebrow">The Shadow Dissolves</p>
          <h1>{defeatedSeason.boss_name}</h1>
          <p className="defeat-sub">has no more hold over you.</p>
        </div>
        <button className="cta" onClick={() => setStep('reflect')}>Continue</button>
      </div>
    )
  }

  if (step === 'reflect') {
    return (
      <div className="defeat-screen reflect">
        <p className="defeat-verse">{verse}</p>
        <h2>What did God teach you this season?</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="This season you overcame..."
          rows={5}
        />
        <button className="cta" disabled={saving} onClick={submitReflection}>
          {saving ? 'Saving...' : 'Begin Next Season'}
        </button>
      </div>
    )
  }

  return (
    <div className="defeat-screen rewards">
      <h2>+500 XP</h2>
      <p>A new season begins.</p>
    </div>
  )
}
