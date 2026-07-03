export function paginateNewest(items, page = 1, pageSize = 12) {
  const ordered = [...items].reverse();
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;
  return { items: ordered.slice(start, start + pageSize), currentPage, pageCount, total: ordered.length };
}
