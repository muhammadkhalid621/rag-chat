function getPagination(query) {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10));
  const requestedLimit = Number.parseInt(query.limit || '20', 10);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

module.exports = { getPagination };
