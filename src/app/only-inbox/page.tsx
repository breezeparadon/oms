import { Suspense } from "react"
import { InboxView } from "@/app/inbox/inbox-view"

export default function CrmInboxPage() {
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  )
}
