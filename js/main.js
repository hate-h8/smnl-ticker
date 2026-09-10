
loadSettingsFromStorage();
applyTheme();
renderHeadlines(currentHeadlines.length ? currentHeadlines : DEFAULT_HEADLINES);
loadScores();
setInterval(loadScores, REFRESH_SECONDS * 1000);
applyTickerScale();

window.addEventListener("resize", fitScoreContent);
window.addEventListener("resize", applyTickerScale);

stage.addEventListener("click", () => {
  if (!overlay.classList.contains("open")) openPanel();
});