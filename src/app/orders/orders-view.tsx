"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Hand, Lock, Send, ChevronDown, ClipboardList, Combine, Download, Printer, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { FilterSelect, PageHeader, PlatformDot, Pill, ProductThumb, StatusBadge } from "@/components/oms/bits"
import { OrderSheet } from "@/components/oms/order-sheet"
import { useQueryParam } from "@/components/oms/use-query-param"
import { canMerge, useOms } from "@/components/oms/store"
import { Pager } from "@/components/oms/pager"
import { DAY, NOW, can, ROLES, PAYMENT_LABEL, PLATFORMS, PLATFORM_IDS, SHOPS, STATUSES, STATUS_IDS, orderTotal, productBySku, shopById, type Order, type OrderStatus, type PlatformId } from "@/lib/mock-data"
import { baht, dateTime, dayKey, dueIn, num } from "@/lib/format"
import { cn } from "@/lib/utils"


export function OrdersView() {
  const params = useSearchParams()
  const { orders, customers, printLabels, setStatus, mergeOrders, claimOrders, confirmToWarehouse, lockedBy, me } = useOms()
  const [owner, setOwner] = React.useState("all")
  // accounting & other read-only roles: no selection / bulk actions
  const canAct = can(me.role, "order.claim") || can(me.role, "order.status") || can(me.role, "order.print") || can(me.role, "order.confirm")
  const [statusParam, setStatusParam] = useQueryParam("status")
  const tab = (statusParam as OrderStatus | "all" | null) ?? "to_process"
  const setTab = (s: OrderStatus | "all") => setStatusParam(s)
  const [platformParam, setPlatformParam] = useQueryParam("platform")
  const platform = platformParam ?? "all"
  const setPlatform = (v: string) => setPlatformParam(v === "all" ? null : v)
  const [dateParam, setDateParam] = useQueryParam("date")
  const range = (dateParam ?? "all") as DateRange
  const setRange = (v: string) => setDateParam(v === "all" ? null : v)
  const [shop, setShop] = React.useState("all")
  const [payment, setPayment] = React.useState("all")
  const [q, setQ] = React.useState(params.get("q") ?? "")
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(25)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [openId, setOpenId] = useQueryParam("open")

  React.useEffect(() => {
    if (params.get("q") !== null) setQ(params.get("q") ?? "")
  }, [params])

  const custMap = React.useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])

  const base = orders.filter(
    (o) =>
      inRange(o.createdAt, range) &&
      (platform === "all" || o.platform === platform) &&
      (shop === "all" || o.shopId === shop) &&
      (payment === "all" || o.payment === payment) &&
      (owner === "all" || (owner === "mine" ? o.claimedBy === me.id : owner === "free" ? !o.claimedBy : !!o.claimedBy && o.claimedBy !== me.id)) &&
      (!q ||
        o.id.toLowerCase().includes(q.toLowerCase()) ||
        o.platformOrderNo.includes(q) ||
        custMap.get(o.customerId)!.name.includes(q) ||
        custMap.get(o.customerId)!.phone.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
        (o.tracking ?? "").includes(q.toUpperCase())),
  )
  const list = tab === "all" ? base : base.filter((o) => o.status === tab)
  const pageList = list.slice(page * pageSize, page * pageSize + pageSize)
  const selOrders = orders.filter((o) => selected.has(o.id))
  const merge = canMerge(selOrders)

  React.useEffect(() => setPage(0), [tab, platform, shop, payment, q, range])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const allOnPage = pageList.length > 0 && pageList.every((o) => selected.has(o.id))
  const clear = () => setSelected(new Set())

  const shopOptions = [{ value: "all", label: "ทุกร้าน" }, ...SHOPS.filter((s) => platform === "all" || s.platform === platform).map((s) => ({ value: s.id, label: s.name }))]

  return (
    <div className="space-y-4">
      <PageHeader
        title="ออเดอร์ทั้งหมด"
        description={`ดึงอัตโนมัติจาก ${PLATFORM_IDS.length} ช่องทาง ${SHOPS.length} ร้าน — ออเดอร์ทั้งหมด ${num(orders.length)} รายการ`}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("ดึงออเดอร์ล่าสุดจากทุกช่องทางแล้ว", { description: "ไม่พบออเดอร์ใหม่ใน 1 นาทีที่ผ่านมา" })}>
              <RefreshCw /> ซิงค์ออเดอร์
            </Button>
            <Button variant="outline" onClick={() => toast("ส่งออกไฟล์ Excel (จำลอง)")}>
              <Download /> ส่งออก
            </Button>
            {can(me.role, "order.create") && <Button render={<Link href="/orders/new" />}>+ สร้างออเดอร์</Button>}
            {!canAct && <span className="rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">ดูอย่างเดียว ({ROLES[me.role].label})</span>}
          </>
        }
      />

      {/* Status tabs */}
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {(["all", ...STATUS_IDS] as const).map((s) => {
          const n = s === "all" ? base.length : base.filter((o) => o.status === s).length
          return (
            <button
              key={s}
              onClick={() => {
                setTab(s)
                clear()
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                tab === s ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
              )}
            >
              {s === "all" ? "ทั้งหมด" : STATUSES[s].label}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", tab === s ? "bg-primary-foreground/20" : "bg-muted")}>{n}</span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เลขออเดอร์ / ชื่อ / เบอร์โทร / เลขพัสดุ" className="pl-8" />
        </div>
        <FilterSelect value={range} onChange={setRange} className="min-w-32" options={DATE_OPTIONS} />
        <FilterSelect
          value={platform}
          onChange={(v) => {
            setPlatform(v)
            setShop("all")
          }}
          options={[{ value: "all", label: "ทุกช่องทาง" }, ...PLATFORM_IDS.map((p) => ({ value: p, label: PLATFORMS[p].name }))]}
        />
        <FilterSelect value={shop} onChange={setShop} options={shopOptions} className="min-w-48" />
        <FilterSelect
          value={owner}
          onChange={setOwner}
          options={[
            { value: "all", label: "ผู้รับงาน: ทุกคน" },
            { value: "mine", label: "งานของฉัน" },
            { value: "free", label: "ยังไม่มีคนรับ" },
            { value: "others", label: "เพื่อนรับงานอยู่" },
          ]}
        />
        <FilterSelect value={payment} onChange={setPayment} options={[{ value: "all", label: "ทุกวิธีชำระ" }, ...Object.entries(PAYMENT_LABEL).map(([value, label]) => ({ value, label }))]} />
        {(range !== "all" || platform !== "all" || shop !== "all" || payment !== "all" || q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPlatform("all")
              setRange("all")
              setShop("all")
              setPayment("all")
              setQ("")
            }}
          >
            <X /> ล้างตัวกรอง
          </Button>
        )}
      </div>

      {(range !== "all" || platform !== "all") && <SalesSummary orders={base} range={range} platform={platform} />}

      {/* Bulk action bar */}
      {canAct && selected.size > 0 && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
          <span className="px-2 text-sm font-medium">เลือก {selected.size} ออเดอร์</span>
          {can(me.role, "order.confirm") && (
            <Button
              size="sm"
              onClick={() => {
                const { done, batch } = confirmToWarehouse([...selected])
                if (done.length) toast.success(`ส่งให้คลังแพ็กแล้ว ${done.length} ออเดอร์ (รอบ ${batch})`, { description: "ได้เลขพัสดุจากแพลตฟอร์มแล้ว — ทีมคลังได้รับแจ้งเตือน และเห็นในคิวแพ็กทันที" })
                clear()
              }}
            >
              <Send /> ยืนยัน &amp; ส่งให้คลัง
            </Button>
          )}
          {can(me.role, "order.print") && (
            <Button
              size="sm"
              variant={can(me.role, "order.confirm") ? "outline" : "default"}
              onClick={() => {
                const done = printLabels([...selected])
                if (done.length) toast.success(`พิมพ์ใบปะหน้า ${done.length} ใบ`, { description: "รับงานเป็นของคุณแล้ว" })
                clear()
              }}
            >
              <Printer /> พิมพ์ใบปะหน้า
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const done = claimOrders([...selected])
              if (done.length) toast.success(`รับงาน ${done.length} ออเดอร์แล้ว`, { description: "ทีมจะเห็นว่าคุณกำลังทำออเดอร์เหล่านี้" })
              clear()
            }}
          >
            <Hand /> รับงาน
          </Button>
          <Button size="sm" variant="outline" render={<Link href={`/fulfillment/picking?ids=${[...selected].join(",")}`} />}>
            <ClipboardList /> ใบหยิบสินค้า
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
              เปลี่ยนสถานะ <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>ย้ายไปสถานะ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_IDS.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      const done = setStatus([...selected], s)
                      if (done.length) toast.success(`เปลี่ยน ${done.length} ออเดอร์เป็น “${STATUSES[s].label}”`)
                      clear()
                    }}
                  >
                    {STATUSES[s].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="outline"
            disabled={!merge.ok}
            title={merge.ok ? "" : merge.reason}
            onClick={() => {
              const id = mergeOrders([...selected])
              if (id) toast.success(`รวม ${selected.size} ออเดอร์เป็น ${id} แล้ว`)
              clear()
            }}
          >
            <Combine /> รวมออเดอร์
          </Button>
          {!merge.ok && selected.size > 1 && <span className="text-xs text-muted-foreground">รวมไม่ได้: {merge.reason}</span>}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={clear}>
            ยกเลิกการเลือก
          </Button>
        </div>
      )}

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {canAct && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPage}
                    onCheckedChange={(v) =>
                      setSelected((prev) => {
                        const n = new Set(prev)
                        for (const o of pageList) {
                          if (v) n.add(o.id)
                          else n.delete(o.id)
                        }
                        return n
                      })
                    }
                    aria-label="เลือกทั้งหมด"
                  />
                </TableHead>
                )}
                <TableHead>ออเดอร์</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-right">ยอดสุทธิ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ขนส่ง</TableHead>
                <TableHead>กำหนดส่ง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageList.map((o) => {
                const c = custMap.get(o.customerId)!
                const due = dueIn(o.shipBy)
                const first = productBySku(o.items[0].sku)
                return (
                  <TableRow key={o.id} data-state={selected.has(o.id) ? "selected" : undefined} className="cursor-pointer" onClick={() => setOpenId(o.id)}>
                    {canAct && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} aria-label={`เลือก ${o.id}`} />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PlatformDot platform={o.platform} />
                        <div>
                          <div className="font-medium">{o.id}</div>
                          <div className="text-[11px] text-muted-foreground">{shopById(o.shopId).name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.name}
                        {c.blacklisted && <Pill className="bg-rose-100 text-[10px] text-rose-700 dark:bg-rose-950 dark:text-rose-300">บัญชีดำ</Pill>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.province}</div>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <ProductThumb sku={first.sku} />
                          {o.items.length > 1 && <span className="absolute -right-1.5 -bottom-1.5 rounded-full bg-foreground px-1 text-[9px] font-semibold text-background">+{o.items.length - 1}</span>}
                        </div>
                        <div className="min-w-0">
                      <div className="truncate">{first.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {o.items.reduce((s, i) => s + i.qty, 0)} ชิ้น
                        {o.items.length > 1 && ` · +${o.items.length - 1} รายการ`}
                        {o.mergedFrom && " · รวมออเดอร์"}
                      </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium tabular-nums">{baht(orderTotal(o))}</div>
                      <div className={cn("text-[11px]", o.payment === "cod" ? "text-amber-600" : "text-muted-foreground")}>{o.payment === "cod" ? "COD" : o.payment === "transfer" ? "โอน" : "ชำระแล้ว"}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                      {o.claimedBy && (
                        <div className={cn("mt-1 flex items-center gap-1 text-[11px]", lockedBy(o) ? "text-amber-700 dark:text-amber-400" : "text-primary")}>
                          {lockedBy(o) ? <Lock className="size-3" /> : <Hand className="size-3" />}
                          {lockedBy(o) ? lockedBy(o)!.name : "งานของฉัน"}
                        </div>
                      )}
                      {o.labelPrinted && o.status === "to_pack" && <div className="mt-0.5 text-[11px] text-muted-foreground">พิมพ์ใบปะหน้าแล้ว</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{o.carrier}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{o.tracking ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {["to_process", "to_pack", "unpaid"].includes(o.status) ? (
                        <span className={due.urgent ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted-foreground"}>{due.text}</span>
                      ) : (
                        <span className="text-muted-foreground">{dateTime(o.createdAt)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {pageList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canAct ? 8 : 7} className="py-12 text-center text-muted-foreground">
                    ไม่พบออเดอร์ตามเงื่อนไข
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Pager page={page} pageSize={pageSize} total={list.length} onPage={setPage} onPageSize={setPageSize} unit="รายการ" />
      </Card>

      <OrderSheet order={orders.find((o) => o.id === openId) ?? null} onOpenChange={(open) => !open && setOpenId(null)} />
    </div>
  )
}

// ---------- date range + "what did we sell" summary ----------
type DateRange = "all" | "today" | "yesterday" | "7d" | "30d"
const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "ทุกวัน" },
  { value: "today", label: "วันนี้" },
  { value: "yesterday", label: "เมื่อวาน" },
  { value: "7d", label: "7 วันล่าสุด" },
  { value: "30d", label: "30 วันล่าสุด" },
]
function inRange(t: number, r: DateRange) {
  if (r === "today") return dayKey(t) === dayKey(NOW)
  if (r === "yesterday") return dayKey(t) === dayKey(NOW - DAY)
  if (r === "7d") return t > NOW - 7 * DAY
  if (r === "30d") return t > NOW - 30 * DAY
  return true
}

function SalesSummary({ orders, range, platform }: { orders: Order[]; range: DateRange; platform: string }) {
  const [showAll, setShowAll] = React.useState(false)
  const sold = orders.filter((o) => o.status !== "cancelled")
  const revenue = sold.reduce((s, o) => s + orderTotal(o), 0)
  const items = new Map<string, { qty: number; rev: number; orders: number }>()
  for (const o of sold)
    for (const it of o.items) {
      if (!it.price) continue
      const cur = items.get(it.sku) ?? { qty: 0, rev: 0, orders: 0 }
      cur.qty += it.qty
      cur.rev += it.qty * it.price
      cur.orders += 1
      items.set(it.sku, cur)
    }
  const rows = [...items.entries()].sort((a, b) => b[1].qty - a[1].qty || b[1].rev - a[1].rev)
  const units = rows.reduce((s, [, v]) => s + v.qty, 0)
  const byPlatform = PLATFORM_IDS.map((p) => {
    const l = sold.filter((o) => o.platform === p)
    return { p, n: l.length, rev: l.reduce((s, o) => s + orderTotal(o), 0) }
  }).filter((x) => x.n)
  const label = `${DATE_OPTIONS.find((d) => d.value === range)!.label}${platform !== "all" ? ` · ${PLATFORMS[platform as PlatformId].name}` : " · ทุกช่องทาง"}`
  const shown = showAll ? rows : rows.slice(0, 6)
  return (
    <Card className="gap-3 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4">
        <div className="flex items-center gap-2 font-semibold">
          {platform !== "all" && <PlatformDot platform={platform as PlatformId} />}
          สรุปยอดขาย {label}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span>
            <b className="tabular-nums">{num(sold.length)}</b> ออเดอร์
          </span>
          <span>
            <b className="tabular-nums">{baht(revenue)}</b>
          </span>
          <span>
            <b className="tabular-nums">{num(units)}</b> ชิ้น · {rows.length} SKU
          </span>
          {orders.length - sold.length > 0 && <span className="text-muted-foreground">ยกเลิก {orders.length - sold.length}</span>}
        </div>
        {platform === "all" && (
          <div className="flex flex-wrap gap-1.5">
            {byPlatform.map((x) => (
              <span key={x.p} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                <PlatformDot platform={x.p} className="size-4 text-[7px]" /> {x.n} · {baht(x.rev)}
              </span>
            ))}
          </div>
        )}
      </div>
      {rows.length > 0 ? (
        <div className="px-4">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">สินค้าที่ขายได้ (เรียงตามจำนวนชิ้น)</div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map(([sku, v], i) => (
              <div key={sku} className="flex items-center gap-2.5 rounded-lg border p-2">
                <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <ProductThumb sku={sku} className="size-10" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm">{productBySku(sku).name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {v.orders} ออเดอร์ · {baht(v.rev)}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">×{v.qty}</span>
              </div>
            ))}
          </div>
          {rows.length > 6 && (
            <button className="mt-2 text-xs text-primary hover:underline" onClick={() => setShowAll((x) => !x)}>
              {showAll ? "ย่อ" : `ดูทั้งหมด ${rows.length} SKU`}
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 text-sm text-muted-foreground">ยังไม่มียอดขายในช่วงนี้</div>
      )}
    </Card>
  )
}
