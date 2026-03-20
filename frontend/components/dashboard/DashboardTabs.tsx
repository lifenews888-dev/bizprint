'use client'

import { useState } from 'react'

interface Tab { key: string; label: string }

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export default function DashboardTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: '10px 20px', cursor: 'pointer', border: 'none', background: 'none',
            fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
            fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
            color: activeTab === tab.key ? '#FF6A00' : 'var(--text3)',
            borderBottom: activeTab === tab.key ? '2px solid #FF6A00' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}
        >{tab.label}</button>
      ))}
    </div>
  )
}
