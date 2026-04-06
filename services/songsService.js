
const supabase = require('../config/supabaseClient');

//Obtener las canciones de un album

async function getSongsByAlbum(albumId) {
  try {
    const { data, error } = await supabase
      .from('songs')          
      .select('id, position, title, length') 
      .eq('album_id', albumId) 
      .order('position', { ascending: true }); 

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error en SongsService:', err);
    throw err;
  }
}

module.exports = {
  getSongsByAlbum,
};