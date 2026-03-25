const multer = require('multer');
const storage = multer.memoryStorage(); // guardamos en memoria
const upload = multer({ storage });

module.exports = upload;