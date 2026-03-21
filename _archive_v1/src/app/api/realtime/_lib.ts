import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const API_BASE = 'https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1';
const API_KEY = process.env.PTV_REALTIME_API_KEY!;

// In-memory cache: mode:path -> { data, ts }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 30_000;

export type TransitMode = 'metro' | 'tram' | 'metrobus';

export async function fetchRealtime(path: string, mode: TransitMode = 'metro'): Promise<GtfsRealtimeBindings.transit_realtime.FeedMessage> {
  const cacheKey = `${mode}:${path}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data as GtfsRealtimeBindings.transit_realtime.FeedMessage;
  }

  const url = `${API_BASE}/${mode}${path}`;
  const res = await fetch(url, {
    headers: {
      'KeyId': API_KEY,
      'Accept': 'application/x-protobuf',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`PTV API error (${mode}): ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  cache.set(cacheKey, { data: feed, ts: now });
  return feed;
}
