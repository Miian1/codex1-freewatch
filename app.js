const CORS_PROXY = 'https://anime-cors-proxy.mkstd.workers.dev/proxy';
const API_BASE = 'https://api.consumet.org/anime/animepahe';

const animeGrid = document.getElementById('animeGrid');
const pageLabel = document.getElementById('pageLabel');
const resultMeta = document.getElementById('resultMeta');
const listTitle = document.getElementById('listTitle');
const template = document.getElementById('animeCardTemplate');

const heroSlides = document.getElementById('heroSlides');
let heroItems = [];
let heroIndex = 0;
let heroTimer = null;

let state = {
  page: 1,
  mode: 'recent',
  query: '',
};

function withProxy(url) {
  return `${CORS_PROXY}?url=${encodeURIComponent(url)}`;
}

async function fetchJSON(url) {
  const res = await fetch(withProxy(url));
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

function normalizeRecent(item) {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    image: item.image,
    episodeNumber: item.episodeNumber || item.episode || 1,
    subOrDub: (item.subOrDub || 'sub').toLowerCase(),
    episodeId: item.episodeId || item.id,
  };
}

function cardLinks(anime) {
  const params = new URLSearchParams({ id: anime.id, title: anime.title });
  const watchParams = new URLSearchParams({
    title: anime.title,
    ep: String(anime.episodeNumber || 1),
    subOrDub: anime.subOrDub || 'sub',
    sourceId: anime.id,
  });
  return {
    details: `details.html?${params}`,
    watch: `player.html?${watchParams}`,
  };
}

function renderCards(list) {
  animeGrid.innerHTML = '';
  if (!list.length) {
    animeGrid.innerHTML = '<p>No results found.</p>';
    return;
  }

  for (const raw of list) {
    const anime = normalizeRecent(raw);
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('.card-image').src = anime.image || '';
    fragment.querySelector('.card-title').textContent = anime.title;
    fragment.querySelector('.card-sub').textContent = `Episode ${anime.episodeNumber} · ${anime.subOrDub.toUpperCase()}`;
    const links = cardLinks(anime);
    fragment.querySelector('.details-link').href = links.details;
    fragment.querySelector('.watch-link').href = links.watch;
    animeGrid.appendChild(fragment);
  }
}

function uniqueById(list) {
  const seen = new Set();
  return list.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function renderHero() {
  if (!heroItems.length) {
    heroSlides.innerHTML = '<p>No hero data.</p>';
    return;
  }

  const item = heroItems[heroIndex];
  const links = cardLinks(item);
  heroSlides.innerHTML = `
    <article class="hero-slide">
      <img src="${item.image || ''}" alt="${item.title}" />
      <div>
        <h2>${item.title}</h2>
        <p class="meta">Newest episode: ${item.episodeNumber} · ${item.subOrDub.toUpperCase()}</p>
        <p>Catch up on this title now from the latest episode feed.</p>
        <div class="card-actions">
          <a class="btn" href="${links.details}">View Details</a>
          <a class="btn btn-secondary" href="${links.watch}">Watch</a>
        </div>
      </div>
    </article>
  `;
}

function startHeroAuto() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    if (!heroItems.length) return;
    heroIndex = (heroIndex + 1) % heroItems.length;
    renderHero();
  }, 5000);
}

async function loadRecent() {
  const data = await fetchJSON(`${API_BASE}/recent-episodes?page=${state.page}`);
  const results = data.results || [];
  const normalized = results.map(normalizeRecent);
  renderCards(normalized);
  pageLabel.textContent = `Page ${state.page}`;
  resultMeta.textContent = `${results.length} recent episode cards`;
  listTitle.textContent = 'Recent Episodes';

  if (!heroItems.length) {
    heroItems = uniqueById(normalized).slice(0, 5);
    renderHero();
    startHeroAuto();
  }
}

async function loadSearch() {
  const q = state.query.trim();
  if (!q) return loadRecent();

  const data = await fetchJSON(`${API_BASE}/${encodeURIComponent(q)}`);
  const results = data.results || data || [];

  const normalized = results.map((item) => ({
    id: item.id,
    title: item.title,
    image: item.image,
    episodeNumber: 1,
    subOrDub: 'sub',
  }));

  renderCards(normalized);
  pageLabel.textContent = 'Search mode';
  resultMeta.textContent = `${normalized.length} result(s)`;
  listTitle.textContent = `Search: ${q}`;
}

async function refresh() {
  animeGrid.innerHTML = '<p>Loading...</p>';
  try {
    if (state.mode === 'search') await loadSearch();
    else await loadRecent();
  } catch (err) {
    animeGrid.innerHTML = `<p>Failed to load data: ${err.message}</p>`;
  }
}

document.getElementById('prevPage').addEventListener('click', () => {
  if (state.mode !== 'recent') return;
  state.page = Math.max(1, state.page - 1);
  refresh();
});

document.getElementById('nextPage').addEventListener('click', () => {
  if (state.mode !== 'recent') return;
  state.page += 1;
  refresh();
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const value = document.getElementById('searchInput').value;
  state.query = value;
  state.mode = value.trim() ? 'search' : 'recent';
  refresh();
});

document.getElementById('heroPrev').addEventListener('click', () => {
  if (!heroItems.length) return;
  heroIndex = (heroIndex - 1 + heroItems.length) % heroItems.length;
  renderHero();
});

document.getElementById('heroNext').addEventListener('click', () => {
  if (!heroItems.length) return;
  heroIndex = (heroIndex + 1) % heroItems.length;
  renderHero();
});

refresh();
