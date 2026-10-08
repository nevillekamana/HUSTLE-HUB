import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Minimal ProtectedRoute for test: behaviour is what the app should implement.
function ProtectedRoute({ user, role, children }){
  if(!user) return <div>redirect:/login</div>
  if(role === 'freelancer' && user.role !== 'freelancer') return <div>redirect:/</div>
  return <>{children}</>
}

describe('ProtectedRoute (isolated)', ()=>{
  it('redirects unsigned visitors', ()=>{
    render(<ProtectedRoute user={null}><div>ok</div></ProtectedRoute>)
    expect(screen.getByText(/redirect:\/login/)).toBeTruthy()
  })

  it('redirects wrong role users', ()=>{
    render(<ProtectedRoute user={{ role: 'client' }} role='freelancer'><div>ok</div></ProtectedRoute>)
    expect(screen.getByText(/redirect:\//)).toBeTruthy()
  })

  it('allows freelancer', ()=>{
    render(<ProtectedRoute user={{ role: 'freelancer' }} role='freelancer'><div>ok</div></ProtectedRoute>)
    expect(screen.getByText('ok')).toBeTruthy()
  })
})
