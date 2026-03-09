import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const BASE_URL = process.env.PTV_REALTIME_BASE_URL!;
const API_KEY = process.env.PTV_REALTIME_API_KEY!;

// In-memory cache: path -> { data, ts }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 30_000;

export async function fetchRealtime(path: string): Promise<GtfsRealtimeBindings.transit_realtime.FeedMessage> {
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data as GtfsRealtimeBindings.transit_realtime.FeedMessage;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Ocp-Apim-Subscription-Key': API_KEY,
      'Accept': 'application/x-protobuf',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`PTV API error: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  cache.set(path, { data: feed, ts: now });
  return feed;
}
