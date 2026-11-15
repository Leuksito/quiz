'use strict';

const estadoRanking = document.getElementById('estadoRanking');
const filtroRanking = document.getElementById('filtroRanking');
const tablaRanking = document.getElementById('tablaRanking');
const botonBorrarRanking = document.getElementById('borrarRanking');

let quizzes = [];

async function iniciarRanking() {
  try {
    const catalogo = await cargarCatalogo();

    quizzes = catalogo.map(function (item) {
      return {
        id: item.id,
        titulo: item.datos.titulo
      };
    });

    quizzes.forEach(function (quiz) {
      const opcion = document.createElement('option');
      opcion.value = quiz.id;
      opcion.textContent = quiz.titulo;
      filtroRanking.appendChild(opcion);
    });

    const seleccionado = new URLSearchParams(window.location.search).get('quiz');
    if (seleccionado && quizzes.some(function (quiz) { return quiz.id === seleccionado; })) {
      filtroRanking.value = seleccionado;
    }

    estadoRanking.hidden = true;
    tablaRanking.hidden = false;
    pintarRanking();

    filtroRanking.addEventListener('change', pintarRanking);
    botonBorrarRanking.addEventListener('click', borrarRanking);
  } catch (error) {
    estadoRanking.className = 'mensaje mensaje--error';
    estadoRanking.textContent = 'No se pudo cargar el ranking. ' + ayudaCarga();
  }
}

function pintarRanking() {
  const seleccion = filtroRanking.value;
  const filas = [];

  quizzes.forEach(function (quiz) {
    if (seleccion !== 'todas' && seleccion !== quiz.id) {
      return;
    }

    obtenerMarcas(quiz.id).forEach(function (marca) {
      filas.push({
        nombre: marca.nombre,
        aciertos: marca.aciertos,
        total: marca.total,
        pistas: marca.pistas,
        tiempo: marca.tiempo,
        fecha: marca.fecha,
        quiz: quiz.titulo
      });
    });
  });

  filas.sort(compararMarcas);

  if (filas.length === 0) {
    tablaRanking.innerHTML = '<p class="mensaje">No hay marcas guardadas en esta categoría.</p>';
    return;
  }

  let html =
    '<div class="tabla-envoltura">' +
      '<table>' +
        '<thead><tr>' +
          '<th>Puesto</th><th>Nombre</th><th>Categoría</th><th>Aciertos</th><th>Pistas</th><th>Tiempo</th><th>Fecha</th>' +
        '</tr></thead><tbody>';

  html += filas.map(function (fila, posicion) {
    return (
      '<tr>' +
        '<td>' + (posicion + 1) + '</td>' +
        '<td>' + escaparHtml(fila.nombre) + '</td>' +
        '<td>' + escaparHtml(fila.quiz) + '</td>' +
        '<td>' + fila.aciertos + '/' + fila.total + '</td>' +
        '<td>' + (fila.pistas || 0) + '</td>' +
        '<td>' + formatearTiempo(fila.tiempo) + '</td>' +
        '<td>' + formatearFecha(fila.fecha) + '</td>' +
      '</tr>'
    );
  }).join('');

  html += '</tbody></table></div>';
  tablaRanking.innerHTML = html;
}

function borrarRanking() {
  if (!window.confirm('¿Quieres borrar todas las marcas del ranking?')) {
    return;
  }

  if (borrarTodoElRanking()) {
    pintarRanking();
  } else {
    window.alert('No se pudo borrar el ranking.');
  }
}

iniciarRanking();
