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

// ---------- Products / inventory (171 SKUs — full catalogue from happyshoppingofficial.com/page/products) ----------
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
  listings: Partial<Record<PlatformId, Listing>>
  weight?: number // grams
}
export type Listing = { listingId: string; synced: boolean; state?: "live" | "pending" | "failed"; note?: string }

// [sku, name, brand, group, category, price, fullPrice]
const PRODUCT_SEED: [string, string, string, string, string, number, number][] = [
  ["100220049", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (3+2แถม22) No.01 White (Ver.2)", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 9099],
  ["100220050", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (3+2แถม22) No.02 Natural (Ver.2)", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 9099],
  ["100220051", "DERAEY แป้งไดมอนด์ เนเชอรัล พาวเดอร์ SPF30PA+++ (2แถม18) No.D1 ผิวสองสี", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 6982],
  ["100220052", "DERAEY แป้งไดมอนด์ เนเชอรัล พาวเดอร์ SPF30PA+++ (2แถม18) No.D2 ผิวเข้ม", "DERAEY", "ความงาม", "เครื่องสำอาง", 1000, 6982],
  ["100220053", "On Anong มิราเคิล ออร่า ชายน์ พาวเดอร์ SPF35PA+++ พร้อมของแถม No.02ผิวขาว", "On Anong (อรอนงค์)", "ความงาม", "เครื่องสำอาง", 990, 6030],
  ["100220054", "On Anong มิราเคิล ออร่า ชายน์ พาวเดอร์ SPF35PA+++ พร้อมของแถม No.03ผิวสองสี", "On Anong (อรอนงค์)", "ความงาม", "เครื่องสำอาง", 990, 6030],
  ["800250064", "Charcoalogy Acne Clearing Face and Body Clay Soap สบู่ถ่านไม้ไผ่ สูตรลดสิว 1 ก้อน", "Charcoalogy", "ความงาม", "ดูแลผิวหน้า", 129, 129],
  ["800250066", "Charcoalogy Anti-Pollution Age Defense Detox Soap สบู่ถ่านไม้ไผ่ สูตรดีท็อกซ์ผิว 1 ก้อน", "Charcoalogy", "ความงาม", "ดูแลผิวหน้า", 129, 129],
  ["800250065", "Charcoalogy VitaminC Brightening Face and Body Soap สบู่ถ่านวิตามินC สูตรกระจ่างใส 1 ก้อน", "Charcoalogy", "ความงาม", "ดูแลผิวหน้า", 129, 129],
  ["100210039", "DERAEY คริสตัล เซรั่ม 50มล. 4ขวด+สบู่เซรั่ม 100ก. 4ก้อน+ของแถม9ชิ้น", "DERAEY", "ความงาม", "ดูแลผิวหน้า", 1000, 10022],
  ["100210029", "Madam Gold ครีมขมิ้นนมผึ้ง 50g.", "Madam Gold", "ความงาม", "ดูแลผิวหน้า", 190, 390],
  ["100210030", "Madam Gold เซรั่มขมิ้นนมผึ้ง 30ml.", "Madam Gold", "ความงาม", "ดูแลผิวหน้า", 139, 390],
  ["300250013", "Yanhee SUNSCREEN SPF 50++++ BEIGE CREAM 30g. 1 หลอด", "Yanhee", "ความงาม", "ดูแลผิวหน้า", 219, 219],
  ["300250012", "Yanhee SUNSCREEN SPF 50++++ White CREAM 30g. 1 หลอด", "Yanhee", "ความงาม", "ดูแลผิวหน้า", 219, 219],
  ["100210020", "YOWANG ครีมบำรุงผิวหน้ากระจ่างใส ไบรท์เทนนิ่งครีม 30มล. 5กระปุก แถมสบู่ 30ก. 4ชิ้น", "YOWANG", "ความงาม", "ดูแลผิวหน้า", 999, 6766],
  ["100210022", "YOWANG ครีมบำรุงผิวหน้า กระชับ ตึง 30มล. 5กระปุก แถมสบู่ 30ก. 4ชิ้น", "YOWANG", "ความงาม", "ดูแลผิวหน้า", 999, 3726],
  ["300250008", "Yanhee Mela Cream ยันฮี เมล่า ครีม 20g. 1 หลอด", "Yanhee", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์บำรุง และดูแลผิวหน้า", 134, 149],
  ["300250009", "Yanhee Serum Vit C ยันฮี เซรั่ม วิตซี 20g. 1 ขวด", "Yanhee", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์บำรุง และดูแลผิวหน้า", 116, 129],
  ["300250010", "Yanhee Serum Vit E ยันฮี เซรั่ม วิตอี 20g. 1 ขวด", "Yanhee", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์บำรุง และดูแลผิวหน้า", 116, 129],
  ["800250054", "KA UV Extreme Protection Spray SPF50+ PA+++ ขนาด 100 ml.", "KA", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์ป้องกันแสงแดด", 199, 199],
  ["800250067", "KA UV Shield Soft Lotion SPF50+ PA++++ Super Bright 140g.", "KA", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์ป้องกันแสงแดด", 259, 259],
  ["800250068", "KA UV Shield Soft Lotion SPF50+ PA++++ Super Fresh 140g.", "KA", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์ป้องกันแสงแดด", 259, 259],
  ["800250053", "KA UV Whitening Soft Cream SPF50+ PA++++ ขนาด 30 g.", "KA", "ความงาม", "ดูแลผิวหน้า › ผลิตภัณฑ์ป้องกันแสงแดด", 199, 199],
  ["100250095", "DERAEY สบู่กัญชง (1ก้อน)", "DERAEY", "ความงาม", "ดูแลร่างกาย", 140, 590],
  ["100220041", "Suk Skin Herbs สบู่ 60g.(แพ็ค8) 2กล่อง+ครีมอาบน้ำ20ซอง+ถุงตีฟอง8ชิ้น", "Suk Skin herbs", "ความงาม", "ดูแลร่างกาย › ผลิตภัณฑ์ทำความสะอาดผิวกาย", 899, 3072],
  ["300250007", "Yanhee Whitening Body Lotion Natural Blossom 150ml. 1 หลอด", "Yanhee", "ความงาม", "ดูแลร่างกาย › ผลิตภัณฑ์บำรุงและดูแลผิวกาย", 129, 199],
  ["300250004", "Yanhee เจลทารักแร้ ลดรอยคล้ำใต้วงแขน 10g. 1 หลอด", "Yanhee", "ความงาม", "ดูแลร่างกาย › ผลิตภัณฑ์ระงับกลิ่นกาย", 89, 99],
  ["100220045", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (5แถม22) No.01 White", "DERAEY", "ความงาม", "ทั่วไป", 1000, 7595],
  ["100220046", "DERAEY แป้งโกลด์ เนเชอรัล มิราเคิล ทูเวย์ เค้ก (5แถม22) No.02 Natural", "DERAEY", "ความงาม", "ทั่วไป", 1000, 7595],
  ["100250096", "DERAEY GOLD NATURAL MIRACLE TWO WAY CAKE POWDER เบอร์01 (1แถม1 ตลับ)", "DERAEY", "ความงาม", "ทั่วไป", 279, 1180],
  ["100250097", "DERAEY GOLD NATURAL MIRACLE TWO WAY CAKE POWDER เบอร์02 (1แถม1 ตลับ)", "DERAEY", "ความงาม", "ทั่วไป", 279, 1180],
  ["100220044", "Suk Skin Herbs แชมพูสมุนไพร 150มล. 4 แถม 4ขวด", "Suk Skin herbs", "ความงาม", "ทั่วไป", 999, 3920],
  ["100220043", "Suk Skin Herbs สบู่ 60g.(แพ็ค8) 3กล่อง+ครีมอาบน้ำ 8ซอง+ถุงตีฟอง8ชิ้น", "Suk Skin herbs", "ความงาม", "ทั่วไป", 999, 9680],
  ["100210037", "Suk Skin Herbs สบู่เหลวสมุนไพร 300มล. 4 แถม 4ขวด", "Suk Skin herbs", "ความงาม", "ทั่วไป", 999, 5520],
  ["100220024", "Suk Skin Herbs สบู่สมุนไพร 130g. 5 ก้อน พร้อมถุงตีฟอง แถมสบู่ 60g. 5 ก้อน+สบู่ 20g. 10 ก้อน", "Suk Skin herbs", "ความงาม", "ผลิตภัณฑ์ดูแลผิว", 999, 7095],
  ["100250076", "Pacare Bessie ครีมเปลี่ยนสีผม 2.0 สีดำ 60 มล. แพ็คคู่", "Pacare Bessie", "ความงาม", "ผลิตภัณฑ์ดูแลเส้นผม", 99, 118],
  ["100250078", "Pacare Bessie ครีมเปลี่ยนสีผม 5.31 สีน้ำตาลคาราเมล 60 มล. แพ็คคู่", "Pacare Bessie", "ความงาม", "ผลิตภัณฑ์ดูแลเส้นผม", 99, 118],
  ["100250079", "Pacare Bessie ครีมเปลี่ยนสีผม 5.55 สีแดงเชอร์รี่ 60 มล. แพ็คคู่", "Pacare Bessie", "ความงาม", "ผลิตภัณฑ์ดูแลเส้นผม", 99, 118],
  ["100250080", "Pacare Bessie ครีมเปลี่ยนสีผม 7.91 สีน้ำตาลหม่นเทา 60 มล. แพ็คคู่", "Pacare Bessie", "ความงาม", "ผลิตภัณฑ์ดูแลเส้นผม", 99, 118],
  ["100220057", "Sukaya แชมพูสมุนไพร เรด จินเส็ง 150มล. 4 แถม 4ขวด+สบู่ 20ก. 8ก้อน", "สุขกายะ", "ความงาม", "ผลิตภัณฑ์ดูแลเส้นผม", 999, 5992],
  ["100250083", "Farger Bond Booster Hair Treatment ทรีทเม้นท์บำรุงผม 50มล. 1 ถุง", "Farger", "ความงาม", "อุปกรณ์ความงาม › อุปกรณ์ดูแลผม", 79, 99],
  ["100250087", "Farger Bond Booster Plex Pro Treatment ทรีทเม้นท์บำรุงแกนผม 450มล. 1 ถุง", "Farger", "ความงาม", "อุปกรณ์ความงาม › อุปกรณ์ดูแลผม", 390, 590],
  ["100110348", "สุภาพโอสถ 4Mix Oilน้ำมันสกัดเย็น250แคปซูล+60แคปซูล+เบลล์รังนก45มล.4ขวด", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 1090, 2770],
  ["100110356", "สุภาพโอสถ น้ำมันงาดำรำข้าว 250แคปซูล+(6แคปซูล)2ซอง+กระเป๋านุ่มนิ่ม", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 1190, 3098],
  ["100110349", "สุภาพโอสถ น้ำมันงาดำรำข้าว 250แคปซูล+(6แคปซูล)2ซอง+เบลล์รังนก45มล.4ขวด", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 1190, 2828],
  ["100110369", "Activis taide ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพไต (30แคปซูล) 2แถม2กล่อง", "Activis taide", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 1090, 4760],
  ["100110367", "Dii Klear ผลิตภัณฑ์เสริมอาหารบำรุงดวงตา (30แคปซูล) 2แถม1กล่อง", "Dii Klear", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 1099, 2970],
  ["100110368", "Mplus ผลิตภัณฑ์เสริมอาหารชาย (20แคปซูล) 3แถม3กล่อง", "Mplus", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 1090, 4740],
  ["100110331", "Suklife ผลิตภัณฑ์เสริมอาหารบำรุงสมอง บีสิบเจ็ดพลัส 20แคปซูล5กระปุก+สุขกายะบาล์ม 3ก. 2กระปุก", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 999, 6648],
  ["100110332", "Suklife ผลิตภัณฑ์เสริมอาหารเอ็มทูพลัส 30แคปซูล 3 แถม 3กระปุก", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 999, 4140],
  ["100110344", "Suklife ผลิตภัณฑ์เสริมอาหารแอปเปิ้ลไซเดอร์เวนีก้า พลัส 20แคปซูล", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ทั่วไป", 179, 690],
  ["100110382", "สุภาพโอสถ ทวิน แบล็ค เทอร์เมอริค 30แคปซูล 6กระปุก", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 990, 3540],
  ["100110305", "สุภาพโอสถ ผลิตภัณฑ์เสริมอาหารน้ำมันปลา ฟิชออยล์ 1000มก. (200 แคปซูล) 2 กระปุก", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 990, 2400],
  ["100110380", "สุภาพโอสถ อัลติมัส บำรุงดวงตา 30เม็ด 2แถม2กล่อง", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 1090, 3560],
  ["100140135", "Donutt โดนัทท์ กาแฟ ผสมสารสกัดถั่วขาวและสารสกัดเมล็ดกาแฟดิบ 10 ซอง 3 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 299, 387],
  ["100140136", "Donutt โดนัทท์ โกโก้ ผสมสารสกัดถั่วขาวและสารสกัดเมล็ดกาแฟดิบ 10 ซอง 3 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 299, 387],
  ["100140138", "Donutt โดนัทท์ โทเทิลไฟบีลี่ พลัส โพรไบโอติกส์ กลิ่นมะขาม 10 ซอง 3 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 450, 987],
  ["100140139", "Donutt โดนัทท์ โทเทิลไฟบีลี่ พลัส โพรไบโอติกส์ กลิ่นมะม่วง 10 ซอง 3 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 450, 987],
  ["100140141", "Donutt โดนัทท์ โทเทิลไฟบีลี่ พลัส โพรไบโอติกส์ กลิ่นสับปะรด 10 ซอง 3 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 450, 987],
  ["100140140", "Donutt โดนัทท์ โทเทิลไฟบีลี่ พลัส โพรไบโอติกส์ กลิ่นเสาวรส 10 ซอง 3 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 450, 987],
  ["100140155", "Donutt โทเทิล ไฟบิลี่ พลัส โพรไบโอติกส์ 10 ซอง จำนวน 4 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 699, 1316],
  ["100110253", "NAVIS PLUS ผลิตภัณฑ์เสริมอาหารน้ำมันงาสกัดเย็น (30 แคปซูล) 10 กล่อง", "navis plus", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 1990, 12000],
  ["100110306", "Suklife ผลิตภัณฑ์เสริมอาหารบำรุงสมอง บีสิบเจ็ดพลัส 20แคปซูล5กระปุก+สุขกายะน้ำมันนวด 3มล. 2ขวด", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 999, 6648],
  ["100110284", "Yes Care ผลิตภัณฑ์เสริมอาหารดูแลสุขภาพดวงตา (30 เม็ด) 2 แถม 1 กระปุก", "Yes Care", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหาร", 1090, 3600],
  ["100110371", "สุภาพโอสถ บีเอสอาร์บี คอมเพล็กซ์ (30แคปซูล) 7กระปุก", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 1190, 3430],
  ["100140191", "B SHINE ไบโอ โปร ซี วิตามินซี 1000มก. พลัส บิลเบอร์รี่ 30เม็ด แถมฟรี7เม็ด", "B SHINE", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 219, 369],
  ["100140190", "B SHINE ไบโอ โปร ซี วิตามินซี 1000มก. พลัส บิลเบอร์รี่ 30เม็ด แพ็คคู่", "B SHINE", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 339, 640],
  ["100140201", "Donutt กลูต้าพลัส 30 แคปซูล (1แถม1)", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 199, 580],
  ["100140200", "Donutt ไบโอ แมกนีเซียม คอมเพล็กซ์ 30แคปซูล+แอสต้าแซนธิน 30 แคปซูล (1แถม1)", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 259, 819],
  ["100140197", "Donutt ไบโอ แมกนีเซียม คอมเพล็กซ์ 30 แคปซูล (2กล่อง)", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 299, 980],
  ["100140199", "Donutt สารสกัดงาดำพลัสยูซีทู 30 แคปซูล (1กล่อง)", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 199, 490],
  ["100140196", "Donutt Collagen Dipeptide คอลลาเจนผสมรังนก120กรัม (1กระปุก)", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 299, 490],
  ["100110346", "Suklife น้ำพลูคาวสกัดเข้มข้น 375มล. 2 ขวด แถม 1 ขวด", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 1090, 3870],
  ["100110364", "Suklife ผลิตภัณฑ์เสริมอาหารบำรุงสมอง บีสิบเจ็ดพลัส 20แคปซูล 6กระปุก", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 1090, 7740],
  ["100110354", "Suklife ผลิตภัณฑ์เสริมอาหาร เวล่า ออยล์(20แคปซูล) 3+3กล่อง", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 999, 7740],
  ["100110353", "Suklife ผลิตภัณฑ์เสริมอาหารแอปเปิ้ลไซเดอร์เวนีก้า พลัส(20แคปซูล) 3+3กล่อง", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 999, 4140],
  ["100140192", "Suklife B17 Plus 20แคปซูล (1กระปุก)", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 290, 1290],
  ["100140193", "Suklife B17 Plus 20แคปซูล (2แถม1กระปุก)", "Suklife", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ", 790, 3870],
  ["100140016", "B SHINE สลินน์ 30 เม็ด แพ็คคู่", "B SHINE", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › ดูแลรูปร่างและลดน้ำหนัก", 599, 1180],
  ["100110251", "สุภาพโอสถ ผลิตภัณฑ์เสริมอาหารน้ำมันงาดำ+น้ำมันรำข้าว 30 แคปซูล 7 กระปุก", "สุภาพโอสถ", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › บำรุงกระดูก ข้อต่อ", 1090, 2450],
  ["100140035", "Donutt ไฟบีลี่ มิกซ์ รสมิกซ์เบอร์รี่ 10 ซอง จำนวน 1 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › ระบบทางเดินอาหาร", 199, 275],
  ["100140025", "Donutt ไฟบีลี่ มิกซ์ รสมิกซ์เบอร์รี่ บรรจุ 10 ซอง 4 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › ระบบทางเดินอาหาร", 769, 1100],
  ["100110081", "Herbplus ผลิตภัณฑ์เสริมอาหาร GI365 ปริมาณ 45 แคปซูล โปร 3 กล่องแถม 2 กล่อง", "HerbPlus", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › ระบบทางเดินอาหาร", 2190, 4500],
  ["100140026", "Donutt ถั่งเช่า ผสมมัลติวิตามิน บี 30 แคปซูล 2 กล่อง แถมไวตามิน ซี 30 แคปซูล 1 กระปุก", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › สุขภาพองค์รวม", 329, 950],
  ["100140036", "Donutt ถั่งเช่า ผสมมัลติวิตามิน บี 30 แคปซูล จำนวน 1 กล่อง", "DONUTT", "ผลิตภัณฑ์เสริมอาหารและยา", "ผลิตภัณฑ์เสริมอาหารบำรุงสุขภาพ › สุขภาพองค์รวม", 169, 475],
  ["100140081", "B SHINE เนเจอร์ซี อะเซโรลาเชอร์รี่ 30 เม็ด (แถมฟรี 5 เม็ด) แพ็ค 2 แถม 1 กระปุก", "B SHINE", "ผลิตภัณฑ์เสริมอาหารและยา", "วิตามิน", 458, 960],
  ["100520084", "Arrow Lite_เซตเสื้อกล้ามผ้าTC 4ตัว ฟรี 5ตัว Size L", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 990, 2250],
  ["100520083", "Arrow Lite_เซตเสื้อกล้ามผ้าTC 4ตัว ฟรี 5ตัว Size M", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 990, 2250],
  ["100520085", "Arrow Lite_เซตเสื้อกล้ามผ้าTC 4ตัว ฟรี 5ตัว Size XL", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 990, 2250],
  ["100520153", "Arrow Lite_เซตเสื้อยืดผ้าคอตตอนคอกลมกระดุมแขนยาว สีดำ 5ตัว Size L", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1099, 2250],
  ["100520150", "Arrow Lite_เซตเสื้อยืดผ้าคอตตอนคอกลมแขนสั้น สีดำ3ตัว+สีขาว2ตัว Size L", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 999, 2950],
  ["100520149", "Arrow Lite_เซตเสื้อยืดผ้าคอตตอนคอกลมแขนสั้น สีดำ3ตัว+สีขาว2ตัว Size M", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 999, 2950],
  ["100520151", "Arrow Lite_เซตเสื้อยืดผ้าคอตตอนคอกลมแขนสั้น สีดำ3ตัว+สีขาว2ตัว Size XL", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 999, 2950],
  ["100550055", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size L สีกรม 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 590, 100550055],
  ["100550057", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size L สีขาว 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550056", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size L สีดำ 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550054", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size L สีแดงมารูน 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550053", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size L สีเทาเข้ม 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550060", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size XL สีกรม 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550062", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size XL สีขาว 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550061", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size XL สีดำ 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550059", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size XL สีแดงมารูน 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100550058", "Arrow Lite_เสื้อยืดคอกลมแขนสั้น Size XL สีเทาเข้ม 1ตัว", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 229, 590],
  ["100520173", "Arrow Lite Short Pants_กางเกงขาสั้นผ้าคอตตอน 3 ฟรี 2ตัว Size L (ver.3)", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1390, 3450],
  ["100520168", "Arrow Lite Short Pants_กางเกงขาสั้นผ้าคอตตอน 3 ฟรี 2ตัว Size L (ver.4)", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1390, 3450],
  ["100520190", "Arrow Lite Short Pants_กางเกงขาสั้นผ้าคอตตอน 3 ฟรี 2ตัว Size M (ver.3)", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1390, 3450],
  ["100520167", "Arrow Lite Short Pants_กางเกงขาสั้นผ้าคอตตอน 3 ฟรี 2ตัว Size M (ver.4)", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1390, 3450],
  ["100520174", "Arrow Lite Short Pants_กางเกงขาสั้นผ้าคอตตอน 3 ฟรี 2ตัว Size XL (ver.3)", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1390, 3450],
  ["100520169", "Arrow Lite Short Pants_กางเกงขาสั้นผ้าคอตตอน 3 ฟรี 2ตัว Size XL (ver.4)", "ARROW LITE", "สินค้าแฟชั่น", "ทั่วไป", 1390, 3450],
  ["100520157", "HENRII PAULMAN เซตกางเกงลำลอง 5 ตัว", "HENRII PAULMAN", "สินค้าแฟชั่น", "ทั่วไป", 1090, 3450],
  ["100520166", "LADY HAMPTON กางเกงขายาวผู้หญิง 7 ตัว (Ver.2)", "LADY HAMPTON", "สินค้าแฟชั่น", "ทั่วไป", 999, 3430],
  ["100520155", "LADY HAMPTON กางเกงขายาวผู้หญิงลายดอกไม้ 7 ตัว", "LADY HAMPTON", "สินค้าแฟชั่น", "ทั่วไป", 999, 3430],
  ["100510061", "MAXGUYVER กางเกงชั้นในชายทรงทรังค์ 25ตัว แถมกระเป๋ากีฬา+แว่นกันแดดแฟชั่น", "MAXGUYVER", "สินค้าแฟชั่น", "ทั่วไป", 999, 3980],
  ["100510069", "MAXGUYVER กางเกงชั้นในชายทรงทรังค์ 5ตัว (คละสี)", "MAXGUYVER", "สินค้าแฟชั่น", "ทั่วไป", 199, 600],
  ["100550007", "ONONO บราไร้โครงแบบสวม FREESIZE (สีดำ,เนื้อ,ส้มอ่อน) 3 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 359, 870],
  ["100550023", "ONONO เสื้อกล้ามคอเต่าเสริมฟองน้ำ (FHA017) สีดำ 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 289, 390],
  ["100550024", "ONONO เสื้อกล้ามคอเต่าเสริมฟองน้ำ (FHA017) สีน้ำตาล 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 289, 390],
  ["100550025", "ONONO เสื้อกล้ามคอเต่าเสริมฟองน้ำ (FHA017) สีเบจ 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 289, 390],
  ["100550020", "ONONO เสื้อกล้ามเสริมฟองน้ำ (FHA016) สีดำ 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 299, 390],
  ["100550022", "ONONO เสื้อกล้ามเสริมฟองน้ำ (FHA016) สีแดง 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 299, 390],
  ["100550021", "ONONO เสื้อกล้ามเสริมฟองน้ำ (FHA016) สีเทา 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 299, 390],
  ["100550019", "ONONO เสื้อครอปปาดไหล่เสริมฟองน้ำ (FHA015) สีครีม 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 299, 390],
  ["100550017", "ONONO เสื้อครอปปาดไหล่เสริมฟองน้ำ (FHA015) สีดำ 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 299, 390],
  ["100550018", "ONONO เสื้อครอปปาดไหล่เสริมฟองน้ำ (FHA015) สีเทา 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 299, 390],
  ["100550016", "ONONO เสื้อสายเดี่ยวเสริมฟองน้ำ (FHA013) สีขาว 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 329, 450],
  ["100550015", "ONONO เสื้อสายเดี่ยวเสริมฟองน้ำ (FHA013) สีดำ 1 ตัว", "ONONO", "สินค้าแฟชั่น", "ทั่วไป", 329, 450],
  ["100520156", "SLIMELA ชุดเดรสลายดอกไม้ 7ชุด (Ver.2)", "SLIMELA", "สินค้าแฟชั่น", "ทั่วไป", 999, 4130],
  ["100520170", "SLIMELA ชุดเดรสลายดอกไม้ 7ชุด (Ver.3)", "SLIMELA", "สินค้าแฟชั่น", "ทั่วไป", 999, 4130],
  ["100510062", "Slimela Bra ชุดชั้นในไร้โครง 8ตัว แถม กระเป๋าช้อปปิ้ง", "SLIMELA", "สินค้าแฟชั่น", "ทั่วไป", 999, 3410],
  ["100510070", "Slimela Bra ชุดชั้นในไร้โครงลายลูกฟูก 8ตัว+กระเป๋าช้อปปิ้ง (ver.2)", "SLIMELA", "สินค้าแฟชั่น", "ทั่วไป", 999, 3410],
  ["100520159", "St.Patrick เซตเสื้อยืดแขนสั้น 8ตัว Size L", "St.Patrick", "สินค้าแฟชั่น", "ทั่วไป", 999, 4720],
  ["100520158", "St.Patrick เซตเสื้อยืดแขนสั้น 8ตัว Size M", "St.Patrick", "สินค้าแฟชั่น", "ทั่วไป", 999, 4720],
  ["100520160", "St.Patrick เซตเสื้อยืดแขนสั้น 8ตัว Size XL", "St.Patrick", "สินค้าแฟชั่น", "ทั่วไป", 999, 4720],
  ["300120029", "เครื่องดื่มรังนกสำเร็จรูปผสมโสม บอนแบค ปริมาณ 42 มล. 3 กล่อง แถม 3 กล่อง", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 1590, 3600],
  ["200120183", "เครื่องดื่มรังนกสำเร็จรูปผสมโสม บอนแบค ปริมาณ 42 มล. จำนวน 8 กล่อง", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 1800, 4800],
  ["200120185", "เครื่องดื่มรังนกสำเร็จรูปสูตร 100% จากถ้ำธรรมชาติ บอนแบค ปริมาณ 42 มล. (8 กล่อง)", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 1800, 3600],
  ["100120095", "Altra Coffee กาแฟปรุงสำเร็จรูป 39in1 (10ซอง) 5แถม5ห่อ", "Altra Coffee", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 1099, 5900],
  ["200140025", "BONBACK เครื่องดื่มรังนกสำเร็จรูปผสมโสม ปริมาณ 42 มล. 3 กล่อง แถม 4 กล่อง", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 1690, 4200],
  ["300120030", "BONBACK เครื่องดื่มรังนกสำเร็จรูป สูตรธรรมชาติ ขนาด 42 มล. โปร 3 กล่อง แถม 3 กล่อง", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 1590, 2700],
  ["200140023", "BONBACK สูตร 100% จากถ้ำธรรมชาติ ขนาด 42 มล. 1 กล่อง", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 299, 450],
  ["200140022", "BONBACK สูตรผสมโสม ขนาด 42 ml 1 กล่อง", "BONBACK", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 299, 600],
  ["100140011", "B SHINE มารีน คอลลาเจนเปปไทด์ 100,000 มก. 1 ซอง", "B SHINE", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 359, 490],
  ["100140012", "B SHINE มารีน คอลลาเจนเปปไทด์ 100,000 มก. แพ็คคู่", "B SHINE", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 649, 980],
  ["100140008", "B SHINE มารีน คอลลาเจนเปปไทด์ 24,000 มก. 1 ซอง และ เนเจอร์ซี 6 เม็ด 1 ซอง", "B SHINE", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 119, 180],
  ["100140017", "B SHINE มารีน คอลลาเจน เอ็มซิงค์ 24,000 มก. 1 ซอง และ เนเจอร์ซี 6 เม็ด 1 ซอง", "B SHINE", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 109, 180],
  ["100140018", "B SHINE มารีน คอลลาเจน เอ็มซิงค์ 24,000 มก. แพ็คคู่", "B SHINE", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 139, 240],
  ["100140023", "Donutt ลีฟเนส 3in1 กาแฟผสมถั่งเช่าและสารสกัดเห็ดหลินจือ 10 ซอง 6 กล่อง", "DONUTT", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 519, 1194],
  ["100140033", "Donutt ลีฟเนส 3in1 กาแฟผสมถั่งเช่าและสารสกัดเห็ดหลินจือ 10 ซอง จำนวน 1 กล่อง", "DONUTT", "อาหารและเครื่องดื่ม", "เครื่องดื่ม", 99, 199],
  ["100250099", "DERAEY กาแฟปรุงสำเร็จชนิดผง INSTANT COFFEE MIX (3ถุง)", "DERAEY", "อาหารและเครื่องดื่ม", "ทั่วไป", 690, 870],
  ["101120017", "มหาสุข น้ำผึ้งป่า 1000มล. 3ขวด แถมถุงผ้า+พัดลมUSB", "มหาสุข", "อาหารและเครื่องดื่ม", "อาหาร", 990, 2350],
  ["101120013", "ลำดวน เชียงแซลมอน 400ก. 3แพ็ค+150ก. 2แพ็ค", "ลำดวน", "อาหารและเครื่องดื่ม", "อาหาร", 990, 2168],
  ["101120012", "ลำดวน เชียงปลาสลิด 500ก. 4 แพ็ค", "ลำดวน", "อาหารและเครื่องดื่ม", "อาหาร", 999, 2360],
  ["601120003", "หอม ปลาอินทรีเค็ม 1กก. + ปลากุเลา 50ก.", "หอมปลาอินทรี", "อาหารและเครื่องดื่ม", "อาหาร", 890, 990],
  ["601120002", "หอม ปลาอินทรีเค็ม 500ก. 2แพ็ค+น้ำพริกปลาอินทรีเค็ม 60ก.", "หอมปลาอินทรี", "อาหารและเครื่องดื่ม", "อาหาร", 999, 1279],
  ["100130106", "Exlink Voice หูฟังขยายเสียง 2 ชิ้น", "Exlink Voice", "เครื่องใช้และอุปกรณ์เพื่อสุขภาพ", "ทั่วไป", 1290, 1980],
  ["100130116", "HEALLIFE อุปกรณ์พยุงเข่า 4ชิ้น แถมกระเป๋าคาดเอว+ผ้าสวมเข่า2ชิ้น", "HEALLIFE", "เครื่องใช้และอุปกรณ์เพื่อสุขภาพ", "อุปกรณ์เพื่อสุขภาพ", 990, 3240],
  ["100130073", "Max Leg Elder Wellness ไม้เท้าช่วยพยุง แถม แว่นกรองแสงพร้อมไฟ LED 2ชิ้น+หินหยกบริหารมือ", "Max Leg Elder Wellness", "เครื่องใช้และอุปกรณ์เพื่อสุขภาพ", "อุปกรณ์เพื่อสุขภาพ", 999, 4960],
  ["100130118", "Sukaya เซนท์ สตอรี่ สเปรย์ อโรมา 30มล. 5ขวด แถม สเปรย์ 3มล. 5ขวด คละ", "สุขกายะ", "เครื่องใช้และอุปกรณ์เพื่อสุขภาพ", "อุปกรณ์เพื่อสุขภาพ", 999, 3945],
  ["100130107", "Sukaya ครีมสมุนไพรหัวนวดลูกกลิ้ง 70ก. 4หลอด แถมสุขกายะน้ำมัน 3มล. 4ขวด", "สุขกายะ", "ฟิตเนสและการออกกำลังกาย", "ทั่วไป", 999, 3192],
  ["100130103", "Sukaya น้ำมันนวด 30มล. 2ขวด แถมหัวลูกกลิ้ง 12มล. 4ขวด+บาล์มสติ๊ก", "สุขกายะ", "ฟิตเนสและการออกกำลังกาย", "ทั่วไป", 899, 3348],
  ["100130078", "Sukaya น้ำมันนวด 30มล. 2แถม2ขวด+น้ำมันนวด 3มล. 4ขวด", "สุขกายะ", "ฟิตเนสและการออกกำลังกาย", "ทั่วไป", 999, 3192],
  ["100130088", "Sukaya น้ำมันนวดหัวลูกกลิ้ง 12มล. 8ขวด+ขวดพกพา 3มล. 6ขวด+ยาดม 1กป.", "สุขกายะ", "ฟิตเนสและการออกกำลังกาย", "ทั่วไป", 999, 3813],
  ["100130098", "Sukaya Aromatic Cooling Oil 5ml.", "สุขกายะ", "ฟิตเนสและการออกกำลังกาย", "ทั่วไป", 219, 390],
  ["100310055", "BCC สเปรย์ทำความสะอาดเครื่องปรับอากาศ 500ml. 3 แถม 1+ผ้า", "BCC", "บ้านและครัว", "ทั่วไป", 990, 1659],
  ["800330001", "Din Nao สารปรับปรุงสภาพดิน(1000ml.) 3ขวดแถมปราบมาร 2ซอง", "Din Nao", "บ้านและครัว", "ทั่วไป", 990, 2470],
  ["100310059", "House Clear เครื่องไล่หนูและแมลงภายในบ้าน 1 แถม 1+เครื่องไล่แมลงวัน+ชุดไขควงอเนกประสงค์", "House Clear", "บ้านและครัว", "ทั่วไป", 999, 5160],
  ["100310061", "MAX UP ชุดไฟสปอร์ตไลท์โซลาเซลล์ 2000W 1แถม1+รีโมท 1อัน+ผ้า 8ผืน", "MAX UP Solar Light", "บ้านและครัว", "ทั่วไป", 1390, 4280],
  ["100310093", "SUPERMAX เครื่องตัดหญ้าไร้สาย 2ล้อพร้อมอุปกรณ์+ของแถม", "SUPERMAX", "บ้านและครัว", "ทั่วไป", 899, 4260],
  ["100340024", "Tapper ที่นอนท็อปเปอร์หนา 4 นิ้ว สีน้ำเงินกรม เทามิลเลเนียม 1ผืน", "Tapper", "บ้านและครัว", "ทั่วไป", 279, 1290],
  ["100340023", "Tapper ที่นอนท็อปเปอร์หนา 4 นิ้ว สีน้ำเงินกรม น้ำตาลทอง 1ผืน", "Tapper", "บ้านและครัว", "ทั่วไป", 279, 1290],
  ["100310067", "THORNADO ปืนฉีดน้ำแรงดันสูงไร้สาย แถมแบตเตอรี่ 1ก้อน+ถุงมือไมโครไฟเบอร์ 2ชิ้น", "THORNADO", "บ้านและครัว", "ทั่วไป", 999, 3370],
  ["FREE-FOAM", "ถุงตีฟองสบู่ (ของแถม)", "Happy Shopping", "ของแถม", "ของแถม", 0, 0],
]

export const FREE_GIFT_SKU = "FREE-FOAM"
export const PRODUCT_GROUPS = [...new Set(PRODUCT_SEED.map((r) => r[3]))]
// Pick a few SKUs to be low / out of stock for the demo (by position so it is stable)
const LOW_STOCK = new Set([2, 17, 31, 52, 88, 104, 126, 140, 158].map((i) => PRODUCT_SEED[i][0]))
const OUT_OF_STOCK = new Set([PRODUCT_SEED[27][0], PRODUCT_SEED[97][0]])

export const PRODUCTS: Product[] = PRODUCT_SEED.map(([sku, name, brand, group, category, price, fullPrice]) => {
  const listings: Product["listings"] = {}
  for (const p of PLATFORM_IDS) {
    if (sku === FREE_GIFT_SKU) continue
    if (p === "instagram" && rand() < 0.4) continue
    if (p === "lazada" && rand() < 0.15) continue
    listings[p] = { listingId: `${PLATFORMS[p].short}-${int(100000, 999999)}`, synced: rand() > 0.012 }
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
type Kind = "beauty" | "supplement" | "food" | "fashion" | "other"
type ReasonCtx = { name: string; kind: Kind }
const kindOf = (group: string): Kind =>
  group === "ความงาม" ? "beauty" : group === "ผลิตภัณฑ์เสริมอาหารและยา" ? "supplement" : group === "อาหารและเครื่องดื่ม" ? "food" : group === "สินค้าแฟชั่น" ? "fashion" : "other"
const short = (n: string) => n.split(" ").slice(0, 4).join(" ")
const RETURN_REASONS: { reason: string; restock: boolean; for?: Kind[]; details: ((c: ReasonCtx) => string)[] }[] = [
  {
    reason: "สินค้าชำรุด/เสียหาย",
    restock: false,
    details: [
      (c) =>
        c.kind === "beauty"
          ? `กล่องบุบ ${short(c.name)} ฝาแตก เนื้อครีม/แป้งหกเลอะทั้งกล่องค่ะ`
          : c.kind === "supplement" || c.kind === "food"
            ? `${short(c.name)} ซีลฉีกขาดมาตั้งแต่แกะกล่อง ไม่กล้าทานค่ะ`
            : c.kind === "fashion"
              ? `${short(c.name)} มีรอยขาดตรงตะเข็บ ด้ายหลุดค่ะ`
              : `${short(c.name)} มีรอยแตกร้าว ใช้งานไม่ได้ครับ`,
      (c) => `พัสดุมาถึงกล่องเปียกน้ำ ${short(c.name)} เสียหายครับ`,
    ],
  },
  { reason: "ได้รับสินค้าไม่ครบ", restock: true, details: [(c) => `สั่งโปรแถม แต่ ${short(c.name)} ได้มาไม่ครบตามจำนวนค่ะ`, () => "ของแถมตามโปรไม่ได้ใส่มาในกล่องเลยค่ะ"] },
  {
    reason: "ได้รับสินค้าผิด",
    restock: true,
    details: [(c) => (/No\.|เบอร์|ผิว|สี|ไซส์|Size|[SMLX]{1,3}\b/.test(c.name) ? `สั่ง ${short(c.name)} แต่ได้คนละสี/คนละไซส์/คนละเบอร์มาค่ะ ขอเปลี่ยนด้วยค่ะ` : `สั่ง ${short(c.name)} แต่ได้สินค้าตัวอื่นมาค่ะ ขอเปลี่ยนด้วยค่ะ`)],
  },
  { reason: "ไซส์ไม่พอดี", restock: true, for: ["fashion"], details: [(c) => `${short(c.name)} ตัวเล็กกว่าตารางไซส์ ใส่ไม่ได้ค่ะ ขอเปลี่ยนไซส์ใหญ่ขึ้น`] },
  { reason: "สินค้าใกล้หมดอายุ", restock: false, for: ["beauty", "supplement", "food"], details: [(c) => `${short(c.name)} ล็อตที่ได้รับเหลืออายุไม่ถึง 2 เดือน ใช้ไม่ทันค่ะ`] },
  {
    reason: "แพ้/ไม่เหมาะกับผิว",
    restock: false,
    for: ["beauty", "supplement"],
    details: [(c) => (c.kind === "beauty" ? `ใช้ ${short(c.name)} แล้วหน้าแดง คัน ขึ้นผื่นค่ะ ใช้ไปแค่ 2 ครั้ง` : `ทาน ${short(c.name)} แล้วมีอาการใจสั่น นอนไม่หลับ ขอคืนกล่องที่ยังไม่แกะค่ะ`)],
  },
  { reason: "เปลี่ยนใจ", restock: true, details: [() => "กดสั่งซ้ำโดยไม่ตั้งใจค่ะ ของยังไม่ได้แกะเลย", () => "สั่งเผื่อคุณแม่แต่คุณแม่ซื้อมาแล้ว ของยังไม่ได้แกะค่ะ"] },
]
export const INITIAL_RETURNS: ReturnCase[] = INITIAL_ORDERS.filter((o) => o.status === "returned" || (o.status === "delivered" && rand() < 0.04))
  .slice(0, 18)
  .map((o, i) => {
    const sellableItems = o.items.filter((it) => it.price > 0)
    const chosen = sellableItems.length > 1 && rand() < 0.5 ? [pick(sellableItems)] : sellableItems
    const kind = kindOf(productBySku(chosen[0].sku).group)
    const r = pick(RETURN_REASONS.filter((x) => !x.for || x.for.includes(kind)))
    const items = chosen.map((it) => ({ sku: it.sku, qty: it.qty }))
    const type = r.reason === "ได้รับสินค้าผิด" ? "exchange" : r.reason === "ได้รับสินค้าไม่ครบ" ? "refund_only" : pick(["return_refund", "return_refund", "refund_only"] as const)
    const status = (["requested", "requested", "approved", "in_transit", "received", "refunded", "rejected"] as const)[i % 7]
    return {
      id: `RT-${String(301 + i)}`,
      orderId: o.id,
      items,
      reason: r.reason,
      detail: pick(r.details)({ name: productBySku(items[0].sku).name, kind }),
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


// ---------- Platform listings not yet linked to a master SKU (for "ดึงสินค้าจากแพลตฟอร์ม") ----------
export type PlatformListing = {
  id: string
  platform: PlatformId
  title: string
  sellerSku: string
  price: number
  stock: number
  image?: string
  suggestSku?: string // best match in master catalogue
  score?: number
}
const DECOR = ["[ของแท้ 100%] ", "🔥ส่งฟรี🔥 ", "【พร้อมส่ง】", "", "NEW! "]
export const INITIAL_PLATFORM_LISTINGS: PlatformListing[] = (() => {
  const out: PlatformListing[] = []
  const pool = shuffle(PRODUCTS.filter((p) => p.price > 0))
  let n = 0
  for (const p of pool) {
    const missing = (["shopee", "lazada", "tiktok"] as PlatformId[]).filter((pl) => !p.listings[pl])
    if (!missing.length) continue
    const platform = pick(missing)
    const variant = pick([p.sku, p.sku.toLowerCase(), `${p.sku}-${PLATFORMS[platform].short}`, ""])
    out.push({
      id: `PL-${platform}-${int(100000, 999999)}`,
      platform,
      title: `${pick(DECOR)}${p.name}${rand() < 0.4 ? " ราคาพิเศษ" : ""}`,
      sellerSku: variant,
      price: p.price + pick([0, 0, 10, -10, 20]),
      stock: int(0, 80),
      image: p.image,
      suggestSku: p.sku,
      score: variant.toUpperCase().startsWith(p.sku.toUpperCase()) ? 100 : int(78, 94),
    })
    if (++n >= 9) break
  }
  // listings that only exist on the platform (no master SKU yet)
  out.push(
    { id: "PL-shopee-778201", platform: "shopee", title: "Happy Shopping ถุงผ้าแคนวาส ลายความสุข สั่งได้", sellerSku: "HS-TOTE-01", price: 159, stock: 120 },
    { id: "PL-tiktok-551920", platform: "tiktok", title: "เซ็ตของขวัญปีใหม่ 2027 Happy Box (คละสินค้า)", sellerSku: "", price: 1590, stock: 30 },
    { id: "PL-lazada-302118", platform: "lazada", title: "Happy Shopping ร่มพับ UV กันแดด", sellerSku: "HS-UMB-UV", price: 290, stock: 45 },
  )
  return out
})()
