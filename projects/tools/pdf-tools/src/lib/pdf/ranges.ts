/** 1-based inclusive range → 0-based inclusive indices, or an error string. */
export function parsePageRange(
  from: number,
  to: number,
  pageCount: number,
): { start: number; end: number } | string {
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    return 'Page numbers must be whole numbers.';
  }
  if (pageCount < 1) return 'PDF has no pages.';
  if (from < 1 || to < 1 || from > pageCount || to > pageCount) {
    return `Pages must be between 1 and ${pageCount}.`;
  }
  if (from > to) return 'Start page must be ≤ end page.';
  return { start: from - 1, end: to - 1 };
}
