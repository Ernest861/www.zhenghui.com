import { getStore } from "@netlify/blobs";

const STORE_NAME = "visitor-countries";
const STORE_KEY = "country-totals-v1";
const MAX_DAYS = 180;

const JSON_HEADERS = {
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-origin": "*",
  "access-control-max-age": "86400",
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

function emptyData() {
  return {
    version: 1,
    total: 0,
    updatedAt: null,
    countries: {},
    days: {},
  };
}

function normalizeCountry(country) {
  const code = String(country?.code || "ZZ").trim().toUpperCase();
  const name = String(country?.name || "Unknown").trim() || "Unknown";

  if (!/^[A-Z]{2}$/.test(code)) {
    return { code: "ZZ", name: "Unknown" };
  }

  return { code, name };
}

function normalizeData(value) {
  const data = value && typeof value === "object" ? value : emptyData();
  const countries = data.countries && typeof data.countries === "object" ? data.countries : {};
  const days = data.days && typeof data.days === "object" ? data.days : {};

  return {
    version: 1,
    total: Number(data.total) || 0,
    updatedAt: data.updatedAt || null,
    countries,
    days,
  };
}

function publicPayload(data) {
  const normalized = normalizeData(data);
  const countries = Object.entries(normalized.countries)
    .map(([code, value]) => ({
      code,
      name: value?.name || code,
      count: Number(value?.count) || 0,
      lastSeen: value?.lastSeen || null,
    }))
    .filter((country) => country.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    total: normalized.total,
    countryCount: countries.length,
    updatedAt: normalized.updatedAt,
    countries,
  };
}

function pruneDays(days) {
  const entries = Object.entries(days).sort(([a], [b]) => b.localeCompare(a));
  return Object.fromEntries(entries.slice(0, MAX_DAYS));
}

async function readData(store) {
  try {
    const entry = await store.getWithMetadata(STORE_KEY, {
      consistency: "strong",
      type: "json",
    });

    return {
      data: normalizeData(entry?.data),
      etag: entry?.etag || null,
    };
  } catch (error) {
    if (error?.status === 404) {
      return { data: emptyData(), etag: null };
    }

    throw error;
  }
}

function addVisit(data, country) {
  const now = new Date();
  const isoNow = now.toISOString();
  const day = isoNow.slice(0, 10);
  const normalized = normalizeData(data);
  const existing = normalized.countries[country.code] || {
    name: country.name,
    count: 0,
    firstSeen: isoNow,
  };

  normalized.total += 1;
  normalized.updatedAt = isoNow;
  normalized.countries[country.code] = {
    ...existing,
    name: country.name,
    count: (Number(existing.count) || 0) + 1,
    lastSeen: isoNow,
  };

  const dayEntry = normalized.days[day] || { total: 0, countries: {} };
  dayEntry.total += 1;
  dayEntry.countries[country.code] = (Number(dayEntry.countries[country.code]) || 0) + 1;
  normalized.days[day] = dayEntry;
  normalized.days = pruneDays(normalized.days);

  return normalized;
}

async function recordVisit(store, country) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, etag } = await readData(store);
    const updated = addVisit(data, country);
    const options = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
    const result = await store.setJSON(STORE_KEY, updated, options);

    if (result?.modified !== false) {
      return updated;
    }
  }

  const { data } = await readData(store);
  return data;
}

function getVisitorCountry(context) {
  return normalizeCountry({
    code: context?.geo?.country?.code,
    name: context?.geo?.country?.name,
  });
}

export default async function handler(request, context) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: JSON_HEADERS });
  }

  const store = getStore(STORE_NAME);

  if (request.method === "GET") {
    const { data } = await readData(store);
    return Response.json(publicPayload(data), { headers: JSON_HEADERS });
  }

  const updated = await recordVisit(store, getVisitorCountry(context));
  return Response.json(publicPayload(updated), { headers: JSON_HEADERS });
}
