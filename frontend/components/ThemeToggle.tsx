'use client'
import { useEffect, useState } from 'react'

function getInitialDarkTheme() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('theme') !== 'light'
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(getInitialDarkTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} style={{
      background: 'transparent',
      border: '1px solid var(--border2)',
      borderRadius: '8px',
      padding: '6px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: 'var(--text2)',
      fontSize: '12px',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
      transition: 'all 0.2s',
    }}>
      {dark ? (
        <>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          Light
        </>
      ) : (
        <>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
          Dark
        </>
      )}
    </button>
  )
}
