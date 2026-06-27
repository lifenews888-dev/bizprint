'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, RefreshCw, Send, Upload, UserPlus } from 'lucide-react'
import { apiFetch } from '@/lib/api'

type EmailSummary = {
  total: number
  subscribed: number
  unsubscribed: number
  campaigns: number
  sent: number
  failed: number
}

type EmailContact = {
  id: string
  email: string
  name?: string
  company?: string
  phone?: string
  source?: string
  status?: string
  tags?: string[]
  created_at?: string
}

type EmailCampaign = {
  id: string
  name: string
  subject: string
  segment?: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  dry_run_count: number
  created_at?: string
}

const emptySummary: EmailSummary = {
  total: 0,
  subscribed: 0,
  unsubscribed: 0,
  campaigns: 0,
  sent: 0,
  failed: 0,
}

const EMAIL_TEMPLATES = [
  {
    key: 'offer',
    label: 'Санал / урамшуулал',
    subject: 'BizPrint-ийн шинэ санал',
    html: '<h2>Сайн байна уу, {{name}}</h2><p>Танд зориулсан хэвлэлийн шинэ санал бэлэн боллоо.</p><p><a href="https://bizprint.mn/shop">Дэлгүүр үзэх</a></p><p><a href="{{unsubscribe_url}}">И-мэйлээс гарах</a></p>',
  },
  {
    key: 'reorder',
    label: 'Дахин захиалга',
    subject: 'Дахин хэвлүүлэхэд бэлэн үү?',
    html: '<h2>{{company}} хэвлэлийн ажлаа үргэлжлүүлэх үү?</h2><p>Өмнөх загвар, хэмжээ, материал дээрээ хурдан шинэ захиалга үүсгэх боломжтой.</p><p><a href="https://bizprint.mn/quick-order">Шуурхай захиалах</a></p><p><a href="{{unsubscribe_url}}">И-мэйлээс гарах</a></p>',
  },
  {
    key: 'welcome',
    label: 'Шинэ хэрэглэгч',
    subject: 'BizPrint-д тавтай морил',
    html: '<h2>Тавтай морил, {{name}}</h2><p>Нэрийн хуудас, баннер, каталог, сав баглаа боодол зэрэг хэвлэлийн захиалгаа нэг дор удирдаарай.</p><p><a href="https://bizprint.mn">BizPrint нээх</a></p><p><a href="{{unsubscribe_url}}">И-мэйлээс гарах</a></p>',
  },
]

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
const areaClass = 'min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
const buttonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50'
const ghostButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50'

export default function AdminEmailMarketingPage() {
  const [summary, setSummary] = useState<EmailSummary>(emptySummary)
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const [contactForm, setContactForm] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  })
  const [csv, setCsv] = useState('email,name,company,phone\ncustomer@example.com,Customer name,Company,+976')
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    preheader: '',
    segment: 'all',
    sender_name: 'BizPrint',
    sender_email: '',
    html: '<h2>Сайн байна уу, {{name}}</h2><p>BizPrint-ийн шинэ санал танд хүрч байна.</p><p><a href="{{unsubscribe_url}}">И-мэйлээс гарах</a></p>',
  })

  const load = useCallback(async (term = '', status = '', source = '', tag = '') => {
    setLoading(true)
    const params = new URLSearchParams()
    if (term.trim()) params.set('search', term.trim())
    if (status) params.set('status', status)
    if (source) params.set('source', source)
    if (tag.trim()) params.set('tag', tag.trim())
    const query = params.toString()
    const [summaryData, contactData, campaignData] = await Promise.all([
      apiFetch<EmailSummary>('/marketing/email/summary').catch(() => emptySummary),
      apiFetch<EmailContact[]>(`/marketing/email/contacts${query ? `?${query}` : ''}`).catch(() => []),
      apiFetch<EmailCampaign[]>('/marketing/email/campaigns').catch(() => []),
    ])
    setSummary(summaryData || emptySummary)
    setContacts(Array.isArray(contactData) ? contactData : [])
    setCampaigns(Array.isArray(campaignData) ? campaignData : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const statCards = useMemo(() => [
    { label: 'Нийт контакт', value: summary.total },
    { label: 'Идэвхтэй', value: summary.subscribed },
    { label: 'Unsubscribe', value: summary.unsubscribed },
    { label: 'Campaign', value: summary.campaigns },
    { label: 'Илгээгдсэн', value: summary.sent },
    { label: 'Алдаа', value: summary.failed },
  ], [summary])

  const runAction = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key)
    setMessage('')
    try {
      const result = await action()
      setMessage(`${success}: ${JSON.stringify(result)}`)
      await load()
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Алдаа гарлаа')
    } finally {
      setBusy('')
    }
  }

  const saveContact = () => runAction(
    'contact',
    () => apiFetch('/marketing/email/contacts', { method: 'POST', body: contactForm }),
    'Контакт хадгаллаа',
  )

  const importContacts = () => runAction(
    'import',
    () => apiFetch('/marketing/email/contacts/import', { method: 'POST', body: { csv, source: 'admin_upload', tag: 'admin-import' } }),
    'Import дууслаа',
  )

  const syncUsers = () => runAction(
    'sync',
    () => apiFetch('/marketing/email/contacts/sync-users', { method: 'POST' }),
    'Бүртгэлтэй хэрэглэгчдийг sync хийлээ',
  )

  const createCampaign = () => runAction(
    'campaign',
    () => apiFetch('/marketing/email/campaigns', { method: 'POST', body: campaignForm }),
    'Campaign үүсгэлээ',
  )

  const sendCampaign = (campaign: EmailCampaign, realSend: boolean) => {
    if (realSend && !window.confirm(`${campaign.name} campaign-ийг бодитоор эхний 50 контакт руу илгээх үү?`)) return
    runAction(
      `${realSend ? 'send' : 'dry'}-${campaign.id}`,
      () => apiFetch(`/marketing/email/campaigns/${campaign.id}/send`, { method: 'POST', body: { dry_run: !realSend, limit: 50 } }),
      realSend ? 'Илгээлт эхэллээ' : 'Dry-run шалгалт дууслаа',
    )
  }

  const refreshContacts = () => load(search, statusFilter, sourceFilter, tagFilter)

  const applyTemplate = (key: string) => {
    const template = EMAIL_TEMPLATES.find(item => item.key === key)
    if (!template) return
    setCampaignForm({
      ...campaignForm,
      subject: campaignForm.subject || template.subject,
      html: template.html,
    })
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6 text-slate-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Имэйл маркетинг</h1>
          <p className="mt-1 text-sm text-slate-500">Контакт дата хадгалах, бөөнөөр import хийх, registered user sync, campaign dry-run хийх суурь.</p>
        </div>
        <button className={ghostButtonClass} onClick={refreshContacts} disabled={loading}>
          <RefreshCw size={16} />
          Шинэчлэх
        </button>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      {message && (
        <div className="mb-5 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          {message}
        </div>
      )}

      <section className="mb-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-orange-600" />
            <h2 className="font-bold">Гараар контакт нэмэх</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="email@example.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            <input className={inputClass} placeholder="Нэр" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
            <input className={inputClass} placeholder="Компани" value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} />
            <input className={inputClass} placeholder="Утас" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
          </div>
          <button className={`${buttonClass} mt-4`} onClick={saveContact} disabled={busy === 'contact'}>
            <Mail size={16} />
            Хадгалах
          </button>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-orange-600" />
              <h2 className="font-bold">CSV import</h2>
            </div>
            <button className={ghostButtonClass} onClick={syncUsers} disabled={busy === 'sync'}>
              <RefreshCw size={16} />
              Registered user sync
            </button>
          </div>
          <textarea className={`${areaClass} w-full font-mono`} value={csv} onChange={(e) => setCsv(e.target.value)} />
          <button className={`${buttonClass} mt-4`} onClick={importContacts} disabled={busy === 'import'}>
            <Upload size={16} />
            Бөөнөөр хадгалах
          </button>
        </div>
      </section>

      <section className="mb-5 rounded-md border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Send size={18} className="text-orange-600" />
          <h2 className="font-bold">Campaign үүсгэх</h2>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {EMAIL_TEMPLATES.map((template) => (
            <button key={template.key} className={ghostButtonClass} onClick={() => applyTemplate(template.key)}>
              {template.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <input className={inputClass} placeholder="Campaign нэр" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
          <input className={inputClass} placeholder="Subject" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} />
          <input className={inputClass} placeholder="Preheader" value={campaignForm.preheader} onChange={(e) => setCampaignForm({ ...campaignForm, preheader: e.target.value })} />
          <input className={inputClass} placeholder="Sender email (сонголттой)" value={campaignForm.sender_email} onChange={(e) => setCampaignForm({ ...campaignForm, sender_email: e.target.value })} />
          <input className={inputClass} placeholder="Sender name" value={campaignForm.sender_name} onChange={(e) => setCampaignForm({ ...campaignForm, sender_name: e.target.value })} />
          <select className={inputClass} value={campaignForm.segment} onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })}>
            <option value="all">Бүх subscribed контакт</option>
            <option value="registered">Бүртгүүлсэн хэрэглэгчид</option>
            <option value="manual">Гараар нэмсэн контакт</option>
            <option value="imported">CSV import контакт</option>
            <option value="tag:admin-import">admin-import tag</option>
          </select>
          <div className="text-sm text-slate-500">Variables: {'{{name}}'}, {'{{company}}'}, {'{{email}}'}, {'{{unsubscribe_url}}'}</div>
          <textarea className={`${areaClass} lg:col-span-2`} value={campaignForm.html} onChange={(e) => setCampaignForm({ ...campaignForm, html: e.target.value })} />
        </div>
        <button className={`${buttonClass} mt-4`} onClick={createCampaign} disabled={busy === 'campaign'}>
          <Send size={16} />
          Campaign хадгалах
        </button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Контактууд</h2>
            <div className="flex flex-wrap gap-2">
              <input className={inputClass} placeholder="Хайх" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Бүх төлөв</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
              <select className={inputClass} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="">Бүх эх сурвалж</option>
                <option value="manual">Manual</option>
                <option value="admin_upload">CSV import</option>
                <option value="registered_user">Registered user</option>
              </select>
              <input className={inputClass} placeholder="tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
              <button className={ghostButtonClass} onClick={refreshContacts}>Хайх</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Email</th>
                  <th>Нэр</th>
                  <th>Компани</th>
                  <th>Эх сурвалж</th>
                  <th>Tag</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-slate-50">
                    <td className="py-3 font-semibold">{contact.email}</td>
                    <td>{contact.name || '-'}</td>
                    <td>{contact.company || '-'}</td>
                    <td>{contact.source || '-'}</td>
                    <td>{contact.tags?.join(', ') || '-'}</td>
                    <td>{contact.status || '-'}</td>
                  </tr>
                ))}
                {!contacts.length && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Контакт олдсонгүй</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-bold">Campaign жагсаалт</h2>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-md border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{campaign.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{campaign.subject}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {campaign.status} · {campaign.segment || 'all'} · sent {campaign.sent_count} · failed {campaign.failed_count} · dry {campaign.dry_run_count}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                    {campaign.total_recipients}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className={ghostButtonClass} onClick={() => sendCampaign(campaign, false)} disabled={busy === `dry-${campaign.id}`}>
                    Dry-run 50
                  </button>
                  <button className={buttonClass} onClick={() => sendCampaign(campaign, true)} disabled={busy === `send-${campaign.id}`}>
                    Бодитоор 50 илгээх
                  </button>
                </div>
              </div>
            ))}
            {!campaigns.length && (
              <div className="rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                Campaign үүсээгүй байна
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
