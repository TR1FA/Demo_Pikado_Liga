const STORAGE_KEY = "pikado-liga-demo-v1";

const defaultState = {
  admin: {
    username: "admin",
    password: "1234"
  },
  session: {
    loggedIn: false
  },
  players: [
    { id: 1, name: "Dejan Marković" },
    { id: 2, name: "Bojan Milanović" },
    { id: 3, name: "Đorđe Trifunović" },
    { id: 4, name: "Bojan Majkić" },
    { id: 5, name: "Miloš Ivković" },
    { id: 6, name: "Dalibor Girić" },
    { id: 7, name: "Goran Cimeša" },
    { id: 8, name: "Leonardo Girić" }
  ],
  matches: [
    { id: 1, round: "Kolo 1", player1Id: 4, player2Id: 1, winnerId: 4 },
    { id: 2, round: "Kolo 1", player1Id: 5, player2Id: 6, winnerId: 5 },
    { id: 3, round: "Kolo 1", player1Id: 8, player2Id: 7, winnerId: 8 },
    { id: 4, round: "Kolo 1", player1Id: 2, player2Id: 3, winnerId: 2 }
  ]
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initial = cloneDefaultState();
    saveState(initial);
    return initial;
  }
  return JSON.parse(saved);
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

const playersGrid = document.getElementById("players-grid");
const leaderboardBody = document.querySelector("#leaderboard-table tbody");
const matchesList = document.getElementById("matches-list");
const matchesCount = document.getElementById("matches-count");

const adminModal = document.getElementById("admin-modal");
const openAdminBtn = document.getElementById("open-admin-btn");
const closeAdminBtn = document.getElementById("close-admin-btn");
const closeModalBackdrop = document.getElementById("close-modal-backdrop");
const resetDemoBtn = document.getElementById("reset-demo-btn");

const loginView = document.getElementById("login-view");
const adminView = document.getElementById("admin-view");

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("login-error");

const logoutBtn = document.getElementById("logout-btn");
const matchForm = document.getElementById("match-form");
const roundNameInput = document.getElementById("round-name");
const player1Select = document.getElementById("player1");
const player2Select = document.getElementById("player2");
const winnerSelect = document.getElementById("winner");
const matchError = document.getElementById("match-error");
const clearMatchesBtn = document.getElementById("clear-matches-btn");

function getPlayerById(id) {
  return state.players.find(player => player.id === Number(id));
}

function getStandings() {
  const stats = state.players.map(player => ({
    id: player.id,
    name: player.name,
    wins: 0,
    losses: 0,
    points: 0
  }));

  state.matches.forEach(match => {
    const winner = stats.find(p => p.id === match.winnerId);
    const loserId = match.player1Id === match.winnerId ? match.player2Id : match.player1Id;
    const loser = stats.find(p => p.id === loserId);

    if (winner) {
      winner.wins += 1;
      winner.points += 3;
    }

    if (loser) {
      loser.losses += 1;
    }
  });

  stats.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name, "sr");
  });

  return stats;
}

function getInitials(name) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderPlayers() {
  const standings = getStandings();
  const rankMap = new Map();
  standings.forEach((player, index) => rankMap.set(player.id, index + 1));

  playersGrid.innerHTML = state.players.map(player => {
    const stat = standings.find(s => s.id === player.id);
    const rank = rankMap.get(player.id);

    let rankClass = "";
    if (rank === 1) rankClass = "rank-1";
    if (rank === 2) rankClass = "rank-2";
    if (rank === 3) rankClass = "rank-3";

    return `
      <article class="player-card ${rankClass}">
        <div class="player-avatar">${getInitials(player.name)}</div>
        <h3>${player.name}</h3>
        <div class="player-stats">
          <span>Rang: ${rank}</span>
          <span>Pobjede: ${stat.wins}</span>
          <span>Porazi: ${stat.losses}</span>
          <span>Bodovi: ${stat.points}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderLeaderboard() {
  const standings = getStandings();

  leaderboardBody.innerHTML = standings.map((player, index) => `
    <tr>
      <td>${index + 1}.</td>
      <td>${player.name}</td>
      <td>${player.wins}</td>
      <td>${player.losses}</td>
      <td><strong>${player.points}</strong></td>
    </tr>
  `).join("");
}

function renderMatches() {
  if (!state.matches.length) {
    matchesList.innerHTML = '<p class="muted">Još nema unesenih mečeva.</p>';
    matchesCount.textContent = "0 mečeva";
    return;
  }

  const reversed = [...state.matches].reverse();

  matchesList.innerHTML = reversed.map(match => {
    const p1 = getPlayerById(match.player1Id);
    const p2 = getPlayerById(match.player2Id);
    const winner = getPlayerById(match.winnerId);

    return `
      <div class="match-item">
        <div class="match-round">${match.round}</div>
        <div class="match-main">${p1.name} vs ${p2.name}</div>
        <div class="match-winner">Pobjednik: ${winner.name}</div>
      </div>
    `;
  }).join("");

  matchesCount.textContent = `${state.matches.length} mečeva`;
}

function fillPlayerSelects() {
  const options = state.players.map(player =>
    `<option value="${player.id}">${player.name}</option>`
  ).join("");

  player1Select.innerHTML = '<option value="">Izaberi igrača</option>' + options;
  player2Select.innerHTML = '<option value="">Izaberi igrača</option>' + options;
  updateWinnerOptions();
}

function updateWinnerOptions() {
  const p1 = Number(player1Select.value);
  const p2 = Number(player2Select.value);

  if (!p1 || !p2 || p1 === p2) {
    winnerSelect.innerHTML = '<option value="">Prvo izaberi dva različita igrača</option>';
    return;
  }

  const player1 = getPlayerById(p1);
  const player2 = getPlayerById(p2);

  winnerSelect.innerHTML = `
    <option value="">Izaberi pobjednika</option>
    <option value="${player1.id}">${player1.name}</option>
    <option value="${player2.id}">${player2.name}</option>
  `;
}

function renderAdminState() {
  if (state.session.loggedIn) {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
  } else {
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
  }
}

function renderAll() {
  renderPlayers();
  renderLeaderboard();
  renderMatches();
  fillPlayerSelects();
  renderAdminState();
}

openAdminBtn.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
  renderAdminState();
});

closeAdminBtn.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

closeModalBackdrop.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

resetDemoBtn.addEventListener("click", () => {
  state = cloneDefaultState();
  saveState(state);
  renderAll();
});

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  loginError.textContent = "";

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === state.admin.username && password === state.admin.password) {
    state.session.loggedIn = true;
    saveState(state);
    usernameInput.value = "";
    passwordInput.value = "";
    renderAdminState();
    return;
  }

  loginError.textContent = "Pogrešno korisničko ime ili lozinka.";
});

logoutBtn.addEventListener("click", () => {
  state.session.loggedIn = false;
  saveState(state);
  renderAdminState();
});

player1Select.addEventListener("change", updateWinnerOptions);
player2Select.addEventListener("change", updateWinnerOptions);

matchForm.addEventListener("submit", event => {
  event.preventDefault();
  matchError.textContent = "";

  const round = roundNameInput.value.trim();
  const player1Id = Number(player1Select.value);
  const player2Id = Number(player2Select.value);
  const winnerId = Number(winnerSelect.value);

  if (!round) {
    matchError.textContent = "Unesi naziv kola.";
    return;
  }

  if (!player1Id || !player2Id || player1Id === player2Id) {
    matchError.textContent = "Moraš izabrati dva različita igrača.";
    return;
  }

  if (!winnerId || ![player1Id, player2Id].includes(winnerId)) {
    matchError.textContent = "Izaberi validnog pobjednika.";
    return;
  }

  const newMatch = {
    id: Date.now(),
    round,
    player1Id,
    player2Id,
    winnerId
  };

  state.matches.push(newMatch);
  saveState(state);
  renderAll();

  roundNameInput.value = "";
  player1Select.value = "";
  player2Select.value = "";
  winnerSelect.innerHTML = '<option value="">Prvo izaberi dva različita igrača</option>';
});

clearMatchesBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Da li sigurno želiš obrisati sve rezultate?");
  if (!confirmed) return;

  state.matches = [];
  saveState(state);
  renderAll();
});

renderAll();
