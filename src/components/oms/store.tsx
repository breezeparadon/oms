"use client"

import * as React from "react"
import {
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
  adjustStock: (sku: string, wh: "bkk" | "cnx", delta: number) => void
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

  const tick = () => NOW + ++clock.current * 1000

  const reservedMap = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const o of orders) {
      if (!RESERVING.includes(o.status)) continue
      for (const it of o.items) m.set(it.sku, (m.get(it.sku) ?? 0) + it.qty)
    }
    return m
  }, [orders])

  const value: Ctx = {
    orders,
    products,
    customers,
    conversations,
    returns,
    reserved: (sku) => reservedMap.get(sku) ?? 0,
    setStatus: (ids, status) =>
      setOrders((prev) =>
        prev.map((o) => {
          if (!ids.includes(o.id)) return o
          const tracking = ["to_ship", "shipping"].includes(status) && !o.tracking ? `TH${(Number(o.id.slice(4)) * 7919 + 10000000).toString().slice(0, 8)}X` : o.tracking
          return { ...o, status, tracking, labelPrinted: o.labelPrinted || status === "to_ship" }
        }),
      ),
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
      return id
    },
    adjustStock: (sku, wh, delta) =>
      setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, stock: { ...p.stock, [wh]: Math.max(0, p.stock[wh] + delta) } } : p))),
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
