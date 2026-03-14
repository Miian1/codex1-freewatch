const CORS_PROXY = 'https://anime-cors-proxy.mkstd.workers.dev/proxy';
const API_BASE = 'https://api.consumet.org/anime/animepahe';

const detailsRoot = document.getElementById('detailsRoot');
const episodesList = document.getElementById('episodesList');

function withProxy(url) {
  return `${CORS_PROXY}?url=${encodeURIComponent(url)}`;
}

async function fetchJSON(url) {
  const res = await fetch(withProxy(url));
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderDetails(info) {
  const genres = (info.genres || []).join(', ') || 'N/A';
  detailsRoot.innerHTML = `
    <img src="${info.image || ''}" alt="${info.title || 'Anime'}" />
    <div>
      <h1>${info.title || 'Unknown title'}</h1>
      <p class="meta"><strong>Status:</strong> ${info.status || 'N/A'} · <strong>Type:</strong> ${info.type || 'N/A'}</p>
      <p class="meta"><strong>Release:</strong> ${info.releaseDate || 'N/A'} · <strong>Total Episodes:</strong> ${info.totalEpisodes || 'N/A'}</p>
      <p class="meta"><strong>Genres:</strong> ${genres}</p>
      <p>${info.description || 'No description available.'}</p>
      <div class="card-actions">
        <a class="btn" href="player.html?anilistId=${info.anilistId || ''}&ep=1&subOrDub=${info.subOrDub || 'sub'}&title=${encodeURIComponent(info.title || '')}&id=${encodeURIComponent(info.id || '')}">Watch Now</a>
      </div>
    </div>
  `;
}

function renderEpisodes(info) {
  const episodes = info.episodes || [];
  if (!episodes.length) {
    episodesList.innerHTML = '<p>No episodes listed.</p>';
    return;
  }

  episodesList.innerHTML = episodes
    .map((ep) => {
      const params = new URLSearchParams({
        anilistId: String(info.anilistId || ''),
        ep: String(ep.number || 1),
        subOrDub: info.subOrDub || 'sub',
        title: info.title || '',
        id: info.id || '',
        episodeId: ep.id || '',
      });
      return `<a class="episode-btn" href="player.html?${params}">Episode ${ep.number || '?'}</a>`;
    })
    .join('');
}

async function init() {
  const id = getParam('id');
  if (!id) {
    detailsRoot.innerHTML = '<p>Missing anime id.</p>';
    return;
  }

  try {
    detailsRoot.innerHTML = '<p>Loading details...</p>';
    const info = await fetchJSON(`${API_BASE}/info/${encodeURIComponent(id)}`);
    info.anilistId = info.anilistId || info.anilistID || info.anilist_id || '';
    renderDetails(info);
    renderEpisodes(info);
  } catch (err) {
    detailsRoot.innerHTML = `<p>Failed to load details: ${err.message}</p>`;
  }
}

init();
