const supabase = require('../config/supabaseClient');
const albumsService = require('./albumsService'); 



//Crear la escucha de un album
async function createListen(userId, { albumId, rating = null, liked = false, review = null, listen_date = null }) {

  const dateToUse = listen_date ? new Date(listen_date) : new Date();
  if (dateToUse > new Date()) throw new Error("La fecha de escucha no puede ser futura");

  // Insertar escucha directamente usando albumId
  const { data, error } = await supabase
    .from('listens')
    .insert([{
      user_id: userId,
      album_id: albumId,
      rating,
      liked,
      review,
      listen_date: dateToUse.toISOString()
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}


//Obtener las escuchas de un usuario
async function getListensByUser(user_id) {
  const { data, error } = await supabase
    .from('listens')
    .select(`*, album:album_id(*)`) 
    .eq('user_id', user_id)
    .order('listen_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}


// Eliminar una escucha propia
async function deleteListen(listenId, userId) {
  // Verificar que la escucha pertenece al usuario
  const { data: listen, error: findError } = await supabase
    .from('listens')
    .select('*')
    .eq('id', listenId)
    .eq('user_id', userId)
    .single();

  if (findError || !listen) throw new Error("Escucha no encontrada o no tienes permiso");

  const { error } = await supabase
    .from('listens')
    .delete()
    .eq('id', listenId);

  if (error) throw new Error(error.message);
  return { message: "Escucha eliminada correctamente" };
}

// Editar una escucha propia
async function updateListen(listenId, userId, { rating, liked, review, listen_date }) {
  // Verificar que la escucha pertenece al usuario
  const { data: listen, error: findError } = await supabase
    .from('listens')
    .select('*')
    .eq('id', listenId)
    .eq('user_id', userId)
    .single();

  if (findError || !listen) throw new Error("Escucha no encontrada o no tienes permiso");

  // Validar fecha 
  if (listen_date && new Date(listen_date) > new Date()) {
    throw new Error("La fecha de escucha no puede ser futura");
  }

  const { data, error } = await supabase
    .from('listens')
    .update({ rating, liked, review, listen_date })
    .eq('id', listenId)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

module.exports = { createListen, getListensByUser, deleteListen, updateListen };