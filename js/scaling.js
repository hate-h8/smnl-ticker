// ============================================================
// SCALING
// The greenscreen backdrop (.stage) fills the actual display
// via plain CSS (position:fixed; inset:0) - no JS needed there.
// The ticker itself is authored at a fixed design width
// (DESIGN_W, see config.js) so its internal proportions stay
// correct; this scales it to the real display width and anchors
// it to the bottom-left, so it reads the same relative size
// whether you're on a 1920x1080 canvas, a bigger monitor, or a
// smaller one (e.g. 1280x720). See styles.css .ticker-wrap for
// the matching transform-origin.
// ============================================================

const tickerWrap = document.getElementById("tickerWrap");

function applyTickerScale() {
  const scale = window.innerWidth / DESIGN_W;
  tickerWrap.style.transform = `scale(${scale})`;
}