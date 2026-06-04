const supabase = require('../config/supabaseClient');

async function getSongsByAlbum(albumId) {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id, position, title, length, deezer_track_id')
      .eq('album_id', albumId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error en SongsService:', err);
    throw err;
  }
}

module.exports = { getSongsByAlbum };