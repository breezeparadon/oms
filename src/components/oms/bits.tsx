"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PLATFORMS, STATUSES, TIERS, type OrderStatus, type PlatformId, type Tier } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"

export function PlatformDot({ platform, className }: { platform: PlatformId; className?: string }) {
  const p = PLATFORMS[platform]
  return (
    <span
      title={p.name}
      className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white", className)}
      style={{ backgroundColor: p.color }}
    >
      {p.short}
    </span>
  )
}

export function PlatformBadge({ platform, className }: { platform: PlatformId; className?: string }) {
  const p = PLATFORMS[platform]
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium", className)}>
      <PlatformDot platform={platform} />
      {p.name}
    </span>
  )
}

export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", className)}>{children}</span>
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUSES[status]
  return <Pill className={s.className}>{s.label}</Pill>
}

export function TierBadge({ tier }: { tier: Tier }) {
  const t = TIERS[tier]
  return <Pill className={t.className}>{t.label}</Pill>
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-end">{actions}</div>}
    </div>
  )
}

export function Kpi({ label, value, hint, icon, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; tone?: "default" | "warn" | "danger" | "good" }) {
  const toneCls = { default: "text-primary", warn: "text-amber-600 dark:text-amber-400", danger: "text-rose-600 dark:text-rose-400", good: "text-emerald-600 dark:text-emerald-400" }[tone]
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          {hint && <div className={cn("mt-1 text-xs", tone === "default" ? "text-muted-foreground" : toneCls)}>{hint}</div>}
        </div>
        {icon && <div className={cn("rounded-lg bg-accent p-2 [&_svg]:size-4", toneCls)}>{icon}</div>}
      </CardContent>
    </Card>
  )
}

export function initials(name: string) {
  return name.trim().slice(0, 1)
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FilterSelect({
  value,
  onChange,
  options,
  className,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  placeholder?: string
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onChange((v as string | null) ?? options[0].value)}>
      <SelectTrigger className={cn("min-w-36", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

import { Gift, Package } from "lucide-react"
import { productBySku } from "@/lib/mock-data"

export function ProductThumb({ sku, className }: { sku: string; className?: string }) {
  const p = productBySku(sku)
  return (
    <span className={cn("relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ring-1 ring-border", className)}>
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover" />
      ) : (
        sku.startsWith("FREE") ? <Gift className="size-1/2 text-primary" /> : <Package className="size-1/2 text-muted-foreground" />
      )}
    </span>
  )
}

import { Link2 } from "lucide-react"
import { toast } from "sonner"

/** Copies the current URL (which encodes the open item) so it can be sent to teammates */
export function CopyLinkButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      title="คัดลอกลิงก์ส่งให้ทีม"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast.success("คัดลอกลิงก์แล้ว", { description: window.location.pathname + window.location.search })
        } catch {
          toast.error("คัดลอกไม่สำเร็จ", { description: window.location.href })
        }
      }}
      className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground", className)}
    >
      <Link2 className="size-3.5" /> คัดลอกลิงก์
    </button>
  )
}
