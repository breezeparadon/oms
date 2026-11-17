import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Happy Shopping CRM (Mockup)",
  description: "แชทรวมทุกช่องทางและข้อมูลลูกค้า — เวอร์ชัน CRM อย่างเดียว (ไม่มีออเดอร์/คลัง/สต๊อก)",
}

export default function CrmOnlyLayout({ children }: LayoutProps<"/only-inbox">) {
  return children
}
