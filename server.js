const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Importar rutas
const usersRoutes = require('./routes/usersRoutes');
app.use('/users', usersRoutes);
const albumsRoutes = require('./routes/albumsRoutes');
app.use('/albums', albumsRoutes);
const listensRoutes = require('./routes/listensRoutes');
app.use('/listens', listensRoutes);

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});