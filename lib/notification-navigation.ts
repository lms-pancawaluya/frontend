export type NotificationRole = "admin" | "guru" | "pengajar";

interface NotificationDestinationInput {
  type: string;
  linkUrl?: string | null;
  role?: string | null;
}

/** Tipe notifikasi terkait Course Discussion. */
const COMMENT_NOTIFICATION_TYPES = new Set([
  "COMMENT_MENTION",
  "COMMENT_REPLY",
  "NEW_COMMENT",
]);

/**
 * Halaman diskusi Course berbeda per role (pola yang sama dengan Helpdesk).
 * `course` dipakai sebagai query param agar halaman memilih course yang benar.
 */
function resolveDiscussionPath(role: string | null): string | null {
  if (role === "admin") return "/admin/diskusi";
  if (role === "pengajar") return "/pengajar/diskusi";
  if (role === "guru") return "/modules/courses";
  return null;
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

  if (COMMENT_NOTIFICATION_TYPES.has(type)) {
    // linkUrl adalah source of truth. Dua bentuk yang didukung:
    //   /courses/:courseId[?commentId=:commentId]
    //   /contents/:contentId
    const commentId = url.searchParams.get("commentId");

    if (url.pathname === "/contents" || url.pathname.startsWith("/contents/")) {
      const contentId = getPathId(url.pathname, "contents");
      return contentId ? `/pembelajaran/${encodeURIComponent(contentId)}` : null;
    }

    const courseId = getPathId(url.pathname, "courses");
    if (courseId) {
      const basePath = resolveDiscussionPath(normalizedRole);
      if (!basePath) return null;

      // Guru memakai route statis /modules/courses/:courseId; Admin/Pengajar
      // memakai halaman diskusi dengan query `course`.
      const target =
        basePath === "/modules/courses"
          ? `${basePath}/${encodeURIComponent(courseId)}`
          : `${basePath}?course=${encodeURIComponent(courseId)}`;

      const withComment = commentId
        ? `${target}${target.includes("?") ? "&" : "?"}commentId=${encodeURIComponent(commentId)}`
        : target;

      return withComment;
    }

    return null;
  }

  return null;
}
