import { useState, useEffect } from 'react'

const STORAGE_KEY = 'rooted_reminder_enabled'

// NOTE ON SCOPE: this uses the browser Notification API, which can only
// fire while the app is open in a tab/installed window. True background
// push notifications (the kind that arrive even when the app is fully
// closed) require a push subscription + a server that sends them on a
// schedule — real infrastructure beyond a client-only PWA. This is a
// deliberately honest MVP version: a same-session reminder, not a
// promise of background delivery. Upgrading to real push later means
// adding a small serverless function (e.g. a Supabase Edge Function on
// a cron) that calls the Web Push API.
export default function ReminderToggle() {
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    setEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  async function toggle() {
    if (!enabled) {
      if (typeof Notification === 'undefined') return
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true')
        setEnabled(true)
        new Notification('Rooted', {
          body: "You'll get a gentle nudge if you haven't checked in today.",
        })
      }
    } else {
      localStorage.setItem(STORAGE_KEY, 'false')
      setEnabled(false)
    }
  }

  if (permission === 'unsupported') return null

  return (
    <button className="reminder-toggle" onClick={toggle}>
      {enabled ? '🔔 Reminders on' : '🔕 Enable daily reminder'}
    </button>
  )
}
