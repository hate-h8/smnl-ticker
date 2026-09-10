// ============================================================
// CONFIG
// Central place for constants: default theme/headlines, the
// Supabase connection used to pull scores, and the various
// timing knobs (how often scores refresh, how fast the ticker
// scrolls, etc).
// ============================================================

// ---- Theme ---------------------------------------------------
// THEME_META drives which color pickers show up in the Settings
// panel (label shown to the user + which CSS variable it edits).
const THEME_META = [
  { key: "--headline-bg-top",    label: "Headlines background (top)" },
  { key: "--headline-bg-bottom", label: "Headlines background (bottom)" },
  { key: "--box-bg",             label: "League/score box background" },
  { key: "--accent",             label: "Accent (borders, highlights)" },
  { key: "--text",               label: "Text color" },
];

// The colors used the first time the ticker loads with nothing
// saved yet, or after hitting "Reset to defaults" in Settings.
const DEFAULT_THEME = {
  "--headline-bg-top": "#12233B",
  "--headline-bg-bottom": "#12233B",
  "--box-bg": "#BA1C07",
  "--accent": "#E2B22C",
  "--text": "#FFFFFF",
  "--greenscreen": "#00FF00",
};

// ---- Headlines -------------------------------------------------
const DEFAULT_HEADLINES = [
  { flag: "News", text: "You are watching SMNL Baseball" },
  { flag: "Website", text: "Checkout the SMNL website at https://smnl-web.vercel.app/" },
  { flag: "H8", text: "Shoutout H8 for making the ticker" },
];

// ---- localStorage keys ------------------------------------------
const STORAGE_THEME_KEY = "smnl_ticker_theme_v1";
const STORAGE_HEADLINES_KEY = "smnl_ticker_headlines_v1";

// ---- Supabase (scores backend) -----------------------------------
const SUPABASE_URL = "https://hhjmginyyvcrngvcnhdb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JSBxFG27P4j44Ou1ivP3gw_oSBm-AVs";

// One entry per league/season shown in the score box rotation.
const LEAGUES = [
  { seasonId: 5, label: "PRO" },
  { seasonId: 6, label: "ALL-STAR" },
  { seasonId: 7, label: "LEGENDARY" },
];

// ---- Timing knobs ---------------------------------------------------
const PAIRS_PER_LEAGUE = 24;        // max score pairs kept per league
const REFRESH_SECONDS = 60;         // how often scores re-fetch from Supabase
const SCROLL_SECONDS = 45;          // how long one full headline scroll loop takes
const SCORE_INTERVAL_SECONDS = 10;  // how long each score pair displays before cycling

// ---- Scaling -----------------------------------------------------------
// The ticker is authored at this fixed design width; scaling.js
// scales it to whatever the real display/OBS source width is.
const DESIGN_W = 1920;