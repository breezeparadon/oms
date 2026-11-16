"use client"

import Link from "next/link"
import { toast } from "sonner"
import { Eye, Hand, History, Lock, MessageCircle, Printer, Send, Truck } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { can, userById, type StaffUser, PAYMENT_LABEL, RAW_STATUS, orderSubtotal, orderTotal, productBySku, shopById, type Order } from "@/lib/mock-data"
import { ago, baht, dateTime, dueIn } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CopyLinkButton, PlatformBadge, Pill, ProductThumb, StatusBadge, TierBadge } from "./bits"
import { useOms } from "./store"

export function OrderSheet({ order, onOpenChange }: { order: Order | null; onOpenChange: (open: boolean) => void }) {
  const { customers, printLabels, setStatus, conversations, me, lockedBy, claimOrders, releaseOrder, presence, confirmToWarehouse } = useOms()
  const o = order
  const c = o ? customers.find((x) => x.id === o.customerId) : undefined
  const conv = o ? conversations.find((x) => x.customerId === o.customerId) : undefined
  return (
    <Sheet open={!!o} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {o && c && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {o.id} <StatusBadge status={o.status} />
                <CopyLinkButton className="ml-auto mr-6" />
              </SheetTitle>
              <SheetDescription>
                เลขออเดอร์แพลตฟอร์ม <span className="font-mono">{o.platformOrderNo}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6 text-sm">
              <WorkBanner
                lock={lockedBy(o)}
                mine={o.claimedBy === me.id}
                since={o.claimedAt}
                viewing={presence(`order:${o.id}`)?.user}
                closed={!["unpaid", "to_process", "to_pack"].includes(o.status)}
                canClaim={can(me.role, "order.claim")}
                onClaim={() => {
                  if (claimOrders([o.id]).length) toast.success(`รับงาน ${o.id} แล้ว`)
                }}
                onRelease={() => {
                  releaseOrder(o.id)
                  toast(`ปล่อยงาน ${o.id} คืนให้ทีมแล้ว`)
                }}
              />
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                <div>
                  <div className="text-xs text-muted-foreground">ช่องทาง / ร้าน</div>
                  <PlatformBadge platform={o.platform} className="mt-1" />
                  <div className="mt-0.5 text-xs">{shopById(o.shopId).name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">สถานะบนแพลตฟอร์ม (ต้นทาง)</div>
                  <div className="mt-1 font-mono text-xs">{RAW_STATUS[o.platform][o.status]}</div>
                  <div className="text-[11px] text-muted-foreground">→ แปลงเป็นสถานะกลางของ OMS</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">สั่งซื้อเมื่อ</div>
                  <div>{dateTime(o.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ต้องส่งภายใน</div>
                  <div className={dueIn(o.shipBy).urgent && ["to_process", "to_pack"].includes(o.status) ? "text-rose-600" : ""}>{dateTime(o.shipBy)}</div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">ลูกค้า</div>
                  <TierBadge tier={c.tier} />
                </div>
                <div className="rounded-lg border p-3">
                  <Link href={`/customers?id=${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">· {c.phone}</span>
                  <div className="mt-1 text-muted-foreground">
                    {c.address} {c.district} {c.province} {c.zip}
                  </div>
                  {c.blacklisted && <Pill className="mt-2 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">บัญชีดำ: {c.note}</Pill>}
                </div>
              </div>

              <div>
                <div className="mb-2 font-medium">สินค้า</div>
                <div className="divide-y rounded-lg border">
                  {o.items.map((it) => {
                    const p = productBySku(it.sku)
                    return (
                      <div key={it.sku} className="flex items-center justify-between gap-3 p-3">
                        <ProductThumb sku={it.sku} className="size-14" />
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2">{p.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div>x{it.qty}</div>
                          <div className="text-xs text-muted-foreground">{it.price ? baht(it.price * it.qty) : "ของแถม"}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 space-y-1">
                  <Row label="ยอดสินค้า" value={baht(orderSubtotal(o))} />
                  <Row label="ค่าจัดส่ง" value={baht(o.shippingFee)} />
                  <Row label="ส่วนลด" value={`-${baht(o.discount)}`} />
                  <Separator />
                  <Row label="ยอดสุทธิ" value={<span className="text-base font-semibold">{baht(orderTotal(o))}</span>} />
                  <Row label="การชำระเงิน" value={PAYMENT_LABEL[o.payment]} />
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 font-medium">
                  <Truck className="size-4" /> การจัดส่ง
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Row label="ขนส่ง" value={o.carrier} />
                  <Row label="คลัง" value={o.warehouse === "bkk" ? "คลังกรุงเทพฯ" : "คลังเชียงใหม่"} />
                  <Row label="เลขพัสดุ" value={<span className="font-mono">{o.tracking ?? "—"}</span>} />
                  <Row label="ใบปะหน้า" value={o.labelPrinted ? "พิมพ์แล้ว" : "ยังไม่พิมพ์"} />
                </div>
              </div>

              {(o.tags.length > 0 || o.note) && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {o.tags.map((t) => (
                      <Pill key={t} className="bg-muted">
                        {t}
                      </Pill>
                    ))}
                  </div>
                  {o.note && <div className="text-xs text-muted-foreground">{o.note}</div>}
                </div>
              )}

              {o.handoff && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
                  <Send className="size-4 shrink-0" />
                  <span>
                    ส่งให้คลังแล้ว รอบ <b>{o.handoff.batch}</b> โดย {userById(o.handoff.by)?.name} · {ago(o.handoff.at)}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {o.status === "to_process" && can(me.role, "order.confirm") && (
                  <Button
                    disabled={!!lockedBy(o)}
                    onClick={() => {
                      const { done, batch } = confirmToWarehouse([o.id])
                      if (done.length) toast.success(`ส่ง ${o.id} ให้คลังแพ็กแล้ว (รอบ ${batch})`, { description: "ทีมคลังได้รับแจ้งเตือนแล้ว" })
                    }}
                  >
                    <Send /> ยืนยัน &amp; ส่งให้คลัง
                  </Button>
                )}
                {o.status === "to_pack" && !o.labelPrinted && can(me.role, "order.print") && (
                  <Button
                    disabled={!!lockedBy(o) || !can(me.role, "order.print")}
                    onClick={() => {
                      if (printLabels([o.id]).length) toast.success(`พิมพ์ใบปะหน้า ${o.id} แล้ว`)
                    }}
                  >
                    <Printer /> พิมพ์ใบปะหน้า
                  </Button>
                )}
                {o.status === "to_pack" && (
                  <Button
                    variant="outline"
                    disabled={!!lockedBy(o) || !can(me.role, "order.pack")}
                    title={!can(me.role, "order.pack") ? "เฉพาะทีมคลัง/ผู้จัดการ" : undefined}
                    onClick={() => {
                      if (setStatus([o.id], "to_ship").length) toast.success("แพ็กเสร็จ รอขนส่งเข้ารับ")
                    }}
                  >
                    แพ็กเสร็จ
                  </Button>
                )}
                {conv && (
                  <Button variant="outline" render={<Link href={`/inbox?c=${conv.id}`} />}>
                    <MessageCircle /> เปิดแชทลูกค้า
                  </Button>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <History className="size-3.5" /> ประวัติการทำงาน
                </div>
                <ol className="relative space-y-3 border-l pl-4">
                  {[...(o.events ?? [])].reverse().map((e, i) => {
                    const u = userById(e.by)
                    return (
                      <li key={i} className="relative">
                        <span className={cn("absolute top-1 -left-[21px] size-2.5 rounded-full ring-2 ring-background", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                        <div className="text-sm">
                          <span className="font-medium">{u ? u.name : "ระบบ"}</span> {e.text}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{dateTime(e.at)}</div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

/** Who is working on this order — prevents two admins doing the same job */
export function WorkBanner({
  lock,
  mine,
  since,
  viewing,
  closed,
  canClaim,
  onClaim,
  onRelease,
}: {
  lock?: StaffUser
  mine: boolean
  since?: number
  viewing?: StaffUser
  closed: boolean
  canClaim: boolean
  onClaim: () => void
  onRelease: () => void
}) {
  return (
    <div className="space-y-2">
      {viewing && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <Eye className="size-3.5" /> {viewing.name} กำลังเปิดดูออเดอร์นี้อยู่
        </div>
      )}
      {!closed &&
        (lock ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <Lock className="size-4 shrink-0" />
            <span className="flex-1">
              <b>{lock.name}</b> รับงานนี้อยู่ {since ? `(${ago(since)})` : ""} — ปุ่มพิมพ์/แพ็กถูกล็อกไว้ กันทำงานซ้ำ
            </span>
          </div>
        ) : mine ? (
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs">
            <Hand className="size-4 shrink-0 text-primary" />
            <span className="flex-1">คุณรับงานนี้อยู่ — ทีมจะเห็นว่าคุณกำลังทำ</span>
            <Button size="xs" variant="ghost" onClick={onRelease}>
              ปล่อยงาน
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <span className="flex-1">ยังไม่มีใครรับงานนี้{!canClaim && " — ดูอย่างเดียว (ไม่มีสิทธิ์รับงาน)"}</span>
            {canClaim && (
              <Button size="xs" onClick={onClaim}>
                <Hand /> รับงาน
              </Button>
            )}
          </div>
        ))}
    </div>
  )
}
