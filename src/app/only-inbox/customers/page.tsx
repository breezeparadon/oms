import { Suspense } from "react"
import { CustomersView } from "@/app/customers/customers-view"

export default function CrmCustomersPage() {
  return (
    <Suspense>
      <CustomersView />
    </Suspense>
  )
}
