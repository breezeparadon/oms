"use client"

import * as React from "react"
import Link from "next/link"
import { PackageCheck, AlertTriangle, Bell, MessageCircle, PackageX, PlugZap, RotateCcw, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NOW, SHOPS, customerById, messagePreview, orderTotal, userById } from "@/lib/mock-data"
import { ago, baht } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PlatformDot } from "./bits"
import { useOms } from "./store"
import { useCrmLinks, useCrmOnly } from "./crm-mode"

type Noti = {
  id: string
  icon: React.ReactNode
  tone: string
  title: string
  body: string
  at: number
  href: string
  kind: "order" | "chat" | "alert"
}

export function Notifications() {
  const { orders, conversations, products, reserved, returns, customers, me } = useOms()
  const crm = useCrmOnly()
  const links = useCrmLinks()
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<"all" | Noti["kind"]>("all")
  const [read, setRead] = React.useState<Set<string>>(new Set())

  const items = React.useMemo<Noti[]>(() => {
    const list: Noti[] = []
    // Risk: blacklisted customer COD
    for (const o of orders) {
      const c = customers.find((x) => x.id === o.customerId)
      if (o.status === "to_process" && o.payment === "cod" && c?.blacklisted)
        list.push({ id: `risk-${o.id}`, kind: "alert", icon: <AlertTriangle />, tone: "bg-rose-100 text-rose-600", title: `ออเดอร์เสี่ยง ${o.id}`, body: `${c.name} (บัญชีดำ) สั่ง COD ${baht(orderTotal(o))}`, at: o.createdAt, href: `/orders?status=to_process` })
    }
    // New orders (latest 6 waiting to process)
    for (const o of orders.filter((x) => x.status === "to_process").slice(0, 6))
      list.push({ id: `ord-${o.id}`, kind: "order", icon: <PlatformDot platform={o.platform} className="size-full rounded-full text-[9px]" />, tone: "", title: `ออเดอร์ใหม่ ${o.id}`, body: `${customerById(o.customerId).name} · ${baht(orderTotal(o))}`, at: o.createdAt, href: `/orders?status=to_process` })
    // Unread chats (latest 6)
    for (const c of conversations.filter((x) => x.unread > 0 && x.status !== "closed").slice(0, 6)) {
      const last = c.messages[c.messages.length - 1]
      list.push({ id: `chat-${c.id}-${c.messages.length}`, kind: "chat", icon: <PlatformDot platform={c.platform} className="size-full rounded-full text-[9px]" />, tone: "", title: `${customerById(c.customerId).name} ส่งข้อความ (${c.unread})`, body: messagePreview(last), at: last.at, href: `${links.inbox}?c=${c.id}` })
    }
    // Low / out of stock
    for (const p of products) {
      if (!p.price) continue
      const avail = p.stock.bkk + p.stock.cnx - reserved(p.sku)
      if (avail <= p.safety)
        list.push({ id: `stk-${p.sku}`, kind: "alert", icon: <PackageX />, tone: "bg-amber-100 text-amber-700", title: avail <= 0 ? "สินค้าหมดสต๊อก" : "สต๊อกใกล้หมด", body: `${p.name} — ${avail <= 0 ? "หมด" : `เหลือ ${avail}`}`, at: NOW - 20 * 60_000, href: "/inventory" })
    }
    // Warehouse: new hand-off rounds from sales (only for roles that pack)
    if (me.role === "warehouse" || me.role === "owner") {
      const rounds = new Map<string, { by: string; at: number; n: number }>()
      for (const o of orders) if (o.status === "to_pack" && o.handoff) {
        const r = rounds.get(o.handoff.batch) ?? { by: o.handoff.by, at: o.handoff.at, n: 0 }
        r.n++
        rounds.set(o.handoff.batch, r)
      }
      for (const [batch, r] of rounds)
        list.push({ id: `ho-${batch}-${r.n}`, kind: "order", icon: <PackageCheck />, tone: "bg-orange-100 text-orange-700", title: `งานส่งคลัง ${batch}: ${r.n} ออเดอร์รอแพ็ก`, body: `${userById(r.by)?.name ?? ""} ยืนยันแล้ว ได้เลขพัสดุแล้ว`, at: r.at, href: "/fulfillment/packing" })
    }
    // Return requests
    for (const r of returns.filter((x) => x.status === "requested"))
      list.push({ id: `rt-${r.id}`, kind: "alert", icon: <RotateCcw />, tone: "bg-fuchsia-100 text-fuchsia-700", title: `คำขอคืนสินค้า ${r.id}`, body: `${r.orderId} · ${r.reason}`, at: r.createdAt, href: "/returns" })
    // Expiring channel tokens
    for (const s of SHOPS.filter((x) => x.tokenExpiresInDays <= 7))
      list.push({ id: `tok-${s.id}`, kind: "alert", icon: <PlugZap />, tone: "bg-sky-100 text-sky-700", title: "การเชื่อมต่อใกล้หมดอายุ", body: `${s.name} — เหลือ ${s.tokenExpiresInDays} วัน`, at: NOW - 3 * 3600_000, href: links.channels })
    // CRM-only edition: no order / stock / return data — keep chats and connection alerts
    return list.filter((n) => !crm || n.kind === "chat" || n.id.startsWith("tok-")).sort((a, b) => b.at - a.at)
  }, [orders, conversations, products, reserved, returns, customers, me, crm, links])

  const unread = items.filter((n) => !read.has(n.id)).length
  const shown = items.filter((n) => tab === "all" || n.kind === tab)
  const count = (k: Noti["kind"]) => items.filter((n) => n.kind === k && !read.has(n.id)).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="การแจ้งเตือน" className="relative" />}>
        <Bell />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{unread > 99 ? "99+" : unread}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,400px)] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">การแจ้งเตือน</div>
          <button className="text-xs text-primary hover:underline disabled:opacity-40" disabled={!unread} onClick={() => setRead(new Set(items.map((n) => n.id)))}>
            อ่านทั้งหมด
          </button>
        </div>
        <div className="flex gap-1 border-b px-3 py-2 text-xs">
          {(
            [
              ["all", "ทั้งหมด", unread],
              ["order", "ออเดอร์", count("order")],
              ["chat", "แชท", count("chat")],
              ["alert", "แจ้งเตือน", count("alert")],
            ] as const
          ).filter(([k]) => !crm || k !== "order").map(([k, label, n]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1", tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {k === "order" && <ShoppingCart className="size-3" />}
              {k === "chat" && <MessageCircle className="size-3" />}
              {label}
              {n > 0 && <span className="tabular-nums">{n}</span>}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {shown.map((n) => {
            const isRead = read.has(n.id)
            return (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => {
                  setRead((prev) => new Set(prev).add(n.id))
                  setOpen(false)
                }}
                className={cn("flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/60", !isRead && "bg-accent/40")}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full [&>svg]:size-4", n.tone)}>{n.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm", !isRead && "font-semibold")}>{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{ago(n.at)}</span>
                </span>
                {!isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </Link>
            )
          })}
          {shown.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
