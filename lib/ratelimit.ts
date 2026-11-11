// Small per-visitor limit for the routes that start an AI run. In memory, which is enough for one demo server.
const hits = new Map<string, number[]>();

export function visitor(req: Request) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

// Returns a 429 Response when over the limit, otherwise null.
export function limit(req: Request, bucket: string, max: number, windowMs: number) {
  const key = `${bucket}:${visitor(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return Response.json({ error: 'rate_limited', reason: `Demo limit: ${max} AI runs per ${Math.round(windowMs / 60000)} minutes per visitor. Please wait a few minutes.` }, { status: 429 });
  }
  recent.push(now);
  hits.set(key, recent);
  return null;
}
