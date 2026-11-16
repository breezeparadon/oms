import { Suspense } from "react"
import { CustomersView } from "./customers-view"

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersView />
    </Suspense>
  )
}
