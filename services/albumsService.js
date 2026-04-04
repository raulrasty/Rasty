require("dotenv").config();
const supabase = require("../config/supabaseClient");
const userAgentMB = process.env.MUSICBRAINZ_USER_AGENT;

// Palabras clave para filtrar álbumes que no son LPs
const TITLE_BLACKLIST = [
  "sampler", "demo", "session", "sessions", "radio", "promo",
  "bootleg", "interview", "live", "acoustic", "unplugged",
  "untitled", "test", "rough", "rehearsal", "outtakes",
];

// Normaliza strings para comparaciones sin acentos ni símbolos
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Obtener todos los álbumes de la base de datos
async function getAllAlbums() {
  const { data, error } = await supabase.from("albums").select("*");
  if (error) throw new Error(error.message);
  return data;
}

// Crear un álbum en la base de datos
async function createAlbum(albumData) {
  const { data, error } = await supabase.from("albums").insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

// Obtener las canciones de un álbum ordenadas por posición
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

// Obtener la URL de portada desde coverartarchive
// Intenta primero con el release-group, luego con el release específico
async function getCoverUrl(rgId, releaseId) {
  const rgCoverUrl = `https://coverartarchive.org/release-group/${rgId}/front`;
  try {
    const res = await fetch(rgCoverUrl, {
      method: "HEAD",
      headers: { "User-Agent": userAgentMB },
      redirect: "follow",
    });
    if (res.ok) return rgCoverUrl;
  } catch (_) {}

  if (releaseId) {
    const relCoverUrl = `https://coverartarchive.org/release/${releaseId}/front`;
    try {
      const res = await fetch(relCoverUrl, {
        method: "HEAD",
        headers: { "User-Agent": userAgentMB },
        redirect: "follow",
      });
      if (res.ok) return relCoverUrl;
    } catch (_) {}
  }

  // Fallback: devolver URL del release-group aunque no se haya verificado
  return rgCoverUrl;
}

// Buscar álbumes en MusicBrainz por ID de artista
// y guardar los que no existan en la BD junto con sus canciones
async function searchByArtistId(artistId, artistName, title) {
  // Paginación: obtener todos los release-groups del artista por su ID
  let allReleaseGroups = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const rgUrl =
      `https://musicbrainz.org/ws/2/release-group` +
      `?artist=${artistId}&type=album&fmt=json&limit=${limit}&offset=${offset}`;

    const rgResponse = await fetch(rgUrl, { headers: { "User-Agent": userAgentMB } });
    const rgData = await rgResponse.json();

    if (!rgData["release-groups"] || rgData["release-groups"].length === 0) break;

    allReleaseGroups.push(...rgData["release-groups"]);

    if (rgData["release-groups"].length < limit) break;

    offset += limit;
  }

  console.log(`MB devolvió ${allReleaseGroups.length} release-groups para "${artistName}"`);

  if (allReleaseGroups.length === 0) throw new Error("No se encontraron álbumes");

  // Filtrar para quedarse solo con LPs
  const filtered = allReleaseGroups.filter((rg) => {
    if (rg["primary-type"] !== "Album") return false;

    const badSecondary = [
      "Compilation", "Live", "Remix", "Soundtrack",
      "Interview", "Spokenword", "Audiobook", "Audio drama", "Mixtape/Street", "Demo",
    ];
    if (rg["secondary-types"]?.some((t) => badSecondary.includes(t))) return false;

    const rgTitle = rg.title.toLowerCase();
    if (TITLE_BLACKLIST.some((word) => rgTitle.includes(word))) return false;

    if (/^\[.*\]$/.test(rg.title.trim()) || /^\(.*\)$/.test(rg.title.trim())) return false;

    // Si se busca por título concreto, filtrar por él
    if (title && !normalize(rg.title).includes(normalize(title))) return false;

    return true;
  });

  console.log(`Después del filtro quedan ${filtered.length} álbumes`);

  if (filtered.length === 0) throw new Error("No se encontraron álbumes del artista indicado");

  const results = [];

  for (const rg of filtered) {
    const rgId = rg.id;

    // Buscar si el álbum ya existe en la BD por su ID de MusicBrainz
    let { data: existing, error: existingError } = await supabase
      .from("albums")
      .select("*")
      .eq("musicbrainz_id", rgId);
    if (existingError) throw new Error(existingError.message);

    // Si no se encuentra por ID, buscar por título + artista como fallback
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

    // Si el álbum ya existe, devolver sus datos y canciones
    if (existing.length > 0) {
      const savedAlbum = existing[0];
      let tracks = await getTracksFromDB(savedAlbum.id);

      // Si no tiene canciones guardadas, buscarlas en MB y guardarlas
      if (tracks.length === 0) {
        const relUrl = `https://musicbrainz.org/ws/2/release/?release-group=${rgId}&status=official&fmt=json&limit=5`;
        const relResponse = await fetch(relUrl, { headers: { "User-Agent": userAgentMB } });
        const relData = await relResponse.json();
        const bestRelease =
          relData.releases?.find((r) => r.status === "Official") || relData.releases?.[0];

        if (bestRelease?.id) {
          const tracksResponse = await fetch(
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

    // Álbum nuevo: obtener datos completos de MB y guardarlo en la BD
    const releaseYear = rg["first-release-date"]
      ? parseInt(rg["first-release-date"].split("-")[0])
      : null;

    // Buscar el release oficial para obtener fecha exacta y canciones
    const relUrl =
      `https://musicbrainz.org/ws/2/release/` +
      `?release-group=${rgId}&status=official&fmt=json&limit=5`;
    const relResponse = await fetch(relUrl, { headers: { "User-Agent": userAgentMB } });
    const relData = await relResponse.json();

    const bestRelease =
      relData.releases?.find((r) => r.status === "Official") || relData.releases?.[0];

    const releaseId = bestRelease?.id ?? null;
    const releaseDate = bestRelease?.date?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? bestRelease.date
      : null;

    // Obtener portada
    const coverUrl = await getCoverUrl(rgId, releaseId);

    // Guardar álbum en la BD
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

    // Obtener y guardar canciones del álbum
    let tracks = [];
    if (releaseId) {
      const tracksResponse = await fetch(
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
  }

  return results;
}

// Buscar artista por nombre, si hay varios candidatos devolver lista para que el usuario elija
async function searchAndSaveAlbums(title, artist, artistId = null) {
  // Si ya tenemos el ID, buscar directamente
  if (artistId) {
    return await searchByArtistId(artistId, artist || 'Artista', title);
  }

  if (!artist) throw new Error("Debes proporcionar un artista");

  // Buscar candidatos por nombre
  const artistSearchUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:"${artist}"&fmt=json&limit=5`;
  const artistRes = await fetch(artistSearchUrl, { headers: { "User-Agent": userAgentMB } });
  const artistData = await artistRes.json();

  if (!artistData.artists?.length) throw new Error("No se encontró el artista");

  // Si hay más de un candidato, devolver lista para que el usuario elija
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

  // Solo un resultado, buscar directamente
  const foundArtistId = artistData.artists[0].id;
  const foundArtistName = artistData.artists[0].name;
  console.log(`Artista encontrado: ${foundArtistName} (${foundArtistId})`);

  return await searchByArtistId(foundArtistId, foundArtistName, title);
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums };