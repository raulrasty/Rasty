require("dotenv").config();
const supabase = require("../config/supabaseClient");
const userAgentMB = process.env.MUSICBRAINZ_USER_AGENT;

const TITLE_BLACKLIST = [
  "sampler",
  "bootleg",
  "promo",
  "rehearsal",
  "outtakes",
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      console.error(`Intento ${i + 1} fallido para ${url}:`, err.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

async function getAllAlbums() {
  const { data, error } = await supabase.from("albums").select("*");
  if (error) throw new Error(error.message);
  return data;
}

async function createAlbum(albumData) {
  const { data, error } = await supabase.from("albums").insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function getTracksFromDB(albumId) {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("album_id", albumId)
    .order("position", { ascending: true });
  if (error) {
    console.error("Error obteniendo canciones de la DB:", error);
    return [];
  }
  return data || [];
}

async function getCoverUrl(rgId, releaseId) {
  const rgCoverUrl = `https://coverartarchive.org/release-group/${rgId}/front`;
  try {
    const res = await fetchWithRetry(rgCoverUrl, {
      method: "HEAD",
      headers: { "User-Agent": userAgentMB },
      redirect: "follow",
    });
    if (res.ok) return rgCoverUrl;
  } catch (_) {}

  if (releaseId) {
    const relCoverUrl = `https://coverartarchive.org/release/${releaseId}/front`;
    try {
      const res = await fetchWithRetry(relCoverUrl, {
        method: "HEAD",
        headers: { "User-Agent": userAgentMB },
        redirect: "follow",
      });
      if (res.ok) return relCoverUrl;
    } catch (_) {}
  }

  return rgCoverUrl;
}

async function searchByArtistId(artistId, artistName, title, page = 1, limit = 6) {
  let allReleaseGroups = [];
  let offset = 0;
  const mbLimit = 100;

  while (true) {
    const rgUrl =
      `https://musicbrainz.org/ws/2/release-group` +
      `?artist=${artistId}&type=album&fmt=json&limit=${mbLimit}&offset=${offset}`;

    const rgResponse = await fetchWithRetry(rgUrl, { headers: { "User-Agent": userAgentMB } });
    const rgData = await rgResponse.json();

    if (!rgData["release-groups"] || rgData["release-groups"].length === 0) break;

    allReleaseGroups.push(...rgData["release-groups"]);

    if (rgData["release-groups"].length < mbLimit) break;

    offset += mbLimit;
  }

  const filtered = allReleaseGroups.filter((rg) => {
    if (rg["primary-type"] !== "Album") return false;

    const badSecondary = [
      "Compilation", "Live", "Remix", "Soundtrack",
      "Interview", "Spokenword", "Audiobook", "Audio drama", "Mixtape/Street", "Demo",
    ];
    if (rg["secondary-types"]?.some((t) => badSecondary.includes(t))) return false;

    const rgTitle = rg.title.toLowerCase();
    if (TITLE_BLACKLIST.some((word) => new RegExp(`\\b${word}\\b`).test(rgTitle))) {
      return false;
    }

    if (/^\[.*\]$/.test(rg.title.trim()) || /^\(.*\)$/.test(rg.title.trim())) {
      return false;
    }

    if (title && !normalize(rg.title).includes(normalize(title))) {
      return false;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const yearA = a["first-release-date"] ? parseInt(a["first-release-date"].split("-")[0]) : 0;
    const yearB = b["first-release-date"] ? parseInt(b["first-release-date"].split("-")[0]) : 0;
    return yearA - yearB;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit;
  const to = from + limit;
  const paginated = filtered.slice(from, to);

  console.log(`Total filtrados: ${total}, página ${page}/${totalPages}, procesando ${paginated.length}`);

  if (paginated.length === 0) throw new Error("No se encontraron álbumes del artista indicado");

  const results = [];

  for (const rg of paginated) {
    try {
      const rgId = rg.id;

      let { data: existing, error: existingError } = await supabase
        .from("albums")
        .select("*")
        .eq("musicbrainz_id", rgId);
      if (existingError) throw new Error(existingError.message);

      if (existing.length === 0) {
        const artistCredit =
          rg["artist-credit"]
            ?.map((ac) => (ac.name || ac.artist?.name || "") + (ac.joinphrase || ""))
            .join("") || "";

        const { data: existingByTitle, error: titleError } = await supabase
          .from("albums")
          .select("*")
          .ilike("title", rg.title)
          .ilike("artist", artistCredit);
        if (titleError) throw new Error(titleError.message);
        existing = existingByTitle;
      }

      if (existing.length > 0) {
        const savedAlbum = existing[0];
        let tracks = await getTracksFromDB(savedAlbum.id);

        if (tracks.length === 0) {
          const relUrl = `https://musicbrainz.org/ws/2/release/?release-group=${rgId}&status=official&fmt=json&limit=5`;
          const relResponse = await fetchWithRetry(relUrl, { headers: { "User-Agent": userAgentMB } });
          const relData = await relResponse.json();
          const bestRelease =
            relData.releases?.find((r) => r.status === "Official") || relData.releases?.[0];

          if (bestRelease?.id) {
            const tracksResponse = await fetchWithRetry(
              `https://musicbrainz.org/ws/2/release/${bestRelease.id}?inc=recordings&fmt=json`,
              { headers: { "User-Agent": userAgentMB } }
            );
            const tracksData = await tracksResponse.json();

            if (tracksData.media?.length > 0) {
              tracks = tracksData.media.flatMap((medium) =>
                medium.tracks.map((track) => ({
                  album_id: savedAlbum.id,
                  position: track.position,
                  title: track.title,
                  length: track.length,
                  created_at: new Date().toISOString(),
                }))
              );
              if (tracks.length > 0) {
                await supabase.from("songs").insert(tracks);
              }
            }
          }
        }

        results.push({ album: savedAlbum, tracks });
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const releaseYear = rg["first-release-date"]
        ? parseInt(rg["first-release-date"].split("-")[0])
        : null;

      const relUrl =
        `https://musicbrainz.org/ws/2/release/` +
        `?release-group=${rgId}&status=official&fmt=json&limit=5`;
      const relResponse = await fetchWithRetry(relUrl, { headers: { "User-Agent": userAgentMB } });
      const relData = await relResponse.json();

      const bestRelease =
        relData.releases?.find((r) => r.status === "Official") || relData.releases?.[0];

      const releaseId = bestRelease?.id ?? null;
      const releaseDate = bestRelease?.date?.match(/^\d{4}-\d{2}-\d{2}$/)
        ? bestRelease.date
        : null;

      const coverUrl = await getCoverUrl(rgId, releaseId);

      const albumData = {
        musicbrainz_id: rgId,
        title: rg.title,
        artist:
          rg["artist-credit"]
            ?.map((ac) => (ac.name || ac.artist?.name || "") + (ac.joinphrase || ""))
            .join("") || artistName,
        release_date: releaseDate,
        release_year: releaseYear,
        cover_url: coverUrl,
      };

      const { data: newAlbum, error: insertError } = await supabase
        .from("albums")
        .insert([albumData])
        .select();
      if (insertError) throw new Error(insertError.message);
      const savedAlbum = newAlbum[0];

      let tracks = [];
      if (releaseId) {
        const tracksResponse = await fetchWithRetry(
          `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`,
          { headers: { "User-Agent": userAgentMB } }
        );
        const tracksData = await tracksResponse.json();

        if (tracksData.media?.length > 0) {
          tracks = tracksData.media.flatMap((medium) =>
            medium.tracks.map((track) => ({
              album_id: savedAlbum.id,
              position: track.position,
              title: track.title,
              length: track.length,
              created_at: new Date().toISOString(),
            }))
          );
          if (tracks.length > 0) {
            const { error: tracksError } = await supabase.from("songs").insert(tracks);
            if (tracksError) console.error("Error guardando canciones:", tracksError);
          }
        }
      }

      results.push({ album: savedAlbum, tracks });
      await new Promise((resolve) => setTimeout(resolve, 100));

    } catch (err) {
      console.error('Error procesando álbum:', rg.title, err.message);
      continue;
    }
  }

  return { results, total, page, totalPages };
}

async function searchAndSaveAlbums(title, artist, artistId = null, page = 1, limit = 6) {
  if (artistId) {
    return await searchByArtistId(artistId, artist || 'Artista', title, page, limit);
  }

  if (!artist) throw new Error("Debes proporcionar un artista");

  const artistSearchUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:"${artist}"&fmt=json&limit=5`;
  const artistRes = await fetchWithRetry(artistSearchUrl, { headers: { "User-Agent": userAgentMB } });
  const artistData = await artistRes.json();

  if (!artistData.artists?.length) throw new Error("No se encontró el artista");

  if (artistData.artists.length > 1) {
    return {
      disambiguation: true,
      candidates: artistData.artists.map((a) => ({
        id: a.id,
        name: a.name,
        disambiguation: a.disambiguation || "",
        country: a.country || "",
      })),
    };
  }

  const foundArtistId = artistData.artists[0].id;
  const foundArtistName = artistData.artists[0].name;

  return await searchByArtistId(foundArtistId, foundArtistName, title, page, limit);
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums };