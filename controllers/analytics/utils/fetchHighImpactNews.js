// jobs/utils/fetchHighImpactNews.js
const https     = require("https");
const http      = require("http");
const NodeCache = require("node-cache");

const SOURCES = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
];

const cache       = new NodeCache({ checkperiod: 120 });
const CACHE_KEY   = "ff_news_ok";
const FAIL_KEY    = "ff_news_fail";
const SUCCESS_TTL = 6 * 60 * 60;  // 6 h
const FAILURE_TTL = 10 * 60;       // 10 min — skip retries for one full cron cycle

// ─────────────────────────────────────────────────────────────────────────────
// httpGet
// ─────────────────────────────────────────────────────────────────────────────
const httpGet = (url, redirectsLeft = 3) =>
  new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; NodeJS-cron/1.0)", "Accept": "application/json" }, timeout: 10_000 },
      (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) return reject(new Error(`Too many redirects from ${url}`));
          return resolve(httpGet(res.headers.location, redirectsLeft - 1));
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} from ${url}`)); }
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          const t = raw.trimStart();
          if (!t.startsWith("[") && !t.startsWith("{")) {
            console.error(`[fetchHighImpactNews] Non-JSON from ${url}: ${raw.slice(0, 120)}`);
            return reject(new Error(`Non-JSON response from ${url}`));
          }
          try { resolve(JSON.parse(raw)); } catch { reject(new Error(`JSON.parse failed for ${url}`)); }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
    req.on("error", reject);
  });

// ─────────────────────────────────────────────────────────────────────────────
// tryFetch
// ─────────────────────────────────────────────────────────────────────────────
const tryFetch = async () => {
  const errors = [];
  for (const url of SOURCES) {
    try {
      const data = await httpGet(url);
      if (Array.isArray(data)) return data;
      errors.push(`${url}: not an array`);
    } catch (err) {
      errors.push(`${url}: ${err.message}`);
    }
  }
  throw new Error(`All sources failed — ${errors.join(" | ")}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// parseEvent
// ─────────────────────────────────────────────────────────────────────────────
const parseEvent = (e) => {
  const parts = (e.date ?? "").split("-");
  if (parts.length !== 3) return null;
  const iso = `${parts[2]}-${parts[0]}-${parts[1]}`;
  let time = "00:00", timestamp = new Date(iso + "T00:00:00.000Z").getTime();
  if (e.time && e.time !== "All Day") {
    const match = e.time.toLowerCase().match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (match) {
      let h = parseInt(match[1], 10); const m = parseInt(match[2], 10);
      if (match[3] === "pm" && h !== 12) h += 12;
      if (match[3] === "am" && h === 12) h = 0;
      time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      timestamp = new Date(`${iso}T${time}:00.000Z`).getTime();
    }
  }
  return { title: e.title ?? "Unknown Event", currency: e.country ?? e.currency ?? "USD", impact: "High", date: iso, time, timestamp };
};

// ─────────────────────────────────────────────────────────────────────────────
// warmCache — call this ONCE before runAllChecks starts.
// Fetches and caches the result so every subsequent fetchHighImpactNews()
// call in the same cron cycle is a synchronous cache hit with zero HTTP work.
// ─────────────────────────────────────────────────────────────────────────────
const warmCache = async () => {
  // Already have a good result or are in failure backoff — nothing to do
  if (cache.get(CACHE_KEY) !== undefined || cache.get(FAIL_KEY) !== undefined) return;

  try {
    const todayUTC = new Date().toISOString().split("T")[0];
    const raw = await tryFetch();
    const events = raw
      .filter((e) => {
        if ((e.impact ?? "").toLowerCase() !== "high") return false;
        const parts = (e.date ?? "").split("-");
        if (parts.length !== 3) return false;
        return `${parts[2]}-${parts[0]}-${parts[1]}` === todayUTC;
      })
      .map(parseEvent)
      .filter(Boolean);

    cache.set(CACHE_KEY, events, SUCCESS_TTL);
    console.log(`[fetchHighImpactNews] warmed — ${events.length} high-impact events for ${todayUTC} (TTL 6h)`);
  } catch (err) {
    cache.set(FAIL_KEY, true, FAILURE_TTL);
    console.error(`[fetchHighImpactNews] warm failed (backoff ${FAILURE_TTL / 60}min): ${err.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchHighImpactNews — always a cache read after warmCache() has been called.
// ─────────────────────────────────────────────────────────────────────────────
const fetchHighImpactNews = () => {
  const cached = cache.get(CACHE_KEY);
  if (cached !== undefined) return cached;
  // Either in failure backoff or warmCache wasn't called — return empty safely
  return [];
};

module.exports = { fetchHighImpactNews, warmCache };