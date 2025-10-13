export function parsePagination(q){
  const page = Math.max(1, Number(q.page || 1));
  const limit = Math.min(10000, Math.max(1, Number(q.limit || 20)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
