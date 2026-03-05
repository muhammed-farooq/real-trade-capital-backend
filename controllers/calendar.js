const axios = require("axios");

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

async function fetchUpstream(url, cached) {
  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json,text/plain,*/*",
  };
  if (cached?.etag)         headers["If-None-Match"]     = cached.etag;
  if (cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;

  return axios.get(url, {
    timeout: 15000,
    headers,
    // ✅ Add 404 to allowed statuses so axios doesn't throw
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304 || s === 404 || s === 429,
  });
}

const fetchCalendar = async (req, res) => {
  const weekParam = req.params.week ?? "";
  const isNext    = weekParam === "next" || weekParam === "nextweek";
  const week      = isNext ? "nextweek" : "thisweek";
  const url       = `https://nfs.faireconomy.media/ff_calendar_${week}.json`;
  const key       = week;

  const cached = cache.get(key);

  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return res.status(200).json(cached.data);
  }

  try {
    const r = await fetchUpstream(url, cached);

    if (r.status === 304 && cached?.data) {
      cached.ts = Date.now();
      cache.set(key, cached);
      return res.status(200).json(cached.data);
    }

    if (r.status === 429) {
      if (cached?.data) {
        res.setHeader("X-Calendar-Warn", "upstream-rate-limited-served-cache");
        return res.status(200).json(cached.data);
      }
      return res.status(429).json({ error: "Upstream rate limited", detail: "Try again later" });
    }

    // ✅ 404 = next week's file not published yet — return empty array, not an error
    if (r.status === 404) {
      return res.status(200).json({
        events: [],
        message: isNext
          ? "Next week's calendar is not published yet. Check back on Friday."
          : "This week's calendar is unavailable.",
      });
    }

    if (!Array.isArray(r.data)) {
      return res.status(502).json({ error: "Upstream did not return an array", rawType: typeof r.data });
    }

    cache.set(key, {
      ts:           Date.now(),
      data:         r.data,
      etag:         r.headers.etag,
      lastModified: r.headers["last-modified"],
    });

    return res.status(200).json(r.data);

  } catch (e) {
    if (cached?.data) return res.status(200).json(cached.data);
    console.error("[fetchCalendar]", e?.message);
    return res.status(500).json({ error: "Failed to fetch calendar", detail: e?.message });
  }
};

module.exports = { fetchCalendar };