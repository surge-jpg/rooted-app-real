// ROOTED — Core game logic
// Every number here matches what was decided in the design spec.

// ---------------------------------------------------------------
// DICE TIERS
// ---------------------------------------------------------------
export const DICE_TIERS = [
  { tier: 1, name: 'Seed',        die: 4,  threshold: 0 },
  { tier: 2, name: 'Rooted',      die: 6,  threshold: 15 },
  { tier: 3, name: 'Rising',      die: 8,  threshold: 40 },
  { tier: 4, name: 'Unshaken',    die: 12, threshold: 80 },
  { tier: 5, name: 'Flourishing', die: 20, threshold: 150 },
  { tier: 6, name: 'Unbreakable', die: 30, threshold: 300 },
]

export function getTierForCompletions(completions) {
  let current = DICE_TIERS[0]
  for (const t of DICE_TIERS) {
    if (completions >= t.threshold) current = t
  }
  return current
}

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

// ---------------------------------------------------------------
// TREE / FOUNDATION HEALTH
// Driven by rolling 7-10 day completion rate of Faith, Wisdom,
// Strength, and Character tasks only (NOT Stewardship).
// ---------------------------------------------------------------
const FOUNDATION_STATS = ['faith', 'wisdom', 'strength', 'character']

export function getTreeState(recentCompletionRate) {
  // recentCompletionRate: 0-1, fraction of foundation tasks done in window
  if (recentCompletionRate >= 0.8) return { tier: 'flourishing', modifier: 2, label: 'Flourishing' }
  if (recentCompletionRate >= 0.5) return { tier: 'healthy', modifier: 0, label: 'Healthy' }
  if (recentCompletionRate >= 0.25) return { tier: 'wilting', modifier: -1, label: 'Wilting' }
  return { tier: 'dry', modifier: -2, label: 'Dry' } // floor — never worse, never fully dies
}

export function applyTreeModifier(rawRoll, treeModifier) {
  return Math.max(1, rawRoll + treeModifier) // never let a roll go below 1
}

// ---------------------------------------------------------------
// BOSS HP SCALING
// Season 1 = 2500 HP, tuned for a 4-6 week first win.
// Season N HP = Base * (1 + 0.4*(N-1)) * avg stat tier at season start
// ---------------------------------------------------------------
const SEASON_1_BASE_HP = 2500

export function calculateSeasonHP(seasonNumber, avgStatTier) {
  if (seasonNumber === 1) return SEASON_1_BASE_HP
  const seasonMultiplier = 1 + 0.4 * (seasonNumber - 1)
  return Math.round(SEASON_1_BASE_HP * seasonMultiplier * Math.max(1, avgStatTier))
}

// ---------------------------------------------------------------
// SEASON THEME ASSIGNMENT — auto-picks weakest stat, tiebreak by
// least recent activity.
// ---------------------------------------------------------------
export function pickNextSeasonTheme(statsArray) {
  // statsArray: [{ stat_key, tier, completions_total, last_completed_at }]
  const sorted = [...statsArray].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    // tiebreak: whichever was completed least recently
    return new Date(a.last_completed_at || 0) - new Date(b.last_completed_at || 0)
  })
  return sorted[0].stat_key
}

const SEASON_BOSS_NAMES = {
  faith: 'The Shadow of Doubt',
  wisdom: 'The Shadow of Foolishness',
  strength: 'The Shadow of Neglect',
  discipline: 'The Shadow of Laziness',
  stewardship: 'The Shadow of Waste',
  character: 'The Shadow of Pride',
}

export function bossNameForStat(statKey) {
  return SEASON_BOSS_NAMES[statKey] || 'The Shadow'
}

// ---------------------------------------------------------------
// TREE VITALITY — real rolling-window calculation
// Looks at the last N days of task completions for the four
// foundation stats and computes what fraction of "possible"
// foundation task-days were actually completed.
// ---------------------------------------------------------------
export function calculateVitalityFromCompletions(completions, taskDefsById, windowDays = 7) {
  // completions: array of { task_id, completed_date }
  // taskDefsById: { task_id: { stat_key, ... } }
  const foundationTaskIds = Object.keys(taskDefsById).filter((id) =>
    FOUNDATION_STATS.includes(taskDefsById[id].stat_key)
  )
  if (foundationTaskIds.length === 0) return 0

  const today = new Date()
  const windowStart = new Date(today)
  windowStart.setDate(today.getDate() - (windowDays - 1))

  const possibleCompletions = foundationTaskIds.length * windowDays
  let actualCompletions = 0

  for (const c of completions) {
    if (!foundationTaskIds.includes(c.task_id)) continue
    const completedDate = new Date(c.completed_date)
    if (completedDate >= windowStart && completedDate <= today) {
      actualCompletions += 1
    }
  }

  return Math.min(1, actualCompletions / possibleCompletions)
}

// ---------------------------------------------------------------
// SEASON DEFEAT FLOW
// Call this once hp_current hits 0. Creates the next season row
// using the auto-assigned weakest-stat theme.
// ---------------------------------------------------------------
export function buildNextSeasonPayload({ userId, previousSeasonNumber, statsArray, reflectionNote }) {
  const themeStatKey = pickNextSeasonTheme(statsArray)
  const avgTier = statsArray.reduce((sum, s) => sum + s.tier, 0) / statsArray.length
  const nextSeasonNumber = previousSeasonNumber + 1
  return {
    user_id: userId,
    season_number: nextSeasonNumber,
    theme_stat_key: themeStatKey,
    boss_name: bossNameForStat(themeStatKey),
    hp_max: calculateSeasonHP(nextSeasonNumber, avgTier),
    hp_current: calculateSeasonHP(nextSeasonNumber, avgTier),
  }
}

// ---------------------------------------------------------------
// SEASON DEFEAT SCRIPTURE — shown on the reflection screen,
// rotates by which stat the defeated season was themed around.
// ---------------------------------------------------------------
export const SEASON_DEFEAT_VERSES = {
  faith: '"Now faith is confidence in what we hope for and assurance about what we do not see." — Hebrews 11:1',
  wisdom: '"The fear of the Lord is the beginning of wisdom." — Proverbs 9:10',
  strength: '"I can do all things through him who strengthens me." — Philippians 4:13',
  discipline: '"No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness." — Hebrews 12:11',
  stewardship: '"Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things." — Matthew 25:23',
  character: '"Whatever is true, whatever is noble, whatever is right, whatever is pure — think about such things." — Philippians 4:8',
}

export const RESTORATION_STAGES = [
  { stage: 1, minPct: 0,  label: 'Abandoned Frame' },
  { stage: 2, minPct: 10, label: 'Rust Removed · Frame Cleaned' },
  { stage: 3, minPct: 25, label: 'Engine Bay Restored · Wheels On' },
  { stage: 4, minPct: 50, label: 'Engine Installed · Interior Added' },
  { stage: 5, minPct: 75, label: 'Paint In Progress · Final Details' },
  { stage: 6, minPct: 100, label: 'Fully Restored' },
]

export function getRestorationStage(currentAmount, targetAmount) {
  const pct = (currentAmount / targetAmount) * 100
  let stage = RESTORATION_STAGES[0]
  for (const s of RESTORATION_STAGES) {
    if (pct >= s.minPct) stage = s
  }
  return { ...stage, pct: Math.min(100, pct) }
}
