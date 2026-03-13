const https = require("https");

const FF_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json"; // ForexFactory public feed

const httpGet = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error("Failed to parse news JSON"));
          }
        });
      })
      .on("error", reject);
  });

/**
 * @returns {Promise<Array<{
 *   title: string,
 *   currency: string,
 *   impact: "High"|"Medium"|"Low",
 *   date: string,       // "YYYY-MM-DD"
 *   time: string,       // "HH:MM" UTC
 *   timestamp: number,  // epoch ms (UTC)
 * }>>}
 */
const fetchHighImpactNews = async () => {
  try {
    const raw = await httpGet(FF_URL);

    const todayUTC = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    return raw
      .filter((e) => {
        if ((e.impact ?? "").toLowerCase() !== "high") return false;

        // ForexFactory date format: "01-15-2025" (MM-DD-YYYY)
        const parts = (e.date ?? "").split("-");
        if (parts.length !== 3) return false;
        const iso = `${parts[2]}-${parts[0]}-${parts[1]}`; // → "YYYY-MM-DD"
        return iso === todayUTC;
      })
      .map((e) => {
        const parts = e.date.split("-");
        const iso   = `${parts[2]}-${parts[0]}-${parts[1]}`;

        // e.time is like "8:30am" or "All Day"
        let time      = "00:00";
        let timestamp = new Date(iso).getTime();

        if (e.time && e.time !== "All Day") {
          const t = e.time.toLowerCase();
          const match = t.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
          if (match) {
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            if (match[3] === "pm" && h !== 12) h += 12;
            if (match[3] === "am" && h === 12) h = 0;
            time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            timestamp = new Date(`${iso}T${time}:00.000Z`).getTime();
          }
        }

        return {
          title:     e.title    ?? "Unknown Event",
          currency:  e.country  ?? e.currency ?? "USD",
          impact:    "High",
          date:      iso,
          time,
          timestamp,
        };
      });
  } catch (err) {
    console.error("[fetchHighImpactNews] failed:", err.message);
    return []; // fail-soft — job continues
  }
};

module.exports = { fetchHighImpactNews };