# BizPrint Setup Script - Production Tab + Delivery Tracking
# Run: .\bizprint-setup.ps1

$BACKEND  = "C:\Users\User\projects\bizprint\backend\src"
$ADMIN    = "C:\Users\User\projects\bizprint\frontend\app\admin\workflow\components"
$DASH     = "C:\Users\User\projects\bizprint\frontend\app\dashboard"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Setup: Production + Delivery" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# 1. BACKEND - production-job.entity.ts
# ============================================================
Write-Host ""
Write-Host "[1/6] production-job.entity.ts" -ForegroundColor Yellow

Write-File "$BACKEND\production-jobs\production-job.entity.ts" @"
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/order.entity'

export enum ProductionJobStatus {
  PENDING     = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
}

@Entity()
export class ProductionJob {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'enum', enum: ProductionJobStatus, default: ProductionJobStatus.PENDING })
  status: ProductionJobStatus

  @Column({ nullable: true })
  notes: string

  @ManyToOne(() => Order, { nullable: true, eager: true })
  order: Order

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
"@

# ============================================================
# 2. BACKEND - production-jobs.service.ts
# ============================================================
Write-Host "[2/6] production-jobs.service.ts" -ForegroundColor Yellow

Write-File "$BACKEND\production-jobs\production-jobs.service.ts" @"
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob, ProductionJobStatus } from './production-job.entity'

@Injectable()
export class ProductionJobsService {
  constructor(
    @InjectRepository(ProductionJob)
    private repo: Repository<ProductionJob>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['order', 'order.user'],
      order: { created_at: 'DESC' },
    })
  }

  async updateStatus(id: number, status: ProductionJobStatus) {
    const job = await this.repo.findOne({ where: { id }, relations: ['order'] })
    if (!job) throw new NotFoundException('Job not found')
    job.status = status
    return this.repo.save(job)
  }

  async createFromOrder(orderId: number) {
    const job = this.repo.create({ order: { id: orderId } as any })
    return this.repo.save(job)
  }
}
"@

# ============================================================
# 3. BACKEND - production-jobs.controller.ts
# ============================================================
Write-Host "[3/6] production-jobs.controller.ts" -ForegroundColor Yellow

Write-File "$BACKEND\production-jobs\production-jobs.controller.ts" @"
import { Controller, Get, Patch, Post, Param, Body, ParseIntPipe } from '@nestjs/common'
import { ProductionJobsService } from './production-jobs.service'
import { ProductionJobStatus } from './production-job.entity'

@Controller('production-jobs')
export class ProductionJobsController {
  constructor(private readonly service: ProductionJobsService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ProductionJobStatus,
  ) {
    return this.service.updateStatus(id, status)
  }

  @Post('from-order/:orderId')
  createFromOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.createFromOrder(orderId)
  }
}
"@

# ============================================================
# 4. BACKEND - delivery module
# ============================================================
Write-Host "[4/6] delivery module (entity + service + controller)" -ForegroundColor Yellow

Write-File "$BACKEND\delivery\delivery.entity.ts" @"
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/order.entity'

export enum DeliveryStatus {
  ASSIGNED   = 'assigned',
  PICKED_UP  = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  DELIVERED  = 'delivered',
  FAILED     = 'failed',
}

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Order, { eager: true })
  order: Order

  @Column({ nullable: true })
  courier_id: number

  @Column({ nullable: true })
  courier_name: string

  @Column({ nullable: true })
  courier_phone: string

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.ASSIGNED })
  status: DeliveryStatus

  @Column({ nullable: true })
  address: string

  @Column({ nullable: true })
  note: string

  @Column({ nullable: true })
  estimated_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
"@

Write-File "$BACKEND\delivery\delivery.service.ts" @"
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Delivery, DeliveryStatus } from './delivery.entity'

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private repo: Repository<Delivery>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['order', 'order.user'],
      order: { created_at: 'DESC' },
    })
  }

  findByOrder(orderId: number) {
    return this.repo.findOne({
      where: { order: { id: orderId } },
      relations: ['order'],
    })
  }

  async updateStatus(id: number, status: DeliveryStatus) {
    const delivery = await this.repo.findOne({ where: { id } })
    if (!delivery) throw new NotFoundException('Delivery not found')
    delivery.status = status
    return this.repo.save(delivery)
  }

  create(data: Partial<Delivery>) {
    const delivery = this.repo.create(data)
    return this.repo.save(delivery)
  }
}
"@

Write-File "$BACKEND\delivery\delivery.controller.ts" @"
import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe } from '@nestjs/common'
import { DeliveryService } from './delivery.service'
import { DeliveryStatus } from './delivery.entity'

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.findByOrder(orderId)
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.service.updateStatus(id, status)
  }
}
"@

# ============================================================
# 5. FRONTEND - Admin components
# ============================================================
Write-Host "[5/6] Frontend admin components" -ForegroundColor Yellow

Write-File "$ADMIN\ProductionTab.tsx" @"
'use client'

import { useEffect, useState } from 'react'

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'Printing',
  completed:   'Done',
  cancelled:   'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed:   'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled:   'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function ProductionTab() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    try {
      const res = await fetch('http://localhost:4000/production-jobs', {
        headers: { Authorization: `Bearer \${localStorage.getItem('token')}` },
      })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(jobId: number, status: string) {
    await fetch(`http://localhost:4000/production-jobs/\${jobId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer \${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    })
    fetchJobs()
  }

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading...</div>
  if (jobs.length === 0) return (
    <div className="p-8 text-center text-gray-500">
      <div className="text-4xl mb-2">🏭</div>
      <p>No production jobs</p>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Production Jobs</h2>
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
          Total: {jobs.length}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-gray-500 font-mono">{job.id}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-white">#{job.order?.id ?? '-'}</span>
                  <div className="text-xs text-gray-500">{job.order?.customer_name ?? ''}</div>
                </td>
                <td className="px-4 py-3 text-gray-400">{job.order?.user?.email ?? '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {job.created_at ? new Date(job.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border \${STATUS_COLORS[job.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={job.status}
                    onChange={(e) => updateStatus(job.id, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">Printing</option>
                    <option value="completed">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
"@

Write-File "$ADMIN\DeliveryTab.tsx" @"
'use client'

import { useEffect, useState } from 'react'

const STATUS_LABELS: Record<string, string> = {
  assigned:   'Assigned',
  picked_up:  'Picked Up',
  on_the_way: 'On The Way',
  delivered:  'Delivered',
  failed:     'Failed',
}

const STATUS_COLORS: Record<string, string> = {
  assigned:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  picked_up:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  on_the_way: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered:  'bg-green-500/20 text-green-400 border-green-500/30',
  failed:     'bg-red-500/20 text-red-400 border-red-500/30',
}

const STEPS = ['assigned', 'picked_up', 'on_the_way', 'delivered']

export default function DeliveryTab() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => { fetchDeliveries() }, [])

  async function fetchDeliveries() {
    try {
      const res = await fetch('http://localhost:4000/delivery', {
        headers: { Authorization: `Bearer \${localStorage.getItem('token')}` },
      })
      const data = await res.json()
      setDeliveries(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`http://localhost:4000/delivery/\${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer \${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    })
    fetchDeliveries()
    setSelected(null)
  }

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading...</div>
  if (deliveries.length === 0) return (
    <div className="p-8 text-center text-gray-500">
      <div className="text-4xl mb-2">🚚</div>
      <p>No deliveries</p>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Deliveries</h2>
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">Total: {deliveries.length}</span>
      </div>
      <div className="grid gap-3">
        {deliveries.map((d) => (
          <div
            key={d.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/40 transition-all cursor-pointer"
            onClick={() => setSelected(d.id === selected?.id ? null : d)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono text-sm">#{d.id}</span>
                <span className="text-white font-medium">Order #{d.order?.id ?? '-'}</span>
                {d.courier_name && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {d.courier_name}
                  </span>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border \${STATUS_COLORS[d.status] ?? ''}`}>
                {STATUS_LABELS[d.status] ?? d.status}
              </span>
            </div>

            <div className="mt-3 flex items-center">
              {STEPS.map((step, i) => {
                const currentIndex = STEPS.indexOf(d.status)
                const isDone = i <= currentIndex
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-1.5 flex-1 rounded-full transition-all \${isDone ? 'bg-purple-500' : 'bg-white/10'}`} />
                    {i < STEPS.length - 1 && (
                      <div className={`w-2 h-2 rounded-full mx-0.5 \${isDone ? 'bg-purple-500' : 'bg-white/10'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {selected?.id === d.id && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="text-gray-300">{d.address ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Phone</p>
                    <p className="text-gray-300">{d.courier_phone ?? '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={(e) => { e.stopPropagation(); updateStatus(d.id, key) }}
                      disabled={d.status === key}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all \${
                        d.status === key
                          ? 'bg-purple-600 text-white cursor-default'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
"@

# ============================================================
# 6. FRONTEND - Customer delivery tracking page
# ============================================================
Write-Host "[6/6] Customer delivery tracking page" -ForegroundColor Yellow

Write-File "$DASH\delivery\page.tsx" @"
'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  { key: 'assigned',   label: 'Assigned',   icon: '📋' },
  { key: 'picked_up',  label: 'Picked Up',  icon: '📦' },
  { key: 'on_the_way', label: 'On The Way', icon: '🚚' },
  { key: 'delivered',  label: 'Delivered',  icon: '✅' },
]

export default function CustomerDeliveryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:4000/delivery', {
      headers: { Authorization: `Bearer \${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((d) => setDeliveries(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
      Loading...
    </div>
  )

  if (deliveries.length === 0) return (
    <div className="text-center py-20 text-gray-500">
      <div className="text-5xl mb-3">🚚</div>
      <p>No deliveries found</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">My Deliveries</h1>

      {deliveries.map((d) => {
        const currentIndex = STEPS.findIndex((s) => s.key === d.status)
        return (
          <div key={d.id} className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="text-white font-bold text-lg">#{d.order?.id ?? '-'}</p>
              </div>
              {d.courier_name && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Courier</p>
                  <p className="text-white">{d.courier_name}</p>
                  {d.courier_phone && (
                    <a href={`tel:\${d.courier_phone}`} className="text-purple-400 text-sm hover:underline">
                      {d.courier_phone}
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center justify-between relative z-10">
                {STEPS.map((step, i) => {
                  const isDone = i <= currentIndex
                  const isCurrent = i === currentIndex
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all \${
                        isDone ? 'bg-purple-600 shadow-lg shadow-purple-500/30' : 'bg-white/10'
                      } \${isCurrent ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0f0f1a]' : ''}`}>
                        {step.icon}
                      </div>
                      <span className={`text-xs text-center \${isDone ? 'text-purple-300' : 'text-gray-600'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/10 -z-0">
                <div
                  className="h-full bg-purple-600 transition-all duration-500"
                  style={{ width: `\${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
                />
              </div>
            </div>

            {d.address && (
              <div className="bg-white/5 rounded-xl px-4 py-3 text-sm text-gray-300">
                {d.address}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
"@

# ============================================================
# DONE
# ============================================================
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  ALL FILES CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files created:" -ForegroundColor White
Write-Host "  [backend]  production-jobs/production-job.entity.ts" -ForegroundColor Gray
Write-Host "  [backend]  production-jobs/production-jobs.service.ts" -ForegroundColor Gray
Write-Host "  [backend]  production-jobs/production-jobs.controller.ts" -ForegroundColor Gray
Write-Host "  [backend]  delivery/delivery.entity.ts" -ForegroundColor Gray
Write-Host "  [backend]  delivery/delivery.service.ts" -ForegroundColor Gray
Write-Host "  [backend]  delivery/delivery.controller.ts" -ForegroundColor Gray
Write-Host "  [frontend] admin/workflow/components/ProductionTab.tsx" -ForegroundColor Gray
Write-Host "  [frontend] admin/workflow/components/DeliveryTab.tsx" -ForegroundColor Gray
Write-Host "  [frontend] dashboard/delivery/page.tsx" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart backend  ->  npm run start:dev" -ForegroundColor White
Write-Host "  2. Add ProductionTab + DeliveryTab to /admin/workflow/page.tsx" -ForegroundColor White
Write-Host "  3. Add delivery link to dashboard sidebar -> /dashboard/delivery" -ForegroundColor White
Write-Host ""
