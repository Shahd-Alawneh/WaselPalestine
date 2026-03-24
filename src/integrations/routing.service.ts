/**
 * Routing Integration Service
 * Providers:
 *   - OSRM (router.project-osrm.org) — real road-network routing
 *   - Nominatim (nominatim.openstreetmap.org) — address → coordinates geocoding
 *
 * Handles: authentication headers, rate limiting (1 req/s for Nominatim),
 * timeouts (8s), caching in Redis (routes: 15 min, geocoding: 24h)
 */

import redisClient from "../db/redis";

const OSRM_BASE = "https://router.project-osrm.org";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const ROUTE_CACHE_TTL = 900;    // 15 minutes
const GEO_CACHE_TTL = 86400;    // 24 hours
const REQUEST_TIMEOUT_MS = 8000;

// Nominatim requires a User-Agent identifying your app
const NOMINATIM_HEADERS = {
  "User-Agent": "WaselPalestine/1.0 (academic project)",
  "Accept-Language": "ar,en",
};

// Simple in-memory rate limiter for Nominatim (max 1 req/s)
let lastNominatimCall = 0;
async function nominatimRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed));
  }
  lastNominatimCall = Date.now();
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Geocoding ───────────────────────────────────────────────────────────────

export interface GeocodedLocation {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  cached: boolean;
}

export async function geocodeAddress(address: string): Promise<GeocodedLocation> {
  const cacheKey = `geo:${address.toLowerCase().trim()}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as GeocodedLocation;
      data.cached = true;
      return data;
    }
  } catch {
    // Redis unavailable
  }

  await nominatimRateLimit();

  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ps`;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, { headers: NOMINATIM_HEADERS }, REQUEST_TIMEOUT_MS);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const e: any = new Error("Geocoding service timed out");
      e.status = 504;
      throw e;
    }
    const e: any = new Error("Geocoding service unreachable");
    e.status = 502;
    throw e;
  }

  if (res.status === 429) {
    const err: any = new Error("Geocoding service rate limit exceeded");
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const err: any = new Error(`Geocoding provider error (${res.status})`);
    err.status = 502;
    throw err;
  }

  const results = await res.json() as any[];

  if (!results || results.length === 0) {
    const err: any = new Error(`Address not found: "${address}"`);
    err.status = 404;
    throw err;
  }

  const result = results[0];
  const data: GeocodedLocation = {
    displayName: result.display_name,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    type: result.type ?? "unknown",
    cached: false,
  };

  try {
    await redisClient.setEx(cacheKey, GEO_CACHE_TTL, JSON.stringify(data));
  } catch {
    // Non-fatal
  }

  return data;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation> {
  const cacheKey = `rgeo:${lat.toFixed(4)}:${lng.toFixed(4)}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as GeocodedLocation;
      data.cached = true;
      return data;
    }
  } catch {
    // Redis unavailable
  }

  await nominatimRateLimit();

  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, { headers: NOMINATIM_HEADERS }, REQUEST_TIMEOUT_MS);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const e: any = new Error("Reverse geocoding timed out");
      e.status = 504;
      throw e;
    }
    const e: any = new Error("Reverse geocoding service unreachable");
    e.status = 502;
    throw e;
  }

  if (!res.ok) {
    const err: any = new Error(`Reverse geocoding error (${res.status})`);
    err.status = 502;
    throw err;
  }

  const raw = await res.json() as any;

  const data: GeocodedLocation = {
    displayName: raw.display_name ?? "",
    lat,
    lng,
    type: raw.type ?? "unknown",
    cached: false,
  };

  try {
    await redisClient.setEx(cacheKey, GEO_CACHE_TTL, JSON.stringify(data));
  } catch {
    // Non-fatal
  }

  return data;
}

// ─── Road Routing ─────────────────────────────────────────────────────────────

export interface OsrmRouteResult {
  distance: number;         // meters
  distanceKm: number;
  duration: number;         // seconds
  durationMinutes: number;
  geometry: [number, number][];  // [lng, lat] pairs
  legs: OsrmLeg[];
  provider: string;
  cached: boolean;
}

export interface OsrmLeg {
  distance: number;
  duration: number;
  summary: string;
  steps: number;
}

export async function getRoadRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<OsrmRouteResult> {
  const cacheKey = `osrm:${originLat.toFixed(4)},${originLng.toFixed(4)}:${destLat.toFixed(4)},${destLng.toFixed(4)}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as OsrmRouteResult;
      data.cached = true;
      return data;
    }
  } catch {
    // Redis unavailable
  }

  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&annotations=false`;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, {}, REQUEST_TIMEOUT_MS);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const e: any = new Error("Routing service timed out");
      e.status = 504;
      throw e;
    }
    const e: any = new Error("Routing service unreachable");
    e.status = 502;
    throw e;
  }

  if (res.status === 429) {
    const err: any = new Error("Routing service rate limit exceeded");
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const err: any = new Error(`Routing provider error (${res.status})`);
    err.status = 502;
    throw err;
  }

  const raw = await res.json() as any;

  if (raw.code !== "Ok" || !raw.routes?.length) {
    const err: any = new Error("No road route found between the specified coordinates");
    err.status = 404;
    throw err;
  }

  const route = raw.routes[0];
  const geometry: [number, number][] = route.geometry?.coordinates ?? [];

  const legs: OsrmLeg[] = (route.legs ?? []).map((leg: any) => ({
    distance: leg.distance,
    duration: leg.duration,
    summary: leg.summary ?? "",
    steps: leg.steps?.length ?? 0,
  }));

  const data: OsrmRouteResult = {
    distance: route.distance,
    distanceKm: Math.round((route.distance / 1000) * 100) / 100,
    duration: route.duration,
    durationMinutes: Math.round(route.duration / 60),
    geometry,
    legs,
    provider: "OSRM / OpenStreetMap",
    cached: false,
  };

  try {
    await redisClient.setEx(cacheKey, ROUTE_CACHE_TTL, JSON.stringify(data));
  } catch {
    // Non-fatal
  }

  return data;
}