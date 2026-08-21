// DEPRECATED: Ticket detail is now rendered as a modal on /helpdesk.
// This route file is kept empty to avoid 404 on stale links and will be deleted.
// See app/helpdesk/page.tsx for the modal-based implementation.
import { redirect } from "next/navigation";

export default function DeprecatedTicketDetailPage() {
  redirect("/helpdesk");
}
