// ============================================================
// SETTINGS PANEL
// The click-to-open overlay: color pickers (backed by THEME_META /
// currentTheme from config.js/state.js), headline rows (backed
// by currentHeadlines), and the Import/Export text box for
// copying settings between machines. Everything here writes
// through persistTheme() / persistHeadlines() (state.js), which
// saves to localStorage and immediately re-renders - so edits
// show up live on the ticker with no refresh needed.
// ============================================================

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function buildColorRows() {
  const container = document.getElementById("colorRows");
  container.innerHTML = "";
  THEME_META.forEach((meta) => {
    const row = document.createElement("div");
    row.className = "color-row";
    row.innerHTML = `<span>${meta.label}</span><input type="color" value="${
      currentTheme[meta.key] || DEFAULT_THEME[meta.key]
    }" data-key="${meta.key}">`;
    container.appendChild(row);
  });
  container.querySelectorAll("input[type=color]").forEach((input) => {
    input.addEventListener("input", (e) => {
      currentTheme[e.target.dataset.key] = e.target.value;
      persistTheme();
    });
  });
}

function buildHeadlineRows() {
  const container = document.getElementById("headlineRows");
  container.innerHTML = "";
  currentHeadlines.forEach((h, i) => {
    const row = document.createElement("div");
    row.className = "headline-row";
    row.innerHTML = `
      <input type="text" class="flag-input" placeholder="FLAG" value="${escapeAttr(h.flag || "")}">
      <input type="text" class="text-input" placeholder="Headline text" value="${escapeAttr(h.text || "")}">
      <button type="button" title="Remove">&times;</button>`;
    const flagInput = row.querySelector(".flag-input");
    const textInput = row.querySelector(".text-input");
    const removeBtn = row.querySelector("button");
    flagInput.addEventListener("input", () => {
      currentHeadlines[i].flag = flagInput.value;
      persistHeadlines();
    });
    textInput.addEventListener("input", () => {
      currentHeadlines[i].text = textInput.value;
      persistHeadlines();
    });
    removeBtn.addEventListener("click", () => {
      currentHeadlines.splice(i, 1);
      persistHeadlines();
      buildHeadlineRows();
    });
    container.appendChild(row);
  });
}

const overlay = document.getElementById("settingsOverlay");
function openPanel() {
  buildColorRows();
  buildHeadlineRows();
  overlay.classList.add("open");
}
function closePanel() {
  overlay.classList.remove("open");
}

document.getElementById("addHeadlineBtn").addEventListener("click", () => {
  currentHeadlines.push({ flag: "", text: "" });
  persistHeadlines();
  buildHeadlineRows();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset colors and headlines to the built-in defaults?")) return;
  currentTheme = { ...DEFAULT_THEME };
  currentHeadlines = [...DEFAULT_HEADLINES];
  persistTheme();
  persistHeadlines();
  buildColorRows();
  buildHeadlineRows();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const box = document.getElementById("importExportBox");
  box.value = JSON.stringify({ theme: currentTheme, headlines: currentHeadlines }, null, 2);
  box.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
});

document.getElementById("importBtn").addEventListener("click", () => {
  const box = document.getElementById("importExportBox");
  try {
    const data = JSON.parse(box.value);
    if (data.theme) currentTheme = { ...DEFAULT_THEME, ...data.theme };
    if (Array.isArray(data.headlines)) currentHeadlines = data.headlines;
    persistTheme();
    persistHeadlines();
    buildColorRows();
    buildHeadlineRows();
    alert("Settings loaded.");
  } catch (e) {
    alert("That doesn't look like valid settings JSON.");
  }
});

document.getElementById("closePanelBtn").addEventListener("click", closePanel);