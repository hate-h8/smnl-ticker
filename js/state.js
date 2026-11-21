// ============================================================
// STATE
// The two pieces of user-editable state (colors + headlines),
// plus loading/saving them to localStorage and applying the
// theme to the page's CSS variables.
// ============================================================

let currentTheme = { ...DEFAULT_THEME };
let currentHeadlines = [...DEFAULT_HEADLINES];
let currentDisplay = { ...DEFAULT_DISPLAY };

function loadSettingsFromStorage() {
  try {
    const t = localStorage.getItem(STORAGE_THEME_KEY);
    if (t) currentTheme = { ...DEFAULT_THEME, ...JSON.parse(t) };
  } catch (e) {
    console.error("Failed to load saved theme:", e);
  }
  try {
    const h = localStorage.getItem(STORAGE_HEADLINES_KEY);
    const parsed = h ? JSON.parse(h) : null;
    if (Array.isArray(parsed) && parsed.length) currentHeadlines = parsed;
  } catch (e) {
    console.error("Failed to load saved headlines:", e);
  }
  try {
    const d = localStorage.getItem(STORAGE_DISPLAY_KEY);
    if (d) currentDisplay = { ...DEFAULT_DISPLAY, ...JSON.parse(d) };
  } catch (e) {
    console.error("Failed to load saved display options:", e);
  }
}

// Pushes currentTheme's values onto :root as CSS custom properties.
function applyTheme() {
  Object.entries(currentTheme).forEach(([cssVar, value]) => {
    document.documentElement.style.setProperty(cssVar, value);
  });
}

// Save + re-apply the theme. Called whenever a color picker changes.
function persistTheme() {
  localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(currentTheme));
  applyTheme();
}

// Save + re-render the headline track. Called whenever headline
// text/flags are edited, added, or removed.
function persistHeadlines() {
  localStorage.setItem(STORAGE_HEADLINES_KEY, JSON.stringify(currentHeadlines));
  renderHeadlines(currentHeadlines.length ? currentHeadlines : DEFAULT_HEADLINES);
}

// Save + re-filter the scores already loaded.
function persistDisplay() {
  localStorage.setItem(STORAGE_DISPLAY_KEY, JSON.stringify(currentDisplay));
  refreshScoreDisplay();
}