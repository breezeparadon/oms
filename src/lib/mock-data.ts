// Deterministic mock data for the OMS + CRM mockup.
// Seeded PRNG + fixed "now" so server and client render identically.

export const NOW = new Date("2026-11-16T14:30:00+07:00").getTime()
export const HOUR = 3600_000
export const DAY = 24 * HOUR
const MIN = 60_000

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261116)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const shuffle = <T,>(arr: readonly T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- Platforms ----------
export type PlatformId = "shopee" | "lazada" | "tiktok" | "lineoa" | "facebook" | "instagram"

export const PLATFORMS: Record<PlatformId, { name: string; short: string; color: string; kind: "marketplace" | "social" }> = {
  shopee: { name: "Shopee", short: "SP", color: "#EE4D2D", kind: "marketplace" },
  lazada: { name: "Lazada", short: "LZ", color: "#0F146D", kind: "marketplace" },
  tiktok: { name: "TikTok Shop", short: "TT", color: "#111111", kind: "marketplace" },
  lineoa: { name: "LINE OA", short: "LN", color: "#06C755", kind: "social" },
  facebook: { name: "Facebook", short: "FB", color: "#1877F2", kind: "social" },
  instagram: { name: "Instagram", short: "IG", color: "#C13584", kind: "social" },
}
export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[]

export type Shop = { id: string; platform: PlatformId; name: string; connected: boolean; lastSync: number; tokenExpiresInDays: number }
export const SHOPS: Shop[] = [
  { id: "sp-main", platform: "shopee", name: "Happy Shopping Official (Shopee)", connected: true, lastSync: NOW - 2 * MIN, tokenExpiresInDays: 312 },
  { id: "sp-outlet", platform: "shopee", name: "Happy Shopping Outlet (Shopee)", connected: true, lastSync: NOW - 4 * MIN, tokenExpiresInDays: 5 },
  { id: "lz-main", platform: "lazada", name: "Happy Shopping LazMall", connected: true, lastSync: NOW - 3 * MIN, tokenExpiresInDays: 120 },
  { id: "tt-main", platform: "tiktok", name: "Happy Shopping TikTok Shop", connected: true, lastSync: NOW - 1 * MIN, tokenExpiresInDays: 64 },
  { id: "ln-main", platform: "lineoa", name: "@happyshopping (LINE OA)", connected: true, lastSync: NOW - 30_000, tokenExpiresInDays: 365 },
  { id: "fb-main", platform: "facebook", name: "Happy Shopping Thailand (Page)", connected: true, lastSync: NOW - 50_000, tokenExpiresInDays: 58 },
  { id: "ig-main", platform: "instagram", name: "@happyshopping.th", connected: true, lastSync: NOW - 2 * HOUR, tokenExpiresInDays: 2 },
]
export const shopById = (id: string) => SHOPS.find((s) => s.id === id)!

// ---------- Products / inventory (40 SKUs — real catalogue from happyshoppingofficial.com) ----------
export type Product = {
  sku: string
  name: string
  brand: string
  group: string // ความงาม | อาหารเสริม | ของแถม
  category: string
  price: number
  fullPrice: number
  cost: number
  image?: string
  stock: { bkk: number; cnx: number }
  safety: number
  listings: Partial<Record<PlatformId, { listingId: string; synced: boolean }>>
}

// [sku, name, brand, group, category, price, fullPrice]
const PRODUCT_SEED: [string, string, string, string, string, number, number][] = [
  ["100220057", "Sukaya แชมพูสมุนไพร เรด จินเส็ง 150มล. 4 แถม 4ขวด+สบู่ 20ก. 8ก้อน", "สุขกายะ", "ความงาม", "ผลิตภัณฑ์ดูแลเส้นผม", 999, 5992],
  ["100220054", "On Anong มิราเคิล ออร่า ชายน์ พาวเดอร์ SPF35PA+++ พร้อมของแถม No.03ผิวสองสี", "On Anong (อรอนงค์)", "ความงาม", "เครื่องสำอาง", 990, 6030],
  ["100220053", "On Anong มิราเคิล ออร่า ชายน์ พาวเดอร์ SPF35PA+++ พร้อมของแถม No.02ผิวขาว", "On Anong (อรอนงค์)", "ความงาม", "เครื่องสำอาง", 990, 6030],
  ["100220050", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (3+2แถม22) No.02 Natural (Ver.2)", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 9099],
  ["100220049", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (3+2แถม22) No.01 White (Ver.2)", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 9099],
  ["100220052", "DERAEY แป้งไดมอนด์ เนเชอรัล พาวเดอร์ SPF30PA+++ (2แถม18) No.D2 ผิวเข้ม", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 6982],
  ["100220051", "DERAEY แป้งไดมอนด์ เนเชอรัล พาวเดอร์ SPF30PA+++ (2แถม18) No.D1 ผิวสองสี", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 6982],
  ["100220044", "Suk Skin Herbs แชมพูสมุนไพร 150มล. 4 แถม 4ขวด", "Suk Skin herbs", "ความงาม", "ความงาม", 999, 3920],
  ["100220043", "Suk Skin Herbs สบู่ 60g.(แพ็ค8) 3กล่อง+ครีมอาบน้ำ 8ซอง+ถุงตีฟอง8ชิ้น", "Suk Skin herbs", "ความงาม", "ความงาม", 999, 9680],
  ["100210037", "Suk Skin Herbs สบู่เหลวสมุนไพร 300มล. 4 แถม 4ขวด", "Suk Skin herbs", "ความงาม", "ความงาม", 999, 5520],
  ["100250095", "DERAEY สบู่กัญชง (1ก้อน)", "DERAEY", "ความงาม", "ดูแลร่างกาย", 140, 590],
  ["100250097", "DERAEY GOLD NATURAL MIRACLE TWO WAY CAKE POWDER เบอร์02 (1แถม1 ตลับ)", "DERAEY", "ความงาม", "ความงาม", 279, 1180],
  ["100250096", "DERAEY GOLD NATURAL MIRACLE TWO WAY CAKE POWDER เบอร์01 (1แถม1 ตลับ)", "DERAEY", "ความงาม", "ความงาม", 279, 1180],
  ["100210039", "DERAEY คริสตัล เซรั่ม 50มล. 4ขวด+สบู่เซรั่ม 100ก. 4ก้อน+ของแถม9ชิ้น", "DERAEY", "ความงาม", "ดูแลผิวหน้า", 1000, 10022],
  ["100220045", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (5แถม22) No.01 White", "DERAEY", "ความงาม", "ความงาม", 1000, 7595],
  ["100220046", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (5แถม22) No.02 Natural", "DERAEY", "ความงาม", "ความงาม", 1000, 7595],
  ["300250012", "Yanhee SUNSCREEN SPF 50++++ White CREAM 30g. 1 หลอด", "Yanhee", "ความงาม", "ดูแลผิวหน้า", 219, 219],
  ["300250013", "Yanhee SUNSCREEN SPF 50++++ BEIGE CREAM 30g. 1 หลอด", "Yanhee", "ความงาม", "ดูแลผิวหน้า", 219, 219],
  ["100210030", "Madam Gold เซรั่มขมิ้นนมผึ้ง 30ml.", "Madam Gold", "ความงาม", "ดูแลผิวหน้า", 139, 390],
  ["100210029", "Madam Gold ครีมขมิ้นนมผึ้ง 50g.", "Madam Gold", "ความงาม", "ดูแลผิวหน้า", 190, 390],
  ["100110382", "สุภาพโอสถ ทวิน แบล็ค เทอร์เมอริค 30แคปซูล 6กระปุก", "สุภาพโอสถ", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหาร", 990, 3540],
  ["100110380", "สุภาพโอสถ อัลติมัส บำรุงดวงตา 30เม็ด 2แถม2กล่อง", "สุภาพโอสถ", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหาร", 1090, 3560],
  ["100110371", "สุภาพโอสถ บีเอสอาร์บี คอมเพล็กซ์ (30แคปซูล) 7กระปุก", "สุภาพโอสถ", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 1190, 3430],
  ["100110368", "Mplus ผลิตภัณฑ์เสริมอาหารชาย (20แคปซูล) 3แถม3กล่อง", "Mplus", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารและยา", 1090, 4740],
  ["100110369", "Activis taide ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพไต (30แคปซูล) 2แถม2กล่อง", "Activis taide", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารและยา", 1090, 4760],
  ["100110367", "Dii Klear ผลิตภัณฑ์เสริมอาหารบำรุงดวงตา (30แคปซูล) 2แถม1กล่อง", "Dii Klear", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารและยา", 1099, 2970],
  ["100110356", "สุภาพโอสถ น้ำมันงาดำรำข้าว 250แคปซูล+(6แคปซูล)2ซอง+กระเป๋านุ่มนิ่ม", "สุภาพโอสถ", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารและยา", 1190, 3098],
  ["100110364", "Suklife ผลิตภัณฑ์เสริมอาหารบำรุงสมอง บีสิบเจ็ดพลัส 20แคปซูล 6กระปุก", "Suklife", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 1090, 7740],
  ["100140196", "Donutt Collagen Dipeptide คอลลาเจนผสมรังนก120กรัม (1กระปุก)", "DONUTT", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 299, 490],
  ["100140201", "Donutt กลูต้าพลัส 30 แคปซูล (1แถม1)", "DONUTT", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 199, 580],
  ["100140200", "Donutt ไบโอ แมกนีเซียม คอมเพล็กซ์ 30แคปซูล+แอสต้าแซนธิน 30 แคปซูล (1แถม1)", "DONUTT", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 259, 819],
  ["100140199", "Donutt สารสกัดงาดำพลัสยูซีทู 30 แคปซูล (1กล่อง)", "DONUTT", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 199, 490],
  ["100140197", "Donutt ไบโอ แมกนีเซียม คอมเพล็กซ์ 30 แคปซูล (2กล่อง)", "DONUTT", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 299, 980],
  ["100140190", "B SHINE ไบโอ โปร ซี วิตามินซี 1000มก. พลัส บิลเบอร์รี่ 30เม็ด แพ็คคู่", "B SHINE", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 339, 640],
  ["100140191", "B SHINE ไบโอ โปร ซี วิตามินซี 1000มก. พลัส บิลเบอร์รี่ 30เม็ด แถมฟรี7เม็ด", "B SHINE", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 219, 369],
  ["100110349", "สุภาพโอสถ น้ำมันงาดำรำข้าว 250แคปซูล+(6แคปซูล)2ซอง+เบลล์รังนก45มล.4ขวด", "สุภาพโอสถ", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารและยา", 1190, 2828],
  ["100110348", "สุภาพโอสถ 4Mix Oilน้ำมันสกัดเย็น250แคปซูล+60แคปซูล+เบลล์รังนก45มล.4ขวด", "สุภาพโอสถ", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารและยา", 1090, 2770],
  ["100110354", "Suklife ผลิตภัณฑ์เสริมอาหาร เวล่า ออยล์(20แคปซูล) 3+3กล่อง", "Suklife", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 999, 7740],
  ["100110353", "Suklife ผลิตภัณฑ์เสริมอาหารแอปเปิ้ลไซเดอร์เวนีก้า พลัส(20แคปซูล) 3+3กล่อง", "Suklife", "อาหารเสริม", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 999, 4140],
  ["FREE-FOAM", "ถุงตีฟองสบู่ (ของแถม)", "Happy Shopping", "ของแถม", "ของแถม", 0, 0],
]

export const FREE_GIFT_SKU = "FREE-FOAM"
// Pick a few SKUs to be low / out of stock for the demo (by position so it is stable)
const LOW_STOCK = new Set([2, 9, 17, 24, 31].map((i) => PRODUCT_SEED[i][0]))
const OUT_OF_STOCK = new Set([PRODUCT_SEED[27][0]])

export const PRODUCTS: Product[] = PRODUCT_SEED.map(([sku, name, brand, group, category, price, fullPrice]) => {
  const listings: Product["listings"] = {}
  for (const p of PLATFORM_IDS) {
    if (sku === FREE_GIFT_SKU) continue
    if (p === "instagram" && rand() < 0.4) continue
    if (p === "lazada" && rand() < 0.15) continue
    listings[p] = { listingId: `${PLATFORMS[p].short}-${int(100000, 999999)}`, synced: rand() > 0.07 }
  }
  return {
    sku,
    name,
    brand,
    group,
    category,
    price,
    fullPrice,
    cost: sku === FREE_GIFT_SKU ? 12 : Math.round(price * (0.28 + rand() * 0.14)),
    image: sku === FREE_GIFT_SKU ? undefined : `/products/${sku}.jpg`,
    stock: OUT_OF_STOCK.has(sku) ? { bkk: 0, cnx: 0 } : LOW_STOCK.has(sku) ? { bkk: int(3, 9), cnx: int(0, 3) } : { bkk: int(60, 320), cnx: int(10, 90) },
    safety: LOW_STOCK.has(sku) ? 25 : 15,
    listings,
  }
})
export const productBySku = (sku: string) => PRODUCTS.find((p) => p.sku === sku)!

// ---------- Customers (CRM) — 22 per platform, some cross-platform ----------
export type Tier = "new" | "member" | "silver" | "gold" | "vip"
export const TIERS: Record<Tier, { label: string; className: string }> = {
  new: { label: "ลูกค้าใหม่", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  member: { label: "Member", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  silver: { label: "Silver", className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100" },
  gold: { label: "Gold", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  vip: { label: "VIP", className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
}

export type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  address: string
  district: string
  province: string
  zip: string
  identities: { platform: PlatformId; handle: string }[]
  tags: string[]
  tier: Tier
  blacklisted: boolean
  note: string
  joinedAt: number
}

const FIRST = ["สมชาย", "สมหญิง", "ณัฐพล", "พิมพ์ชนก", "กิตติพงษ์", "อรอุมา", "ธนากร", "วรรณา", "ปิยะ", "ศิริพร", "อนุชา", "จิราพร", "ภาณุ", "กมลวรรณ", "วีระ", "ชลธิชา", "ณัฐวุฒิ", "สุภาวดี", "ธีรภัทร", "รัตนา", "เอกชัย", "มาลี", "ปรีชา", "นภา", "ชยพล", "ดารุณี", "ศุภชัย", "ลลิตา", "ปวีณา", "ธนวัฒน์", "อภิญญา", "กฤษดา", "ชนิดา", "วรวุฒิ", "พรทิพย์", "สิทธิชัย", "เบญจมาศ", "ทศพล", "ปาริชาติ", "อัครพล", "ศศิธร", "ภัทรพล", "กัญญารัตน์", "ณัฐธิดา", "วิชัย", "สุนิสา", "จักรพันธ์", "ธิดารัตน์"]
const LAST = ["ใจดี", "รักไทย", "ศรีสุข", "มั่งมี", "ทองดี", "แสงทอง", "บุญมา", "วงศ์ใหญ่", "สุขสันต์", "พึ่งบุญ", "เจริญผล", "ปัญญาดี", "แก้วมณี", "ศรีวงศ์", "พรหมมา", "สมบูรณ์", "อินทร์แก้ว", "ชัยมงคล", "นาคสวัสดิ์", "รุ่งเรือง"]
const NICK = ["nat", "pim", "kit", "aor", "bank", "mild", "beam", "ploy", "film", "ice", "praew", "gun", "fern", "boss", "nun", "tarn", "jay", "bow", "mook", "oat", "pang", "toey"]
const LOCATIONS: [string, string, string][] = [
  ["จตุจักร", "กรุงเทพฯ", "10900"], ["บางกะปิ", "กรุงเทพฯ", "10240"], ["วัฒนา", "กรุงเทพฯ", "10110"], ["ห้วยขวาง", "กรุงเทพฯ", "10310"], ["บางนา", "กรุงเทพฯ", "10260"],
  ["ปากเกร็ด", "นนทบุรี", "11120"], ["เมืองนนทบุรี", "นนทบุรี", "11000"], ["คลองหลวง", "ปทุมธานี", "12120"], ["บางพลี", "สมุทรปราการ", "10540"],
  ["เมืองเชียงใหม่", "เชียงใหม่", "50200"], ["เมืองขอนแก่น", "ขอนแก่น", "40000"], ["ศรีราชา", "ชลบุรี", "20110"], ["กะทู้", "ภูเก็ต", "83120"],
  ["เมืองนครราชสีมา", "นครราชสีมา", "30000"], ["หาดใหญ่", "สงขลา", "90110"], ["เมืองอุดรธานี", "อุดรธานี", "41000"], ["เมืองพิษณุโลก", "พิษณุโลก", "65000"],
]
const STREETS = ["ซ.ลาดพร้าว 71", "ถ.รัชดาภิเษก", "ซ.สุขุมวิท 101/1", "ถ.นิมมานเหมินท์", "ถ.มิตรภาพ", "ม.พฤกษา 12", "ถ.แจ้งวัฒนะ", "ซ.รามคำแหง 24", "ถ.เพชรเกษม", "คอนโดเดอะเบส", "ม.ศุภาลัย", "ถ.ประชาอุทิศ", "ซ.อ่อนนุช 17", "ถ.ศรีนครินทร์"]
const TAG_POOL = ["ชอบโปร", "ซื้อซ้ำ", "ตัวแทน", "ขอใบกำกับภาษี", "สายสกินแคร์", "ลูกค้าองค์กร", "ถามเยอะ", "มาจากไลฟ์", "รีวิวดี"]

export const CUSTOMERS_PER_PLATFORM = 22
export const CUSTOMERS: Customer[] = []

let custN = 1001
for (const platform of PLATFORM_IDS) {
  for (let i = 0; i < CUSTOMERS_PER_PLATFORM; i++) {
    const first = pick(FIRST)
    const last = pick(LAST)
    const [district, province, zip] = pick(LOCATIONS)
    const nick = `${pick(NICK)}${int(10, 99)}`
    const handle = (p: PlatformId) =>
      p === "lineoa" ? `${nick.replace(/\d+/, "")} ${first}` : p === "facebook" ? `${first} ${last}` : p === "instagram" ? `@${nick}.${pick(["x", "th", "ii", "zz"])}` : `${nick}${int(100, 999)}`
    const identities = [{ platform, handle: handle(platform) }]
    // ~30% of customers also exist on another channel (same phone) → CRM unifies them
    if (rand() < 0.3) {
      const other = pick(PLATFORM_IDS.filter((p) => p !== platform))
      identities.push({ platform: other, handle: handle(other) })
    }
    CUSTOMERS.push({
      id: `C${custN++}`,
      name: `${first} ${last}`,
      phone: `0${pick([6, 8, 9])}${int(1, 9)}-${int(100, 999)}-${int(1000, 9999)}`,
      email: rand() < 0.4 ? `${nick}@${pick(["gmail.com", "hotmail.com", "outlook.co.th"])}` : undefined,
      address: `${int(1, 299)}/${int(1, 99)} ${pick(STREETS)}`,
      district,
      province,
      zip,
      identities,
      tags: rand() < 0.55 ? shuffle(TAG_POOL).slice(0, int(1, 2)) : [],
      tier: "new",
      blacklisted: false,
      note: "",
      joinedAt: NOW - int(1, 500) * DAY,
    })
  }
}
// A couple of risky customers for demo
CUSTOMERS[13].blacklisted = true
CUSTOMERS[13].note = "ปฏิเสธรับพัสดุ COD 3 ครั้ง (ส.ค.–ต.ค. 69)"
CUSTOMERS[95].blacklisted = true
CUSTOMERS[95].note = "แจ้งไม่ได้รับของแต่ขนส่งยืนยันส่งสำเร็จ"
const custIndex = new Map(CUSTOMERS.map((c) => [c.id, c]))
export const customerById = (id: string) => custIndex.get(id)!
export const primaryPlatform = (c: Customer) => c.identities[0].platform

// ---------- Orders ----------
export type OrderStatus = "unpaid" | "to_process" | "to_pack" | "to_ship" | "shipping" | "delivered" | "cancelled" | "returned"

export const STATUSES: Record<OrderStatus, { label: string; className: string }> = {
  unpaid: { label: "รอชำระเงิน", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  to_process: { label: "รอจัดการ", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  to_pack: { label: "รอแพ็ก", className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  to_ship: { label: "รอขนส่งรับ", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  shipping: { label: "กำลังจัดส่ง", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  delivered: { label: "สำเร็จ", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  cancelled: { label: "ยกเลิก", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  returned: { label: "คืนสินค้า", className: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300" },
}
export const STATUS_IDS = Object.keys(STATUSES) as OrderStatus[]

// Each platform's own status name → unified status (shown in order detail)
export const RAW_STATUS: Record<PlatformId, Record<OrderStatus, string>> = {
  shopee: { unpaid: "UNPAID", to_process: "READY_TO_SHIP", to_pack: "PROCESSED", to_ship: "PROCESSED", shipping: "SHIPPED", delivered: "COMPLETED", cancelled: "CANCELLED", returned: "TO_RETURN" },
  lazada: { unpaid: "unpaid", to_process: "pending", to_pack: "packed", to_ship: "ready_to_ship", shipping: "shipped", delivered: "delivered", cancelled: "canceled", returned: "returned" },
  tiktok: { unpaid: "UNPAID", to_process: "AWAITING_SHIPMENT", to_pack: "AWAITING_SHIPMENT", to_ship: "AWAITING_COLLECTION", shipping: "IN_TRANSIT", delivered: "DELIVERED", cancelled: "CANCELLED", returned: "RETURN_OR_REFUND" },
  lineoa: { unpaid: "รอสลิป", to_process: "ยืนยันสลิปแล้ว", to_pack: "(จัดการใน OMS)", to_ship: "(จัดการใน OMS)", shipping: "(จัดการใน OMS)", delivered: "(จัดการใน OMS)", cancelled: "(จัดการใน OMS)", returned: "(จัดการใน OMS)" },
  facebook: { unpaid: "รอสลิป", to_process: "ยืนยันสลิปแล้ว", to_pack: "(จัดการใน OMS)", to_ship: "(จัดการใน OMS)", shipping: "(จัดการใน OMS)", delivered: "(จัดการใน OMS)", cancelled: "(จัดการใน OMS)", returned: "(จัดการใน OMS)" },
  instagram: { unpaid: "รอสลิป", to_process: "ยืนยันสลิปแล้ว", to_pack: "(จัดการใน OMS)", to_ship: "(จัดการใน OMS)", shipping: "(จัดการใน OMS)", delivered: "(จัดการใน OMS)", cancelled: "(จัดการใน OMS)", returned: "(จัดการใน OMS)" },
}

export const CARRIERS = ["Flash Express", "Kerry Express", "J&T Express", "ไปรษณีย์ไทย", "SPX Express", "LEX TH", "Best Express"] as const
const carrierFor = (p: PlatformId) =>
  p === "shopee" ? pick(["SPX Express", "SPX Express", "Flash Express", "J&T Express"]) : p === "lazada" ? "LEX TH" : p === "tiktok" ? pick(["J&T Express", "Flash Express", "Best Express"]) : pick(["Flash Express", "Kerry Express", "ไปรษณีย์ไทย"])

export type OrderItem = { sku: string; qty: number; price: number }
export type Order = {
  id: string
  platformOrderNo: string
  platform: PlatformId
  shopId: string
  customerId: string
  items: OrderItem[]
  shippingFee: number
  discount: number
  payment: "prepaid" | "cod" | "transfer"
  status: OrderStatus
  carrier: string
  tracking?: string
  labelPrinted: boolean
  createdAt: number
  shipBy: number
  mergedFrom?: string[]
  tags: string[]
  warehouse: "bkk" | "cnx"
  note?: string
}
export const PAYMENT_LABEL: Record<Order["payment"], string> = { prepaid: "ชำระผ่านแพลตฟอร์ม", cod: "เก็บเงินปลายทาง (COD)", transfer: "โอนเงิน" }

export const orderSubtotal = (o: Order) => o.items.reduce((s, i) => s + i.qty * i.price, 0)
export const orderTotal = (o: Order) => orderSubtotal(o) + o.shippingFee - o.discount

function statusForAge(ageHours: number): OrderStatus {
  if (ageHours < 4) return pick(["to_process", "to_process", "to_process", "unpaid"])
  if (ageHours < 24) return pick(["to_process", "to_process", "to_pack", "to_pack", "to_ship", "unpaid", "cancelled"])
  if (ageHours < 72) return pick(["to_ship", "shipping", "shipping", "shipping", "to_pack", "cancelled"])
  return pick(["delivered", "delivered", "delivered", "delivered", "delivered", "shipping", "returned", "cancelled"])
}

const sellable = PRODUCTS.filter((p) => p.price > 0)
const PREFIX: Record<PlatformId, string> = { shopee: "2611", lazada: "8834", tiktok: "5771", lineoa: "LN", facebook: "FB", instagram: "IG" }

let orderN = 1
function makeOrder(customer: Customer, platform: PlatformId, opts: Partial<Order> & { ageHours?: number } = {}): Order {
  const shops = SHOPS.filter((s) => s.platform === platform)
  const shop = opts.shopId ? shopById(opts.shopId) : platform === "shopee" && rand() < 0.3 ? shops[1] : shops[0]
  const ageHours = opts.ageHours ?? (rand() < 0.12 ? rand() * 24 : rand() * 24 * 30)
  const createdAt = NOW - Math.round(ageHours * HOUR)
  const nItems = rand() < 0.7 ? 1 : int(2, 3)
  const items: OrderItem[] = opts.items ?? shuffle(sellable).slice(0, nItems).map((p) => ({ sku: p.sku, qty: rand() < 0.85 ? 1 : 2, price: p.price }))
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const tags: string[] = []
  if (subtotal >= 1000 && !items.some((i) => i.sku === FREE_GIFT_SKU)) {
    items.push({ sku: FREE_GIFT_SKU, qty: 1, price: 0 })
    tags.push("มีของแถม")
  }
  const status = opts.status ?? statusForAge(ageHours)
  const social = PLATFORMS[platform].kind === "social"
  const shipped = ["to_ship", "shipping", "delivered", "returned"].includes(status)
  const { ageHours: _ignored, ...rest } = opts
  void _ignored
  return {
    id: `OMS-${String(orderN++).padStart(5, "0")}`,
    platformOrderNo: social ? `${PREFIX[platform]}-${int(10000, 99999)}` : `${PREFIX[platform]}${int(10000000, 99999999)}${int(100, 999)}`,
    platform,
    shopId: shop.id,
    customerId: customer.id,
    items,
    shippingFee: subtotal >= 500 ? 0 : pick([0, 30, 40, 45]),
    discount: rand() < 0.35 ? pick([20, 30, 50, 100]) : 0,
    payment: social ? pick(["transfer", "transfer", "cod"]) : rand() < 0.25 ? "cod" : "prepaid",
    status,
    carrier: carrierFor(platform),
    tracking: shipped ? `TH${int(10000000, 99999999)}${String.fromCharCode(65 + int(0, 25))}` : undefined,
    labelPrinted: shipped,
    createdAt,
    shipBy: createdAt + (platform === "tiktok" ? 2 : 3) * DAY,
    tags,
    warehouse: rand() < 0.8 ? "bkk" : "cnx",
    ...rest,
  }
}

function buildOrders(): Order[] {
  const list: Order[] = []
  for (const c of CUSTOMERS) {
    // every customer orders 1–4 times, mostly on their primary channel
    const n = pick([1, 1, 2, 2, 2, 3, 3, 4])
    for (let k = 0; k < n; k++) {
      const platform = k > 0 && c.identities.length > 1 && rand() < 0.4 ? c.identities[1].platform : c.identities[0].platform
      list.push(makeOrder(c, platform))
    }
  }
  // Deliberate merge candidates: same customer + same shop + not yet packed
  const mergeOn = (idx: number, count: number, payment: Order["payment"]) => {
    const c = CUSTOMERS[idx]
    const platform = primaryPlatform(c)
    for (let k = 0; k < count; k++) list.push(makeOrder(c, platform, { status: "to_process", ageHours: 0.5 + k * 1.3, payment, warehouse: "bkk" }))
  }
  mergeOn(2, 3, "prepaid") // shopee
  mergeOn(25, 2, "prepaid") // lazada
  mergeOn(47, 2, "prepaid") // tiktok
  mergeOn(70, 2, "transfer") // line
  mergeOn(90, 2, "transfer") // facebook
  // Same customer, different payment type → cannot merge (demo reason)
  const c = CUSTOMERS[5]
  list.push(makeOrder(c, "shopee", { status: "to_process", payment: "prepaid", ageHours: 2, shopId: "sp-main", warehouse: "bkk" }))
  list.push(makeOrder(c, "shopee", { status: "to_process", payment: "cod", ageHours: 3, shopId: "sp-main", warehouse: "bkk" }))
  // Blacklisted customer places COD order → risk alert
  list.push(makeOrder(CUSTOMERS[13], primaryPlatform(CUSTOMERS[13]), { status: "to_process", payment: "cod", ageHours: 0.4 }))
  list.push(makeOrder(CUSTOMERS[95], primaryPlatform(CUSTOMERS[95]), { status: "to_process", payment: "cod", ageHours: 1.1 }))
  return list.sort((a, b) => b.createdAt - a.createdAt)
}

export const INITIAL_ORDERS: Order[] = buildOrders()

// Derive tiers from spend so CRM agrees with orders
for (const c of CUSTOMERS) {
  const spend = INITIAL_ORDERS.filter((o) => o.customerId === c.id && o.status !== "cancelled").reduce((s, o) => s + orderTotal(o), 0)
  c.tier = spend > 6000 ? "vip" : spend > 3500 ? "gold" : spend > 2000 ? "silver" : spend > 800 ? "member" : "new"
}

// ---------- Chats (CRM inbox) — every customer has a conversation ----------
export type ChatMessage = { id: string; from: "customer" | "agent" | "system"; text: string; at: number; agent?: string; product?: string; coupon?: string }

// Where the conversation started — marketplaces attach the product/order the buyer tapped "chat" from,
// Meta attaches the ad/post (Click-to-Messenger referral), LINE attaches rich-menu / broadcast source.
export type ChatSource = "product_page" | "live" | "ad" | "post" | "rich_menu" | "broadcast" | "order_page"
export const CHAT_SOURCE: Record<ChatSource, string> = {
  product_page: "กดแชทจากหน้าสินค้า",
  live: "กดแชทระหว่างไลฟ์",
  ad: "กดแชทจากโฆษณา (Click-to-Message)",
  post: "ทักจากโพสต์/คอมเมนต์",
  rich_menu: "ทักจากริชเมนู LINE",
  broadcast: "ตอบกลับบรอดแคสต์โปรโมชัน",
  order_page: "กดแชทจากหน้าคำสั่งซื้อ",
}
export type ChatContext = { source: ChatSource; sku?: string; orderId?: string; campaign?: string }

export type Conversation = {
  id: string
  customerId: string
  platform: PlatformId
  shopId: string
  assignee: string | null
  status: "open" | "pending" | "closed"
  unread: number
  labels: string[]
  context?: ChatContext
  messages: ChatMessage[]
}

export const AGENTS = ["แอดมินหยก", "แอดมินบรีส", "แอดมินนุ๊ก"]
export const CHAT_LABELS = ["สนใจซื้อ", "สอบถามสินค้า", "ติดตามพัสดุ", "แจ้งโอน", "เคลม/คืนสินค้า", "ลูกค้าองค์กร", "ชม/รีวิว"]
export const QUICK_REPLIES = [
  "สวัสดีค่ะ ยินดีให้บริการค่ะ 😊 สนใจสินค้าตัวไหนสอบถามได้เลยค่ะ",
  "ขอบคุณที่สั่งซื้อค่ะ ทางร้านจะจัดส่งภายใน 1-2 วันทำการนะคะ",
  "รบกวนแจ้งชื่อ ที่อยู่ และเบอร์โทรสำหรับจัดส่งด้วยค่ะ",
  "โอนเข้าบัญชี กสิกรไทย 123-4-56789-0 ชื่อบัญชี บจก. แฮปปี้ ช้อปปิ้ง แล้วแนบสลิปได้เลยค่ะ",
  "ได้รับสลิปเรียบร้อยค่ะ เดี๋ยวแพ็กส่งให้วันนี้เลยนะคะ 📦",
  "ขออภัยในความไม่สะดวกค่ะ รบกวนส่งรูปสินค้าและวิดีโอตอนแกะกล่องให้แอดมินตรวจสอบนะคะ",
]

type Script = { label: string; about: "product" | "order" | "none"; sku?: string; lines: [ChatMessage["from"], string][] }
const skuWhere = (re: RegExp) => (PRODUCTS.find((p) => re.test(p.name)) ?? sellable[0]).sku
const shortName = (sku: string) => productBySku(sku).name.split(" ").slice(0, 4).join(" ")
const withProduct = (fn: (name: string, sku: string) => Omit<Script, "sku" | "about">) => () => {
  const sku = pick(sellable).sku
  return { ...fn(shortName(sku), sku), sku, about: "product" as const }
}
const fixed = (re: RegExp, fn: (name: string) => Omit<Script, "sku" | "about">) => () => {
  const sku = skuWhere(re)
  return { ...fn(shortName(sku)), sku, about: "product" as const }
}
const SCRIPTS: (() => Script)[] = [
  withProduct((n) => ({ label: "สนใจซื้อ", lines: [["customer", `สวัสดีค่ะ ${n} ยังมีโปรอยู่ไหมคะ`], ["agent", "สวัสดีค่ะ ตอนนี้ซื้อ 2 ชิ้นลด 100 บาทค่ะ 😊"], ["customer", "เอา 2 ชิ้นค่ะ ส่งที่อยู่เดิมนะคะ"]] })),
  withProduct((n) => ({ label: "สนใจซื้อ", lines: [["customer", `${n} ราคาเท่าไหร่คะ ส่งฟรีไหม`]] })),
  withProduct((n) => ({ label: "สอบถามสินค้า", lines: [["customer", `${n} ทานยังไง/ใช้ยังไงคะ เห็นผลกี่วัน`]] })),
  fixed(/Yanhee/, () => ({ label: "สอบถามสินค้า", lines: [["customer", "กันแดดตัวนี้ ผิวแพ้ง่ายใช้ได้ไหมครับ"], ["agent", "ใช้ได้ค่ะ เนื้อบางเบา ไม่อุดตันค่ะ"], ["customer", "ของเหลือเยอะไหมครับ เห็นขึ้นว่าใกล้หมด"]] })),
  fixed(/แป้งโกลด์.*No\.01/, () => ({ label: "สอบถามสินค้า", lines: [["customer", "แป้งตัวนี้ เบอร์ 01 กับ 02 ต่างกันยังไงคะ ผิวสองสีควรใช้เบอร์ไหน"]] })),
  fixed(/Sukaya/, () => ({ label: "สนใจซื้อ", lines: [["customer", "ดูไลฟ์เมื่อคืน เซ็ตแชมพูนี้ 4 แถม 4 ยังมีไหมคะ"], ["agent", "ยังมีค่ะ เหลือไม่เยอะแล้วนะคะ"], ["customer", "เอา 1 เซ็ตค่ะ จ่ายปลายทางได้ไหม"]] })),
  fixed(/บีสิบเจ็ด|B17/, () => ({ label: "ลูกค้าองค์กร", lines: [["customer", "สนใจเป็นตัวแทนขายตัวนี้ค่ะ สั่ง 50 กระปุกได้ราคาส่งไหมคะ ขอใบเสนอราคาด้วยค่ะ"]] })),
  () => ({ label: "ติดตามพัสดุ", about: "order", lines: [["customer", "สั่งไปเมื่อวานยังไม่ได้เลขพัสดุเลยค่ะ"]] }),
  () => ({ label: "ติดตามพัสดุ", about: "order", lines: [["customer", "พัสดุค้างที่ศูนย์คัดแยก 3 วันแล้วครับ"], ["agent", "ขออภัยค่ะ แอดมินตามกับขนส่งให้นะคะ"], ["customer", "รบกวนด้วยครับ"]] }),
  () => ({ label: "แจ้งโอน", about: "order", lines: [["customer", "โอนแล้วค่ะ"], ["system", "ลูกค้าส่งรูปภาพ (สลิปโอนเงิน)"]] }),
  () => ({ label: "เคลม/คืนสินค้า", about: "order", lines: [["customer", "ได้รับของแล้วแต่กล่องบุบค่ะ ขอเปลี่ยนได้ไหม"], ["system", "ลูกค้าแนบรูปภาพ 2 รูป"]] }),
  () => ({ label: "เคลม/คืนสินค้า", about: "order", lines: [["customer", "ได้ของไม่ครบ ขาดไป 1 ชิ้นค่ะ"]] }),
  () => ({ label: "ชม/รีวิว", about: "none", lines: [["customer", "ได้รับของแล้ว ชอบมากค่ะ ❤️"], ["agent", "ขอบคุณมากค่ะ 🙏 อย่าลืมรีวิวให้ร้านด้วยนะคะ"]] }),
]

const CAMPAIGNS = ["11.11 ลดแรง ส่งฟรี", "โปรผิวใสรับปีใหม่", "สุขภาพดีเริ่มที่ Suklife", "แป้ง DERAEY ซื้อ 3 แถม 2"]
function contextFor(platform: PlatformId, script: Script, customerId: string): ChatContext | undefined {
  const kind = PLATFORMS[platform].kind
  if (script.about === "order") {
    const mine = INITIAL_ORDERS.filter((x) => x.customerId === customerId && x.platform === platform)
    // tracking questions → an order still on the way; claims → a delivered/returned one
    const prefer: OrderStatus[] = script.label === "ติดตามพัสดุ" ? ["shipping", "to_ship", "to_pack", "to_process"] : script.label === "แจ้งโอน" ? ["unpaid", "to_process"] : ["delivered", "returned", "shipping"]
    const o = prefer.map((st) => mine.find((x) => x.status === st)).find(Boolean) ?? mine[0]
    return o && kind === "marketplace" ? { source: "order_page", orderId: o.id } : o ? { source: platform === "lineoa" ? "rich_menu" : "post", orderId: o.id } : undefined
  }
  if (script.about !== "product") return undefined
  const sku = script.sku
  if (platform === "tiktok") return { source: rand() < 0.5 ? "live" : "product_page", sku }
  if (kind === "marketplace") return { source: "product_page", sku }
  if (platform === "lineoa") return { source: rand() < 0.5 ? "broadcast" : "rich_menu", sku, campaign: pick(CAMPAIGNS) }
  return { source: rand() < 0.65 ? "ad" : "post", sku, campaign: pick(CAMPAIGNS) }
}

export const INITIAL_CONVERSATIONS: Conversation[] = CUSTOMERS.map((c, i): Conversation => {
  const ident = c.identities[0]
  const shop = SHOPS.find((sh) => sh.platform === ident.platform)!
  const script = pick(SCRIPTS)()
  const context = contextFor(ident.platform, script, c.id)
  const ageMin = i < 40 ? int(1, 180) : int(180, 60 * 24 * 6)
  const start = NOW - ageMin * MIN
  let t = start
  const messages: ChatMessage[] = []
  // Marketplace chat opened from a product page: the platform injects a product card as first message
  if (context?.sku && (context.source === "product_page" || context.source === "live" || context.source === "ad"))
    messages.push({ id: `m${i}-card`, from: "customer", text: "", product: context.sku, at: start })
  script.lines.forEach(([from, text], k) => {
    t += int(1, 6) * MIN
    messages.push({ id: `m${i}-${k}`, from, text, at: Math.min(t, NOW - MIN), agent: from === "agent" ? pick(AGENTS) : undefined })
  })
  const lastFromCustomer = messages[messages.length - 1].from !== "agent"
  const closed = !lastFromCustomer && ageMin > 60 * 24
  return {
    id: `CV${1000 + i}`,
    customerId: c.id,
    platform: ident.platform,
    shopId: shop.id,
    assignee: rand() < 0.25 ? null : pick(AGENTS),
    status: closed ? "closed" : lastFromCustomer ? "open" : "pending",
    unread: lastFromCustomer && ageMin < 60 * 24 ? int(1, 4) : 0,
    labels: [script.label],
    context,
    messages,
  }
}).sort((a, b) => b.messages[b.messages.length - 1].at - a.messages[a.messages.length - 1].at)

// ---------- Returns ----------
export type ReturnCase = {
  id: string
  orderId: string
  items: { sku: string; qty: number }[]
  reason: string
  detail: string // what the customer wrote
  evidence: number // photos/videos attached by customer
  type: "return_refund" | "refund_only" | "exchange"
  status: "requested" | "approved" | "in_transit" | "received" | "refunded" | "rejected"
  amount: number
  restock: boolean
  createdAt: number
  returnTracking?: string
  rejectNote?: string
}
export const RETURN_STATUS: Record<ReturnCase["status"], { label: string; className: string }> = {
  requested: { label: "ลูกค้าขอคืน", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  approved: { label: "อนุมัติแล้ว", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  in_transit: { label: "กำลังส่งคืน", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  received: { label: "รับของคืนแล้ว", className: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  refunded: { label: "คืนเงินแล้ว", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  rejected: { label: "ปฏิเสธ", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
}
export const RETURN_FLOW: ReturnCase["status"][] = ["requested", "approved", "in_transit", "received", "refunded"]
export const RETURN_TYPE: Record<ReturnCase["type"], string> = { return_refund: "คืนสินค้า+คืนเงิน", refund_only: "คืนเงินอย่างเดียว", exchange: "เปลี่ยนสินค้า" }
// reason → realistic customer messages (restock = can the item go back to sellable stock)
type ReasonCtx = { name: string; beauty: boolean }
const short = (n: string) => n.split(" ").slice(0, 4).join(" ")
const RETURN_REASONS: { reason: string; restock: boolean; details: ((c: ReasonCtx) => string)[] }[] = [
  {
    reason: "สินค้าชำรุด/เสียหาย",
    restock: false,
    details: [
      (c) => (c.beauty ? `กล่องบุบ ${short(c.name)} ฝาแตก เนื้อครีม/แป้งหกเลอะทั้งกล่องค่ะ` : `กระปุก ${short(c.name)} ฝาแตก ซีลฉีกขาดมาตั้งแต่แกะกล่อง ไม่กล้าทานค่ะ`),
      (c) => `พัสดุมาถึงกล่องเปียกน้ำ ${short(c.name)} เสียหาย ใช้ไม่ได้ครับ`,
    ],
  },
  {
    reason: "ได้รับสินค้าไม่ครบ",
    restock: true,
    details: [(c) => `สั่งโปรแถม แต่ ${short(c.name)} ได้มาไม่ครบตามจำนวนค่ะ ของแถมขาด`, () => "ของแถมตามโปรไม่ได้ใส่มาในกล่องเลยค่ะ"],
  },
  {
    reason: "ได้รับสินค้าผิด",
    restock: true,
    details: [
      (c) => (/No\.|เบอร์|ผิว/.test(c.name) ? `สั่ง ${short(c.name)} แต่ได้คนละเบอร์/คนละเฉดสีมาค่ะ ขอเปลี่ยนด้วยค่ะ` : `สั่ง ${short(c.name)} แต่ได้สินค้าตัวอื่นมาค่ะ ขอเปลี่ยนด้วยค่ะ`),
    ],
  },
  { reason: "สินค้าใกล้หมดอายุ", restock: false, details: [(c) => `${short(c.name)} ล็อตที่ได้รับเหลืออายุไม่ถึง 2 เดือน ใช้ไม่ทันค่ะ`] },
  {
    reason: "แพ้/ไม่เหมาะกับผิว",
    restock: false,
    details: [(c) => (c.beauty ? `ใช้ ${short(c.name)} แล้วหน้าแดง คัน ขึ้นผื่นค่ะ ใช้ไปแค่ 2 ครั้ง` : `ทาน ${short(c.name)} แล้วมีอาการใจสั่น นอนไม่หลับ ขอคืนกล่องที่ยังไม่แกะค่ะ`)],
  },
  { reason: "เปลี่ยนใจ", restock: true, details: [() => "กดสั่งซ้ำโดยไม่ตั้งใจค่ะ ของยังไม่ได้แกะซีลเลย", () => "สั่งเผื่อคุณแม่แต่คุณแม่ซื้อมาแล้ว ของยังไม่ได้แกะค่ะ"] },
]
export const INITIAL_RETURNS: ReturnCase[] = INITIAL_ORDERS.filter((o) => o.status === "returned" || (o.status === "delivered" && rand() < 0.04))
  .slice(0, 18)
  .map((o, i) => {
    const r = pick(RETURN_REASONS)
    const sellableItems = o.items.filter((it) => it.price > 0)
    const chosen = sellableItems.length > 1 && rand() < 0.5 ? [pick(sellableItems)] : sellableItems
    const items = chosen.map((it) => ({ sku: it.sku, qty: it.qty }))
    const type = r.reason === "ได้รับสินค้าผิด" ? "exchange" : r.reason === "ได้รับสินค้าไม่ครบ" ? "refund_only" : pick(["return_refund", "return_refund", "refund_only"] as const)
    const status = (["requested", "requested", "approved", "in_transit", "received", "refunded", "rejected"] as const)[i % 7]
    return {
      id: `RT-${String(301 + i)}`,
      orderId: o.id,
      items,
      reason: r.reason,
      detail: pick(r.details)({ name: productBySku(items[0].sku).name, beauty: productBySku(items[0].sku).group === "ความงาม" }),
      evidence: int(1, 4),
      type,
      status,
      amount: items.reduce((s, it) => s + it.qty * (o.items.find((x) => x.sku === it.sku)?.price ?? 0), 0),
      restock: r.restock,
      createdAt: Math.min(o.createdAt + int(3, 6) * DAY, NOW - int(1, 30) * HOUR),
      returnTracking: ["in_transit", "received", "refunded"].includes(status) ? `TH${int(10000000, 99999999)}R` : undefined,
      rejectNote: status === "rejected" ? "เกินระยะเวลารับคืน 7 วัน และสินค้าถูกใช้งานแล้ว" : undefined,
    }
  })

export const messagePreview = (m: ChatMessage) => m.text || (m.product ? `📦 การ์ดสินค้า: ${productBySku(m.product).name}` : m.coupon ? `🎟 ${m.coupon}` : "")
