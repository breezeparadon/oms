"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DownloadCloud, Plus, AlertTriangle, Boxes, CheckCircle2, PackageX, RefreshCw, Search, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CopyLinkButton, FilterSelect, Kpi, PageHeader, PlatformDot, ProductThumb } from "@/components/oms/bits"
import { useQueryParam } from "@/components/oms/use-query-param"
import { MOVEMENT_LABEL, useOms } from "@/components/oms/store"
import { AddProductSheet, ImportListingsSheet } from "@/components/oms/product-tools"
import { Pager } from "@/components/oms/pager"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NumberInput } from "@/components/oms/number-input"
import { PLATFORM_IDS, PLATFORMS, type PlatformId, type Product } from "@/lib/mock-data"
import { ago, baht, num } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function InventoryPage() {
  return (
    <React.Suspense>
      <InventoryView />
    </React.Suspense>
  )
}

function InventoryView() {
  const params = useSearchParams()
  const { products, reserved, adjustStock, syncListing, platformListings } = useOms()
  const [addOpen, setAddOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [detailSku, setDetailSku] = useQueryParam("sku")
  const [q, setQ] = React.useState(params.get("q") ?? "")
  const [lastQ, setLastQ] = React.useState(params.get("q"))
  if (params.get("q") !== lastQ) {
    setLastQ(params.get("q"))
    setQ(params.get("q") ?? "")
  }
  const [cat, setCat] = React.useState("all")
  const [sub, setSub] = React.useState("all")
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [lowOnly, setLowOnly] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [delta, setDelta] = React.useState(0)
  const [wh, setWh] = React.useState<"bkk" | "cnx">("bkk")

  const cats = [...new Set(products.map((p) => p.group))]
  const avail = (p: Product) => p.stock.bkk + p.stock.cnx - reserved(p.sku)
  const list = products.filter(
    (p) => (cat === "all" || p.group === cat) && (sub === "all" || p.category === sub) && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())) && (!lowOnly || avail(p) <= p.safety),
  )
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize))
  const filterKey = `${q}|${cat}|${sub}|${lowOnly}`
  const [lastKey, setLastKey] = React.useState(filterKey)
  if (filterKey !== lastKey) {
    setLastKey(filterKey)
    setPage(0)
  } else if (page > pageCount - 1) setPage(0)
  const pageList = list.slice(page * pageSize, page * pageSize + pageSize)

  const sellable = products.filter((p) => p.price > 0)
  const low = sellable.filter((p) => avail(p) <= p.safety && avail(p) > 0)
  const out = sellable.filter((p) => avail(p) <= 0)
  const unsynced = products.filter((p) => Object.values(p.listings).some((l) => !l!.synced))
  const value = products.reduce((s, p) => s + (p.stock.bkk + p.stock.cnx) * p.cost, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="สต๊อกและ SKU กลาง"
        description="1 SKU กลางผูกกับทุกแพลตฟอร์ม — ขายได้ที่ไหน ระบบตัดสต๊อกกลางและอัปเดตทุกช่องทางทันที กันขายเกิน"
        actions={
          <>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <DownloadCloud /> ดึงสินค้าจากแพลตฟอร์ม
            {platformListings.length > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{platformListings.length}</span>}
          </Button>
          <Button variant="outline"
            onClick={() => {
              unsynced.forEach((p) => syncListing(p.sku))
              toast.success("ซิงค์สต๊อกไปทุกช่องทางแล้ว", { description: `${products.length} SKU × ${PLATFORM_IDS.length} ช่องทาง` })
            }}
          >
            <RefreshCw /> ซิงค์สต๊อกทุกช่องทาง
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> เพิ่มสินค้า
          </Button>
          </>
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
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อสินค้า / SKU / แบรนด์" className="pl-8" />
        </div>
        <FilterSelect
          value={cat}
          onChange={(v) => {
            setCat(v)
            setSub("all")
          }}
          className="min-w-52"
          options={[{ value: "all", label: `ทุกหมวดหมู่ (${products.length})` }, ...cats.map((c) => ({ value: c, label: `${c} (${products.filter((p) => p.group === c).length})` }))]}
        />
        {cat !== "all" && (
          <FilterSelect
            value={sub}
            onChange={setSub}
            className="min-w-52"
            options={[{ value: "all", label: "ทุกหมวดย่อย" }, ...[...new Set(products.filter((p) => p.group === cat).map((p) => p.category))].map((c) => ({ value: c, label: `${c} (${products.filter((p) => p.group === cat && p.category === c).length})` }))]}
          />
        )}
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
              {pageList.map((p) => {
                const a = avail(p)
                const r = reserved(p.sku)
                return (
                  <TableRow key={p.sku} className="cursor-pointer" onClick={() => setDetailSku(p.sku)}>
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
                            <span key={pl} title={l ? `${PLATFORMS[pl].name}: ${l.listingId} ${l.state === "pending" ? "(รอแพลตฟอร์มตรวจสอบ)" : l.state === "failed" ? `(ลงขายไม่สำเร็จ: ${l.note ?? ""})` : l.synced ? "(ซิงค์แล้ว)" : "(ซิงค์ไม่สำเร็จ)"}` : `${PLATFORMS[pl].name}: ยังไม่ผูก`} className="relative">
                              <PlatformDot platform={pl} className={cn(!l && "opacity-20 grayscale")} />
                              {l && (l.state === "pending" ? <span className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500 ring-2 ring-background" /> : (l.state === "failed" || !l.synced) && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500 ring-2 ring-background" />)}
                            </span>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
        <Pager page={page} pageSize={pageSize} total={list.length} onPage={setPage} onPageSize={setPageSize} unit="SKU" />
      </Card>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>คลิกที่แถวเพื่อดูจำนวนบนแต่ละช่องทางและประวัติสต๊อก</span>
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
              <NumberInput allowNegative value={delta} onValueChange={setDelta} placeholder="เช่น 50 หรือ -3" />
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

      <SkuSheet sku={detailSku} onClose={() => setDetailSku(null)} />
      <AddProductSheet open={addOpen} onOpenChange={setAddOpen} />
      <ImportListingsSheet open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}

const MARKETPLACES: PlatformId[] = ["shopee", "lazada", "tiktok"]

function SkuSheet({ sku, onClose }: { sku: string | null; onClose: () => void }) {
  const { products, movements, available, reserved, simulateSale } = useOms()
  const p = sku ? products.find((x) => x.sku === sku) : undefined
  const log = sku ? movements.filter((m) => m.sku === sku).slice(0, 30) : []
  const last = log[0]
  const avail = p ? available(p.sku) : 0
  const [syncing, setSyncing] = React.useState<{ id: string; except?: PlatformId } | null>(null)
  const [lastSeen, setLastSeen] = React.useState<string | undefined>(last?.id)
  // when a new movement for this SKU arrives, briefly show channels "syncing"
  if (last?.id !== lastSeen) {
    setLastSeen(last?.id)
    if (last && last.availDelta !== 0) setSyncing({ id: last.id, except: last.platform })
  }
  React.useEffect(() => {
    if (!syncing) return
    const t = setTimeout(() => setSyncing(null), 900)
    return () => clearTimeout(t)
  }, [syncing])

  return (
    <Sheet open={!!p} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        {p && (
          <>
            <SheetHeader className="pr-12">
              <div className="flex items-center gap-3">
                <ProductThumb sku={p.sku} className="size-14" />
                <div className="min-w-0">
                  <SheetTitle className="line-clamp-2 text-base">{p.name}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-2">
                    <span>
                      <span className="font-mono">{p.sku}</span> · {p.brand}
                    </span>
                    <CopyLinkButton />
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-xs text-muted-foreground">ของในคลังจริง</div>
                  <div className="text-lg font-semibold tabular-nums">{num(p.stock.bkk + p.stock.cnx)}</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-xs text-muted-foreground">จองแล้ว (ยังไม่แพ็ก)</div>
                  <div className="text-lg font-semibold tabular-nums">{num(reserved(p.sku))}</div>
                </div>
                <div className="rounded-lg bg-brand-soft p-2 ring-1 ring-primary/20">
                  <div className="text-xs text-muted-foreground">พร้อมขาย (ทุกช่องทาง)</div>
                  <div key={last?.id} className="animate-cart-flash rounded text-lg font-bold text-primary tabular-nums">{num(avail)}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">พร้อมขาย = ของในคลังจริง − จองแล้ว · ตัวเลขนี้ถูกส่งไปทุกช่องทางที่ผูกสินค้าไว้</div>

              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">จำนวนที่แสดงบนแต่ละช่องทาง</div>
                <div className="divide-y rounded-lg border">
                  {PLATFORM_IDS.map((pl) => {
                    const l = p.listings[pl]
                    const isSyncing = syncing && l && pl !== syncing.except
                    return (
                      <div key={pl} className="flex items-center gap-3 px-3 py-2">
                        <PlatformDot platform={pl} />
                        <span className="flex-1">{PLATFORMS[pl].name}</span>
                        {!l ? (
                          <span className="text-xs text-muted-foreground">ยังไม่ได้ผูกสินค้า</span>
                        ) : (
                          <>
                            <span className="font-mono text-[11px] text-muted-foreground">{l.listingId}</span>
                            <span key={`${pl}-${last?.id}`} className="animate-cart-flash w-14 rounded text-right font-semibold tabular-nums">{num(avail)}</span>
                            {isSyncing ? (
                              <RefreshCw className="size-4 animate-spin text-primary" />
                            ) : l.synced ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="size-4 text-rose-500" />
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-dashed p-3">
                <div className="mb-2 text-xs text-muted-foreground">ลองจำลอง: ลูกค้าซื้อ 1 ชิ้นจากแพลตฟอร์ม → ช่องทางอื่นลดตามทันที</div>
                <div className="flex flex-wrap gap-2">
                  {MARKETPLACES.filter((pl) => p.listings[pl]).map((pl) => (
                    <Button key={pl} size="sm" variant="outline" disabled={avail <= 0} onClick={() => simulateSale(p.sku, pl)}>
                      <PlatformDot platform={pl} className="size-4 text-[7px]" /> ขายใน {PLATFORMS[pl].name} 1 ชิ้น
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">ประวัติการเคลื่อนไหวสต๊อก</div>
                <div className="divide-y rounded-lg border">
                  {log.map((m) => (
                    <div key={m.id} className="flex items-start gap-3 px-3 py-2">
                      <span className={cn("mt-0.5 w-10 shrink-0 text-right font-semibold tabular-nums", m.availDelta < 0 || m.onHandDelta < 0 ? "text-rose-600" : "text-emerald-600")}>
                        {(m.availDelta || m.onHandDelta) > 0 ? "+" : ""}
                        {m.availDelta || m.onHandDelta}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {m.platform && <PlatformDot platform={m.platform} className="size-4 text-[7px]" />}
                          <span className="font-medium">{MOVEMENT_LABEL[m.kind]}</span>
                          {m.ref && <span className="text-xs text-muted-foreground">{m.ref}</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {m.kind === "ship" ? "ของในคลังจริงลดลง (พร้อมขายไม่เปลี่ยน เพราะจองไว้แล้ว)" : m.synced?.length ? `ซิงค์ไป ${m.synced.map((x) => PLATFORMS[x].name).join(", ")}` : ""}
                          {m.availAfter !== undefined && m.availDelta !== 0 && ` · พร้อมขายเหลือ ${m.availAfter}`}
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{ago(m.at)}</span>
                    </div>
                  ))}
                  {log.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">ยังไม่มีการเคลื่อนไหวใน 4 วันล่าสุด</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
