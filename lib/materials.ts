/**
 * Shared helpers for sequencing Guru-side Learning Materials.
 * Backend returns each Content with a `urutan` (order) field. Materials must be
 * treated as a single ordered list regardless of `tipe`.
 */

/** A learning material as returned by GET /api/modules/:id/contents. */
export interface ModuleMaterial {
  id?: string;
  judul?: string;
  tipe?: string;
  konten?: string;
  urutan?: number;
}

/** A material is "teks" material when its tipe is teks or text. */
export function isTextMaterial(tipe?: string): boolean {
  return tipe === "teks" || tipe === "text";
}

/** A material is a dedicated video when its tipe is video. */
export function isVideoMaterial(tipe?: string): boolean {
  return tipe === "video";
}

/**
 * Sorts contents by their `urutan` field, preserving the original response
 * order as a stable tie-breaker (and for items missing `urutan`).
 */
export function sortMaterialsByUrutan<T extends ModuleMaterial>(contents: T[]): T[] {
  return contents
    .map((content, index) => ({ content, index }))
    .sort((a, b) => {
      const aUrutan = typeof a.content.urutan === "number" ? a.content.urutan : Number.POSITIVE_INFINITY;
      const bUrutan = typeof b.content.urutan === "number" ? b.content.urutan : Number.POSITIVE_INFINITY;
      if (aUrutan !== bUrutan) return aUrutan - bUrutan;
      return a.index - b.index;
    })
    .map((entry) => entry.content);
}

/**
 * Resolves the route for a given position in the ordered material list.
 * Video materials use the dedicated video route; every other supported
 * material uses the generic material route. Positions beyond the list return
 * to the Course Detail.
 */
export function getMaterialRoute(
  moduleId: string,
  materials: ModuleMaterial[],
  index: number,
  courseId?: string | null
): string {
  if (index < 0 || index >= materials.length) return courseId ? `/modules/courses/${courseId}` : "/modules";
  const material = materials[index];
  if (isVideoMaterial(material.tipe)) return `/modules/${moduleId}?i=${index}`;
  return `/modules/${moduleId}/text?i=${index}`;
}

