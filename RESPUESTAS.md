URL pública: https://libros-recomendados.onrender.com (ejemplo: reemplazar por la URL real)

# Respuestas — Parte C

## 1. Recorrido de una petición

1. Al pulsar *Guardar* se dispara el evento `submit`, que escucha `app.js` (línea 125) y ejecuta `guardarLibro`.
2. `evento.preventDefault()` (línea 74) evita que el formulario recargue la página.
3. `app.js` arma un objeto con los campos y lo envía con `fetch('/api/libros', { method: 'POST' })` (línea 84). El cuerpo va en JSON (`JSON.stringify`) con la cabecera `Content-Type: application/json`.
4. En `server.js`, `express.json()` (línea 13) convierte el cuerpo en objeto y la ruta `app.post('/api/libros')` (línea 22) valida los datos.
5. Si son válidos, ejecuta la consulta preparada de `db.js` (línea 40): `INSERT INTO libros (titulo, autor, portada, comentario) VALUES (?, ?, ?, ?)`.
6. El servidor responde **201 Created** con el libro creado en JSON, incluido su `id` (línea 38).
7. `app.js` lo agrega al principio del array con `unshift` (línea 92) y `mostrarLibros()` vuelve a dibujar las tarjetas en el DOM.

## 2. Validación

La validación del navegador (`required`, `type="url"`) es una comodidad para el usuario, pero no es seguridad: todo lo que llega del cliente se puede manipular. Por ejemplo, con F12 se puede borrar el atributo `required`, o se puede saltear el formulario escribiendo en la consola:

```js
fetch('/api/libros', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ titulo: '', autor: 'x', portada: 'javascript:alert(1)' }) })
```

Lo mismo se logra con `curl` o Postman. Por eso `server.js` vuelve a validar: rechaza título o autor vacíos (línea 29) y una portada que no empiece con `http://` o `https://` (línea 32), respondiendo **400 Bad Request**.

## 3. Seguridad

- `<script>alert(1)</script>` es un intento de **XSS**: inyectar JavaScript que se ejecute en el navegador de quien vea la lista. No funciona porque `app.js` muestra los datos con `textContent` (líneas 41, 44 y 47), que trata todo como texto: la etiqueta se ve escrita y no se ejecuta. Con `innerHTML` sí se interpretaría como HTML.
- `' OR '1'='1` es un intento de **inyección SQL**: cerrar la comilla y agregar una condición siempre verdadera para alterar la consulta. No tiene efecto porque `db.js` usa consultas preparadas con `?` (líneas 37 a 42): el dato viaja separado del SQL y se guarda como un título más, nunca se interpreta como código.

## 4. Dos formas de guardar datos

El modo oscuro es una preferencia personal de quien usa ese navegador: no le importa a nadie más, por eso basta `localStorage` (líneas 121 y 129 de `app.js`). Los libros, en cambio, son datos compartidos: todos los usuarios deben ver las mismas recomendaciones desde cualquier dispositivo, así que se guardan en el servidor, en SQLite. Si los libros estuvieran en `localStorage`, cada persona vería solo los suyos y se perderían al limpiar el navegador.

En el plan gratuito de Render el disco es efímero: cuando el servicio se reinicia, se duerme o se vuelve a desplegar, `libros.db` se borra. Mi `db.js` lo maneja recreando la tabla con `CREATE TABLE IF NOT EXISTS` y, si está vacía (línea 25), cargando dos libros de ejemplo. Los libros agregados por usuarios igual se pierden; para conservarlos haría falta un disco persistente (pago) o una base de datos externa.

## 5. CSS y arquitectura

`repeat(auto-fill, minmax(160px, 1fr))` (línea 140 de `estilos.css`) crea tantas columnas como entren en el ancho disponible, cada una de al menos 160px; el espacio que sobra se reparte en partes iguales (`1fr`). Así la grilla pasa de una columna en celular a varias en pantallas anchas sin escribir una media query.

La media query `@media (min-width: 768px)` (línea 187) aplica el enfoque *mobile first*: por defecto todo va en una columna y, desde 768px, el contenedor pasa a dos columnas `1fr 2fr` (formulario un tercio, listado dos tercios).

En el patrón MVC: el **modelo** es `db.js` (datos y acceso a SQLite), la **vista** es la carpeta `public/` (HTML, CSS y JS que ve el usuario) y el **controlador** son las rutas de `server.js`, que reciben la petición, usan el modelo y devuelven la respuesta.
