require('dotenv').config();
const supabase = require('../config/supabaseClient');
const userAgentMB = process.env.MUSICBRAINZ_USER_AGENT;
 
const TITLE_BLACKLIST = [
  'sampler', 'demo', 'session', 'sessions', 'radio', 'promo',
  'bootleg', 'interview', 'live', 'acoustic', 'unplugged',
  'untitled', 'test', 'rough', 'rehearsal', 'outtakes',
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')                  // separa acentos
    .replace(/[\u0300-\u036f]/g, '')   // elimina acentos
    .replace(/[^a-z0-9\s]/g, '')       // elimina símbolos raros
    .trim();
}
 
async function getAllAlbums() {
  const { data, error } = await supabase.from('albums').select('*');
  if (error) throw new Error(error.message);
  return data;
}
 
async function createAlbum(albumData) {
  const { data, error } = await supabase.from('albums').insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}
 
async function getTracksFromDB(albumId) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('album_id', albumId)
    .order('position', { ascending: true });
  if (error) {
    console.error('Error obteniendo canciones de la DB:', error);
    return [];
  }
  return data || [];
}
 
// Devuelve la mejor URL de portada disponible para un release-group
// Intenta primero el release-group (más fiable), luego la release concreta
async function getCoverUrl(rgId, releaseId) {
  // 1. Intentar portada del release-group directamente
  const rgCoverUrl = `https://coverartarchive.org/release-group/${rgId}/front`;
  try {
    const res = await fetch(rgCoverUrl, { method: 'HEAD', headers: { "User-Agent": userAgentMB } });
    if (res.ok || res.status === 307 || res.redirected) return rgCoverUrl;
  } catch (_) {}
 
  // 2. Fallback: portada de la release concreta
  if (releaseId && releaseId !== rgId) {
    return `https://coverartarchive.org/release/${releaseId}/front`;
  }
 
  return rgCoverUrl; // devolver igualmente y dejar que el onerror del frontend lo maneje
}
 
async function searchAndSaveAlbums(title, artist) {
  if (!artist) throw new Error("Debes proporcionar un artista");

  const mbQuery = title
    ? `releasegroup:"${title}" AND artist:"${artist}"`
    : `artist:"${artist}"`;

  // PAGINACIÓN PARA TRAER TODOS LOS RELEASE-GROUPS
  let allReleaseGroups = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const rgUrl =
      `https://musicbrainz.org/ws/2/release-group/` +
      `?query=${encodeURIComponent(mbQuery)}` +
      `&type=album&fmt=json&limit=${limit}&offset=${offset}`;

    const rgResponse = await fetch(rgUrl, { headers: { "User-Agent": userAgentMB } });
    const rgData = await rgResponse.json();

    if (!rgData['release-groups'] || rgData['release-groups'].length === 0) break;

    allReleaseGroups.push(...rgData['release-groups']);

    if (rgData['release-groups'].length < limit) break;

    offset += limit;
  }

  console.log(`MB devolvió ${allReleaseGroups.length} release-groups totales para "${artist}"`);

  if (allReleaseGroups.length === 0) {
    throw new Error("No se encontraron álbumes");
  }

  // FILTRADO COMO ANTES, PERO SOBRE allReleaseGroups
  const normalizedArtist = normalize(artist);
  const filtered = allReleaseGroups.filter(rg => {
    if (rg['primary-type'] !== 'Album') return false;

    const badSecondary = ['Compilation', 'Live', 'Remix', 'Soundtrack',
      'Interview', 'Spokenword', 'Audiobook', 'Audio drama', 'Mixtape/Street', 'Demo'];
    if (rg['secondary-types']?.some(t => badSecondary.includes(t))) return false;

    const allArtistNames = rg['artist-credit']
      ?.map(ac => normalize(ac.name || ''))
      .join(' ') || '';
    if (!allArtistNames.includes(normalizedArtist)) return false;

    const rgTitle = rg.title.toLowerCase();
    if (TITLE_BLACKLIST.some(word => rgTitle.includes(word))) return false;

    if (/^\[.*\]$/.test(rg.title.trim()) || /^\(.*\)$/.test(rg.title.trim())) return false;

    return true;
  });

  console.log(`Después del filtro quedan ${filtered.length} álbumes`);

  if (filtered.length === 0) throw new Error("No se encontraron álbumes del artista indicado");

  const results = [];

  for (const rg of filtered) {
    const rgId = rg.id;

    // Buscar por release-group id
    let { data: existing, error: existingError } = await supabase
      .from('albums')
      .select('*')
      .eq('musicbrainz_id', rgId);
    if (existingError) throw new Error(existingError.message);

    // Si no encuentra, buscar por título + artista (álbumes del sistema antiguo)
    if (existing.length === 0) {
      const artistCredit = rg['artist-credit'][0].name;
      const { data: existingByTitle, error: titleError } = await supabase
        .from('albums')
        .select('*')
        .ilike('title', rg.title)
        .ilike('artist', artistCredit);
      if (titleError) throw new Error(titleError.message);
      existing = existingByTitle;
    }

    if (existing.length > 0) {
      const savedAlbum = existing[0];
      let tracks = await getTracksFromDB(savedAlbum.id);

      if (tracks.length === 0) {
        tracks = await fetchAndSaveTracks(savedAlbum.id, rgId);
      }

      results.push({ album: savedAlbum, tracks });
      continue;
    }

    // Álbum nuevo
    const releaseYear = rg['first-release-date']
      ? parseInt(rg['first-release-date'].split('-')[0])
      : null;

    const relUrl =
      `https://musicbrainz.org/ws/2/release/` +
      `?release-group=${rgId}&status=official&fmt=json&limit=5`;
    const relResponse = await fetch(relUrl, { headers: { "User-Agent": userAgentMB } });
    const relData = await relResponse.json();

    const bestRelease = relData.releases?.find(r => r.status === 'Official')
      || relData.releases?.[0];

    const releaseId = bestRelease?.id ?? null;
    const releaseDate = bestRelease?.date?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? bestRelease.date
      : null;

    // Obtener la mejor URL de portada disponible
    const coverUrl = await getCoverUrl(rgId, releaseId);

    const albumData = {
      musicbrainz_id: rgId,
      title: rg.title,
      artist: rg['artist-credit'][0].name,
      release_date: releaseDate,
      release_year: releaseYear,
      cover_url: coverUrl,
    };

    const { data: newAlbum, error: insertError } = await supabase
      .from('albums')
      .insert([albumData])
      .select();
    if (insertError) throw new Error(insertError.message);
    const savedAlbum = newAlbum[0];

    let tracks = [];
    if (releaseId) {
      const tracksResponse = await fetch(
        `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`,
        { headers: { "User-Agent": userAgentMB } }
      );
      const tracksData = await tracksResponse.json();

      if (tracksData.media?.length > 0) {
        tracks = tracksData.media.flatMap(medium =>
          medium.tracks.map(track => ({
            album_id: savedAlbum.id,
            position: track.position,
            title: track.title,
            length: track.length,
            created_at: new Date().toISOString(),
          }))
        );
        if (tracks.length > 0) {
          const { error: tracksError } = await supabase.from('songs').insert(tracks);
          if (tracksError) console.error("Error guardando canciones:", tracksError);
        }
      }
    }

    results.push({ album: savedAlbum, tracks });
  }

  return results;
}
 
module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums };