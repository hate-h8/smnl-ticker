// ============================================================
// SCALING
// ============================================================

const tickerWrap = document.getElementById("tickerWrap");

function applyTickerScale() {
  const scale = window.innerWidth / DESIGN_W;
  tickerWrap.style.transform = `scale(${scale})`;
}