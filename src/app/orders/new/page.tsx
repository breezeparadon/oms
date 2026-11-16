import { Suspense } from "react"
import { NewOrderForm } from "./new-order-form"

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrderForm />
    </Suspense>
  )
}
