'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  className?: string
  render?: (row: T, index: number) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  searchKeys?: string[]
  searchPlaceholder?: string
  filterNode?: React.ReactNode
  emptyIcon?: string
  emptyText?: string
  onRowClick?: (row: T) => void
  loading?: boolean
}

export function AdminDataTable<T extends Record<string, any>>({
  data, columns, searchKeys, searchPlaceholder = 'Хайх...', filterNode,
  emptyIcon = '📋', emptyText = 'Мэдээлэл байхгүй', onRowClick, loading,
}: Props<T>) {
  const [search, setSearch] = useState('')

  const filtered = searchKeys && search
    ? data.filter(row =>
        searchKeys.some(key => {
          const val = row[key]
          return val && String(val).toLowerCase().includes(search.toLowerCase())
        })
      )
    : data

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Search + Filter bar */}
      {(searchKeys || filterNode) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          {searchKeys && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
          {filterNode}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-3xl mb-2">{emptyIcon}</div>
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map(col => (
                <TableHead key={col.key} className={cn('text-xs font-semibold uppercase tracking-wider text-muted-foreground', col.className)}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, idx) => (
              <TableRow
                key={(row as any).id || idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map(col => (
                  <TableCell key={col.key} className={cn('text-sm', col.className)}>
                    {col.render
                      ? col.render(row, idx)
                      : (row[col.key] ?? '—')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
