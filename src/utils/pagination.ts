export function getPagination(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const pageRaw = typeof query.page === 'string' ? query.page : '1';
  const limitRaw = typeof query.limit === 'string' ? query.limit : '20';

  const page = Math.max(1, Number.parseInt(pageRaw, 10));
  const requestedLimit = Number.parseInt(limitRaw, 10);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
