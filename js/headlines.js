// ============================================================
// HEADLINES
// ============================================================

const track = document.getElementById("track");
document.documentElement.style.setProperty("--duration", SCROLL_SECONDS + "s");

function renderHeadlineInner(it) {
  return `
    <div class="item">
      <span class="headline">
        ${it.flag ? `<span class="flag">${it.flag}</span>` : ""}${it.text}
      </span>
    </div>`;
}

function renderHeadlines(items) {
  let html = "";
  items.forEach((it) => {
    html += renderHeadlineInner(it) + `<div class="divider"></div>`;
  });
  track.innerHTML = html + html; // duplicated for the seamless scroll loop
}