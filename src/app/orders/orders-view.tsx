"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Hand, Lock, ChevronDown, ClipboardList, Combine, Download, Printer, RefreshCw, Search, X } from "lucide-react"
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
import { PAYMENT_LABEL, PLATFORMS, PLATFORM_IDS, SHOPS, STATUSES, STATUS_IDS, orderTotal, productBySku, shopById, type OrderStatus } from "@/lib/mock-data"
import { baht, dateTime, dueIn, num } from "@/lib/format"
import { cn } from "@/lib/utils"


export function OrdersView() {
  const params = useSearchParams()
  const { orders, customers, printLabels, setStatus, mergeOrders, claimOrders, lockedBy, me } = useOms()
  const [owner, setOwner] = React.useState("all")
  const [statusParam, setStatusParam] = useQueryParam("status")
  const tab = (statusParam as OrderStatus | "all" | null) ?? "to_process"
  const setTab = (s: OrderStatus | "all") => setStatusParam(s)
  const [platform, setPlatform] = React.useState("all")
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

  React.useEffect(() => setPage(0), [tab, platform, shop, payment, q])

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
            <Button render={<Link href="/orders/new" />}>+ สร้างออเดอร์</Button>
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
        {(platform !== "all" || shop !== "all" || payment !== "all" || q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPlatform("all")
              setShop("all")
              setPayment("all")
              setQ("")
            }}
          >
            <X /> ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
          <span className="px-2 text-sm font-medium">เลือก {selected.size} ออเดอร์</span>
          <Button
            size="sm"
            onClick={() => {
              const done = printLabels([...selected])
              if (done.length) toast.success(`พิมพ์ใบปะหน้า ${done.length} ใบ`, { description: "ออเดอร์ที่ “รอจัดการ” ถูกย้ายไป “รอแพ็ก” และรับงานเป็นของคุณ" })
              clear()
            }}
          >
            <Printer /> พิมพ์ใบปะหน้า
          </Button>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} aria-label={`เลือก ${o.id}`} />
                    </TableCell>
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
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
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
