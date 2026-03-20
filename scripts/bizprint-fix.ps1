# BizPrint Fix Script
# Run: .\bizprint-fix.ps1

$SRC = "C:\Users\User\projects\bizprint\backend\src"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Error Fix" -ForegroundColor Cyan
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
# FIX 1: admin.service.ts - usersRepo -> userRepo
# ============================================================
Write-Host ""
Write-Host "[1/3] Fix admin.service.ts (usersRepo -> userRepo)" -ForegroundColor Yellow

$adminPath = "$SRC\admin\admin.service.ts"
$adminContent = [System.IO.File]::ReadAllText($adminPath, [System.Text.Encoding]::UTF8)
$adminFixed = $adminContent -replace 'this\.usersRepo', 'this.userRepo'
[System.IO.File]::WriteAllText($adminPath, $adminFixed, [System.Text.Encoding]::UTF8)
Write-Host "  [OK] $adminPath" -ForegroundColor Green

# ============================================================
# FIX 2: delivery.entity.ts - correct order.entity path
# ============================================================
Write-Host "[2/3] Fix delivery.entity.ts (order import path)" -ForegroundColor Yellow

Write-File "$SRC\delivery\delivery.entity.ts" @"
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/entities/order.entity'

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

# ============================================================
# FIX 3: production-job.entity.ts - correct order.entity path
# ============================================================
Write-Host "[3/3] Fix production-job.entity.ts (order import path)" -ForegroundColor Yellow

Write-File "$SRC\production-jobs\production-job.entity.ts" @"
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm'
import { Order } from '../orders/entities/order.entity'

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
# DONE
# ============================================================
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  ALL FIXES APPLIED!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fixed:" -ForegroundColor White
Write-Host "  admin.service.ts     usersRepo -> userRepo" -ForegroundColor Gray
Write-Host "  delivery.entity.ts   import path fixed" -ForegroundColor Gray
Write-Host "  production-job.entity.ts  import path fixed" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend should auto-recompile now." -ForegroundColor Yellow
Write-Host ""
