'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

// Top ~120 useful icons for menu/nav context
const ICON_NAMES = [
  'Home','ShoppingCart','Package','Printer','Image','FileText','Layers','Grid3x3',
  'LayoutGrid','Tag','Tags','Star','Heart','Bookmark','Award','Gift','Zap',
  'Sparkles','Crown','Diamond','Gem','Trophy','Medal','BadgeCheck','Shield',
  'Lock','Unlock','Eye','EyeOff','Search','Filter','SlidersHorizontal',
  'Settings','Cog','Wrench','Palette','Paintbrush','Pencil','Edit3','Type',
  'Bold','Italic','AlignLeft','List','ListOrdered','Table','BarChart3','PieChart',
  'TrendingUp','Activity','Target','Crosshair','MapPin','Navigation','Compass',
  'Globe','Map','Phone','Mail','MessageCircle','MessageSquare','Send','Bell',
  'BellRing','Calendar','Clock','Timer','Alarm','Hourglass','ArrowRight',
  'ExternalLink','Link','Share2','Download','Upload','Cloud','Database',
  'Server','Cpu','Monitor','Smartphone','Tablet','Laptop','Wifi','Bluetooth',
  'Camera','Video','Music','Headphones','Mic','Volume2','Play','Pause',
  'Users','User','UserPlus','Building2','Store','Warehouse','Factory','Truck',
  'Car','Plane','Ship','Bike','CreditCard','Wallet','DollarSign','Coins',
  'Receipt','Calculator','Percent','ShoppingBag','Box','Archive','Folder',
  'FolderOpen','File','FileImage','FilePlus','Clipboard','ClipboardList',
  'CheckCircle','XCircle','AlertCircle','Info','HelpCircle','Flag',
  'Megaphone','Rocket','Flame','Sun','Moon','Leaf','TreePine','Flower',
] as const

interface Props {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return ICON_NAMES.slice(0, 60)
    const s = search.toLowerCase()
    return ICON_NAMES.filter(name => name.toLowerCase().includes(s))
  }, [search])

  const SelectedIcon = value ? (LucideIcons as any)[value] : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="h-4 w-4 text-primary" />
            <span className="text-foreground">{value}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Икон сонгох...</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 w-[320px] rounded-xl border border-border bg-card shadow-xl p-3">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Икон хайх..."
                className="pl-8 h-8 text-xs"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
              {filtered.map(name => {
                const Icon = (LucideIcons as any)[name]
                if (!Icon) return null
                const selected = value === name
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => { onChange(name); setOpen(false); setSearch('') }}
                    className={`flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors ${
                      selected ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${selected ? 'text-primary' : 'text-foreground'}`} strokeWidth={1.6} />
                  </button>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">Олдсонгүй</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Render a Lucide icon by name string */
export function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null
  const Icon = (LucideIcons as any)[name]
  if (!Icon) return <span className={className}>{name}</span>
  return <Icon className={className || 'h-4 w-4'} strokeWidth={1.6} />
}
