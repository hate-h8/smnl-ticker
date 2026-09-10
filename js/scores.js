// ============================================================
// SCORES
// Pulls the most recent FINALIZED games from Supabase (across
// all real, non-test leagues - filtering happens server-side)
// and pairs them up client-side (the two games played per week
// between the same two teams), cycling through them in the
// score box on the left. Also owns fitScoreContent(), which
// shrinks/grows the score text to fit the box regardless of
// team name length.
// ============================================================

const scoreBox = document.getElementById("scoreBox");
const scoreSlide = document.getElementById("scoreSlide");
const leagueName = document.getElementById("leagueName");

let scoreItems = [];
let scoreIndex = 0;
let scoreTimer = null;

// Fetches the RESULTS_LIMIT most recently finalized games across
// every non-test league, and normalizes each row into the shape
// the rest of this file works with.
async function fetchRecentGames() {
  const params = new URLSearchParams({
    select:
      "id,week,innings,finalized_at,home_team_id,away_team_id," +
      "seasons!inner(number,leagues!inner(name,slug,is_test))," +
      "home:teams!home_team_id(name,abbrev,owner:users!owner_id(display_name,handle))," +
      "away:teams!away_team_id(name,abbrev,owner:users!owner_id(display_name,handle))," +
      "game_team_stats(team_id,runs)",
    status: "eq.final",
    finalized_at: "not.is.null",
    "seasons.leagues.is_test": "eq.false",
    order: "finalized_at.desc",
    limit: String(RESULTS_LIMIT),
  });
  const url = `${SUPABASE_URL}/rest/v1/games?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`);
  const rows = await res.json();

  return rows.map((g) => {
    const stats = g.game_team_stats || [];
    const homeLine = stats.find((l) => l.team_id === g.home_team_id);
    const awayLine = stats.find((l) => l.team_id === g.away_team_id);
    return {
      id: g.id,
      week: g.week,
      innings: g.innings,
      finalizedAt: g.finalized_at,
      league: g.seasons && g.seasons.leagues ? g.seasons.leagues.name : null,
      homeTeamId: g.home_team_id,
      awayTeamId: g.away_team_id,
      home: g.home ? g.home.name : "Home",
      away: g.away ? g.away.name : "Away",
      homeScore: homeLine ? homeLine.runs : null,
      awayScore: awayLine ? awayLine.runs : null,
    };
  });
}

// Groups a flat list of finalized games into "pairs" - the (up
// to) two games played in a given week between the same two
// teams - sorted most recent first. A "pair" with only one game
// is rendered as a single row (see renderScoreInner) rather than
// guessing the second is "not yet played": since this query only
// ever returns already-finalized games, a missing second game
// might genuinely not exist yet, OR might have been played and
// finalized but simply fallen outside this fetch's RESULTS_LIMIT
// window (config.js) - we have no way to tell those apart, so we
// don't claim either one.
function groupIntoPairs(games) {
  const groups = new Map();
  games.forEach((g) => {
    if (g.homeTeamId == null || g.awayTeamId == null) return;
    const ids = [g.homeTeamId, g.awayTeamId].sort((a, b) => a - b);
    const key = `${g.week}:${ids[0]}-${ids[1]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(g);
  });

  const pairs = [];
  groups.forEach((arr) => {
    arr.sort((a, b) => a.id - b.id); // stand-in for game order, see file header
    pairs.push({
      league: arr[0].league,
      week: arr[0].week,
      latestFinalizedAt: Math.max(...arr.map((g) => Date.parse(g.finalizedAt))),
      game1: arr[0] || null,
      game2: arr[1] || null,
    });
  });

  pairs.sort((a, b) => b.latestFinalizedAt - a.latestFinalizedAt);
  return pairs;
}

// Renders a single game line. `label` ("G1"/"G2") is only shown
// when there's a second game to disambiguate from - a solo game
// gets no label at all, see renderScoreInner.
function renderGameRow(game, label) {
  if (!game) return "";
  const awayWin = game.awayScore > game.homeScore;
  const homeWin = game.homeScore > game.awayScore;
  const showFinalTag = game.innings && game.innings !== 9;
  const finalTag = showFinalTag ? `<span class="final-tag">F/${game.innings}</span>` : "";
  const labelHtml = label ? `<span class="game-label">${label}</span>` : "";
  return `
    <div class="score-row">
      ${labelHtml}
      <span class="team ${awayWin ? "win" : ""}">${game.away}</span>
      <span class="score">${game.awayScore}</span>
      <span class="at">@</span>
      <span class="score">${game.homeScore}</span>
      <span class="team ${homeWin ? "win" : ""}">${game.home}</span>
      ${finalTag}
    </div>`;
}

// Two real games -> both rows, labeled G1/G2. Only one -> a single
// unlabeled row, sized on its own
function renderScoreInner(pair) {
  if (pair.game2) {
    return renderGameRow(pair.game1, "G1") + renderGameRow(pair.game2, "G2");
  }
  return renderGameRow(pair.game1, null);
}

// Shrinks/grows the score box's content so long team names still
// fit inside the fixed-width box without wrapping or overflowing.
function fitScoreContent() {
  const fit = scoreSlide.querySelector(".score-fit");
  if (!fit) return;
  fit.style.transform = "scale(1)";
  const availableW = scoreSlide.clientWidth - 44;
  const availableH = scoreSlide.clientHeight;
  const neededW = fit.scrollWidth;
  const neededH = fit.scrollHeight;
  if (neededW === 0 || neededH === 0) return;
  let scale = Math.min(availableW / neededW, availableH / neededH);
  scale = Math.max(0.4, Math.min(scale, 1.8));
  fit.style.transform = `scale(${scale})`;
}

function showScore(index) {
  if (!scoreItems.length) {
    scoreBox.style.display = "none";
    return;
  }
  scoreBox.style.display = "block";
  const it = scoreItems[index];
  leagueName.textContent = it.league ? `${it.league} LEAGUE` : "SMNL";
  scoreSlide.classList.remove("enter");
  scoreSlide.innerHTML = `<div class="score-fit">${renderScoreInner(it)}</div>`;
  void scoreSlide.offsetWidth; // force reflow so the enter animation replays
  scoreSlide.classList.add("enter");
  requestAnimationFrame(fitScoreContent);
}

// Starts (or restarts) the rotation through score pairs, one
// pair every SCORE_INTERVAL_SECONDS.
function startScoreCycle(items) {
  scoreItems = items;
  scoreIndex = 0;
  if (scoreTimer) clearInterval(scoreTimer);
  showScore(scoreIndex);
  if (scoreItems.length > 1) {
    scoreTimer = setInterval(() => {
      scoreIndex = (scoreIndex + 1) % scoreItems.length;
      showScore(scoreIndex);
    }, SCORE_INTERVAL_SECONDS * 1000);
  }
}

// Fetches fresh scores from Supabase and restarts the cycle.
// Called once on load and then every REFRESH_SECONDS.
async function loadScores() {
  const games = await fetchRecentGames().catch((err) => {
    console.error("Failed to load scores:", err);
    return [];
  });
  startScoreCycle(groupIntoPairs(games));
}