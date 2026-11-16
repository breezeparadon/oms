"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Camera, Check, MessageCircle, PackageOpen, Quote, RotateCcw, ShoppingCart, Wallet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Kpi, PageHeader, PlatformBadge, PlatformDot, Pill, ProductThumb, TierBadge } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { PAYMENT_LABEL, RETURN_FLOW, RETURN_STATUS, RETURN_TYPE, productBySku, shopById, type ReturnCase } from "@/lib/mock-data"
import { baht, dateOnly, dateTime, num } from "@/lib/format"
import { cn } from "@/lib/utils"

const NEXT: Partial<Record<ReturnCase["status"], { to: ReturnCase["status"]; label: string }>> = {
  requested: { to: "approved", label: "อนุมัติคำขอคืน" },
  approved: { to: "in_transit", label: "ลูกค้าส่งของคืนแล้ว" },
  in_transit: { to: "received", label: "รับของคืนเข้าคลัง" },
  received: { to: "refunded", label: "คืนเงินลูกค้า" },
}

export default function ReturnsPage() {
  const { returns, orders, customers, conversations, updateReturn, adjustStock } = useOms()
  const [filter, setFilter] = React.useState<ReturnCase["status"] | "all">("all")
  const [openId, setOpenId] = React.useState<string | null>(null)
  const list = returns.filter((r) => filter === "all" || r.status === filter)
  const refunded = returns.filter((r) => r.status === "refunded").reduce((s, r) => s + r.amount, 0)

  const advance = (r: ReturnCase) => {
    const next = NEXT[r.status]
    if (!next) return
    const o = orders.find((x) => x.id === r.orderId)
    // refund_only cases skip the physical return legs
    const to = r.type === "refund_only" && r.status === "approved" ? "refunded" : next.to
    updateReturn(r.id, { status: to, returnTracking: to === "in_transit" ? `TH${r.id.slice(3)}8842R` : r.returnTracking })
    if (to === "received" && r.restock && o) {
      r.items.forEach((i) => adjustStock(i.sku, o.warehouse, i.qty))
      toast.success("รับของคืนแล้ว — คืนเข้าสต๊อกอัตโนมัติ", { description: r.items.map((i) => `${productBySku(i.sku).name.slice(0, 30)}… +${i.qty}`).join(", ") })
    } else if (to === "received") {
      toast.success("รับของคืนแล้ว — สินค้าเสียหาย ไม่คืนเข้าสต๊อก (ตัดเป็นของเสีย)")
    } else toast.success(`${r.id}: ${RETURN_STATUS[to].label}`)
  }

  const open = returns.find((r) => r.id === openId) ?? null
  const order = open ? orders.find((o) => o.id === open.orderId) : undefined
  const cust = order ? customers.find((c) => c.id === order.customerId) : undefined
  const conv = cust ? conversations.find((c) => c.customerId === cust.id) : undefined

  return (
    <div className="space-y-4">
      <PageHeader title="คืนสินค้า / คืนเงิน" description="ติดตามเคสหลังการขายจากทุกช่องทาง — คลิกที่เคสเพื่อดูสินค้า เหตุผล และหลักฐานจากลูกค้า" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="เคสทั้งหมด" value={num(returns.length)} icon={<RotateCcw />} />
        <Kpi label="รออนุมัติ" value={num(returns.filter((r) => r.status === "requested").length)} tone="warn" icon={<RotateCcw />} hint="ควรตอบภายใน 48 ชม." />
        <Kpi label="รอรับของคืน" value={num(returns.filter((r) => r.status === "in_transit" || r.status === "approved").length)} icon={<PackageOpen />} />
        <Kpi label="คืนเงินแล้ว" value={baht(refunded)} tone="danger" icon={<Wallet />} />
      </div>
      <div className="flex flex-wrap gap-1">
        {(["all", ...Object.keys(RETURN_STATUS)] as (ReturnCase["status"] | "all")[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-lg border px-3 py-1.5 text-sm", filter === s ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
            {s === "all" ? "ทั้งหมด" : RETURN_STATUS[s].label} ({s === "all" ? returns.length : returns.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>
      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เคส</TableHead>
                <TableHead>สินค้าที่ขอคืน</TableHead>
                <TableHead>เหตุผล</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="text-right">ยอดคืน</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => {
                const o = orders.find((x) => x.id === r.orderId)
                const c = o && customers.find((x) => x.id === o.customerId)
                const first = productBySku(r.items[0].sku)
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                    <TableCell>
                      <div className="font-medium">{r.id}</div>
                      <div className="text-xs text-muted-foreground">{dateOnly(r.createdAt)}</div>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <ProductThumb sku={first.sku} className="size-11" />
                          {r.items.length > 1 && <span className="absolute -right-1.5 -bottom-1.5 rounded-full bg-foreground px-1 text-[9px] font-semibold text-background">+{r.items.length - 1}</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm">{first.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.items.reduce((s, i) => s + i.qty, 0)} ชิ้น · {RETURN_TYPE[r.type]}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <div className="font-medium">{r.reason}</div>
                      <div className="truncate text-xs text-muted-foreground">“{r.detail}”</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {o && <PlatformDot platform={o.platform} />}
                        <span>{c?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{r.orderId}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{baht(r.amount)}</TableCell>
                    <TableCell>
                      <Pill className={RETURN_STATUS[r.status].className}>{RETURN_STATUS[r.status].label}</Pill>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open && order && cust && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {open.id} <Pill className={RETURN_STATUS[open.status].className}>{RETURN_STATUS[open.status].label}</Pill>
                </SheetTitle>
                <SheetDescription>
                  {RETURN_TYPE[open.type]} · ยื่นคำขอ {dateTime(open.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6 text-sm">
                {/* Progress */}
                {open.status !== "rejected" ? (
                  <div className="flex items-center">
                    {RETURN_FLOW.filter((s) => open.type !== "refund_only" || !["in_transit", "received"].includes(s)).map((s, i, arr) => {
                      const done = arr.indexOf(open.status) >= i
                      return (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1 text-center">
                            <span className={cn("flex size-6 items-center justify-center rounded-full text-[11px] font-semibold", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{done ? <Check className="size-3.5" /> : i + 1}</span>
                            <span className={cn("w-16 text-[10px] leading-tight", done ? "text-foreground" : "text-muted-foreground")}>{RETURN_STATUS[s].label}</span>
                          </div>
                          {i < arr.length - 1 && <div className={cn("mb-5 h-0.5 flex-1", arr.indexOf(open.status) > i ? "bg-primary" : "bg-muted")} />}
                        </React.Fragment>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <div className="font-medium">ปฏิเสธคำขอคืน</div>
                    <div className="text-xs">{open.rejectNote}</div>
                  </div>
                )}

                {/* Reason */}
                <div className="rounded-xl border bg-amber-50/60 p-3 dark:bg-amber-950/20">
                  <div className="text-xs text-muted-foreground">เหตุผลที่ขอคืน</div>
                  <div className="mt-0.5 text-base font-semibold">{open.reason}</div>
                  <div className="mt-2 flex gap-2 text-sm">
                    <Quote className="size-4 shrink-0 text-amber-500" />
                    <span>{open.detail}</span>
                  </div>
                  <div className="mt-1 text-right text-xs text-muted-foreground">— {cust.name}</div>
                </div>

                {/* Evidence */}
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Camera className="size-3.5" /> หลักฐานจากลูกค้า ({open.evidence} ไฟล์)
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: open.evidence }, (_, i) => {
                      const p = productBySku(open.items[i % open.items.length].sku)
                      return (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                          {p.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className={cn("size-full object-cover", i % 2 ? "scale-125 rotate-6 blur-[0.5px] brightness-90" : "-rotate-3 saturate-75")} />
                          )}
                          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">{i === open.evidence - 1 && open.evidence > 2 ? "วิดีโอแกะกล่อง" : `รูป ${i + 1}`}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">สินค้าที่ขอคืน</div>
                  <div className="divide-y rounded-lg border">
                    {open.items.map((it) => {
                      const p = productBySku(it.sku)
                      const price = order.items.find((x) => x.sku === it.sku)?.price ?? p.price
                      return (
                        <div key={it.sku} className="flex items-center gap-3 p-3">
                          <ProductThumb sku={it.sku} className="size-14" />
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2">{p.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div>x{it.qty}</div>
                            <div className="text-xs text-muted-foreground">{baht(price * it.qty)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">ยอดที่ต้องคืนลูกค้า</span>
                    <span className="text-base font-semibold">{baht(open.amount)}</span>
                  </div>
                </div>

                {/* Order + customer */}
                <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">ออเดอร์ต้นทาง</div>
                    <div className="font-medium">{order.id}</div>
                    <PlatformBadge platform={order.platform} className="mt-1" />
                    <div className="text-xs text-muted-foreground">{shopById(order.shopId).name}</div>
                    <div className="text-xs text-muted-foreground">
                      สั่งซื้อ {dateOnly(order.createdAt)} · {PAYMENT_LABEL[order.payment]}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ลูกค้า</div>
                    <div className="flex items-center gap-1.5 font-medium">
                      {cust.name} <TierBadge tier={cust.tier} />
                    </div>
                    <div className="text-xs text-muted-foreground">{cust.phone}</div>
                    {open.returnTracking && (
                      <div className="mt-1 text-xs">
                        เลขพัสดุส่งคืน <span className="font-mono">{open.returnTracking}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Restock */}
                {open.type !== "refund_only" && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="restock">คืนเข้าสต๊อกเมื่อรับของ</Label>
                      <div className="text-xs text-muted-foreground">{open.restock ? "สภาพดี ขายต่อได้" : "สินค้าเสียหาย/เปิดใช้แล้ว → ตัดเป็นของเสีย"}</div>
                    </div>
                    <Switch id="restock" checked={open.restock} disabled={["received", "refunded", "rejected"].includes(open.status)} onCheckedChange={(v) => updateReturn(open.id, { restock: v })} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {NEXT[open.status] && (
                    <Button onClick={() => advance(open)}>
                      <Check /> {open.type === "refund_only" && open.status === "approved" ? "คืนเงินลูกค้า" : NEXT[open.status]!.label}
                    </Button>
                  )}
                  {open.status === "requested" && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateReturn(open.id, { status: "rejected", rejectNote: "ตรวจสอบหลักฐานแล้วไม่ตรงเงื่อนไขการรับคืน" })
                        toast(`${open.id}: ปฏิเสธคำขอคืน`)
                      }}
                    >
                      <X /> ปฏิเสธ
                    </Button>
                  )}
                  {conv && (
                    <Button variant="outline" render={<Link href={`/inbox?c=${conv.id}`} />}>
                      <MessageCircle /> แชทกับลูกค้า
                    </Button>
                  )}
                  <Button variant="outline" render={<Link href={`/orders?status=${order.status}`} />}>
                    <ShoppingCart /> ดูออเดอร์
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
