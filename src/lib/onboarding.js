import { supabase } from './supabase'
import { calculateSeasonHP } from './gameLogic'

// Runs once after a user's first successful sign-in. Checks whether they
// already have a profile row (our signal that onboarding already happened);
// if not, creates everything needed for a fresh account to actually work:
// a profile row, a Season 1 boss, and a starter goal — so nobody has to
// touch the Supabase table editor by hand.
//
// Safe against concurrent calls (e.g. two browser tabs signing in at once,
// or the client firing this twice on load): the profile insert is the
// "lock" — if it fails because the row already exists (a unique-violation
// error, code 23505), this call backs off and does nothing further,
// so only one call ever creates the season/goal/stats rows.
export async function ensureOnboarded(user) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) return // already onboarded, nothing to do

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    display_name: user.email?.split('@')[0] || 'Friend',
  })

  if (profileError) {
    // Someone else (another tab/device, or a near-simultaneous call) won
    // the race and already created the profile. Don't proceed — creating
    // season/goal/stats here too would duplicate them.
    if (profileError.code === '23505') return
    throw profileError
  }

  // 2. seed all six stats at tier 1 so the Garden screen has rows to show
  //    immediately instead of needing to infer defaults everywhere
  const statKeys = ['faith', 'wisdom', 'strength', 'discipline', 'stewardship', 'character']
  await supabase.from('stats').insert(
    statKeys.map((key) => ({
      user_id: user.id,
      stat_key: key,
      completions_total: 0,
      tier: 1,
    }))
  )

  // 3. Season 1 — fixed starting boss per the design spec
  const season1HP = calculateSeasonHP(1, 1)
  await supabase.from('seasons').insert({
    user_id: user.id,
    season_number: 1,
    theme_stat_key: 'discipline',
    boss_name: 'The Shadow of Laziness',
    hp_max: season1HP,
    hp_current: season1HP,
  })

  // 4. starter goal — the R35 restoration project
  await supabase.from('goals').insert({
    user_id: user.id,
    title: 'Nissan GT-R R35 Restoration',
    target_amount: 100000,
    current_amount: 0,
    is_active: true,
  })
}
