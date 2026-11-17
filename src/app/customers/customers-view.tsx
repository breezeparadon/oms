"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Ban, Crown, MessageCircle, Search, ShoppingBag, Users, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CopyLinkButton, FilterSelect, Kpi, PageHeader, PlatformDot, Pill, ProductThumb, StatusBadge, TierBadge, initials } from "@/components/oms/bits"
import { useQueryParam } from "@/components/oms/use-query-param"
import { useOms } from "@/components/oms/store"
import { Pager } from "@/components/oms/pager"
import { useCrmLinks, useCrmOnly } from "@/components/oms/crm-mode"
import { DAY, NOW, PLATFORMS, PLATFORM_IDS, TIERS, orderTotal, productBySku, type Tier } from "@/lib/mock-data"
import { ago, baht, dateOnly, dateTime, num } from "@/lib/format"


export function CustomersView() {
  const { customers, orders, conversations, updateCustomer } = useOms()
  const crm = useCrmOnly()
  const links = useCrmLinks()
  const [q, setQ] = React.useState("")
  const [platform, setPlatform] = React.useState("all")
  const [tier, setTier] = React.useState("all")
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(25)
  const [openId, setOpenId] = useQueryParam("id")
  const [noteDraft, setNoteDraft] = React.useState("")


  const stats = React.useMemo(() => {
    const m = new Map<string, { orders: number; spend: number; last: number }>()
    for (const o of orders) {
      const s = m.get(o.customerId) ?? { orders: 0, spend: 0, last: 0 }
      s.orders++
      if (o.status !== "cancelled") s.spend += orderTotal(o)
      s.last = Math.max(s.last, o.createdAt)
      m.set(o.customerId, s)
    }
    return m
  }, [orders])

  // CRM-only edition: activity comes from chats, not orders
  const chatStats = React.useMemo(() => {
    const m = new Map<string, { convs: number; open: number; last: number }>()
    for (const c of conversations) {
      const s = m.get(c.customerId) ?? { convs: 0, open: 0, last: 0 }
      s.convs++
      if (c.status !== "closed") s.open++
      s.last = Math.max(s.last, c.messages[c.messages.length - 1].at)
      m.set(c.customerId, s)
    }
    return m
  }, [conversations])

  const list = customers
    .filter(
      (c) =>
        (platform === "all" || c.identities.some((i) => i.platform === platform)) &&
        (tier === "all" || c.tier === tier) &&
        (!q || c.name.includes(q) || c.phone.replace(/-/g, "").includes(q.replace(/-/g, "")) || c.identities.some((i) => i.handle.toLowerCase().includes(q.toLowerCase()))),
    )
    .sort((a, b) => (crm ? (chatStats.get(b.id)?.last ?? 0) - (chatStats.get(a.id)?.last ?? 0) : (stats.get(b.id)?.spend ?? 0) - (stats.get(a.id)?.spend ?? 0)))
  const pageList = list.slice(page * pageSize, page * pageSize + pageSize)
  React.useEffect(() => setPage(0), [q, platform, tier])

  const multi = customers.filter((c) => c.identities.length > 1).length
  const repeat = customers.filter((c) => (stats.get(c.id)?.orders ?? 0) > 1).length
  const newThisMonth = customers.filter((c) => c.joinedAt > NOW - 30 * DAY).length

  const open = customers.find((c) => c.id === openId) ?? null
  const openOrders = open ? orders.filter((o) => o.customerId === open.id) : []
  const openConvs = open ? conversations.filter((c) => c.customerId === open.id) : []
  const openStat = open ? stats.get(open.id) : undefined
  const openChat = open ? chatStats.get(open.id) : undefined
  const withOpenChat = customers.filter((c) => (chatStats.get(c.id)?.open ?? 0) > 0).length

  React.useEffect(() => setNoteDraft(open?.note ?? ""), [open?.id, open?.note])

  return (
    <div className="space-y-4">
      <PageHeader
        title="ข้อมูลลูกค้า (CRM)"
        description={
          crm
            ? "รวมลูกค้าจากทุกช่องทางเป็นโปรไฟล์เดียว — เห็นแชททุกช่องทาง แท็ก โน้ต และบัญชีดำในที่เดียว (เวอร์ชัน CRM ไม่มีข้อมูลการซื้อ)"
            : "รวมลูกค้าจากทุกช่องทางเป็นโปรไฟล์เดียว (จับคู่ด้วยเบอร์โทร/ที่อยู่) — เห็นประวัติซื้อและแชทครบในที่เดียว"
        }
        actions={
          <Button variant="outline" onClick={() => toast("นำเข้าลูกค้าจาก Excel/CSV (จำลอง)")}>
            <UserPlus /> นำเข้าลูกค้า
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="ลูกค้าทั้งหมด" value={num(customers.length)} hint={`ใหม่ 30 วัน ${newThisMonth} คน`} icon={<Users />} />
        {crm ? (
          <Kpi label="มีแชทเปิดอยู่" value={num(withOpenChat)} hint="ลูกค้าที่ยังคุยค้างอยู่" icon={<MessageCircle />} tone="good" />
        ) : (
          <Kpi label="ซื้อซ้ำ (>1 ออเดอร์)" value={num(repeat)} hint={`${Math.round((repeat / customers.length) * 100)}% ของลูกค้าทั้งหมด`} icon={<ShoppingBag />} tone="good" />
        )}
        <Kpi label="ใช้หลายช่องทาง" value={num(multi)} hint="รวมโปรไฟล์อัตโนมัติแล้ว" icon={<MessageCircle />} />
        <Kpi label="VIP / Gold" value={num(customers.filter((c) => c.tier === "vip" || c.tier === "gold").length)} hint={`บัญชีดำ ${customers.filter((c) => c.blacklisted).length} คน`} icon={<Crown />} tone="warn" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ชื่อ / เบอร์โทร / ชื่อบัญชีโซเชียล" className="pl-8" />
        </div>
        <FilterSelect value={platform} onChange={setPlatform} options={[{ value: "all", label: "ทุกช่องทาง" }, ...PLATFORM_IDS.map((p) => ({ value: p, label: PLATFORMS[p].name }))]} />
        <FilterSelect value={tier} onChange={setTier} options={[{ value: "all", label: "ทุกระดับ" }, ...(Object.keys(TIERS) as Tier[]).map((t) => ({ value: t, label: TIERS[t].label }))]} />
      </div>

      <Card className="py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ช่องทาง</TableHead>
                <TableHead>ระดับ</TableHead>
                {crm ? (
                  <>
                    <TableHead className="text-right">ห้องแชท</TableHead>
                    <TableHead>คุยล่าสุด</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">ออเดอร์</TableHead>
                    <TableHead className="text-right">ยอดซื้อสะสม</TableHead>
                    <TableHead>ซื้อล่าสุด</TableHead>
                  </>
                )}
                <TableHead>แท็ก</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageList.map((c) => {
                const s = stats.get(c.id)
                const cs = chatStats.get(c.id)
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">{initials(c.name)}</div>
                        <div>
                          <div className="flex items-center gap-1 font-medium">
                            {c.name}
                            {c.blacklisted && <Ban className="size-3.5 text-rose-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.phone} · {c.province}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {c.identities.map((i) => (
                          <PlatformDot key={i.platform} platform={i.platform} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={c.tier} />
                    </TableCell>
                    {crm ? (
                      <>
                        <TableCell className="text-right tabular-nums">{cs?.convs ?? 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{cs?.last ? ago(cs.last) : "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right tabular-nums">{s?.orders ?? 0}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{baht(s?.spend ?? 0)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s?.last ? ago(s.last) : "—"}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <Pill key={t} className="bg-muted text-[11px]">
                            {t}
                          </Pill>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <Pager page={page} pageSize={pageSize} total={list.length} onPage={setPage} onPageSize={setPageSize} unit="คน" />
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {open.name} <TierBadge tier={open.tier} />
                  <CopyLinkButton className="ml-auto mr-6" />
                </SheetTitle>
                <SheetDescription>
                  รหัสลูกค้า {open.id} · เป็นลูกค้าตั้งแต่ {dateOnly(open.joinedAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6 text-sm">
                {crm ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted p-2">
                      <div className="text-xs text-muted-foreground">ห้องแชท</div>
                      <div className="font-semibold">{openChat?.convs ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <div className="text-xs text-muted-foreground">ช่องทาง</div>
                      <div className="font-semibold">{open.identities.length}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <div className="text-xs text-muted-foreground">คุยล่าสุด</div>
                      <div className="font-semibold">{openChat?.last ? ago(openChat.last) : "—"}</div>
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">ยอดซื้อสะสม</div>
                    <div className="font-semibold">{baht(openStat?.spend ?? 0)}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">ออเดอร์</div>
                    <div className="font-semibold">{openStat?.orders ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">เฉลี่ย/ออเดอร์</div>
                    <div className="font-semibold">{baht(openStat?.orders ? openStat.spend / openStat.orders : 0)}</div>
                  </div>
                </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">ข้อมูลติดต่อ</div>
                    <div>{open.phone}</div>
                    {open.email && <div>{open.email}</div>}
                    <div className="text-muted-foreground">
                      {open.address} {open.district} {open.province} {open.zip}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">บัญชีที่เชื่อมกัน</div>
                    {open.identities.map((i) => (
                      <div key={i.platform} className="flex items-center gap-2">
                        <PlatformDot platform={i.platform} />
                        <span className="truncate">{i.handle}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">{crm ? "ระดับลูกค้า (แอดมินตั้งเอง — ไม่มียอดซื้อให้คำนวณ)" : "ระดับลูกค้า"}</div>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(TIERS) as Tier[]).map((t) => (
                      <button key={t} onClick={() => updateCustomer(open.id, { tier: t })} className={open.tier === t ? "rounded-full ring-2 ring-primary" : "rounded-full opacity-60 hover:opacity-100"}>
                        <TierBadge tier={t} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bl" className="text-rose-600">
                      {crm ? "บัญชีดำ (ลูกค้าที่ต้องระวัง)" : "บัญชีดำ (ห้ามส่ง COD)"}
                    </Label>
                    <Switch
                      id="bl"
                      checked={open.blacklisted}
                      onCheckedChange={(v) => {
                        updateCustomer(open.id, { blacklisted: v })
                        toast(v ? "เพิ่มเข้าบัญชีดำแล้ว" : "นำออกจากบัญชีดำแล้ว")
                      }}
                    />
                  </div>
                  <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="โน้ตภายในทีม เช่น ชอบให้ห่อของขวัญ, โทรก่อนส่ง" />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={noteDraft === open.note}
                    onClick={() => {
                      updateCustomer(open.id, { note: noteDraft })
                      toast.success("บันทึกโน้ตแล้ว")
                    }}
                  >
                    บันทึกโน้ต
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {openConvs[0] && (
                    <Button variant="outline" render={<Link href={`${links.inbox}?c=${openConvs[0].id}`} />}>
                      <MessageCircle /> เปิดแชท
                    </Button>
                  )}
                  {!crm && (
                    <Button render={<Link href={`/orders/new?customer=${open.id}${openConvs[0] ? `&conv=${openConvs[0].id}` : ""}`} />}>
                      <ShoppingBag /> สร้างออเดอร์
                    </Button>
                  )}
                </div>

                {!crm && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">ประวัติการซื้อ ({openOrders.length})</div>
                  <div className="divide-y rounded-lg border">
                    {openOrders.map((o) => (
                      <div key={o.id} className="p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <PlatformDot platform={o.platform} className="size-4 text-[7px]" />
                            {o.id}
                          </span>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="flex shrink-0 -space-x-2">
                              {o.items.slice(0, 3).map((i) => (
                                <ProductThumb key={i.sku} sku={i.sku} className="size-8 ring-2 ring-background" />
                              ))}
                            </span>
                            <span className="truncate">{o.items.map((i) => productBySku(i.sku).name).join(", ")}</span>
                          </span>
                          <span className="shrink-0">
                            {baht(orderTotal(o))} · {dateOnly(o.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {openConvs.map((cv) => (
                  <div key={cv.id} className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">แชทล่าสุดผ่าน {PLATFORMS[cv.platform].name}</div>
                    <div className="space-y-1.5 rounded-lg border bg-muted/40 p-2.5">
                      {cv.messages.slice(-3).map((m) => (
                        <div key={m.id} className="text-xs">
                          <span className="font-medium">{m.from === "customer" ? open.name.split(" ")[0] : m.from === "agent" ? m.agent : "ระบบ"}:</span> {m.text}
                          <span className="ml-1 text-muted-foreground">{dateTime(m.at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
