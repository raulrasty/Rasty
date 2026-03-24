const supabase = require('../config/supabaseClient');

async function getAlbumById(albumId) {
  const { data, error } = await supabase
    .from('albums')
    .select('title, artist, release_year, cover_url')
    .eq('id', albumId)
    .single();

  console.log('Data recibida de Supabase:', data);

  if (error) {
    throw new Error('Error al obtener el álbum');
  }

  if (!data) {
    throw new Error('Álbum no encontrado');
  }

  return data;
}

module.exports = {
  getAlbumById
};