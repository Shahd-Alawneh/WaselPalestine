/**
 * Weather Integration Service
 * Provider: OpenWeatherMap (https://openweathermap.org/api)
 * - Caches results in Redis for 10 minutes to avoid rate limits
 * - Handles timeouts (5s), rate limiting (429), and provider errors gracefully
 */

import redisClient from "../db/redis";

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5";
const CACHE_TTL_SECONDS = 600; // 10 minutes
const REQUEST_TIMEOUT_MS = 5000;

export interface WeatherData {
  location: string;
  country: string;
  lat: number;
  lng: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  windSpeed: number;
  visibility: number;
  conditions: WeatherCondition[];
  fetchedAt: string;
  cached: boolean;
}

export interface WeatherCondition {
  main: string;
  description: string;
  isMobilityHazard: boolean;
}

// Conditions that affect road mobility
const MOBILITY_HAZARDS = [
  "Thunderstorm", "Drizzle", "Rain", "Snow",
  "Fog", "Sand", "Dust", "Squall", "Tornado",
];

function isMobilityHazard(condition: string): boolean {
  return MOBILITY_HAZARDS.some((h) => condition.toLowerCase().includes(h.toLowerCase()));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function getWeatherByCoords(lat: number, lng: number): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const err: any = new Error("Weather API key not configured");
    err.status = 503;
    throw err;
  }

  const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;

  // Try cache first
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as WeatherData;
      data.cached = true;
      return data;
    }
  } catch {
    // Redis unavailable — proceed without cache
  }

  const url = `${OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const e: any = new Error("Weather service timed out");
      e.status = 504;
      throw e;
    }
    const e: any = new Error("Weather service unreachable");
    e.status = 502;
    throw e;
  }

  if (res.status === 429) {
    const err: any = new Error("Weather API rate limit exceeded — try again later");
    err.status = 429;
    throw err;
  }

  if (res.status === 401) {
    const err: any = new Error("Weather API key invalid");
    err.status = 503;
    throw err;
  }

  if (!res.ok) {
    const err: any = new Error(`Weather provider error (${res.status})`);
    err.status = 502;
    throw err;
  }

  const raw = await res.json() as any;

  const conditions: WeatherCondition[] = (raw.weather ?? []).map((w: any) => ({
    main: w.main,
    description: w.description,
    isMobilityHazard: isMobilityHazard(w.main),
  }));

  const data: WeatherData = {
    location: raw.name,
    country: raw.sys?.country ?? "",
    lat: raw.coord?.lat ?? lat,
    lng: raw.coord?.lon ?? lng,
    temperature: raw.main?.temp,
    feelsLike: raw.main?.feels_like,
    humidity: raw.main?.humidity,
    description: conditions[0]?.description ?? "",
    windSpeed: raw.wind?.speed ?? 0,
    visibility: raw.visibility ?? 0,
    conditions,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  // Store in cache
  try {
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
  } catch {
    // Cache write failure is non-fatal
  }

  return data;
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const err: any = new Error("Weather API key not configured");
    err.status = 503;
    throw err;
  }

  const cacheKey = `weather:city:${city.toLowerCase().trim()}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as WeatherData;
      data.cached = true;
      return data;
    }
  } catch {
    // Redis unavailable
  }

  const url = `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      const e: any = new Error("Weather service timed out");
      e.status = 504;
      throw e;
    }
    const e: any = new Error("Weather service unreachable");
    e.status = 502;
    throw e;
  }

  if (res.status === 404) {
    const err: any = new Error(`City "${city}" not found in weather service`);
    err.status = 404;
    throw err;
  }

  if (res.status === 429) {
    const err: any = new Error("Weather API rate limit exceeded");
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const err: any = new Error(`Weather provider error (${res.status})`);
    err.status = 502;
    throw err;
  }

  const raw = await res.json() as any;

  const conditions: WeatherCondition[] = (raw.weather ?? []).map((w: any) => ({
    main: w.main,
    description: w.description,
    isMobilityHazard: isMobilityHazard(w.main),
  }));

  const data: WeatherData = {
    location: raw.name,
    country: raw.sys?.country ?? "",
    lat: raw.coord?.lat ?? 0,
    lng: raw.coord?.lon ?? 0,
    temperature: raw.main?.temp,
    feelsLike: raw.main?.feels_like,
    humidity: raw.main?.humidity,
    description: conditions[0]?.description ?? "",
    windSpeed: raw.wind?.speed ?? 0,
    visibility: raw.visibility ?? 0,
    conditions,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  try {
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
  } catch {
    // Non-fatal
  }

  return data;
}