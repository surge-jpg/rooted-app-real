import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="auth-screen">
      <h1>Rooted</h1>
      <p className="tagline">God provides the seed. You faithfully cultivate it.</p>
      {sent ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
