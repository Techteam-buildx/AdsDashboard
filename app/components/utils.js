// Shared helpers for the Marketing Dashboard widget: API calls, date ranges,
// number formatting and the metric/series calculations for each source tab.
// Loaded first; everything here is a global used by the components.

// ---------- API ----------

const API_BASE =
  window.ADS_API_BASE != null
    ? window.ADS_API_BASE
    : "https://2onghku7vk.execute-api.ap-south-1.amazonaws.com/dev";
// API Gateway gives up at 29s; stop waiting just before that.
const REQUEST_TIMEOUT_MS = 28000;
const DEFAULT_CITIES = ["Bangalore", "Hyderabad", "Hossur"];

async function readJson(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    // non-JSON body
  }
  if (!response.ok) {
    const detail = (body && (body.error || body.message)) || `HTTP ${response.status}`;
    const err = new Error(response.status === 504 ? "The server timed out." : detail);
    err.isTimeout = response.status === 504;
    throw err;
  }
  if (!body || typeof body !== "object") throw new Error("Unexpected response from server.");
  return body;
}

async function fetchDashboard({ startDate, endDate, mStartDate, mEndDate, city }, signal) {
  const params = [];
  if (mStartDate && mEndDate) params.push(`mstart=${mStartDate}`, `mend=${mEndDate}`);
  if (city) params.push(`city=${encodeURIComponent(city)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  const response = await fetch(`${API_BASE}/app/dashboard/${startDate}/${endDate}${query}`, { signal });
  return readJson(response);
}

// City list from the backend; null if unavailable, keeping the defaults.
async function fetchCities() {
  try {
    const response = await fetch(`${API_BASE}/app/config`);
    if (!response.ok) return null;
    const body = await response.json();
    return Array.isArray(body.cities) && body.cities.length ? body.cities : null;
  } catch (e) {
    return null;
  }
}

// ---------- Dates ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// YYYY-MM-DD in the viewer's local time zone (toISOString() would give the UTC date).
function formatLocalDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "last90", label: "Last 90 days" },
  { key: "custom", label: "Custom range…" },
];

// [startDate, endDate] for a preset, as YYYY-MM-DD.
function presetRange(key, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const f = formatLocalDate;
  switch (key) {
    case "today": return [f(today), f(today)];
    case "yesterday": return [f(addDays(today, -1)), f(addDays(today, -1))];
    case "last7": return [f(addDays(today, -6)), f(today)];
    case "last30": return [f(addDays(today, -29)), f(today)];
    case "last90": return [f(addDays(today, -89)), f(today)];
    case "thisMonth": return [f(new Date(today.getFullYear(), today.getMonth(), 1)), f(today)];
    case "lastMonth":
      return [
        f(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        f(new Date(today.getFullYear(), today.getMonth(), 0)),
      ];
    default: return null;
  }
}

function prettyDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function describeRange(r) {
  if (!r) return "";
  const range = r.startDate === r.endDate
    ? prettyDate(r.startDate)
    : `${prettyDate(r.startDate)} – ${prettyDate(r.endDate)}`;
  const parts = [range];
  if (r.mStartDate && r.mEndDate) {
    parts.push(`meetings ${prettyDate(r.mStartDate)} – ${prettyDate(r.mEndDate)}`);
  }
  parts.push(r.city || "All cities");
  return parts.join(" · ");
}

function shortDateLabel(ymd) {
  const [, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Calendar bucket for a YYYY-MM-DD label: "Oct 2026" or "Wk of 6 Oct" (weeks start Monday).
function bucketLabel(ymd, interval) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (interval === "monthly") return `${MONTHS[m - 1]} ${y}`;
  if (interval !== "weekly") return shortDateLabel(ymd);
  const date = new Date(Date.UTC(y, m - 1, d));
  const offset = (date.getUTCDay() + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - offset);
  return `Wk of ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

// ---------- Number formatting (Indian system) ----------

function formatCount(n) {
  if (n == null || isNaN(n)) return "–";
  return Math.round(n).toLocaleString("en-IN");
}

function formatRupees(n) {
  if (n == null || isNaN(n)) return "–";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ₹14.70 L, ₹1.07 Cr; below a lakh the full amount.
function formatRupeesCompact(n) {
  if (n == null || isNaN(n)) return "–";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return formatRupees(n);
}

function formatRupeesAxis(n) {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${+(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${+(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${+(n / 1e3).toFixed(0)}k`;
  return `₹${n}`;
}

function ratio(a, b) {
  return b ? a / b : null;
}

// ---------- Sources and metrics ----------

const SOURCES = [
  { key: "comparison", label: "Combined" },
  { key: "google", label: "Google Ads" },
  { key: "facebook", label: "Meta Ads" },
  { key: "socials", label: "Socials" },
  { key: "referral", label: "Referral" },
  { key: "cplead", label: "CP Leads" },
];

// API field prefixes behind each tab.
const SOURCE_PREFIXES = {
  comparison: ["google", "facebook", "referral", "cplead"],
  google: ["google"],
  facebook: ["facebook"],
  socials: ["google", "facebook"],
  referral: ["referral"],
  cplead: ["cplead"],
};

function sumFields(data, prefixes, suffix) {
  return prefixes.reduce((t, p) => t + (Number(data[`${p}_${suffix}`]) || 0), 0);
}

// Totals and cost ratios for the selected tab.
function computeMetrics(data, page) {
  const p = SOURCE_PREFIXES[page] || SOURCE_PREFIXES.comparison;
  const spend = sumFields(data, p, "budget");
  const leads = sumFields(data, p, "leads");
  const meetings = sumFields(data, p, "meetings_done");
  const qualified = sumFields(data, p, "qualified");
  const futureQualified = sumFields(data, p, "future_qualified");
  const conversions = sumFields(data, p, "converted");
  return {
    spend,
    leads,
    meetings,
    qualified,
    futureQualified,
    conversions,
    // Referral cost per lead is a fixed payout per converted referral, as before.
    cpl: page === "referral" ? (data.cpl_referral || null) : ratio(spend, leads),
    cpm: ratio(spend, meetings),
    cpq: ratio(spend, qualified),
    cqf: ratio(spend, qualified + futureQualified),
    cpc: ratio(spend, conversions),
  };
}

function sumSeries(data, prefixes, suffix, length) {
  const out = new Array(length).fill(0);
  for (const p of prefixes) {
    const arr = data[`${p}_${suffix}`];
    if (Array.isArray(arr)) arr.forEach((v, i) => { out[i] += Number(v) || 0; });
  }
  return out;
}

// Per-period series for the selected tab, bucketed daily / weekly / monthly.
function computeSeries(data, page, interval) {
  const dates = data.labels || [];
  const p = SOURCE_PREFIXES[page] || SOURCE_PREFIXES.comparison;
  const raw = {
    spend: sumSeries(data, p, "budgetData", dates.length),
    leads: sumSeries(data, p, "leadsData", dates.length),
    meetings: sumSeries(data, p, "meetingsData", dates.length),
    qualified: sumSeries(data, p, "qualifiedData", dates.length),
    conversions: sumSeries(data, p, "convertedData", dates.length),
  };
  const labels = [];
  const out = { spend: [], leads: [], meetings: [], qualified: [], conversions: [] };
  let current = null;
  dates.forEach((date, i) => {
    const key = bucketLabel(date, interval);
    if (key !== current) {
      current = key;
      labels.push(key);
      for (const k of Object.keys(out)) out[k].push(0);
    }
    for (const k of Object.keys(out)) out[k][out[k].length - 1] += raw[k][i];
  });
  out.cpl = out.spend.map((s, i) => ratio(s, out.leads[i]));
  return { labels, ...out };
}

// One row per source, for the Combined / Socials breakdown.
function sourceBreakdown(data, page) {
  const keys = page === "socials" ? ["google", "facebook"] : ["google", "facebook", "referral", "cplead"];
  return keys.map((k) => {
    const m = computeMetrics(data, k);
    return { key: k, label: SOURCES.find((s) => s.key === k).label, ...m };
  });
}

// ---------- Theme (chart colours come from CSS variables) ----------

function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
