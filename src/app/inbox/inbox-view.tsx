"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Check, Megaphone, PackageSearch, Radio, ShoppingCart, Ticket, Image as ImageIcon, MessageSquareReply, Paperclip, Search, Send, ShoppingBag, Sparkles, Tag, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FilterSelect, PlatformDot, Pill, ProductThumb, StatusBadge, TierBadge, initials } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { AGENTS, CHAT_LABELS, CHAT_SOURCE, PLATFORMS, PLATFORM_IDS, QUICK_REPLIES, messagePreview, productBySku, orderTotal, shopById, type Conversation } from "@/lib/mock-data"
import { ago, baht, dateOnly, timeOnly } from "@/lib/format"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread" | "pending" | "unassigned" | "closed"

export function InboxView() {
  const params = useSearchParams()
  const { conversations, customers, orders, products, sendMessage, updateConversation } = useOms()
  const [activeId, setActiveId] = React.useState<string | null>(params.get("c"))
  const [platform, setPlatform] = React.useState("all")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [q, setQ] = React.useState("")
  const [text, setText] = React.useState("")
  const threadRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const c = params.get("c")
    if (c) setActiveId(c)
  }, [params])

  const custMap = React.useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])
  const sorted = [...conversations].sort((a, b) => b.messages[b.messages.length - 1].at - a.messages[a.messages.length - 1].at)
  const list = sorted.filter((c) => {
    if (platform !== "all" && c.platform !== platform) return false
    if (q && !custMap.get(c.customerId)!.name.includes(q) && !c.messages.some((m) => m.text.includes(q))) return false
    if (filter === "unread") return c.unread > 0 && c.status !== "closed"
    if (filter === "pending") return c.status === "pending"
    if (filter === "unassigned") return !c.assignee && c.status !== "closed"
    if (filter === "closed") return c.status === "closed"
    return c.status !== "closed"
  })
  const active = conversations.find((c) => c.id === activeId) ?? null
  const customer = active ? custMap.get(active.customerId)! : null
  const custOrders = customer ? orders.filter((o) => o.customerId === customer.id) : []
  const spend = custOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + orderTotal(o), 0)

  React.useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, active?.messages.length])

  React.useEffect(() => {
    if (active && active.unread > 0) updateConversation(active.id, { unread: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  const counts: Record<Filter, number> = {
    all: conversations.filter((c) => c.status !== "closed").length,
    unread: conversations.filter((c) => c.unread > 0 && c.status !== "closed").length,
    pending: conversations.filter((c) => c.status === "pending").length,
    unassigned: conversations.filter((c) => !c.assignee && c.status !== "closed").length,
    closed: conversations.filter((c) => c.status === "closed").length,
  }

  const send = (t: string) => {
    if (!active || !t.trim()) return
    const latest = custOrders.find((o) => o.tracking)
    sendMessage(active.id, t.replace("{tracking}", latest?.tracking ?? "TH0000000"))
    setText("")
  }

  const simulateIncoming = () => {
    const target = sorted.find((c) => c.status !== "closed" && c.id !== activeId) ?? sorted[0]
    sendMessage(target.id, "สวัสดีค่ะ สอบถามสินค้าหน่อยค่ะ", "customer")
    updateConversation(target.id, { unread: (target.unread || 0) + 1, status: "open" })
    toast(`ข้อความใหม่จาก ${PLATFORMS[target.platform].name}`, { description: custMap.get(target.customerId)!.name })
  }

  return (
    <div className="-m-4 flex h-[calc(100svh-3.5rem)] overflow-hidden md:-m-6">
      {/* Conversation list */}
      <aside className={cn("flex w-full shrink-0 flex-col border-r bg-background md:w-80", active && "hidden md:flex")}>
        <div className="space-y-2 border-b p-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">แชทรวมทุกช่องทาง</div>
            <Button size="xs" variant="ghost" onClick={simulateIncoming} title="จำลองข้อความเข้า">
              <Sparkles /> จำลอง
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / ข้อความ" className="pl-8" />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <button onClick={() => setPlatform("all")} className={cn("shrink-0 rounded-md border px-2 py-1 text-xs", platform === "all" && "border-primary bg-primary text-primary-foreground")}>
              ทั้งหมด
            </button>
            {PLATFORM_IDS.map((p) => (
              <button key={p} onClick={() => setPlatform(p)} title={PLATFORMS[p].name} className={cn("shrink-0 rounded-md border p-0.5", platform === p && "border-primary ring-2 ring-primary/30")}>
                <PlatformDot platform={p} />
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto text-xs">
            {(
              [
                ["all", "เปิดอยู่"],
                ["unread", "ยังไม่ตอบ"],
                ["unassigned", "ไม่มีคนดูแล"],
                ["pending", "รอลูกค้า"],
                ["closed", "ปิดแล้ว"],
              ] as [Filter, string][]
            ).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={cn("shrink-0 rounded-full px-2 py-1", filter === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                {label} {counts[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.map((c) => {
            const cust = custMap.get(c.customerId)!
            const last = c.messages[c.messages.length - 1]
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={cn("flex w-full items-start gap-3 border-b px-3 py-2.5 text-left hover:bg-muted/60", activeId === c.id && "bg-muted")}>
                <div className="relative">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 font-semibold text-slate-700 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200">{initials(cust.name)}</div>
                  <PlatformDot platform={c.platform} className="absolute -right-1 -bottom-1 size-4 text-[7px] ring-2 ring-background" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{cust.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{ago(last.at).replace("ที่แล้ว", "")}</span>
                  </div>
                  <div className={cn("truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>
                    {last.from === "agent" && "คุณ: "}
                    {messagePreview(last)}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {c.labels.map((l) => (
                      <span key={l} className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
                        {l}
                      </span>
                    ))}
                    {!c.assignee && c.status !== "closed" && <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">ไม่มีคนดูแล</span>}
                    {c.unread > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{c.unread}</span>}
                  </div>
                </div>
              </button>
            )
          })}
          {list.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">ไม่มีแชท</div>}
        </div>
      </aside>

      {/* Thread */}
      <section className={cn("flex min-w-0 flex-1 flex-col bg-muted/30", !active && "hidden md:flex")}>
        {active && customer ? (
          <>
            <div className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
              <Button size="icon-sm" variant="ghost" className="md:hidden" onClick={() => setActiveId(null)}>
                <ArrowLeft />
              </Button>
              <PlatformDot platform={active.platform} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{customer.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {active.platform && customer.identities.find((i) => i.platform === active.platform)?.handle} · {shopById(active.shopId).name}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
                  <UserRound /> {active.assignee ?? "มอบหมาย"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>มอบหมายให้</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {AGENTS.map((a) => (
                      <DropdownMenuItem key={a} onClick={() => updateConversation(active.id, { assignee: a })}>
                        {a}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button size="sm" variant="outline" className="hidden sm:inline-flex" />}>
                  <Tag /> ป้าย
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    {CHAT_LABELS.map((l) => (
                      <DropdownMenuItem key={l} onClick={() => updateConversation(active.id, { labels: active.labels.includes(l) ? active.labels.filter((x) => x !== l) : [...active.labels, l] })}>
                        {active.labels.includes(l) && <Check />} {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant={active.status === "closed" ? "outline" : "default"}
                onClick={() => {
                  updateConversation(active.id, { status: active.status === "closed" ? "open" : "closed", unread: 0 })
                  toast.success(active.status === "closed" ? "เปิดแชทอีกครั้ง" : "ปิดแชทแล้ว")
                }}
              >
                {active.status === "closed" ? "เปิดใหม่" : "ปิดแชท"}
              </Button>
            </div>

            {active.context && <ContextBanner conv={active} />}

            <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="text-center text-[11px] text-muted-foreground">{dateOnly(active.messages[0].at)}</div>
              {active.messages.map((m) =>
                m.product ? (
                  <div key={m.id} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
                    <ProductCardBubble sku={m.product} platform={active.platform} mine={m.from === "agent"} at={m.at} agent={m.agent} />
                  </div>
                ) : m.coupon ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="w-64 overflow-hidden rounded-2xl rounded-br-sm bg-background shadow-sm ring-1 ring-primary/30">
                      <div className="flex items-center gap-2 bg-brand-gradient px-3 py-2 text-white">
                        <Ticket className="size-4" />
                        <span className="text-sm font-semibold">{m.coupon}</span>
                      </div>
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        {m.text}
                        <div className="mt-1 text-[10px]">
                          {m.agent} · {timeOnly(m.at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : m.from === "system" ? (
                  <div key={m.id} className="flex justify-center">
                    <span className="flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground ring-1 ring-border">
                      <ImageIcon className="size-3.5" /> {m.text}
                    </span>
                  </div>
                ) : (
                  <div key={m.id} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm", m.from === "agent" ? "rounded-br-sm bg-brand-gradient text-white" : "rounded-bl-sm bg-background ring-1 ring-border")}>
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      <div className={cn("mt-1 text-[10px]", m.from === "agent" ? "text-white/75" : "text-muted-foreground")}>
                        {m.agent && `${m.agent} · `}
                        {timeOnly(m.at)}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="border-t bg-background p-3">
              <div className="mb-2 flex gap-1 overflow-x-auto">
                {QUICK_REPLIES.map((r) => (
                  <button key={r} onClick={() => setText(r)} className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted" title={r}>
                    <MessageSquareReply className="mr-1 inline size-3" />
                    {r.slice(0, 22)}…
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(text)
                }}
                className="flex items-end gap-2"
              >
                <Button type="button" size="icon" variant="ghost" aria-label="แนบไฟล์">
                  <Paperclip />
                </Button>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      send(text)
                    }
                  }}
                  rows={1}
                  placeholder={`ตอบกลับผ่าน ${PLATFORMS[active.platform].name}… (Enter เพื่อส่ง)`}
                  className="max-h-32 min-h-9 flex-1 resize-none"
                />
                <Button type="submit" size="icon" aria-label="ส่ง" disabled={!text.trim()}>
                  <Send />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquareReply className="size-10 opacity-40" />
            <div className="text-sm">เลือกแชทจากรายการด้านซ้าย</div>
            <div className="text-xs">รวมแชทจาก Shopee · Lazada · TikTok · LINE OA · Facebook · Instagram</div>
          </div>
        )}
      </section>

      {/* Customer panel */}
      {active && customer && (
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l bg-background xl:flex">
          <div className="space-y-4 p-4 text-sm">
            <div className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xl font-semibold text-slate-700 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200">{initials(customer.name)}</div>
              <div className="mt-2 font-semibold">{customer.name}</div>
              <div className="mt-1 flex justify-center gap-1">
                <TierBadge tier={customer.tier} />
                {customer.blacklisted && <Pill className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">บัญชีดำ</Pill>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted p-2">
                <div className="text-xs text-muted-foreground">ยอดซื้อสะสม</div>
                <div className="font-semibold">{baht(spend)}</div>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <div className="text-xs text-muted-foreground">ออเดอร์</div>
                <div className="font-semibold">{custOrders.length}</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">ข้อมูลติดต่อ</div>
              <div>{customer.phone}</div>
              {customer.email && <div className="text-muted-foreground">{customer.email}</div>}
              <div className="text-muted-foreground">
                {customer.address} {customer.district} {customer.province} {customer.zip}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">บัญชีที่เชื่อมกัน (รวมเป็นคนเดียว)</div>
              {customer.identities.map((i) => (
                <div key={i.platform} className="flex items-center gap-2">
                  <PlatformDot platform={i.platform} />
                  <span className="truncate">{i.handle}</span>
                </div>
              ))}
            </div>
            {(customer.tags.length > 0 || customer.note) && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">แท็ก / โน้ต</div>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((t) => (
                    <Pill key={t} className="bg-muted">
                      {t}
                    </Pill>
                  ))}
                </div>
                {customer.note && <div className="text-xs text-rose-600">{customer.note}</div>}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">ออเดอร์ล่าสุด</div>
                <Link href={`/customers?id=${customer.id}`} className="text-xs text-primary hover:underline">
                  ดูทั้งหมด
                </Link>
              </div>
              {custOrders.slice(0, 4).map((o) => (
                <Link key={o.id} href={`/orders?status=${o.status}`} className="block rounded-lg border p-2 hover:bg-muted">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <PlatformDot platform={o.platform} className="size-4 text-[7px]" /> {o.id}
                    </span>
                    <span className="text-xs">{baht(orderTotal(o))}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusBadge status={o.status} />
                    <span className="text-[11px] text-muted-foreground">{dateOnly(o.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
            {PLATFORMS[active.platform].kind === "social" ? (
              <div className="space-y-2 rounded-xl bg-brand-soft p-3">
                <div className="text-xs">
                  <span className="font-semibold">{PLATFORMS[active.platform].name}</span> ไม่มีระบบตะกร้า — ปิดการขายในแชท แล้วสร้างออเดอร์ที่นี่ ออเดอร์จะเข้าสู่ขั้นตอนแพ็ก/ส่งเหมือน marketplace
                </div>
                <Button className="w-full" render={<Link href={`/orders/new?customer=${customer.id}&conv=${active.id}&platform=${active.platform}${active.context?.sku ? `&sku=${active.context.sku}` : ""}`} />}>
                  <ShoppingBag /> สร้างออเดอร์จากแชทนี้
                </Button>
                {active.context?.sku && <div className="text-center text-[11px] text-muted-foreground">ใส่ “{productBySku(active.context.sku).name.slice(0, 28)}…” ให้อัตโนมัติ</div>}
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-dashed p-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{PLATFORMS[active.platform].name}</span> มีตะกร้าในแพลตฟอร์ม — ลูกค้ากดสั่งเอง แล้วออเดอร์จะ<span className="font-medium text-foreground">ดึงเข้า OMS อัตโนมัติ</span> (ไม่ต้องสร้างซ้ำ) แอดมินช่วยปิดการขายด้วยการส่งการ์ดสินค้า/คูปอง
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                      <PackageSearch /> ส่งการ์ดสินค้า
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>เลือกสินค้าที่จะส่งให้ลูกค้า</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {products
                          .filter((p) => p.price > 0 && p.listings[active.platform])
                          .sort((a, b) => (a.sku === active.context?.sku ? -1 : b.sku === active.context?.sku ? 1 : 0))
                          .slice(0, 10)
                          .map((p) => (
                            <DropdownMenuItem
                              key={p.sku}
                              onClick={() => {
                                sendMessage(active.id, "", "agent", { product: p.sku })
                                toast.success("ส่งการ์ดสินค้าแล้ว", { description: `ลูกค้ากดจากการ์ดเพื่อสั่งใน ${PLATFORMS[active.platform].name} ได้ทันที` })
                              }}
                            >
                              <ProductThumb sku={p.sku} className="size-8" />
                              <span className="line-clamp-2 text-xs">{p.name}</span>
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      sendMessage(active.id, `ใช้ได้กับคำสั่งซื้อขั้นต่ำ ฿500 · หมดอายุใน 3 วัน — กดเก็บแล้วใช้ตอนชำระเงินใน ${PLATFORMS[active.platform].name}`, "agent", { coupon: "ส่วนลด ฿50 สำหรับคุณ" })
                      toast.success("ส่งคูปองแล้ว")
                    }}
                  >
                    <Ticket /> ส่งคูปอง
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

function ProductCardBubble({ sku, platform, mine, at, agent }: { sku: string; platform: Conversation["platform"]; mine: boolean; at: number; agent?: string }) {
  const p = productBySku(sku)
  return (
    <div className={cn("w-72 overflow-hidden rounded-2xl bg-background shadow-sm ring-1 ring-border", mine ? "rounded-br-sm" : "rounded-bl-sm")}>
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
        <PlatformDot platform={platform} className="size-4 text-[7px]" /> {mine ? "แอดมินส่งการ์ดสินค้า" : "ลูกค้าสอบถามสินค้านี้"}
      </div>
      <div className="flex gap-3 p-3">
        <ProductThumb sku={sku} className="size-16" />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm">{p.name}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-semibold text-primary">{baht(p.price)}</span>
            {p.fullPrice > p.price && <span className="text-[11px] text-muted-foreground line-through">{baht(p.fullPrice)}</span>}
          </div>
        </div>
      </div>
      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
        {agent && `${agent} · `}
        {timeOnly(at)}
      </div>
    </div>
  )
}

function ContextBanner({ conv }: { conv: Conversation }) {
  const { orders, reserved } = useOms()
  const ctx = conv.context!
  const icon = ctx.source === "ad" || ctx.source === "broadcast" ? <Megaphone className="size-4" /> : ctx.source === "live" ? <Radio className="size-4" /> : ctx.source === "order_page" ? <ShoppingCart className="size-4" /> : <PackageSearch className="size-4" />
  const order = ctx.orderId ? orders.find((o) => o.id === ctx.orderId) : undefined
  const p = ctx.sku ? productBySku(ctx.sku) : undefined
  const avail = p ? p.stock.bkk + p.stock.cnx - reserved(p.sku) : 0
  return (
    <div className="flex items-center gap-3 border-b bg-accent/40 px-4 py-2 text-xs">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          ที่มา: {CHAT_SOURCE[ctx.source]}
          {ctx.campaign && <span className="font-normal text-muted-foreground"> · แคมเปญ “{ctx.campaign}”</span>}
        </div>
        {p && (
          <div className="truncate text-muted-foreground">
            สินค้า: {p.name} · {baht(p.price)} · <span className={avail <= p.safety ? "text-amber-600" : ""}>{avail <= 0 ? "หมดสต๊อก" : `คงเหลือ ${avail}`}</span>
          </div>
        )}
        {order && (
          <div className="truncate text-muted-foreground">
            ออเดอร์: {order.id} · {baht(orderTotal(order))} · <StatusBadge status={order.status} /> {order.tracking && <span className="font-mono">· {order.tracking}</span>}
          </div>
        )}
      </div>
      {p && <ProductThumb sku={p.sku} className="size-9" />}
      {order && (
        <Link href={`/orders?status=${order.status}`} className="shrink-0 text-primary hover:underline">
          ดูออเดอร์
        </Link>
      )}
    </div>
  )
}

export type { Conversation }
