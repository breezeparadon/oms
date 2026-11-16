"use client"

import * as React from "react"
import { toast } from "sonner"
import { AlertTriangle, Boxes, CheckCircle2, PackageX, RefreshCw, Search, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilterSelect, Kpi, PageHeader, PlatformDot, ProductThumb } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { PLATFORM_IDS, PLATFORMS, type Product } from "@/lib/mock-data"
import { baht, num } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function InventoryPage() {
  const { products, reserved, adjustStock, syncListing } = useOms()
  const [q, setQ] = React.useState("")
  const [cat, setCat] = React.useState("all")
  const [lowOnly, setLowOnly] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [delta, setDelta] = React.useState(0)
  const [wh, setWh] = React.useState<"bkk" | "cnx">("bkk")

  const cats = [...new Set(products.map((p) => p.group))]
  const avail = (p: Product) => p.stock.bkk + p.stock.cnx - reserved(p.sku)
  const list = products.filter(
    (p) => (cat === "all" || p.group === cat) && (!q || p.name.includes(q) || p.sku.toLowerCase().includes(q.toLowerCase())) && (!lowOnly || avail(p) <= p.safety),
  )
  const sellable = products.filter((p) => p.price > 0)
  const low = sellable.filter((p) => avail(p) <= p.safety && avail(p) > 0)
  const out = sellable.filter((p) => avail(p) <= 0)
  const unsynced = products.filter((p) => Object.values(p.listings).some((l) => !l!.synced))
  const value = products.reduce((s, p) => s + (p.stock.bkk + p.stock.cnx) * p.cost, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="สต๊อกและ SKU กลาง"
        description="1 SKU กลาง ผูกกับสินค้าทุกแพลตฟอร์ม — มีออเดอร์เข้าจากช่องทางไหน ระบบตัดสต๊อกกลางและอัปเดตจำนวนไปทุกช่องทางทันที กันขายเกิน (Overselling)"
        actions={
          <Button
            onClick={() => {
              unsynced.forEach((p) => syncListing(p.sku))
              toast.success("ซิงค์สต๊อกไปทุกช่องทางแล้ว", { description: `${products.length} SKU × ${PLATFORM_IDS.length} ช่องทาง` })
            }}
          >
            <RefreshCw /> ซิงค์สต๊อกทุกช่องทาง
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="SKU ทั้งหมด" value={num(products.length)} hint={`${cats.length} หมวดหมู่`} icon={<Boxes />} />
        <Kpi label="มูลค่าสต๊อก (ต้นทุน)" value={baht(value)} icon={<CheckCircle2 />} tone="good" />
        <Kpi label="ใกล้หมด" value={num(low.length)} hint="ต่ำกว่าจุดสั่งซื้อ" icon={<TriangleAlert />} tone="warn" />
        <Kpi label="หมดสต๊อก / ซิงค์ไม่สำเร็จ" value={`${out.length} / ${unsynced.length}`} hint="ตรวจสอบด่วน" icon={<PackageX />} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อสินค้า / SKU" className="pl-8" />
        </div>
        <FilterSelect value={cat} onChange={setCat} options={[{ value: "all", label: "ทุกกลุ่มสินค้า" }, ...cats.map((c) => ({ value: c, label: c }))]} />
        <div className="flex items-center gap-2">
          <Switch id="low" checked={lowOnly} onCheckedChange={setLowOnly} />
          <Label htmlFor="low">เฉพาะสินค้าใกล้หมด</Label>
        </div>
      </div>

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU / สินค้า</TableHead>
                <TableHead className="text-right">ราคา</TableHead>
                <TableHead className="text-right">คลัง กทม.</TableHead>
                <TableHead className="text-right">คลัง ชม.</TableHead>
                <TableHead className="text-right">จองแล้ว</TableHead>
                <TableHead className="text-right">พร้อมขาย</TableHead>
                <TableHead>ผูกกับช่องทาง</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => {
                const a = avail(p)
                const r = reserved(p.sku)
                return (
                  <TableRow key={p.sku}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumb sku={p.sku} className="size-12" />
                        <div className="min-w-0 max-w-sm">
                          <div className="line-clamp-2 font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-mono">{p.sku}</span> · {p.brand} · {p.category}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.price ? baht(p.price) : "ของแถม"}
                      {p.fullPrice > p.price && <div className="text-[11px] text-muted-foreground line-through">{baht(p.fullPrice)}</div>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{num(p.stock.bkk)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(p.stock.cnx)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{r}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("font-semibold tabular-nums", a <= 0 ? "text-rose-600" : a <= p.safety ? "text-amber-600" : "")}>{a <= 0 ? "หมด" : num(a)}</span>
                      {a > 0 && a <= p.safety && <AlertTriangle className="ml-1 inline size-3.5 text-amber-500" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {PLATFORM_IDS.map((pl) => {
                          const l = p.listings[pl]
                          return (
                            <span key={pl} title={l ? `${PLATFORMS[pl].name}: ${l.listingId} ${l.synced ? "(ซิงค์แล้ว)" : "(ซิงค์ไม่สำเร็จ)"}` : `${PLATFORMS[pl].name}: ยังไม่ผูก`} className="relative">
                              <PlatformDot platform={pl} className={cn(!l && "opacity-20 grayscale")} />
                              {l && !l.synced && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500 ring-2 ring-background" />}
                            </span>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(p)
                          setDelta(0)
                          setWh("bkk")
                        }}
                      >
                        ปรับสต๊อก
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>จองแล้ว = อยู่ในออเดอร์ที่ยังไม่แพ็ก</span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-rose-500" /> ซิงค์ไปแพลตฟอร์มไม่สำเร็จ
        </span>
        <span>ไอคอนจาง = ยังไม่ได้ผูกสินค้ากับช่องทางนั้น</span>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปรับสต๊อก: {editing?.name}</DialogTitle>
            <DialogDescription>รับสินค้าเข้า / ตัดของเสีย / นับสต๊อก — ระบบจะส่งจำนวนใหม่ไปทุกช่องทาง</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>คลัง</Label>
              <FilterSelect value={wh} onChange={(v) => setWh(v as "bkk" | "cnx")} className="w-full" options={[{ value: "bkk", label: `กรุงเทพฯ (${editing?.stock.bkk ?? 0})` }, { value: "cnx", label: `เชียงใหม่ (${editing?.stock.cnx ?? 0})` }]} />
            </div>
            <div className="space-y-1.5">
              <Label>จำนวน (+ รับเข้า / − ตัดออก)</Label>
              <Input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex gap-2">
            {[10, 50, 100].map((n) => (
              <Button key={n} size="sm" variant="outline" onClick={() => setDelta(n)}>
                +{n}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              disabled={!delta}
              onClick={() => {
                if (!editing) return
                adjustStock(editing.sku, wh, delta)
                toast.success(`${delta > 0 ? "รับเข้า" : "ตัดออก"} ${Math.abs(delta)} ชิ้น`, { description: `${editing.sku} — อัปเดตไป ${Object.keys(editing.listings).length} ช่องทางแล้ว` })
                setEditing(null)
              }}
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
