"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckCircle2, Circle, Lock, PackageCheck, ScanBarcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader, PlatformBadge, Pill, ProductThumb } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { productBySku, shopById } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function PackingPage() {
  const { orders, customers, setStatus, printLabels, lockedBy, claimOrders } = useOms()
  const queue = orders.filter((o) => o.status === "to_pack" || o.status === "to_process")
  const [code, setCode] = React.useState("")
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [scanned, setScanned] = React.useState<Record<string, number>>({})
  const [skuCode, setSkuCode] = React.useState("")
  const [packedCount, setPackedCount] = React.useState(0)
  const active = orders.find((o) => o.id === activeId)

  const openOrder = (raw: string) => {
    const v = raw.trim().toUpperCase()
    const o = orders.find((x) => x.id === v || x.tracking === v || x.platformOrderNo === raw.trim())
    if (!o) return toast.error(`ไม่พบออเดอร์ “${raw}”`)
    if (!["to_pack", "to_process"].includes(o.status)) return toast.warning(`${o.id} ไม่ได้อยู่ในสถานะรอแพ็ก`)
    const holder = lockedBy(o)
    if (holder) return toast.error(`${o.id} — ${holder.name} รับงานนี้อยู่`, { description: "ข้ามไปออเดอร์ถัดไป เพื่อไม่ให้ทำงานซ้ำกัน" })
    claimOrders([o.id])
    setActiveId(o.id)
    setScanned({})
    setCode("")
  }

  const scanSku = (raw: string) => {
    if (!active) return
    const sku = raw.trim().toUpperCase()
    const line = active.items.find((i) => i.sku === sku)
    if (!line) {
      toast.error(`❌ สแกนผิดสินค้า: ${sku} ไม่อยู่ในออเดอร์นี้`)
      return setSkuCode("")
    }
    const cur = scanned[sku] ?? 0
    if (cur >= line.qty) toast.warning(`${sku} สแกนครบแล้ว`)
    else setScanned({ ...scanned, [sku]: cur + 1 })
    setSkuCode("")
  }

  const complete = active && active.items.every((i) => (scanned[i.sku] ?? 0) >= i.qty)
  const c = active ? customers.find((x) => x.id === active.customerId)! : null

  return (
    <div className="space-y-4">
      <PageHeader title="สแกนแพ็กสินค้า" description="สแกนเลขออเดอร์/เลขพัสดุ แล้วสแกนบาร์โค้ดสินค้าทีละชิ้น — ระบบเตือนเมื่อหยิบผิด ป้องกันส่งของผิด" actions={<Pill className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">แพ็กแล้วรอบนี้ {packedCount} กล่อง</Pill>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanBarcode className="size-4" /> สแกน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                openOrder(code)
              }}
              className="flex gap-2"
            >
              <Input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="สแกน/พิมพ์ เลขออเดอร์ หรือ เลขพัสดุ" className="h-11 text-base" />
              <Button type="submit" size="lg" className="h-11">
                เปิด
              </Button>
            </form>

            {active && c ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 p-3 text-sm">
                  <div>
                    <div className="font-semibold">{active.id}</div>
                    <div className="text-muted-foreground">
                      {c.name} · {c.province}
                    </div>
                  </div>
                  <div className="text-right">
                    <PlatformBadge platform={active.platform} />
                    <div className="text-xs text-muted-foreground">{shopById(active.shopId).name}</div>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    scanSku(skuCode)
                  }}
                  className="flex gap-2"
                >
                  <Input value={skuCode} onChange={(e) => setSkuCode(e.target.value)} placeholder="สแกนบาร์โค้ด/SKU สินค้า" className="h-11 font-mono" />
                  <Button type="submit" variant="outline" className="h-11">
                    สแกน
                  </Button>
                </form>
                <div className="divide-y rounded-lg border">
                  {active.items.map((i) => {
                    const n = scanned[i.sku] ?? 0
                    const ok = n >= i.qty
                    return (
                      <div key={i.sku} className={cn("flex items-center gap-3 p-3", ok && "bg-emerald-50 dark:bg-emerald-950/30")}>
                        {ok ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5 text-muted-foreground" />}
                        <ProductThumb sku={i.sku} className="size-14" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{productBySku(i.sku).name}</div>
                          <button className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => scanSku(i.sku)} title="คลิกเพื่อจำลองการสแกน">
                            {i.sku}
                          </button>
                        </div>
                        <div className="text-lg font-semibold tabular-nums">
                          {n}/{i.qty}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="lg"
                    disabled={!complete}
                    onClick={() => {
                      if (!active.labelPrinted) printLabels([active.id])
                      if (!setStatus([active.id], "to_ship").length) return
                      setPackedCount((n) => n + 1)
                      toast.success(`แพ็ก ${active.id} เสร็จ`, { description: "พิมพ์ใบปะหน้าแล้ว → สถานะ “รอขนส่งรับ”" })
                      setActiveId(null)
                    }}
                  >
                    <PackageCheck /> แพ็กเสร็จ + พิมพ์ใบปะหน้า
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => setActiveId(null)}>
                    ยกเลิก
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Tip: คลิกที่รหัส SKU เพื่อจำลองการสแกนบาร์โค้ด</div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">สแกนเลขออเดอร์เพื่อเริ่มแพ็ก หรือเลือกจากคิวด้านขวา</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>คิวรอแพ็ก</CardTitle>
            <CardDescription>{queue.length} ออเดอร์</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[560px] space-y-1 overflow-y-auto">
            {queue.slice(0, 40).map((o) => (
              <button key={o.id} onClick={() => openOrder(o.id)} className={cn("flex w-full items-center justify-between rounded-lg p-2 text-left text-sm hover:bg-muted", activeId === o.id && "bg-muted", lockedBy(o) && "opacity-60")}>
                <span className="font-medium">{o.id}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lockedBy(o) && (
                    <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Lock className="size-3" /> {lockedBy(o)!.name}
                    </span>
                  )}
                  {o.items.reduce((s, i) => s + i.qty, 0)} ชิ้น
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
