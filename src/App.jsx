import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ensureOnboarded } from './lib/onboarding'
import AuthScreen from './screens/AuthScreen'
import BossArena from './screens/BossArena'
import Garden from './screens/Garden'
import Garage from './screens/Garage'

const SCREENS = ['garden', 'arena', 'garage']

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const [activeScreen, setActiveScreen] = useState('arena')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await handleSession(session)
      setSession(session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await handleSession(session)
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSession(session) {
    setOnboarding(true)
    try {
      await ensureOnboarded(session.user)
    } catch (err) {
      console.error('Onboarding failed:', err)
    }
    setOnboarding(false)
  }

  function navigate(direction) {
    const currentIndex = SCREENS.indexOf(activeScreen)
    const nextIndex = direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(SCREENS.length - 1, currentIndex + 1)
    setActiveScreen(SCREENS[nextIndex])
  }

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!session) return <AuthScreen />
  if (onboarding) return <div className="loading-screen">Planting your first seed...</div>

  return (
    <div className="app-frame">
      {activeScreen === 'garden' && <Garden userId={session.user.id} onNavigate={navigate} />}
      {activeScreen === 'arena' && <BossArena userId={session.user.id} onNavigate={navigate} createdAt={session.user.created_at} />}
      {activeScreen === 'garage' && <Garage userId={session.user.id} onNavigate={navigate} />}
    </div>
  )
}
