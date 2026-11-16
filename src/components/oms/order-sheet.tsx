"use client"

import Link from "next/link"
import { toast } from "sonner"
import { MessageCircle, Printer, Truck } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PAYMENT_LABEL, RAW_STATUS, orderSubtotal, orderTotal, productBySku, shopById, type Order } from "@/lib/mock-data"
import { baht, dateTime, dueIn } from "@/lib/format"
import { CopyLinkButton, PlatformBadge, Pill, ProductThumb, StatusBadge, TierBadge } from "./bits"
import { useOms } from "./store"

export function OrderSheet({ order, onOpenChange }: { order: Order | null; onOpenChange: (open: boolean) => void }) {
  const { customers, printLabels, setStatus, conversations } = useOms()
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

              <div className="flex flex-wrap gap-2">
                {["to_process", "to_pack"].includes(o.status) && (
                  <Button
                    onClick={() => {
                      printLabels([o.id])
                      toast.success(`พิมพ์ใบปะหน้า ${o.id} แล้ว`)
                    }}
                  >
                    <Printer /> พิมพ์ใบปะหน้า
                  </Button>
                )}
                {o.status === "to_pack" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatus([o.id], "to_ship")
                      toast.success("แพ็กเสร็จ รอขนส่งเข้ารับ")
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
