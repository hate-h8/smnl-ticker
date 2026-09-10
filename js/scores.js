// ============================================================
// SCORES
// ============================================================

const scoreBox = document.getElementById("scoreBox");
const scoreSlide = document.getElementById("scoreSlide");
const leagueName = document.getElementById("leagueName");

let scoreItems = [];
let scoreIndex = 0;
let scoreTimer = null;

// Looks up, per non-test league, the season with the highest
// `number` - i.e. the current one - and returns just their season
// ids. This is a small/cheap request (one row per league, not per
// game), run once at the start of every fetchGames() call.
async function fetchCurrentSeasonIds() {
  const params = new URLSearchParams({
    select: "id,number,leagues!inner(id,is_test)",
    "leagues.is_test": "eq.false",
  });
  const url = `${SUPABASE_URL}/rest/v1/seasons?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase seasons request failed: ${res.status}`);
  const rows = await res.json();

  const currentByLeague = new Map(); // league id -> {id, number} of its highest-numbered season
  rows.forEach((s) => {
    const leagueId = s.leagues ? s.leagues.id : null;
    if (leagueId == null) return;
    const existing = currentByLeague.get(leagueId);
    if (!existing || s.number > existing.number) {
      currentByLeague.set(leagueId, { id: s.id, number: s.number });
    }
  });
  return [...currentByLeague.values()].map((s) => s.id);
}

// Fetches every game in the current season (see fetchCurrentSeasonIds
// above) across every non-test league - played or not - and
// normalizes each row into the shape the rest of this file works
// with.
async function fetchGames() {
  const currentSeasonIds = await fetchCurrentSeasonIds();
  if (!currentSeasonIds.length) {
    console.error("No current season found (no non-test leagues with a season?) - showing nothing.");
    return [];
  }

  const params = new URLSearchParams({
    select:
      "id,week,innings,finalized_at,status,home_team_id,away_team_id," +
      "seasons!inner(number,leagues!inner(name,slug,is_test))," +
      "home:teams!home_team_id(name,abbrev,owner:users!owner_id(display_name,handle))," +
      "away:teams!away_team_id(name,abbrev,owner:users!owner_id(display_name,handle))," +
      "game_team_stats(team_id,runs)",
    season_id: `in.(${currentSeasonIds.join(",")})`,
    or: "(status.neq.final,finalized_at.not.is.null)",
    order: "week.desc,id.desc",
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
    // Match by team_id, not an is_home flag - see file header note.
    const homeLine = stats.find((l) => l.team_id === g.home_team_id);
    const awayLine = stats.find((l) => l.team_id === g.away_team_id);
    return {
      id: g.id,
      week: g.week,
      innings: g.innings,
      finalizedAt: g.finalized_at,
      isFinal: g.status === "final",
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
    if (!arr.some((g) => g.isFinal)) return; // nothing played yet - skip
    arr.sort((a, b) => a.id - b.id); // stand-in for game order, see file header
    pairs.push({
      league: arr[0].league,
      week: arr[0].week,
      latestId: Math.max(...arr.map((g) => g.id)),
      game1: arr[0] || null,
      game2: arr[1] || null,
    });
  });

  pairs.sort((a, b) => b.week - a.week || b.latestId - a.latestId);
  return pairs;
}

function renderGameRow(game, label) {
  if (!game) return ""; // shouldn't happen in practice - groupIntoPairs always fills game1
  const labelHtml = label ? `<span class="game-label">${label}</span>` : "";

  if (!game.isFinal) {
    return `
      <div class="score-row">
        ${labelHtml}
        <span class="team">${game.away}</span>
        <span class="at">@</span>
        <span class="team">${game.home}</span>
        <span class="not-played">Not yet played</span>
      </div>`;
  }

  const awayWin = game.awayScore > game.homeScore;
  const homeWin = game.homeScore > game.awayScore;
  const showFinalTag = game.innings && game.innings !== 9;
  const finalTag = showFinalTag ? `<span class="final-tag">F/${game.innings}</span>` : "";
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

function renderScoreInner(pair) {
  const weekLabel = `<div class="score-week-label">Week ${pair.week}</div>`;
  if (pair.game2) {
    return weekLabel + renderGameRow(pair.game1, "G1") + renderGameRow(pair.game2, "G2");
  }
  return weekLabel + renderGameRow(pair.game1, null);
}

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

// Fetches fresh games from Supabase
async function loadScores() {
  const games = await fetchGames().catch((err) => {
    console.error("Failed to load scores:", err);
    return [];
  });
  startScoreCycle(groupIntoPairs(games));
}

let lastSeenFinalizedAt = null;

async function probeLatestFinalizedAt() {
  const params = new URLSearchParams({
    select: "finalized_at",
    finalized_at: "not.is.null",
    order: "finalized_at.desc",
    limit: "1",
  });
  const url = `${SUPABASE_URL}/rest/v1/games?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase probe failed: ${res.status}`);
  const rows = await res.json();
  return rows.length ? rows[0].finalized_at : null;
}

// Runs the probe
async function checkForUpdates() {
  let latest;
  try {
    latest = await probeLatestFinalizedAt();
  } catch (err) {
    console.error("Probe failed, skipping this check:", err);
    return;
  }
  if (latest && (!lastSeenFinalizedAt || latest > lastSeenFinalizedAt)) {
    lastSeenFinalizedAt = latest;
    await loadScores();
  }
}