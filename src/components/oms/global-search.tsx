"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Boxes, MessagesSquare, RotateCcw, Search, ShoppingCart, Users, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RETURN_STATUS, orderTotal, messagePreview, productBySku } from "@/lib/mock-data"
import { baht } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PlatformDot, ProductThumb, StatusBadge, TierBadge, Pill } from "./bits"
import { useOms } from "./store"
import { useCrmLinks, useCrmOnly } from "./crm-mode"

type Hit = { key: string; href: string; node: React.ReactNode }
type Group = { id: string; label: string; icon: React.ReactNode; hits: Hit[]; total: number; moreHref?: string }

const LIMIT = 5
const norm = (s: string) => s.toLowerCase().replace(/[-\s]/g, "")

/** Bold the matched part of a string */
function Hl({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (!q || i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/15 px-0.5 font-semibold text-primary">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export function GlobalSearch() {
  const router = useRouter()
  const { orders, customers, products, conversations, returns, reserved } = useOms()
  const crm = useCrmOnly()
  const links = useCrmLinks()
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [mobile, setMobile] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)

  // "/" focuses search (works the same on Windows, macOS, Linux) unless already typing somewhere
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setMobile(true)
        setOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    }
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setMobile(false)
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onClick)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mousedown", onClick)
    }
  }, [])

  const term = q.trim()
  const nt = norm(term)
  const custMap = React.useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])

  const groups: Group[] = React.useMemo(() => {
    if (term.length < 1) return []
    const has = (s?: string) => !!s && (s.toLowerCase().includes(term.toLowerCase()) || (nt.length >= 3 && norm(s).includes(nt)))

    const o = orders.filter((x) => {
      const c = custMap.get(x.customerId)!
      return has(x.id) || has(x.platformOrderNo) || has(x.tracking) || has(c.name) || has(c.phone)
    })
    const c = customers.filter((x) => has(x.name) || has(x.phone) || has(x.email) || has(x.id) || x.identities.some((i) => has(i.handle)))
    const p = products.filter((x) => has(x.name) || has(x.sku) || has(x.brand) || has(x.category))
    const ch = conversations.filter((x) => has(custMap.get(x.customerId)!.name) || x.messages.some((m) => has(m.text)))
    const r = returns.filter((x) => has(x.id) || has(x.orderId) || has(x.reason) || has(custMap.get(orders.find((o2) => o2.id === x.orderId)?.customerId ?? "")?.name))

    return [
      {
        id: "orders",
        label: "ออเดอร์",
        icon: <ShoppingCart />,
        total: o.length,
        moreHref: `/orders?status=all&q=${encodeURIComponent(term)}`,
        hits: o.slice(0, LIMIT).map((x) => {
          const cu = custMap.get(x.customerId)!
          return {
            key: `o-${x.id}`,
            href: `/orders?status=${x.status}&open=${x.id}`,
            node: (
              <>
                <PlatformDot platform={x.platform} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    <Hl text={x.id} q={term} /> <span className="font-normal text-muted-foreground">· <Hl text={cu.name} q={term} /></span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    <Hl text={x.platformOrderNo} q={term} />
                    {x.tracking && (
                      <>
                        {" · "}
                        <Hl text={x.tracking} q={term} />
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-medium">{baht(orderTotal(x))}</div>
                  <StatusBadge status={x.status} />
                </div>
              </>
            ),
          }
        }),
      },
      {
        id: "customers",
        label: "ลูกค้า",
        icon: <Users />,
        total: c.length,
        hits: c.slice(0, LIMIT).map((x) => ({
          key: `c-${x.id}`,
          href: `${links.customers}?id=${x.id}`,
          node: (
            <>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">{x.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  <Hl text={x.name} q={term} />
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  <Hl text={x.phone} q={term} /> · {x.province}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {x.identities.map((i) => (
                  <PlatformDot key={i.platform} platform={i.platform} className="size-4 text-[7px]" />
                ))}
                <TierBadge tier={x.tier} />
              </div>
            </>
          ),
        })),
      },
      {
        id: "products",
        label: "สินค้า",
        icon: <Boxes />,
        total: p.length,
        hits: p.slice(0, LIMIT).map((x) => {
          const avail = x.stock.bkk + x.stock.cnx - reserved(x.sku)
          return {
            key: `p-${x.sku}`,
            href: `/inventory?sku=${encodeURIComponent(x.sku)}`,
            node: (
              <>
                <ProductThumb sku={x.sku} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <Hl text={x.name} q={term} />
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    <Hl text={x.sku} q={term} /> · {x.brand}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <div className="font-medium">{x.price ? baht(x.price) : "ของแถม"}</div>
                  <div className={avail <= x.safety ? "text-amber-600" : "text-muted-foreground"}>{avail <= 0 ? "หมด" : `คงเหลือ ${avail}`}</div>
                </div>
              </>
            ),
          }
        }),
      },
      {
        id: "chats",
        label: "แชท",
        icon: <MessagesSquare />,
        total: ch.length,
        hits: ch.slice(0, LIMIT).map((x) => {
          const cu = custMap.get(x.customerId)!
          const m = [...x.messages].reverse().find((mm) => has(mm.text)) ?? x.messages[x.messages.length - 1]
          return {
            key: `ch-${x.id}`,
            href: `${links.inbox}?c=${x.id}`,
            node: (
              <>
                <PlatformDot platform={x.platform} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    <Hl text={cu.name} q={term} />
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    <Hl text={messagePreview(m)} q={term} />
                  </div>
                </div>
                {x.unread > 0 && <span className="shrink-0 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{x.unread}</span>}
              </>
            ),
          }
        }),
      },
      {
        id: "returns",
        label: "คืนสินค้า",
        icon: <RotateCcw />,
        total: r.length,
        hits: r.slice(0, LIMIT).map((x) => ({
          key: `r-${x.id}`,
          href: `/returns?id=${x.id}`,
          node: (
            <>
              <ProductThumb sku={x.items[0].sku} className="size-8" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  <Hl text={x.id} q={term} /> <span className="font-normal text-muted-foreground">· <Hl text={x.reason} q={term} /></span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  <Hl text={x.orderId} q={term} /> · {productBySku(x.items[0].sku).name}
                </div>
              </div>
              <Pill className={cn("shrink-0", RETURN_STATUS[x.status].className)}>{RETURN_STATUS[x.status].label}</Pill>
            </>
          ),
        })),
      },
    ].filter((g) => g.total > 0 && (!crm || g.id === "customers" || g.id === "chats"))
  }, [term, nt, orders, customers, products, conversations, returns, custMap, reserved, crm, links])

  const flat = groups.flatMap((g) => g.hits)
  const total = groups.reduce((s, g) => s + g.total, 0)

  const go = (href: string) => {
    setOpen(false)
    setMobile(false)
    setQ("")
    inputRef.current?.blur()
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault()
      go(flat[active].href)
    } else if (e.key === "Escape") {
      setOpen(false)
      setMobile(false)
      inputRef.current?.blur()
    }
  }

  let idx = -1
  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="ค้นหา" onClick={() => { setMobile(true); setOpen(true); requestAnimationFrame(() => inputRef.current?.focus()) }}>
        <Search />
      </Button>
      <div
        ref={boxRef}
        className={cn(
          "md:relative md:block md:w-[26rem]",
          mobile ? "fixed inset-x-0 top-0 z-50 block bg-background p-2 shadow-lg md:static md:bg-transparent md:p-0 md:shadow-none" : "hidden",
        )}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={crm ? "ค้นหาลูกค้า เบอร์โทร ข้อความแชท…" : "ค้นหาออเดอร์ ลูกค้า สินค้า แชท เลขพัสดุ…"}
            className="pr-14 pl-8"
            role="combobox"
            aria-expanded={open && !!term}
            aria-controls="global-search-results"
          />
          {q ? (
            <button aria-label="ล้างคำค้นหา" onClick={() => { setQ(""); inputRef.current?.focus() }} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground md:block">/</kbd>
          )}
        </div>

        {open && term && (
          <div id="global-search-results" role="listbox" className="absolute inset-x-2 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border bg-popover p-1 text-sm shadow-xl md:inset-x-0 md:w-[34rem] md:right-0 md:left-auto">
            {groups.length === 0 ? (
              <div className="px-3 py-8 text-center text-muted-foreground">ไม่พบผลลัพธ์สำหรับ “{term}”</div>
            ) : (
              <>
                <div className="px-3 pt-2 pb-1 text-[11px] text-muted-foreground">พบ {total} รายการ</div>
                {groups.map((g) => (
                  <div key={g.id} className="py-1">
                    <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground [&_svg]:size-3.5">
                      <span className="flex items-center gap-1.5">
                        {g.icon} {g.label}
                        <span className="rounded-full bg-muted px-1.5 font-normal tabular-nums">{g.total}</span>
                      </span>
                      {g.moreHref && g.total > LIMIT && (
                        <button className="font-normal text-primary hover:underline" onClick={() => go(g.moreHref!)}>
                          ดูทั้งหมด
                        </button>
                      )}
                    </div>
                    {g.hits.map((h) => {
                      idx++
                      const i = idx
                      return (
                        <button
                          key={h.key}
                          role="option"
                          aria-selected={i === active}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(h.href)}
                          className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left", i === active ? "bg-accent" : "hover:bg-muted")}
                        >
                          {h.node}
                        </button>
                      )
                    })}
                  </div>
                ))}
                <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">↑ ↓ เลือก · Enter เปิด · Esc ปิด</div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
