// app.js — Lógica del lado del cliente (se ejecuta en el navegador)

// 1. Referencias a elementos del DOM
const form = document.querySelector('#form-libro');
const tituloForm = document.querySelector('#titulo-form');
const btnGuardar = document.querySelector('#btn-guardar');
const btnCancelar = document.querySelector('#btn-cancelar');
const lista = document.querySelector('#lista');
const filtro = document.querySelector('#filtro');
const contador = document.querySelector('#contador');
const mensaje = document.querySelector('#mensaje');
const btnTema = document.querySelector('#btn-tema');

// 2. Estado de la aplicación
let libros = [];          // array de objetos (estructura de datos)
let idEditando = null;    // null = agregando un libro nuevo; un número = editando ese libro

// Imagen local que se usa cuando el libro no tiene portada por URL
const PORTADA_LOCAL = 'img/sin-portada.svg';

// 3. Dibujar la lista en pantalla a partir del array
function mostrarLibros() {
  const texto = filtro.value.toLowerCase();

  // filter: nos quedamos solo con los libros que coinciden con la búsqueda
  const visibles = libros.filter(
    (l) => l.titulo.toLowerCase().includes(texto) || l.autor.toLowerCase().includes(texto)
  );

  lista.innerHTML = ''; // vaciamos la lista (aquí no hay datos del usuario)

  visibles.forEach((libro) => {
    const li = document.createElement('li');
    li.className = 'tarjeta';
    if (libro.id === idEditando) {
      li.classList.add('editando'); // resalta la tarjeta que se está editando
    }

    const img = document.createElement('img');
    img.src = libro.portada || PORTADA_LOCAL;
    img.alt = 'Portada de ' + libro.titulo;
    img.onerror = () => { img.src = PORTADA_LOCAL; }; // si la URL falla

    const cuerpo = document.createElement('div');
    cuerpo.className = 'cuerpo';

    const h3 = document.createElement('h3');
    h3.textContent = libro.titulo; // textContent, NO innerHTML: evita XSS

    const autor = document.createElement('p');
    autor.textContent = libro.autor;

    const comentario = document.createElement('p');
    comentario.textContent = libro.comentario || '';

    // Botones Editar y Borrar
    const acciones = document.createElement('div');
    acciones.className = 'acciones';

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'secundario';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => empezarEdicion(libro));

    const btnBorrar = document.createElement('button');
    btnBorrar.type = 'button';
    btnBorrar.className = 'borrar';
    btnBorrar.textContent = 'Borrar';
    btnBorrar.addEventListener('click', () => borrarLibro(libro.id));

    acciones.append(btnEditar, btnBorrar);
    cuerpo.append(h3, autor, comentario);
    li.append(img, cuerpo, acciones);
    lista.append(li);
  });

  contador.textContent = visibles.length;
}

// 4. Modo edición: el mismo formulario sirve para agregar y para modificar
function empezarEdicion(libro) {
  idEditando = libro.id;

  // Cargamos los datos del libro en el formulario
  form.titulo.value = libro.titulo;
  form.autor.value = libro.autor;
  form.portada.value = libro.portada || '';
  form.comentario.value = libro.comentario || '';

  // Cambiamos los textos para que se note que estamos editando
  tituloForm.textContent = 'Modificar libro';
  btnGuardar.textContent = 'Actualizar';
  btnCancelar.hidden = false;
  mensaje.textContent = '';

  mostrarLibros();      // para resaltar la tarjeta
  form.titulo.focus();  // lleva el cursor (y la pantalla) al formulario
}

function cancelarEdicion() {
  idEditando = null;
  form.reset();
  tituloForm.textContent = 'Agregar un libro';
  btnGuardar.textContent = 'Guardar';
  btnCancelar.hidden = true;
  mostrarLibros();
}

// 5. Comunicación con el servidor usando fetch (peticiones HTTP)
async function cargarLibros() {
  try {
    const respuesta = await fetch('/api/libros'); // GET
    libros = await respuesta.json();
    mostrarLibros();
  } catch (error) {
    mensaje.textContent = 'No se pudo conectar con el servidor.';
  }
}

async function guardarLibro(evento) {
  evento.preventDefault(); // evita que el formulario recargue la página

  // Armamos un objeto con los datos del formulario
  const datos = {
    titulo: form.titulo.value,
    autor: form.autor.value,
    portada: form.portada.value,
    comentario: form.comentario.value,
  };

  // Si estamos editando: PUT /api/libros/:id. Si no: POST /api/libros
  const editando = idEditando !== null;
  const url = editando ? '/api/libros/' + idEditando : '/api/libros';
  const metodo = editando ? 'PUT' : 'POST';

  const respuesta = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos), // objeto -> texto JSON
  });

  if (respuesta.ok) {
    const libroGuardado = await respuesta.json();
    if (editando) {
      // map: reemplazamos en el array el libro modificado
      libros = libros.map((l) => (l.id === libroGuardado.id ? libroGuardado : l));
      cancelarEdicion(); // vuelve el formulario al modo "agregar"
      mensaje.textContent = 'Libro actualizado ✔';
    } else {
      libros.unshift(libroGuardado); // lo agregamos al principio del array
      mostrarLibros();
      form.reset();
      mensaje.textContent = 'Libro guardado ✔';
    }
  } else {
    const error = await respuesta.json();
    mensaje.textContent = error.error;
  }
}

async function borrarLibro(id) {
  if (!confirm('¿Borrar este libro?')) return;
  const respuesta = await fetch('/api/libros/' + id, { method: 'DELETE' });
  if (respuesta.ok) {
    libros = libros.filter((l) => l.id !== id);
    if (id === idEditando) {
      cancelarEdicion(); // si se borra el libro que se estaba editando
    } else {
      mostrarLibros();
    }
  }
}

// 6. Modo oscuro: se recuerda en el navegador con localStorage
function aplicarTema(oscuro) {
  document.body.classList.toggle('oscuro', oscuro);
  btnTema.textContent = oscuro ? 'Modo claro' : 'Modo oscuro';
  btnTema.setAttribute('aria-pressed', oscuro);
}

btnTema.addEventListener('click', () => {
  const oscuro = !document.body.classList.contains('oscuro');
  aplicarTema(oscuro);
  localStorage.setItem('tema-oscuro', oscuro);
});

// 7. Eventos
form.addEventListener('submit', guardarLibro);
btnCancelar.addEventListener('click', cancelarEdicion);
filtro.addEventListener('input', mostrarLibros); // filtra mientras se escribe

// 8. Inicio
aplicarTema(localStorage.getItem('tema-oscuro') === 'true');
cargarLibros();
