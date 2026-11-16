"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Printer, ScanBarcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilterSelect, Kpi, PageHeader, PlatformDot, ProductThumb } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { PRODUCT_GROUPS, productBySku } from "@/lib/mock-data"
import { NOW } from "@/lib/mock-data"
import { dateTime, num } from "@/lib/format"
import { cn } from "@/lib/utils"

const binOf = (sku: string) => {
  const g = productBySku(sku).group
  const zone = String.fromCharCode(65 + Math.max(0, PRODUCT_GROUPS.indexOf(g)))
  const n = [...sku].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return `${zone}-${String((n % 12) + 1).padStart(2, "0")}-${(n % 4) + 1}`
}

export function PickingView() {
  const params = useSearchParams()
  const ids = params.get("ids")?.split(",").filter(Boolean)
  const { orders } = useOms()
  const [wh, setWh] = React.useState<"bkk" | "cnx">("bkk")
  const [picked, setPicked] = React.useState<Set<string>>(new Set())

  const batch = orders.filter((o) => (ids ? ids.includes(o.id) : o.status === "to_pack") && o.warehouse === wh)
  const lines = new Map<string, { sku: string; qty: number; orders: string[] }>()
  for (const o of batch)
    for (const it of o.items) {
      const cur = lines.get(it.sku) ?? { sku: it.sku, qty: 0, orders: [] }
      cur.qty += it.qty
      cur.orders.push(o.id)
      lines.set(it.sku, cur)
    }
  const rows = [...lines.values()].sort((a, b) => binOf(a.sku).localeCompare(binOf(b.sku)))
  const totalQty = rows.reduce((s, r) => s + r.qty, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="ใบหยิบสินค้า (Picking List)"
        description={ids ? `จากออเดอร์ที่เลือก ${ids.length} รายการ` : "รวมทุกออเดอร์ที่แอดมินยืนยันส่งคลังแล้ว (“รอแพ็ก”) — จัดเรียงตามตำแหน่งชั้นวาง เดินหยิบรอบเดียว"}
        actions={
          <>
            <FilterSelect value={wh} onChange={(v) => setWh(v as "bkk" | "cnx")} options={[{ value: "bkk", label: "คลังกรุงเทพฯ" }, { value: "cnx", label: "คลังเชียงใหม่" }]} />
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> พิมพ์
            </Button>
            <Button render={<Link href="/fulfillment/packing" />}>
              <ScanBarcode /> ไปสแกนแพ็ก
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="ออเดอร์ในรอบนี้" value={num(batch.length)} />
        <Kpi label="จำนวน SKU" value={num(rows.length)} />
        <Kpi label="จำนวนชิ้นรวม" value={num(totalQty)} />
        <Kpi label="หยิบแล้ว" value={`${picked.size}/${rows.length}`} tone={picked.size === rows.length && rows.length ? "good" : "default"} hint={picked.size === rows.length && rows.length ? "ครบแล้ว พร้อมแพ็ก" : undefined} />
      </div>
      <Card className="py-0">
        <CardHeader className="pt-4">
          <CardTitle>รอบหยิบ #PK-{dateTime(NOW).replace(/\D/g, "").slice(-6)}</CardTitle>
          <CardDescription>ติ๊กเมื่อหยิบครบแต่ละรายการ</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>ออเดอร์</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const p = productBySku(r.sku)
                  const done = picked.has(r.sku)
                  return (
                    <TableRow key={r.sku} className={done ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={done}
                          onCheckedChange={() =>
                            setPicked((prev) => {
                              const n = new Set(prev)
                              if (n.has(r.sku)) n.delete(r.sku)
                              else n.add(r.sku)
                              return n
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold">{binOf(r.sku)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumb sku={r.sku} className="size-12" />
                          <div className="min-w-0">
                            <div className={cn("line-clamp-2 max-w-md", done && "line-through")}>{p.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{r.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-lg font-semibold tabular-nums">{r.qty}</TableCell>
                      <TableCell className="max-w-72">
                        <div className="flex flex-wrap gap-1">
                          {r.orders.slice(0, 6).map((id) => {
                            const o = batch.find((x) => x.id === id)!
                            return (
                              <span key={id} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px]">
                                <PlatformDot platform={o.platform} className="size-3 text-[6px]" />
                                {id}
                              </span>
                            )
                          })}
                          {r.orders.length > 6 && <span className="text-[11px] text-muted-foreground">+{r.orders.length - 6}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      ไม่มีสินค้าที่ต้องหยิบ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
