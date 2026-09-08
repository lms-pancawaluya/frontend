export type NotificationRole = "admin" | "guru" | "pengajar";

interface NotificationDestinationInput {
  type: string;
  linkUrl?: string | null;
  role?: string | null;
}

function getCanonicalPath(linkUrl: string): string | null {
  const value = linkUrl.trim();
  if (!value || value.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;

  try {
    const url = new URL(value, "https://notifications.invalid");
    if (url.origin !== "https://notifications.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function getPathId(pathname: string, segment: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== segment || !segments[1]) return null;

  try {
    const id = decodeURIComponent(segments[1]);
    return id || null;
  } catch {
    return null;
  }
}

export function resolveNotificationDestination({
  type,
  linkUrl,
  role,
}: NotificationDestinationInput): string | null {
  if (!linkUrl) return null;

  const canonicalPath = getCanonicalPath(linkUrl);
  if (!canonicalPath) return null;

  const url = new URL(canonicalPath, "https://notifications.invalid");
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : null;

  if (type === "NEW_MODULE") {
    const moduleId = getPathId(url.pathname, "modules");
    return moduleId ? `/modules/${encodeURIComponent(moduleId)}` : null;
  }

  if (type === "NEW_HELPDESK_TICKET" || type === "HELPDESK_REPLY") {
    const ticketId = getPathId(url.pathname, "helpdesk");
    if (!ticketId) return null;

    const destination = normalizedRole === "admin" ? "/admin/helpdesk" :
      normalizedRole === "guru" || normalizedRole === "pengajar" ? "/helpdesk" : null;
    return destination ? `${destination}?ticketId=${encodeURIComponent(ticketId)}` : null;
  }

  return null;
}
