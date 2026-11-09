// server.js — Servidor web con Express.
// Cumple dos funciones:
//   a) Sirve los archivos estáticos (HTML, CSS, JS e imágenes) de la carpeta /public
//   b) Expone una API REST en /api/libros que lee y escribe en SQLite
const express = require('express');
const path = require('node:path');
const libros = require('./db');

const app = express();
// El hosting (Render, Railway, etc.) indica el puerto en la variable PORT.
const PORT = process.env.PORT || 3000;

app.use(express.json()); // permite leer el cuerpo de las peticiones en formato JSON
app.use(express.static(path.join(__dirname, 'public'))); // sirve /public

// GET /api/libros -> devuelve todos los libros (200 OK)
app.get('/api/libros', (req, res) => {
  res.json(libros.listar.all());
});

// Valida los datos que llegan del cliente. La usan POST y PUT.
// Devuelve { error } si algo está mal, o { datos } si está todo bien.
function validarLibro(body) {
  const titulo = String(body.titulo || '').trim();
  const autor = String(body.autor || '').trim();
  const portada = String(body.portada || '').trim();
  const comentario = String(body.comentario || '').trim();

  // Validación en el servidor: nunca confiar solo en la del navegador
  if (!titulo || !autor) {
    return { error: 'Título y autor son obligatorios' };
  }
  if (portada && !/^https?:\/\//i.test(portada)) {
    return { error: 'La portada debe ser una URL http(s)' };
  }
  return { datos: { titulo, autor, portada, comentario } };
}

// POST /api/libros -> crea un libro (201 Created) o informa error (400 Bad Request)
app.post('/api/libros', (req, res) => {
  const { error, datos } = validarLibro(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const resultado = libros.insertar.run(datos.titulo, datos.autor, datos.portada, datos.comentario);
  const nuevo = libros.obtener.get(resultado.lastInsertRowid);
  res.status(201).json(nuevo);
});

// PUT /api/libros/:id -> modifica un libro (200 OK), 400 si los datos son inválidos o 404 si no existe
app.put('/api/libros/:id', (req, res) => {
  const { error, datos } = validarLibro(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const id = Number(req.params.id);
  const resultado = libros.actualizar.run(datos.titulo, datos.autor, datos.portada, datos.comentario, id);
  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'No existe ese libro' });
  }
  res.json(libros.obtener.get(id));
});

// DELETE /api/libros/:id -> borra un libro (204 No Content) o 404 si no existe
app.delete('/api/libros/:id', (req, res) => {
  const resultado = libros.borrar.run(Number(req.params.id));
  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'No existe ese libro' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
