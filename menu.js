'use strict';

const estadoMenu = document.getElementById('estadoMenu');
const listaQuizzes = document.getElementById('listaQuizzes');

async function cargarMenu() {
  try {
    const quizzes = await cargarCatalogo();

    estadoMenu.hidden = true;
    listaQuizzes.innerHTML = quizzes.map(function (item) {
      return crearTarjeta(item.datos);
    }).join('');
  } catch (error) {
    estadoMenu.className = 'mensaje mensaje--error';
    estadoMenu.innerHTML =
      '<h2>No se pudieron cargar las categorías</h2>' +
      '<p>' + escaparHtml(ayudaCarga()) + '</p>';
  }
}

function crearTarjeta(datos) {
  const preguntas = datos.preguntas.length;
  const mejor = mejorMarca(datos.id);
  const marca = mejor ? 'Mejor marca: ' + mejor.aciertos + '/' + mejor.total : 'Todavía no has jugado';
  const icono = datos.icono || 'img/icono-cultura.jpg';

  return (
    '<article class="tarjeta">' +
      '<div class="tarjeta__cabecera">' +
        '<img src="' + escaparHtml(icono) + '" alt="">' +
        '<div>' +
          '<h3>' + escaparHtml(datos.titulo) + '</h3>' +
          '<p class="meta">' + preguntas + ' preguntas</p>' +
        '</div>' +
      '</div>' +
      '<p>' + escaparHtml(datos.descripcion) + '</p>' +
      '<p class="meta">' + escaparHtml(marca) + '</p>' +
      '<div class="tarjeta__pie">' +
        '<a class="boton" href="quiz.html?quiz=' + encodeURIComponent(datos.id) + '">Jugar</a>' +
        '<a class="enlace" href="ranking.html?quiz=' + encodeURIComponent(datos.id) + '">Ver ranking</a>' +
      '</div>' +
    '</article>'
  );
}

cargarMenu();
