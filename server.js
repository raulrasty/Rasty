const express = require('express');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
const usersRoutes = require('./routes/usersRoutes');
app.use('/users', usersRoutes);
const albumsRoutes = require('./routes/albumsRoutes');
app.use('/albums', albumsRoutes);
const listensRoutes = require('./routes/listensRoutes');
app.use('/listens', listensRoutes);
const songsRoutes = require('./routes/songsRoutes');
app.use('/songs', songsRoutes);
const albumInfoRoutes = require('./routes/albumInfoRoutes'); 
app.use('/albumInfo', albumInfoRoutes);

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});