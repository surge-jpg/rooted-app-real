import { supabase } from '../lib/supabase'

export default function StatusBar({ children }) {
  async function handleSignOut() {
    if (confirm('Sign out?')) {
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="statusbar">
      <span>{children}</span>
      <button className="signout-link" onClick={handleSignOut}>Sign Out</button>
    </div>
  )
}
