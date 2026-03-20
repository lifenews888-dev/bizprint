# BizPrint Chat Files - Direct Write
# Run: .\bizprint-chat-files.ps1

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$COMP = "C:\Users\User\projects\bizprint\frontend\components"
$ADMIN_CHAT = "C:\Users\User\projects\bizprint\frontend\app\admin\chat"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Chat Files Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# 1. ChatBox.tsx
# ============================================================
Write-Host ""
Write-Host "[1/2] Writing ChatBox.tsx..." -ForegroundColor Yellow

Write-File "$COMP\ChatBox.tsx" @'
'use client'
import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'

interface Props { userId: string; userName: string; role: string }

const API = 'http://localhost:4000'

const RC: Record<string, { c: string; bg: string; l: string; e: string }> = {
  admin:    { c:'#FF6B00', bg:'rgba(255,107,0,0.12)',  l:'Админ',      e:'👑' },
  designer: { c:'#8B5CF6', bg:'rgba(139,92,246,0.12)', l:'Дизайнер',   e:'🎨' },
  courier:  { c:'#10B981', bg:'rgba(16,185,129,0.12)', l:'Жолооч',     e:'🚚' },
  customer: { c:'#3B82F6', bg:'rgba(59,130,246,0.12)', l:'Хэрэглэгч',  e:'👤' },
  vendor:   { c:'#F59E0B', bg:'rgba(245,158,11,0.12)', l:'Борлуулагч', e:'🏭' },
  factory:  { c:'#EC4899', bg:'rgba(236,72,153,0.12)', l:'Үйлдвэр',    e:'🏗' },
}

const TARGETS = [
  { role:'admin',    l:'Админ',       e:'👑', d:'Тусламж авах' },
  { role:'designer', l:'Дизайнер',    e:'🎨', d:'Дизайн асуудал' },
  { role:'vendor',   l:'Борлуулагч',  e:'🏭', d:'Бараа үнийн асуудал' },
  { role:'factory',  l:'Үйлдвэр',     e:'🏗', d:'Хэвлэлийн асуудал' },
]

function fmt(d: string) {
  const t = new Date(d), n = new Date(), df = n.getTime()-t.getTime()
  if(df<60000) return 'Одоо'
  if(df<3600000) return Math.floor(df/60000)+'мин'
  if(t.toDateString()===n.toDateString()) return t.toLocaleTimeString('mn-MN',{hour:'2-digit',minute:'2-digit'})
  return t.toLocaleDateString('mn-MN',{month:'short',day:'numeric'})
}

type V = 'closed'|'list'|'chat'|'new'

export default function ChatBox({ userId, userName, role }: Props) {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(userId, userName, role)
  const [view, setView] = useState<V>('closed')
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [preview, setPreview] = useState<string|null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const unread = rooms.reduce((s,r)=>s+(r.unread_count||0),0)
  const msgs = activeRoom ? (messages[activeRoom]||[]) : []
  const room = rooms.find(r=>r.room_id===activeRoom)
  const other = room?.participant_names.find((n:string)=>n!==userName)||'BizPrint'
  const mc = RC[role]||RC.customer

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs,view])
  useEffect(()=>{ if(view==='chat') taRef.current?.focus() },[view])
  useEffect(()=>{
    if(view==='list'&&rooms.length===1&&!activeRoom){ joinRoom(rooms[0].room_id); setView('chat') }
  },[rooms,view])

  async function upload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(API+'/upload/file',{method:'POST',headers:{Authorization:'Bearer '+(localStorage.getItem('access_token')||'')},body:fd})
      const d = await res.json()
      return d.url||(API+'/uploads/'+d.filename)
    } finally { setUploading(false) }
  }

  async function sendFile(file: File) {
    if(!activeRoom) return
    const url = await upload(file)
    sendMessage(activeRoom, file.type.startsWith('image/') ? '[IMG]'+url : '[FILE]'+file.name+'|'+url)
  }

  function send() {
    if(!activeRoom||!text.trim()) return
    sendMessage(activeRoom, text.trim()); setText('')
  }

  function startWith(r: string, l: string) {
    createRoom({type:'support',participants:[userId,r],participantNames:[userName,l]})
    setView('list')
    setTimeout(()=>{
      const rm = rooms.find(x=>x.participants.includes(userId)&&x.participants.includes(r))
      if(rm){ joinRoom(rm.room_id); setView('chat') }
    },600)
  }

  function renderMsg(msg: any) {
    const me = msg.sender_id===userId
    const c = msg.message
    if(c.startsWith('[IMG]')) {
      const url = c.replace('[IMG]','')
      return <img src={url} alt="img" onClick={()=>setPreview(url)} style={{maxWidth:200,borderRadius:10,cursor:'pointer',display:'block'}} />
    }
    if(c.startsWith('[FILE]')) {
      const [name,url] = c.replace('[FILE]','').split('|')
      const ext = name.split('.').pop()?.toUpperCase()||'FILE'
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:me?'rgba(255,255,255,0.15)':'var(--surface2)',borderRadius:10,textDecoration:'none',border:me?'none':'1px solid var(--border)',minWidth:180}}>
          <div style={{width:36,height:36,borderRadius:8,background:me?'rgba(255,255,255,0.2)':'rgba(255,107,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:me?'#fff':'#FF6B00',flexShrink:0}}>{ext}</div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:me?'#fff':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{name}</div>
            <div style={{fontSize:10,color:me?'rgba(255,255,255,0.7)':'var(--text3)'}}>Татаж авах →</div>
          </div>
        </a>
      )
    }
    return (
      <div style={{padding:'10px 14px',background:me?'linear-gradient(135deg,#FF6B00,#FF8C42)':'var(--surface2)',color:me?'#fff':'var(--text)',borderRadius:me?'18px 18px 4px 18px':'18px 18px 18px 4px',fontSize:14,lineHeight:1.6,border:me?'none':'1px solid var(--border)',boxShadow:me?'0 2px 12px rgba(255,107,0,0.2)':'none',wordBreak:'break-word',whiteSpace:'pre-wrap'}}>
        {c}
      </div>
    )
  }

  const W = 380, H = 560

  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}`}</style>

      {/* IMAGE PREVIEW */}
      {preview&&(
        <div onClick={()=>setPreview(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',backdropFilter:'blur(4px)'}}>
          <img src={preview} alt="p" style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:12,boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}} />
          <button onClick={()=>setPreview(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'50%',width:40,height:40,color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
      )}

      {/* WINDOW */}
      {view!=='closed'&&(
        <div onDragOver={e=>{e.preventDefault();if(view==='chat')setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files?.[0];if(f)sendFile(f)}}
          style={{position:'absolute',bottom:70,right:0,width:W,height:H,background:drag?'rgba(255,107,0,0.04)':'var(--surface)',border:drag?'2px dashed #FF6B00':'1px solid var(--border)',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.25)',display:'flex',flexDirection:'column',overflow:'hidden',animation:'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}>

          {/* HEADER */}
          <div style={{padding:'13px 15px',background:'linear-gradient(135deg,#FF6B00,#FF8C42)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff'}}>
              {view==='chat'?other[0]?.toUpperCase():view==='new'?'➕':'💬'}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>{view==='chat'?other:view==='new'?'Шинэ чат':'BizPrint Чат'}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:connected?'#fff':'rgba(255,255,255,0.4)',boxShadow:connected?'0 0 4px #fff':'none'}}/>
                {connected?'Онлайн':'Офлайн'}{drag&&<span style={{marginLeft:6,fontWeight:600}}>📎 Файл оруулах...</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:5}}>
              {(view==='chat'||view==='new')&&<button onClick={()=>setView('list')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:7,width:28,height:28,cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>←</button>}
              <button onClick={()=>setView('closed')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:7,width:28,height:28,cursor:'pointer',color:'#fff',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
          </div>

          {/* NEW CHAT */}
          {view==='new'&&(
            <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:8}}>
              <p style={{fontSize:12,color:'var(--text3)',margin:'0 0 6px',textAlign:'center'}}>Хэнтэй харилцах вэ?</p>
              {TARGETS.filter(t=>t.role!==role).map(t=>{
                const cfg=RC[t.role]||RC.customer
                return(
                  <div key={t.role} onClick={()=>startWith(t.role,t.l)} style={{padding:'13px 14px',background:'var(--surface2)',borderRadius:12,cursor:'pointer',display:'flex',alignItems:'center',gap:11,border:'1px solid var(--border)',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF6B00';e.currentTarget.style.background='rgba(255,107,0,0.04)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface2)'}}>
                    <div style={{width:42,height:42,borderRadius:'50%',background:cfg.bg,border:'2px solid '+cfg.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{t.e}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{t.l}</div>
                      <div style={{fontSize:12,color:'var(--text3)'}}>{t.d}</div>
                    </div>
                    <div style={{color:'var(--text3)',fontSize:16}}>→</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* LIST */}
          {view==='list'&&(
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
              {rooms.length===0?(
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:28,textAlign:'center'}}>
                  <div style={{fontSize:44,marginBottom:12}}>💬</div>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text)',marginBottom:6}}>Сайн байна уу!</div>
                  <div style={{fontSize:12,color:'var(--text3)',marginBottom:20,lineHeight:1.6}}>Админ, дизайнер, борлуулагчтай харилц</div>
                  <button onClick={()=>setView('new')} style={{background:'linear-gradient(135deg,#FF6B00,#FF8C42)',border:'none',borderRadius:12,padding:'11px 22px',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13,width:'100%',boxShadow:'0 4px 16px rgba(255,107,0,0.35)'}}>💬 Чат эхлэх</button>
                </div>
              ):(
                <>
                  {rooms.map(r=>{
                    const on=r.participant_names.find((n:string)=>n!==userName)||'Admin'
                    const ini=on.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
                    return(
                      <div key={r.room_id} onClick={()=>{joinRoom(r.room_id);setView('chat')}} style={{padding:'11px 13px',cursor:'pointer',display:'flex',gap:10,alignItems:'center',borderBottom:'1px solid var(--border)',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,107,0,0.04)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,107,0,0.1)',border:'2px solid #FF6B00',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#FF6B00',flexShrink:0}}>{ini}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                            <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>{on}</div>
                            <div style={{fontSize:10,color:'var(--text3)'}}>{r.last_message_at?fmt(r.last_message_at):''}</div>
                          </div>
                          <div style={{fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {r.last_message?.startsWith('[IMG]')?'📷 Зураг':r.last_message?.startsWith('[FILE]')?'📎 Файл':r.last_message||'Мессеж байхгүй'}
                          </div>
                        </div>
                        {r.unread_count>0&&<div style={{width:18,height:18,borderRadius:'50%',background:'#FF6B00',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{r.unread_count}</div>}
                      </div>
                    )
                  })}
                  <div style={{padding:10}}>
                    <button onClick={()=>setView('new')} style={{width:'100%',padding:9,background:'transparent',border:'1.5px dashed var(--border2)',borderRadius:9,color:'var(--text3)',cursor:'pointer',fontSize:12}}>+ Шинэ чат эхлэх</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CHAT */}
          {view==='chat'&&(
            <>
              <div style={{flex:1,overflowY:'auto',padding:'12px 12px 6px',display:'flex',flexDirection:'column',gap:8}}>
                {msgs.length===0&&<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:16}}><div style={{fontSize:32,marginBottom:8}}>👋</div><div style={{fontWeight:600,fontSize:13,color:'var(--text)',marginBottom:4}}>Сайн байна уу!</div><div style={{fontSize:11,color:'var(--text3)'}}>Асуухыг хүссэн зүйлээ бичнэ үү</div></div>}
                {msgs.map((msg,i)=>{
                  const me=msg.sender_id===userId
                  const prev=msgs[i-1]
                  const showN=!me&&(!prev||prev.sender_id!==msg.sender_id)
                  const showT=!msgs[i+1]||msgs[i+1].sender_id!==msg.sender_id
                  return(
                    <div key={msg.id}>
                      {showN&&<div style={{fontSize:10,fontWeight:700,color:'#FF6B00',marginBottom:2,marginLeft:36}}>{msg.sender_name}</div>}
                      <div style={{display:'flex',gap:6,alignItems:'flex-end',justifyContent:me?'flex-end':'flex-start'}}>
                        {!me&&<div style={{width:26,height:26,borderRadius:'50%',background:'rgba(255,107,0,0.1)',border:'1.5px solid #FF6B00',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#FF6B00',flexShrink:0,alignSelf:'flex-end'}}>{msg.sender_name[0]?.toUpperCase()}</div>}
                        <div style={{maxWidth:'76%'}}>
                          {renderMsg(msg)}
                          {showT&&<div style={{fontSize:9,color:'var(--text3)',marginTop:2,textAlign:me?'right':'left'}}>{fmt(msg.created_at)}{me&&<span style={{marginLeft:3,color:'#10B981'}}>✓✓</span>}</div>}
                        </div>
                        {me&&<div style={{width:26,height:26,borderRadius:'50%',background:mc.bg,border:'1.5px solid '+mc.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:mc.c,flexShrink:0,alignSelf:'flex-end'}}>{userName[0]?.toUpperCase()}</div>}
                      </div>
                    </div>
                  )
                })}
                {uploading&&<div style={{display:'flex',justifyContent:'flex-end'}}><div style={{padding:'9px 13px',background:'rgba(255,107,0,0.1)',borderRadius:10,fontSize:12,color:'#FF6B00',display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,borderRadius:'50%',border:'2px solid #FF6B00',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/> Байршуулж байна...</div></div>}
                <div ref={bottomRef}/>
              </div>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.psd,.zip,.doc,.docx" onChange={e=>{const f=e.target.files?.[0];if(f)sendFile(f);e.target.value=''}} style={{display:'none'}}/>
              <div style={{padding:'9px 11px 11px',borderTop:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
                <div style={{display:'flex',gap:6,alignItems:'flex-end',background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:13,padding:'6px 6px 6px 11px'}}>
                  <button onClick={()=>fileRef.current?.click()} title="Файл/зураг" style={{width:30,height:30,borderRadius:8,border:'none',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:15,flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,107,0,0.1)';e.currentTarget.style.color='#FF6B00'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)';e.currentTarget.style.color='var(--text3)'}}>📎</button>
                  <textarea ref={taRef} value={text} onChange={e=>{setText(e.target.value)}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} rows={1} placeholder="Мессеж бичнэ үү..." style={{flex:1,background:'transparent',border:'none',color:'var(--text)',fontSize:13,outline:'none',resize:'none',padding:'3px 0',lineHeight:1.5,fontFamily:'inherit',minHeight:22,maxHeight:90}}/>
                  <button onClick={send} disabled={!text.trim()||uploading} style={{width:32,height:32,borderRadius:8,border:'none',flexShrink:0,cursor:text.trim()?'pointer':'default',background:text.trim()?'linear-gradient(135deg,#FF6B00,#FF8C42)':'var(--border)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',boxShadow:text.trim()?'0 3px 10px rgba(255,107,0,0.4)':'none'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                  <div style={{fontSize:9,color:'var(--text3)'}}>📎 Drag & drop эсвэл товч дар</div>
                  <div style={{fontSize:9,color:'var(--text3)'}}>Enter илгээх · Shift+Enter мөр</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* BUTTON */}
      <button onClick={()=>{if(view==='closed'){if(rooms.length===0)setView('new');else if(rooms.length===1){joinRoom(rooms[0].room_id);setView('chat')}else setView('list')}else setView('closed')}}
        style={{width:52,height:52,borderRadius:'50%',background:view!=='closed'?'var(--surface)':'linear-gradient(135deg,#FF6B00,#FF8C42)',border:view!=='closed'?'2px solid var(--border)':'none',cursor:'pointer',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:view!=='closed'?'0 4px 16px rgba(0,0,0,0.15)':'0 6px 24px rgba(255,107,0,0.45)',transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
        {view!=='closed'
          ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          :<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
        {unread>0&&view==='closed'&&<div style={{position:'absolute',top:-2,right:-2,width:19,height:19,borderRadius:'50%',background:'#EF4444',color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--bg)',animation:'pulse 2s infinite'}}>{unread>9?'9+':unread}</div>}
      </button>
    </div>
  )
}
'@

# ============================================================
# 2. Admin Chat Page
# ============================================================
Write-Host "[2/2] Writing admin chat page..." -ForegroundColor Yellow

Write-File "$ADMIN_CHAT\page.tsx" @'
'use client'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'

const ADMIN_ID = 'admin'
const ADMIN_NAME = 'Admin'
const API = 'http://localhost:4000'

const RC: Record<string, { c: string; bg: string; l: string; e: string }> = {
  admin:    { c:'#FF6B00', bg:'rgba(255,107,0,0.12)',  l:'Админ',      e:'👑' },
  designer: { c:'#8B5CF6', bg:'rgba(139,92,246,0.12)', l:'Дизайнер',   e:'🎨' },
  courier:  { c:'#10B981', bg:'rgba(16,185,129,0.12)', l:'Жолооч',     e:'🚚' },
  customer: { c:'#3B82F6', bg:'rgba(59,130,246,0.12)', l:'Хэрэглэгч',  e:'👤' },
  vendor:   { c:'#F59E0B', bg:'rgba(245,158,11,0.12)', l:'Борлуулагч', e:'🏭' },
}

function fmt(d: string) {
  const t=new Date(d),n=new Date(),df=n.getTime()-t.getTime()
  if(df<60000) return 'Одоо'
  if(df<3600000) return Math.floor(df/60000)+'мин'
  if(t.toDateString()===n.toDateString()) return t.toLocaleTimeString('mn-MN',{hour:'2-digit',minute:'2-digit'})
  return t.toLocaleDateString('mn-MN',{month:'short',day:'numeric'})
}

export default function AdminChatPage() {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(ADMIN_ID, ADMIN_NAME, 'admin')
  const [text, setText] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string|null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    fetch(API+'/admin/users',{headers:{Authorization:'Bearer '+(localStorage.getItem('access_token')||'')}})
      .then(r=>r.json()).then(d=>setUsers(Array.isArray(d)?d:[]))
  },[])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,activeRoom])
  useEffect(()=>{ if(activeRoom) taRef.current?.focus() },[activeRoom])

  async function upload(file: File) {
    setUploading(true)
    try {
      const fd=new FormData(); fd.append('file',file)
      const res=await fetch(API+'/upload/file',{method:'POST',headers:{Authorization:'Bearer '+(localStorage.getItem('access_token')||'')},body:fd})
      const d=await res.json()
      return d.url||(API+'/uploads/'+d.filename)
    } finally { setUploading(false) }
  }

  async function sendFile(file: File) {
    if(!activeRoom) return
    const url=await upload(file)
    sendMessage(activeRoom, file.type.startsWith('image/')?'[IMG]'+url:'[FILE]'+file.name+'|'+url)
  }

  function send() {
    if(!activeRoom||!text.trim()) return
    sendMessage(activeRoom,text.trim()); setText('')
  }

  function startChat(user: any) {
    createRoom({type:'support',participants:[ADMIN_ID,user.id],participantNames:[ADMIN_NAME,user.name||user.email]})
    setShowNew(false)
  }

  const msgs = activeRoom?(messages[activeRoom]||[]):[]
  const roomData = rooms.find(r=>r.room_id===activeRoom)
  const otherName = roomData?.participant_names.find((n:string)=>n!==ADMIN_NAME)||''
  const otherUser = users.find((u:any)=>(u.name||u.email)===otherName)
  const totalUnread = rooms.reduce((s,r)=>s+(r.unread_count||0),0)

  const filtered = rooms.filter(r=>
    r.participant_names.some((n:string)=>n.toLowerCase().includes(search.toLowerCase()))||
    (r.last_message||'').toLowerCase().includes(search.toLowerCase())
  )

  function renderMsg(msg: any, isMe: boolean) {
    const c=msg.message
    if(c.startsWith('[IMG]')) {
      const url=c.replace('[IMG]','')
      return <img src={url} alt="img" onClick={()=>setPreview(url)} style={{maxWidth:240,borderRadius:10,cursor:'pointer',display:'block'}}/>
    }
    if(c.startsWith('[FILE]')) {
      const [name,url]=c.replace('[FILE]','').split('|')
      const ext=name.split('.').pop()?.toUpperCase()||'FILE'
      return(
        <a href={url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:isMe?'rgba(255,255,255,0.15)':'var(--surface2)',borderRadius:10,textDecoration:'none',border:isMe?'none':'1px solid var(--border)',minWidth:200}}>
          <div style={{width:36,height:36,borderRadius:8,background:isMe?'rgba(255,255,255,0.2)':'rgba(255,107,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:isMe?'#fff':'#FF6B00',flexShrink:0}}>{ext}</div>
          <div><div style={{fontSize:12,fontWeight:600,color:isMe?'#fff':'var(--text)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div><div style={{fontSize:10,color:isMe?'rgba(255,255,255,0.7)':'var(--text3)'}}>Татаж авах →</div></div>
        </a>
      )
    }
    return(
      <div style={{padding:'10px 14px',background:isMe?'linear-gradient(135deg,#FF6B00,#FF8C42)':'var(--surface)',color:isMe?'#fff':'var(--text)',borderRadius:isMe?'18px 18px 4px 18px':'18px 18px 18px 4px',fontSize:14,lineHeight:1.55,border:isMe?'none':'1px solid var(--border)',boxShadow:isMe?'0 2px 10px rgba(255,107,0,0.22)':'none',wordBreak:'break-word',whiteSpace:'pre-wrap'}}>
        {c}
      </div>
    )
  }

  return (
    <div style={{display:'flex',height:'calc(100vh - 54px)',background:'var(--bg)',fontFamily:"'Segoe UI',system-ui,sans-serif",color:'var(--text)',overflow:'hidden'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* IMAGE PREVIEW */}
      {preview&&(
        <div onClick={()=>setPreview(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',backdropFilter:'blur(4px)'}}>
          <img src={preview} alt="p" style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:12}}/>
          <button onClick={()=>setPreview(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'50%',width:40,height:40,color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
      )}

      {/* LEFT SIDEBAR - 300px fixed */}
      <div style={{width:300,minWidth:300,display:'flex',flexDirection:'column',borderRight:'1px solid var(--border)',background:'var(--surface)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'16px 14px 12px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div style={{fontWeight:800,fontSize:16}}>Дотоод чат</div>
              <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:connected?'#10B981':'#EF4444',boxShadow:connected?'0 0 5px #10B981':'none'}}/>
                <span style={{fontSize:11,color:connected?'#10B981':'#EF4444',fontWeight:500}}>{connected?'Онлайн':'Офлайн'}</span>
                {totalUnread>0&&<span style={{background:'#FF6B00',color:'#fff',borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:700,marginLeft:2}}>{totalUnread}</span>}
              </div>
            </div>
            <button onClick={()=>setShowNew(true)} style={{width:32,height:32,borderRadius:9,background:'#FF6B00',border:'none',cursor:'pointer',fontSize:18,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 10px rgba(255,107,0,0.4)'}}>+</button>
          </div>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--text3)'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Хайх..." style={{width:'100%',padding:'7px 8px 7px 28px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text)',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>
        {/* Room list */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.length===0&&<div style={{padding:'28px 14px',textAlign:'center',color:'var(--text3)'}}><div style={{fontSize:28,marginBottom:8}}>💬</div><div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Чат байхгүй</div><div style={{fontSize:11}}>+ дарж шинэ чат үүсгэнэ үү</div></div>}
          {filtered.map(r=>{
            const on=r.participant_names.find((n:string)=>n!==ADMIN_NAME)||r.participant_names[0]
            const oRole=users.find((u:any)=>(u.name||u.email)===on)?.role||'customer'
            const isA=activeRoom===r.room_id
            const cfg=RC[oRole]||RC.customer
            const ini=on.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
            return(
              <div key={r.room_id} onClick={()=>joinRoom(r.room_id)} style={{padding:'10px 13px',cursor:'pointer',display:'flex',gap:9,alignItems:'center',background:isA?'rgba(255,107,0,0.07)':'transparent',borderLeft:`3px solid ${isA?'#FF6B00':'transparent'}`,borderBottom:'1px solid var(--border)',transition:'all 0.15s'}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:cfg.bg,border:'2px solid '+cfg.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:cfg.c,flexShrink:0}}>{ini}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <div style={{fontWeight:600,fontSize:13,color:isA?'#FF6B00':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{on}</div>
                    <div style={{fontSize:10,color:'var(--text3)',flexShrink:0,marginLeft:4}}>{r.last_message_at?fmt(r.last_message_at):''}</div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                    <div style={{fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                      {r.last_message?.startsWith('[IMG]')?'📷 Зураг':r.last_message?.startsWith('[FILE]')?'📎 Файл':r.last_message||'Мессеж байхгүй'}
                    </div>
                    <div style={{display:'flex',gap:3,flexShrink:0}}>
                      <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:cfg.bg,color:cfg.c,fontWeight:700}}>{cfg.e} {cfg.l}</span>
                      {r.unread_count>0&&<span style={{background:'#FF6B00',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{r.unread_count}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT - CHAT AREA */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {!activeRoom?(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{textAlign:'center',color:'var(--text3)'}}>
              <div style={{fontSize:56,marginBottom:14}}>💬</div>
              <div style={{fontSize:20,fontWeight:700,color:'var(--text)',marginBottom:8}}>BizPrint Дотоод чат</div>
              <div style={{fontSize:13,marginBottom:22}}>Хэрэглэгч, дизайнер, жолооч, вендортой шууд харилц</div>
              <button onClick={()=>setShowNew(true)} style={{background:'#FF6B00',border:'none',borderRadius:12,padding:'11px 26px',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:14,boxShadow:'0 4px 16px rgba(255,107,0,0.35)'}}>+ Шинэ чат эхлэх</button>
            </div>
          </div>
        ):(
          <>
            {/* Chat header */}
            <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {otherName&&(()=>{
                  const r=otherUser?.role||'customer'; const cfg=RC[r]||RC.customer
                  const ini=otherName.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
                  return(
                    <div style={{width:38,height:38,borderRadius:'50%',background:cfg.bg,border:'2px solid '+cfg.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:cfg.c,flexShrink:0}}>{ini}</div>
                  )
                })()}
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{otherName}</div>
                  <div style={{fontSize:11,color:'var(--text3)',display:'flex',gap:4,alignItems:'center'}}>
                    {(()=>{const r=otherUser?.role||'customer';const cfg=RC[r]||RC.customer;return <span style={{color:cfg.c,fontWeight:600}}>{cfg.e} {cfg.l}</span>})()}
                    <span style={{color:'var(--text4)'}}>·</span>
                    <span>{roomData?.type==='support'?'Тусламжийн чат':roomData?.type}</span>
                  </div>
                </div>
              </div>
              <div style={{fontSize:11,color:'var(--text3)',background:'var(--surface2)',padding:'3px 9px',borderRadius:7,border:'1px solid var(--border)'}}>{msgs.length} мессеж</div>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
              {msgs.length===0&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13}}>Мессеж байхгүй. Эхлээд бичнэ үү!</div>}
              {msgs.map((msg,i)=>{
                const me=msg.sender_id===ADMIN_ID
                const prev=msgs[i-1]
                const showN=!me&&(!prev||prev.sender_id!==msg.sender_id)
                const showT=!msgs[i+1]||msgs[i+1].sender_id!==msg.sender_id
                const cfg=RC[msg.sender_role]||RC.customer
                const ini=msg.sender_name.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
                return(
                  <div key={msg.id}>
                    {showN&&<div style={{fontSize:10,color:cfg.c,fontWeight:700,marginBottom:3,marginLeft:38}}>{msg.sender_name}</div>}
                    <div style={{display:'flex',gap:7,alignItems:'flex-end',justifyContent:me?'flex-end':'flex-start'}}>
                      {!me&&<div style={{width:30,height:30,borderRadius:'50%',background:cfg.bg,border:'1.5px solid '+cfg.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:cfg.c,flexShrink:0,alignSelf:'flex-end'}}>{ini}</div>}
                      <div style={{maxWidth:'66%'}}>
                        {renderMsg(msg,me)}
                        {showT&&<div style={{fontSize:9,color:'var(--text3)',marginTop:2,textAlign:me?'right':'left'}}>{fmt(msg.created_at)}{me&&<span style={{marginLeft:3,color:'#10B981'}}>✓✓</span>}</div>}
                      </div>
                      {me&&<div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,107,0,0.12)',border:'1.5px solid #FF6B00',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#FF6B00',flexShrink:0,alignSelf:'flex-end'}}>A</div>}
                    </div>
                  </div>
                )
              })}
              {uploading&&<div style={{display:'flex',justifyContent:'flex-end'}}><div style={{padding:'9px 13px',background:'rgba(255,107,0,0.1)',borderRadius:10,fontSize:12,color:'#FF6B00',display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,borderRadius:'50%',border:'2px solid #FF6B00',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>Байршуулж байна...</div></div>}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{padding:'10px 20px 14px',borderTop:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.psd,.zip" onChange={e=>{const f=e.target.files?.[0];if(f)sendFile(f);e.target.value=''}} style={{display:'none'}}/>
              <div style={{display:'flex',gap:8,alignItems:'flex-end',background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:14,padding:'7px 7px 7px 14px'}}>
                <button onClick={()=>fileRef.current?.click()} style={{width:32,height:32,borderRadius:9,border:'none',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:15,flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,107,0,0.1)';e.currentTarget.style.color='#FF6B00'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)';e.currentTarget.style.color='var(--text3)'}}>📎</button>
                <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} rows={1} placeholder="Мессеж бичнэ үү... (Enter илгээх)" style={{flex:1,background:'transparent',border:'none',color:'var(--text)',fontSize:14,outline:'none',resize:'none',padding:'4px 0',lineHeight:1.5,fontFamily:'inherit',minHeight:24,maxHeight:100}}/>
                <button onClick={send} disabled={!text.trim()||uploading} style={{width:36,height:36,borderRadius:10,border:'none',cursor:text.trim()?'pointer':'default',background:text.trim()?'linear-gradient(135deg,#FF6B00,#FF8C42)':'var(--border)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',boxShadow:text.trim()?'0 3px 10px rgba(255,107,0,0.35)':'none',flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      {showNew&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
          <div style={{background:'var(--surface)',borderRadius:18,padding:24,width:420,border:'1px solid var(--border)',boxShadow:'0 20px 50px rgba(0,0,0,0.4)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div><h3 style={{margin:0,fontSize:18,fontWeight:700}}>Шинэ чат эхлэх</h3><p style={{margin:'3px 0 0',fontSize:12,color:'var(--text3)'}}>Хэрэглэгч сонгоно уу</p></div>
              <button onClick={()=>setShowNew(false)} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:9,width:30,height:30,cursor:'pointer',color:'var(--text3)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{maxHeight:340,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
              {users.filter((u:any)=>u.id!==ADMIN_ID).map((u:any)=>{
                const cfg=RC[u.role]||RC.customer
                const ini=(u.name||u.email).split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
                return(
                  <div key={u.id} onClick={()=>startChat(u)} style={{padding:'11px 13px',background:'var(--surface2)',borderRadius:11,cursor:'pointer',display:'flex',alignItems:'center',gap:11,border:'1px solid var(--border)',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF6B00';e.currentTarget.style.background='rgba(255,107,0,0.04)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface2)'}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:cfg.bg,border:'2px solid '+cfg.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:cfg.c,flexShrink:0}}>{ini}</div>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{u.name||u.email}</div><div style={{fontSize:11,color:'var(--text3)'}}>{u.email}</div></div>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:5,background:cfg.bg,color:cfg.c,fontWeight:700}}>{cfg.e} {cfg.l}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'@

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DONE! Restart frontend to see changes" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
