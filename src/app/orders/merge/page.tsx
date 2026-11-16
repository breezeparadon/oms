"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckCircle2, Combine, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PageHeader, PlatformBadge, Pill, ProductThumb } from "@/components/oms/bits"
import { canMerge, useOms } from "@/components/oms/store"
import { PAYMENT_LABEL, orderTotal, productBySku, shopById } from "@/lib/mock-data"
import { baht, dateTime } from "@/lib/format"

export default function MergePage() {
  const { orders, customers, mergeOrders } = useOms()
  const [auto, setAuto] = React.useState(false)

  const groups = React.useMemo(() => {
    const m = new Map<string, typeof orders>()
    for (const o of orders) {
      if (o.status !== "to_process") continue
      const k = `${o.customerId}|${o.shopId}`
      m.set(k, [...(m.get(k) ?? []), o])
    }
    return [...m.values()].filter((g) => g.length > 1)
  }, [orders])

  const mergeable = groups.filter((g) => canMerge(g).ok)

  return (
    <div className="space-y-4">
      <PageHeader
        title="รวมออเดอร์"
        description="ระบบค้นหาออเดอร์ของลูกค้าคนเดียวกัน ร้านเดียวกัน ที่ยังไม่แพ็ก เพื่อรวมเป็นพัสดุเดียว — ลดค่าส่งและจำนวนกล่อง"
        actions={
          <Button
            disabled={mergeable.length === 0}
            onClick={() => {
              mergeable.forEach((g) => mergeOrders(g.map((o) => o.id)))
              toast.success(`รวมออเดอร์แล้ว ${mergeable.length} กลุ่ม`)
            }}
          >
            <Combine /> รวมทั้งหมดที่รวมได้ ({mergeable.length})
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4" /> เงื่อนไขการรวมออเดอร์
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              "ผู้ซื้อคนเดียวกัน ชื่อ-ที่อยู่-เบอร์โทรตรงกัน",
              "ร้านและแพลตฟอร์มเดียวกัน (ใบปะหน้า marketplace ออกจากแพลตฟอร์ม)",
              "ทุกออเดอร์อยู่สถานะ “รอจัดการ” ยังไม่พิมพ์ใบปะหน้า",
              "วิธีชำระเงินเหมือนกัน (COD กับ ชำระแล้ว รวมกันไม่ได้)",
              "ตัดสต๊อกจากคลังเดียวกัน",
              "LINE OA / Facebook / IG: รวมข้ามแชทได้ถ้าเป็นลูกค้าคนเดียวกัน",
            ].map((r) => (
              <div key={r} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {r}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>รวมอัตโนมัติ</CardTitle>
            <CardDescription>รวมทันทีเมื่อออเดอร์ใหม่เข้าเงื่อนไข</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto">เปิดรวมออเดอร์อัตโนมัติ</Label>
              <Switch id="auto" checked={auto} onCheckedChange={(v) => { setAuto(v); toast(v ? "เปิดรวมออเดอร์อัตโนมัติ" : "ปิดรวมออเดอร์อัตโนมัติ") }} />
            </div>
            <div className="text-xs text-muted-foreground">รอ 30 นาทีหลังออเดอร์แรกเข้า เผื่อลูกค้าสั่งเพิ่ม</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground">พบ {groups.length} กลุ่มที่อาจรวมได้</div>

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((g) => {
          const check = canMerge(g)
          const c = customers.find((x) => x.id === g[0].customerId)!
          const sumShip = g.reduce((s, o) => s + o.shippingFee, 0)
          const maxShip = Math.max(...g.map((o) => o.shippingFee))
          return (
            <Card key={g.map((o) => o.id).join()} className={check.ok ? "" : "opacity-90"}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{c.name}</CardTitle>
                    <CardDescription>
                      {c.phone} · {c.district} {c.province}
                    </CardDescription>
                  </div>
                  <PlatformBadge platform={g[0].platform} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="divide-y rounded-lg border text-sm">
                  {g.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 p-2.5">
                      <div className="flex shrink-0 -space-x-3">
                        {o.items.slice(0, 3).map((i) => (
                          <ProductThumb key={i.sku} sku={i.sku} className="ring-2 ring-background" />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {o.id} <span className="font-mono text-xs font-normal text-muted-foreground">{o.platformOrderNo}</span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {o.items.map((i) => `${productBySku(i.sku).name} x${i.qty}`).join(", ")}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <div className="font-medium">{baht(orderTotal(o))}</div>
                        <div className="text-muted-foreground">{PAYMENT_LABEL[o.payment]}</div>
                        <div className="text-muted-foreground">{dateTime(o.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {check.ok ? (
                    <Pill className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      รวมได้ · {g.length} ออเดอร์ → 1 กล่อง {sumShip > maxShip && `· ประหยัดค่าส่ง ${baht(sumShip - maxShip)}`}
                    </Pill>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                      <XCircle className="size-4" /> รวมไม่ได้: {check.reason}
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!check.ok}
                    onClick={() => {
                      const id = mergeOrders(g.map((o) => o.id))
                      toast.success(`รวมเป็น ${id} แล้ว`, { description: `ร้าน ${shopById(g[0].shopId).name}` })
                    }}
                  >
                    <Combine /> รวมออเดอร์
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {groups.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">ไม่มีออเดอร์ที่รวมได้ในขณะนี้ 🎉</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
