const titleEl = document.getElementById('playerTitle');
const metaEl = document.getElementById('playerMeta');
const frame = document.getElementById('animeFrame');
const form = document.getElementById('playerForm');
const backToDetails = document.getElementById('backToDetails');

function getParams() {
  return new URLSearchParams(window.location.search);
}

function buildEmbedUrl(anilistId, episode, subOrDub) {
  const base = `https://vidnest.fun/animepahe/${anilistId}/${episode}/${subOrDub}`;
  const hiddenControls = new URLSearchParams({
    servericon: 'hide',
    topsettings: 'hide',
    centerseekbackward: 'hide',
    centerseekforward: 'hide',
    pip: 'hide',
    cast: 'hide',
  });
  return `${base}?${hiddenControls.toString()}`;
}

function applyPlayer(anilistId, episode, subOrDub, titleText) {
  titleEl.textContent = titleText || 'Anime Player';
  metaEl.textContent = `AniList ${anilistId} · Episode ${episode} · ${subOrDub.toUpperCase()}`;
  frame.src = buildEmbedUrl(anilistId, episode, subOrDub);
}

function initFromQuery() {
  const params = getParams();
  const anilistId = params.get('anilistId') || '';
  const ep = params.get('ep') || '1';
  const subOrDub = (params.get('subOrDub') || 'sub').toLowerCase();
  const title = params.get('title') || 'Anime Player';
  const animeId = params.get('id');

  if (animeId) backToDetails.href = `details.html?id=${encodeURIComponent(animeId)}`;

  document.getElementById('anilistId').value = anilistId;
  document.getElementById('episodeNumber').value = ep;
  document.getElementById('subOrDub').value = subOrDub;

  if (anilistId) {
    applyPlayer(anilistId, ep, subOrDub, title);
  } else {
    metaEl.textContent = 'AniList ID is required. Enter it below to load player.';
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const anilistId = document.getElementById('anilistId').value;
  const ep = document.getElementById('episodeNumber').value;
  const subOrDub = document.getElementById('subOrDub').value;

  if (!anilistId) return;

  const params = new URLSearchParams(window.location.search);
  params.set('anilistId', anilistId);
  params.set('ep', ep);
  params.set('subOrDub', subOrDub);
  const nextUrl = `${window.location.pathname}?${params}`;
  window.history.replaceState({}, '', nextUrl);

  applyPlayer(anilistId, ep, subOrDub, params.get('title') || 'Anime Player');
});

initFromQuery();
