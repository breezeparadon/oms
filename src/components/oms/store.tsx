"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  PLATFORMS,
  CUSTOMERS_PER_PLATFORM,
  SHOPS,
  primaryPlatform,
  type PlatformId,
  CUSTOMERS,
  DAY,
  INITIAL_CONVERSATIONS,
  INITIAL_ORDERS,
  INITIAL_RETURNS,
  NOW,
  PRODUCTS,
  type ChatMessage,
  type Conversation,
  type Customer,
  type Order,
  type OrderStatus,
  type Product,
  type ReturnCase,
} from "@/lib/mock-data"

// Statuses whose items are still reserved from stock (not yet left the warehouse)
export const RESERVING: OrderStatus[] = ["unpaid", "to_process", "to_pack"]
export const OPEN_STATUSES: OrderStatus[] = ["unpaid", "to_process", "to_pack", "to_ship"]

export const SHIPPED: OrderStatus[] = ["to_ship", "shipping", "delivered"]

// ---------- Stock ledger ----------
export type MovementKind = "sale" | "cancel" | "ship" | "adjust" | "return"
export type Movement = {
  id: string
  at: number
  sku: string
  kind: MovementKind
  /** effect on "available to sell" (what every channel shows) */
  availDelta: number
  /** effect on physical on-hand stock */
  onHandDelta: number
  availAfter?: number
  ref?: string
  platform?: PlatformId
  synced?: PlatformId[]
}
export const MOVEMENT_LABEL: Record<MovementKind, string> = {
  sale: "ขาย (กันสต๊อก)",
  cancel: "ยกเลิก (คืนสต๊อก)",
  ship: "แพ็กเสร็จ ตัดออกจากคลัง",
  adjust: "ปรับสต๊อก",
  return: "รับคืนเข้าสต๊อก",
}

function seedMovements(): Movement[] {
  const out: Movement[] = []
  const recent = [...INITIAL_ORDERS].filter((o) => o.createdAt > NOW - 4 * DAY).sort((a, b) => a.createdAt - b.createdAt)
  for (const o of recent)
    for (const it of o.items) {
      out.push({ id: `seed-${o.id}-${it.sku}`, at: o.createdAt, sku: it.sku, kind: "sale", availDelta: -it.qty, onHandDelta: 0, ref: o.id, platform: o.platform, synced: listingChannels(it.sku, o.platform) })
      if (SHIPPED.includes(o.status)) out.push({ id: `seed-${o.id}-${it.sku}-s`, at: o.createdAt + 6 * 3600_000, sku: it.sku, kind: "ship", availDelta: 0, onHandDelta: -it.qty, ref: o.id })
    }
  return out.sort((a, b) => b.at - a.at)
}

/** channels (other than the source) that get the new quantity pushed */
function listingChannels(sku: string, except?: PlatformId): PlatformId[] {
  const p = PRODUCTS.find((x) => x.sku === sku)
  return (Object.keys(p?.listings ?? {}) as PlatformId[]).filter((pl) => pl !== except)
}

export type MergeCheck = { ok: true } | { ok: false; reason: string }

export function canMerge(orders: Order[]): MergeCheck {
  if (orders.length < 2) return { ok: false, reason: "ต้องเลือกอย่างน้อย 2 ออเดอร์" }
  const [a] = orders
  if (orders.some((o) => o.customerId !== a.customerId)) return { ok: false, reason: "ผู้ซื้อคนละคน / ที่อยู่ต่างกัน" }
  if (orders.some((o) => o.shopId !== a.shopId)) return { ok: false, reason: "อยู่คนละร้าน/คนละแพลตฟอร์ม (ใบปะหน้าออกจากแพลตฟอร์มคนละที่)" }
  if (orders.some((o) => o.status !== "to_process")) return { ok: false, reason: "มีออเดอร์ที่ไม่ได้อยู่สถานะ “รอจัดการ”" }
  if (orders.some((o) => o.payment !== a.payment)) return { ok: false, reason: "วิธีชำระเงินต่างกัน (COD กับ ชำระแล้ว รวมไม่ได้)" }
  if (orders.some((o) => o.warehouse !== a.warehouse)) return { ok: false, reason: "ตัดสต๊อกจากคนละคลัง" }
  return { ok: true }
}

type Ctx = {
  orders: Order[]
  products: Product[]
  customers: Customer[]
  conversations: Conversation[]
  returns: ReturnCase[]
  setStatus: (ids: string[], status: OrderStatus) => void
  printLabels: (ids: string[]) => void
  mergeOrders: (ids: string[]) => string | null
  addOrder: (o: Omit<Order, "id">) => string
  adjustStock: (sku: string, wh: "bkk" | "cnx", delta: number, reason?: { kind?: "adjust" | "return"; ref?: string }) => void
  movements: Movement[]
  available: (sku: string) => number
  simulateSale: (sku: string, platform: PlatformId) => string
  syncListing: (sku: string) => void
  reserved: (sku: string) => number
  sendMessage: (convId: string, text: string, from?: ChatMessage["from"], extra?: Pick<ChatMessage, "product" | "coupon">) => void
  updateConversation: (convId: string, patch: Partial<Conversation>) => void
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  updateReturn: (id: string, patch: Partial<ReturnCase>) => void
}

const OmsContext = React.createContext<Ctx | null>(null)

export function OmsProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = React.useState<Order[]>(INITIAL_ORDERS)
  const [products, setProducts] = React.useState<Product[]>(PRODUCTS)
  const [customers, setCustomers] = React.useState<Customer[]>(CUSTOMERS)
  const [conversations, setConversations] = React.useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [returns, setReturns] = React.useState<ReturnCase[]>(INITIAL_RETURNS)
  const seq = React.useRef(INITIAL_ORDERS.length + 1)
  const clock = React.useRef(0) // monotonic offset so new items sort after seed data

  const [movements, setMovements] = React.useState<Movement[]>(seedMovements)
  const tick = () => NOW + ++clock.current * 1000

  const reservedMap = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const o of orders) {
      if (!RESERVING.includes(o.status)) continue
      for (const it of o.items) m.set(it.sku, (m.get(it.sku) ?? 0) + it.qty)
    }
    return m
  }, [orders])

  const availNow = (sku: string, prods = products, res = reservedMap) => {
    const p = prods.find((x) => x.sku === sku)
    return p ? p.stock.bkk + p.stock.cnx - (res.get(sku) ?? 0) : 0
  }

  /** Record stock movements and "push" the new available qty to every listed channel */
  const record = (entries: Omit<Movement, "id" | "at" | "synced" | "availAfter">[], silent = false) => {
    if (!entries.length) return
    const at = tick()
    const avail = new Map<string, number>()
    const rows: Movement[] = entries.map((e, i) => {
      const before = avail.get(e.sku) ?? availNow(e.sku)
      const after = before + e.availDelta
      avail.set(e.sku, after)
      return { ...e, id: `mv-${at}-${i}`, at, availAfter: after, synced: e.availDelta !== 0 ? listingChannels(e.sku, e.platform) : undefined }
    })
    setMovements((prev) => [...rows.reverse(), ...prev])
    // mark listings as synced
    const touched = new Set(rows.filter((r) => r.availDelta !== 0).map((r) => r.sku))
    if (touched.size)
      setProducts((prev) =>
        prev.map((p) => (touched.has(p.sku) ? { ...p, listings: Object.fromEntries(Object.entries(p.listings).map(([k, v]) => [k, { ...v!, synced: true }])) } : p)),
      )
    if (silent || !touched.size) return
    const lines = [...touched].map((sku) => {
      const first = rows.find((r) => r.sku === sku)!
      const before = first.availAfter! - first.availDelta
      const p = products.find((x) => x.sku === sku)!
      return `${p.name.split(" ").slice(0, 3).join(" ")}: ${before} → ${avail.get(sku)}`
    })
    const chans = [...new Set(rows.flatMap((r) => r.synced ?? []))].map((pl) => PLATFORMS[pl].name)
    toast("🔄 ซิงค์สต๊อกทุกช่องทางแล้ว", { description: `${lines.slice(0, 3).join(" · ")}${lines.length > 3 ? ` +${lines.length - 3}` : ""}\nอัปเดตไป ${chans.join(", ")}` })
  }

  const applyStatus = (ids: string[], status: OrderStatus, base = orders) => {
    const moves: Omit<Movement, "id" | "at" | "synced" | "availAfter">[] = []
    const ship: { sku: string; wh: "bkk" | "cnx"; qty: number }[] = []
    for (const o of base) {
      if (!ids.includes(o.id) || o.status === status) continue
      const wasReserving = RESERVING.includes(o.status)
      for (const it of o.items) {
        if (wasReserving && SHIPPED.includes(status)) {
          // left the warehouse: reserved → physically deducted (available unchanged)
          ship.push({ sku: it.sku, wh: o.warehouse, qty: it.qty })
          moves.push({ sku: it.sku, kind: "ship", availDelta: 0, onHandDelta: -it.qty, ref: o.id })
        } else if (wasReserving && status === "cancelled") {
          moves.push({ sku: it.sku, kind: "cancel", availDelta: it.qty, onHandDelta: 0, ref: o.id, platform: o.platform })
        } else if (!wasReserving && !SHIPPED.includes(o.status) && RESERVING.includes(status)) {
          moves.push({ sku: it.sku, kind: "sale", availDelta: -it.qty, onHandDelta: 0, ref: o.id, platform: o.platform })
        }
      }
    }
    if (ship.length)
      setProducts((prev) =>
        prev.map((p) => {
          const mine = ship.filter((x) => x.sku === p.sku)
          if (!mine.length) return p
          const stock = { ...p.stock }
          for (const m of mine) stock[m.wh] = Math.max(0, stock[m.wh] - m.qty)
          return { ...p, stock }
        }),
      )
    record(moves)
  }

  const value: Ctx = {
    movements,
    available: (sku) => availNow(sku),
    orders,
    products,
    customers,
    conversations,
    returns,
    reserved: (sku) => reservedMap.get(sku) ?? 0,
    setStatus: (ids, status) => {
      applyStatus(ids, status)
      setOrders((prev) =>
        prev.map((o) => {
          if (!ids.includes(o.id)) return o
          const tracking = ["to_ship", "shipping"].includes(status) && !o.tracking ? `TH${(Number(o.id.slice(4)) * 7919 + 10000000).toString().slice(0, 8)}X` : o.tracking
          return { ...o, status, tracking, labelPrinted: o.labelPrinted || status === "to_ship" }
        }),
      )
    },
    printLabels: (ids) =>
      setOrders((prev) =>
        prev.map((o) =>
          ids.includes(o.id)
            ? {
                ...o,
                labelPrinted: true,
                status: o.status === "to_process" ? "to_pack" : o.status,
                tracking: o.tracking ?? `TH${(Number(o.id.slice(4)) * 7919 + 10000000).toString().slice(0, 8)}P`,
              }
            : o,
        ),
      ),
    mergeOrders: (ids) => {
      const group = orders.filter((o) => ids.includes(o.id))
      if (!canMerge(group).ok) return null
      const [base, ...others] = [...group].sort((a, b) => a.createdAt - b.createdAt)
      const items = new Map<string, { sku: string; qty: number; price: number }>()
      for (const o of group) for (const it of o.items) {
        const cur = items.get(it.sku)
        items.set(it.sku, cur ? { ...cur, qty: cur.qty + it.qty } : { ...it })
      }
      const merged: Order = {
        ...base,
        items: [...items.values()],
        shippingFee: Math.max(...group.map((o) => o.shippingFee)),
        discount: group.reduce((s, o) => s + o.discount, 0),
        mergedFrom: group.map((o) => o.id),
        tags: [...new Set([...group.flatMap((o) => o.tags), "รวมออเดอร์"])],
        note: `รวมจาก ${group.map((o) => o.platformOrderNo).join(", ")}`,
      }
      setOrders((prev) => [merged, ...prev.filter((o) => !ids.includes(o.id))].sort((a, b) => b.createdAt - a.createdAt))
      void others
      return merged.id
    },
    addOrder: (o) => {
      const id = `OMS-${String(seq.current++).padStart(5, "0")}`
      const createdAt = tick()
      setOrders((prev) => [{ ...o, id, createdAt, shipBy: createdAt + 2 * DAY }, ...prev])
      if (RESERVING.includes(o.status)) record(o.items.map((it) => ({ sku: it.sku, kind: "sale" as const, availDelta: -it.qty, onHandDelta: 0, ref: id, platform: o.platform })))
      return id
    },
    simulateSale: (sku, platform) => {
      const p = products.find((x) => x.sku === sku)!
      const buyers = customers.filter((c) => primaryPlatform(c) === platform)
      const buyer = buyers[(seq.current * 7) % Math.max(1, buyers.length || CUSTOMERS_PER_PLATFORM)] ?? customers[0]
      const shop = SHOPS.find((s) => s.platform === platform)!
      const id = `OMS-${String(seq.current++).padStart(5, "0")}`
      const createdAt = tick()
      const order: Order = {
        id,
        platformOrderNo: `${PLATFORMS[platform].short}${String(createdAt).slice(-9)}`,
        platform,
        shopId: shop.id,
        customerId: buyer.id,
        items: [{ sku, qty: 1, price: p.price }],
        shippingFee: 0,
        discount: 0,
        payment: "prepaid",
        status: "to_process",
        carrier: platform === "lazada" ? "LEX TH" : platform === "shopee" ? "SPX Express" : "J&T Express",
        labelPrinted: false,
        createdAt,
        shipBy: createdAt + 2 * DAY,
        tags: ["ออเดอร์ใหม่ (จำลอง)"],
        warehouse: "bkk",
      }
      setOrders((prev) => [order, ...prev])
      toast.success(`🛒 ออเดอร์ใหม่จาก ${PLATFORMS[platform].name}: ${id}`, { description: `${p.name.slice(0, 40)}… x1 — ดึงเข้า OMS อัตโนมัติ` })
      record([{ sku, kind: "sale", availDelta: -1, onHandDelta: 0, ref: id, platform }])
      return id
    },
    adjustStock: (sku, wh, delta, reason) => {
      const p = products.find((x) => x.sku === sku)
      const real = p ? Math.max(0, p.stock[wh] + delta) - p.stock[wh] : delta
      setProducts((prev) => prev.map((x) => (x.sku === sku ? { ...x, stock: { ...x.stock, [wh]: Math.max(0, x.stock[wh] + delta) } } : x)))
      record([{ sku, kind: reason?.kind ?? "adjust", availDelta: real, onHandDelta: real, ref: reason?.ref }])
    },
    syncListing: (sku) =>
      setProducts((prev) =>
        prev.map((p) =>
          p.sku === sku
            ? { ...p, listings: Object.fromEntries(Object.entries(p.listings).map(([k, v]) => [k, { ...v!, synced: true }])) }
            : p,
        ),
      ),
    sendMessage: (convId, text, from = "agent", extra) =>
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                unread: 0,
                status: from === "agent" ? "pending" : c.status,
                messages: [...c.messages, { id: `new-${clock.current}`, from, text, at: tick(), agent: from === "agent" ? (c.assignee ?? "คุณ (แอดมิน)") : undefined, ...extra }],
              }
            : c,
        ),
      ),
    updateConversation: (convId, patch) => setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, ...patch } : c))),
    updateCustomer: (id, patch) => setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    updateReturn: (id, patch) => setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
  }

  return <OmsContext.Provider value={value}>{children}</OmsContext.Provider>
}

export function useOms() {
  const ctx = React.useContext(OmsContext)
  if (!ctx) throw new Error("useOms must be used inside OmsProvider")
  return ctx
}
