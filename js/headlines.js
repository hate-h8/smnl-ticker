// ============================================================
// HEADLINES
// ============================================================

const track = document.getElementById("track");

function renderHeadlineInner(it) {
  return `
    <div class="item">
      <span class="headline">
        ${it.flag ? `<span class="flag">${it.flag}</span>` : ""}${it.text}
      </span>
    </div>`;
}

function applyScrollDuration() {
  const oneLapDistance = track.scrollWidth / 2;
  const duration = oneLapDistance / SCROLL_PIXELS_PER_SECOND;
  document.documentElement.style.setProperty("--duration", duration + "s");
}

function renderHeadlines(items) {
  let html = "";
  items.forEach((it) => {
    html += renderHeadlineInner(it) + `<div class="divider"></div>`;
  });
  track.innerHTML = html + html; // duplicated for the seamless scroll loop
  applyScrollDuration();
}