const supabase = require("../config/supabaseClient");
const albumsService = require("./albumsService");

//Crear la escucha de un album
async function createListen(
  userId,
  { albumId, rating = null, liked = false, review = null, listen_date = null },
) {
  let dateToUse;
  if (listen_date) {
    // Combinar la fecha elegida con la hora actual
    const chosenDate = new Date(listen_date);
    const now = new Date();
    chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    dateToUse = chosenDate;
  } else {
    dateToUse = new Date();
  }

  if (dateToUse > new Date())
    throw new Error("La fecha de escucha no puede ser futura");

  const { data, error } = await supabase
    .from("listens")
    .insert([
      {
        user_id: userId,
        album_id: albumId,
        rating,
        liked,
        review,
        listen_date: dateToUse.toISOString(),
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

//Obtener las escuchas de un usuario
async function getListensByUser(user_id) {
  const { data, error } = await supabase
    .from("listens")
    .select(`*, album:album_id(*)`)
    .eq("user_id", user_id)
    .order("listen_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Eliminar una escucha propia
async function deleteListen(listenId, userId) {
  // Verificar que la escucha pertenece al usuario
  const { data: listen, error: findError } = await supabase
    .from("listens")
    .select("*")
    .eq("id", listenId)
    .eq("user_id", userId)
    .single();

  if (findError || !listen)
    throw new Error("Escucha no encontrada o no tienes permiso");

  const { error } = await supabase.from("listens").delete().eq("id", listenId);

  if (error) throw new Error(error.message);
  return { message: "Escucha eliminada correctamente" };
}

// Editar una escucha propia
async function updateListen(
  listenId,
  userId,
  { rating, liked, review, listen_date },
) {
  // Verificar que la escucha pertenece al usuario
  const { data: listen, error: findError } = await supabase
    .from("listens")
    .select("*")
    .eq("id", listenId)
    .eq("user_id", userId)
    .single();

  if (findError || !listen)
    throw new Error("Escucha no encontrada o no tienes permiso");

  // Validar fecha si se proporciona
  if (listen_date && new Date(listen_date) > new Date()) {
    throw new Error("La fecha de escucha no puede ser futura");
  }

  // ✅ Solo actualizar listen_date si el usuario la cambió
  const updates = { rating, liked, review };
  if (listen_date) updates.listen_date = listen_date;

  const { data, error } = await supabase
    .from("listens")
    .update(updates)
    .eq("id", listenId)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// Obtener álbumes únicos escuchados por un usuario ordenados por fecha más reciente
async function getAlbumsByUser(userId) {
  const { data, error } = await supabase
    .from("listens")
    .select(
      "album_id, album:album_id(id, title, artist, cover_url, release_year)",
    )
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  // Álbumes únicos
  const seen = new Set();
  const unique = [];

  for (const l of data) {
    if (!seen.has(l.album_id)) {
      seen.add(l.album_id);
      unique.push(l.album);
    }
  }

  // Ordenar por año de lanzamiento de más reciente a más antiguo
  return unique.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
}
module.exports = {
  createListen,
  getListensByUser,
  deleteListen,
  updateListen,
  getAlbumsByUser,
};
