"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { num } from "@/lib/format"
import { cn } from "@/lib/utils"
import { FilterSelect } from "./bits"

export const PAGE_SIZES = [10, 25, 50, 100]

/** page numbers with ellipsis: 1 … 4 5 6 … 12 */
function pagesFor(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i)
  const set = new Set([0, count - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < count))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | "…")[] = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push("…")
    out.push(p)
  })
  return out
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  unit = "รายการ",
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  onPageSize: (n: number) => void
  unit?: string
}) {
  const count = Math.max(1, Math.ceil(total / pageSize))
  const from = total ? page * pageSize + 1 : 0
  const to = Math.min((page + 1) * pageSize, total)
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>แสดง</span>
        <FilterSelect
          value={String(pageSize)}
          onChange={(v) => {
            onPageSize(Number(v))
            onPage(0)
          }}
          className="min-w-20"
          options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n}` }))}
        />
        <span>
          ต่อหน้า · {num(from)}–{num(to)} จาก {num(total)} {unit}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="outline" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="หน้าก่อนหน้า">
          <ChevronLeft />
        </Button>
        {pagesFor(page, count).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn("h-7 min-w-7 rounded-md px-2 text-xs tabular-nums transition", p === page ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted hover:text-foreground")}
            >
              {p + 1}
            </button>
          ),
        )}
        <Button size="icon-sm" variant="outline" disabled={page >= count - 1} onClick={() => onPage(page + 1)} aria-label="หน้าถัดไป">
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
