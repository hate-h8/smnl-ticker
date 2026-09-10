
loadSettingsFromStorage();
applyTheme();
renderHeadlines(currentHeadlines.length ? currentHeadlines : DEFAULT_HEADLINES);
loadScores();
setInterval(loadScores, REFRESH_SECONDS * 1000);
applyTickerScale();

window.addEventListener("resize", fitScoreContent);
window.addEventListener("resize", applyTickerScale);

window.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.key.toLowerCase() === "e") {
    togglePanel();
  } else if (e.key === "Escape") {
    closePanel();
  }
});