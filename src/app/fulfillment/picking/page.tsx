import { Suspense } from "react"
import { PickingView } from "./picking-view"

export default function PickingPage() {
  return (
    <Suspense>
      <PickingView />
    </Suspense>
  )
}
