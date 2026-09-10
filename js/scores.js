// ============================================================
// SCORES
// Pulls recent game results from Supabase for each league in
// LEAGUES (config.js), pairs them up (the two games played per
// week between the same two teams), and cycles through them in
// the score box on the left. Also owns fitScoreContent(), which
// shrinks/grows the score text to fit the box regardless of
// team name length.
// ============================================================

const scoreBox = document.getElementById("scoreBox");
const scoreSlide = document.getElementById("scoreSlide");
const leagueName = document.getElementById("leagueName");

let scoreItems = [];
let scoreIndex = 0;
let scoreTimer = null;

// Fetches one league's recent games from Supabase and groups them
// into "pairs" (the two games played in a given week between the
// same two teams), keeping only pairs where at least one game is
// final (so upcoming-only matchups don't clutter the rotation).
async function fetchLeagueGames(league) {
  const params = new URLSearchParams({
    select:
      "week,game_number,status,innings,home_team:teams!home_team_id(id,name),away_team:teams!away_team_id(id,name),lines:game_team_stats(is_home,runs)",
    season_id: `eq.${league.seasonId}`,
    order: "week.desc,game_number.desc",
    limit: String(PAIRS_PER_LEAGUE * 3),
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

  const games = rows.map((g) => {
    const homeLine = (g.lines || []).find((l) => l.is_home);
    const awayLine = (g.lines || []).find((l) => !l.is_home);
    return {
      week: g.week,
      gameNumber: g.game_number,
      isFinal: g.status === "final",
      innings: g.innings,
      homeTeamId: g.home_team ? g.home_team.id : null,
      awayTeamId: g.away_team ? g.away_team.id : null,
      home: g.home_team ? g.home_team.name : "Home",
      away: g.away_team ? g.away_team.name : "Away",
      homeScore: homeLine ? homeLine.runs : null,
      awayScore: awayLine ? awayLine.runs : null,
    };
  });

  const groups = new Map();
  games.forEach((g) => {
    if (g.homeTeamId === null || g.awayTeamId === null) return;
    const ids = [g.homeTeamId, g.awayTeamId].sort((a, b) => a - b);
    const key = `${g.week}:${ids[0]}-${ids[1]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(g);
  });

  const pairs = [];
  groups.forEach((arr) => {
    arr.sort((a, b) => a.gameNumber - b.gameNumber);
    if (!arr.some((g) => g.isFinal)) return;
    pairs.push({
      type: "score",
      league: league.label,
      week: arr[0].week,
      maxGameNumber: Math.max(...arr.map((g) => g.gameNumber)),
      game1: arr[0] || null,
      game2: arr[1] || null,
    });
  });

  return pairs;
}

// Fetches all leagues in parallel and merges/sorts the results,
// most recent week first. A failed league is logged and skipped
// rather than blocking the others.
async function fetchAllScores() {
  const results = await Promise.allSettled(LEAGUES.map(fetchLeagueGames));
  const pairs = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") pairs.push(...r.value);
    else console.error("Failed to load scores for a league:", r.reason);
  });
  pairs.sort((a, b) => b.week - a.week || b.maxGameNumber - a.maxGameNumber);
  return pairs.slice(0, PAIRS_PER_LEAGUE * LEAGUES.length);
}

// Renders a single game line ("G1"/"G2") - handles the
// not-yet-played and final states, and the extra-innings tag.
function renderGameRow(game, label) {
  if (!game) {
    return `
      <div class="score-row scheduled full-span">
        <span class="game-label">${label}</span>
        <span class="scheduled-text">Not yet played</span>
      </div>`;
  }
  if (!game.isFinal) {
    return `
      <div class="score-row scheduled">
        <span class="game-label">${label}</span>
        <span class="team">${game.away}</span>
        <span class="at">@</span>
        <span class="team">${game.home}</span>
        <span class="scheduled-text">Not yet played</span>
      </div>`;
  }
  const awayWin = game.awayScore > game.homeScore;
  const homeWin = game.homeScore > game.awayScore;
  const showFinalTag = game.innings && game.innings !== 9;
  const finalTag = showFinalTag ? `<span class="final-tag">F/${game.innings}</span>` : "";
  return `
    <div class="score-row">
      <span class="game-label">${label}</span>
      <span class="team ${awayWin ? "win" : ""}">${game.away}</span>
      <span class="score">${game.awayScore}</span>
      <span class="at">@</span>
      <span class="score">${game.homeScore}</span>
      <span class="team ${homeWin ? "win" : ""}">${game.home}</span>
      ${finalTag}
    </div>`;
}

function renderScoreInner(pair) {
  return renderGameRow(pair.game1, "G1") + renderGameRow(pair.game2, "G2");
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
  const scores = await fetchAllScores().catch((err) => {
    console.error("Failed to load scores:", err);
    return [];
  });
  startScoreCycle(scores);
}