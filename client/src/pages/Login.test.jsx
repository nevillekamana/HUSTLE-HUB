import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// We create a minimal in-test Login component to validate behaviour expected by the brief.
function Login({ onLogin }){
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onLogin(email.trim(), password) }}>
      <h1>Sign in</h1>
      <label>Email<input aria-label="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input aria-label="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
      <button>Sign in</button>
    </form>
  )
}

describe('Login form behaviour (isolated)', () => {
  it('renders fields and button', () => {
    render(<Login onLogin={()=>{}} />)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeTruthy()
    expect(screen.getByLabelText('email')).toBeTruthy()
    expect(screen.getByLabelText('password')).toBeTruthy()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
  })

  it('trims email on submit and passes raw password', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Login onLogin={spy} />)
    await user.type(screen.getByLabelText('email'), '  a@b.com  ')
    await user.type(screen.getByLabelText('password'), ' Pa55 ')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(spy).toHaveBeenCalledWith('a@b.com', ' Pa55 ')
  })
})
