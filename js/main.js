// ============================================================
// MAIN
// ============================================================

loadSettingsFromStorage();
applyTheme();
renderHeadlines(currentHeadlines.length ? currentHeadlines : DEFAULT_HEADLINES);
checkForUpdates();
setInterval(checkForUpdates, PROBE_INTERVAL_SECONDS * 1000);
applyTickerScale();

window.addEventListener("resize", fitScoreContent);
window.addEventListener("resize", applyTickerScale);

// Click anywhere on the ticker page (in OBS's Interact window) to
// open Settings.
stage.addEventListener("click", () => {
  if (!overlay.classList.contains("open")) openPanel();
});