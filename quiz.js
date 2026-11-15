'use strict';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const parametros = new URLSearchParams(window.location.search);
const idQuiz = parametros.get('quiz');
const entradaCatalogo = CATALOGO.find(function (item) {
  return item.id === idQuiz;
});

const estadoCarga = document.getElementById('estadoCarga');
const estadoError = document.getElementById('estadoError');
const errorDetalle = document.getElementById('errorDetalle');
const juego = document.getElementById('juego');
const resultados = document.getElementById('resultados');
const categoria = document.getElementById('categoria');
const tituloQuiz = document.getElementById('tituloQuiz');
const hudAciertos = document.getElementById('hudAciertos');
const hudTiempo = document.getElementById('hudTiempo');
const contadorPregunta = document.getElementById('contadorPregunta');
const preguntaMedia = document.getElementById('preguntaMedia');
const preguntaImagen = document.getElementById('preguntaImagen');
const preguntaTexto = document.getElementById('preguntaTexto');
const pista = document.getElementById('pista');
const respuestas = document.getElementById('respuestas');
const retro = document.getElementById('retro');
const botonPista = document.getElementById('botonPista');
const botonConfirmar = document.getElementById('botonConfirmar');

let quiz = null;
let preguntas = [];
let indice = 0;
let aciertos = 0;
let pistas = 0;
let seleccion = null;
let contestada = false;
let historial = [];
let inicio = 0;
let tiempoFinal = 0;
let temporizador = null;

function iniciar() {
  if (!entradaCatalogo) {
    mostrarError('No se ha indicado un quiz válido.');
    return;
  }

  cargarJSON(entradaCatalogo.archivo)
    .then(empezarConDatos)
    .catch(function () {
      mostrarError('No se pudo cargar el quiz. ' + ayudaCarga());
    });
}

function empezarConDatos(datos) {
  const validas = Array.isArray(datos.preguntas) ? datos.preguntas.filter(function (pregunta) {
    return pregunta &&
      typeof pregunta.pregunta === 'string' &&
      Array.isArray(pregunta.respuestas) &&
      pregunta.respuestas.length >= 2 &&
      Number.isInteger(pregunta.correcta) &&
      pregunta.correcta >= 0 &&
      pregunta.correcta < pregunta.respuestas.length;
  }) : [];

  if (validas.length < 3) {
    mostrarError('No hay suficientes preguntas válidas.');
    return;
  }

  quiz = datos;
  preguntas = prepararPreguntas(validas);
  document.title = datos.titulo + ' · Quiz Cultural';

  estadoCarga.hidden = true;
  juego.hidden = false;
  categoria.textContent = 'Quiz Cultural';
  tituloQuiz.textContent = datos.titulo;

  inicio = Date.now();
  actualizarTiempo();
  temporizador = window.setInterval(actualizarTiempo, 1000);
  pintarPregunta();
}

function prepararPreguntas(lista) {
  return mezclar(lista).slice(0, PREGUNTAS_POR_PARTIDA).map(function (pregunta) {
    const opciones = mezclar(pregunta.respuestas.map(function (texto, posicion) {
      return {
        texto: texto,
        correcta: posicion === pregunta.correcta
      };
    }));

    return {
      pregunta: pregunta.pregunta,
      imagen: pregunta.imagen || '',
      imagenAlt: pregunta.imagenAlt || '',
      pista: pregunta.pista || '',
      explicacion: pregunta.explicacion || '',
      opciones: opciones
    };
  });
}

function pintarPregunta() {
  const pregunta = preguntas[indice];

  seleccion = null;
  contestada = false;

  contadorPregunta.textContent = 'Pregunta ' + (indice + 1) + ' de ' + preguntas.length;
  preguntaTexto.textContent = pregunta.pregunta;
  respuestas.innerHTML = '';
  retro.hidden = true;
  retro.className = 'retro';
  retro.textContent = '';

  pregunta.opciones.forEach(function (opcion, posicion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'respuesta';

    const letra = document.createElement('span');
    letra.className = 'respuesta__letra';
    letra.textContent = LETRAS[posicion];

    const texto = document.createElement('span');
    texto.className = 'respuesta__texto';
    texto.textContent = opcion.texto;

    boton.appendChild(letra);
    boton.appendChild(texto);
    boton.addEventListener('click', function () {
      seleccionarRespuesta(posicion);
    });

    respuestas.appendChild(boton);
  });

  if (pregunta.imagen) {
    preguntaImagen.src = pregunta.imagen;
    preguntaImagen.alt = pregunta.imagenAlt || 'Imagen de apoyo';
    preguntaMedia.hidden = false;
  } else {
    preguntaImagen.removeAttribute('src');
    preguntaImagen.alt = '';
    preguntaMedia.hidden = true;
  }

  pista.hidden = true;
  pista.textContent = '';

  if (pregunta.pista) {
    botonPista.hidden = false;
    botonPista.disabled = false;
    botonPista.textContent = 'Pedir pista';
  } else {
    botonPista.hidden = true;
  }

  botonConfirmar.disabled = true;
  botonConfirmar.textContent = 'Confirmar respuesta';
  actualizarMarcador();
}

function seleccionarRespuesta(posicion) {
  if (contestada) {
    return;
  }

  seleccion = posicion;

  Array.prototype.forEach.call(respuestas.children, function (boton, numero) {
    boton.classList.toggle('respuesta--seleccionada', numero === posicion);
  });

  botonConfirmar.disabled = false;
}

function mostrarPista() {
  if (contestada) {
    return;
  }

  const pregunta = preguntas[indice];
  pista.textContent = 'Pista: ' + pregunta.pista;
  pista.hidden = false;
  botonPista.disabled = true;
  pistas += 1;
}

function confirmarRespuesta() {
  if (!contestada) {
    if (seleccion === null) {
      return;
    }

    const pregunta = preguntas[indice];
    const indiceCorrecto = pregunta.opciones.findIndex(function (opcion) {
      return opcion.correcta;
    });
    const acierto = seleccion === indiceCorrecto;

    contestada = true;

    if (acierto) {
      aciertos += 1;
    }

    historial.push({
      pregunta: pregunta.pregunta,
      elegida: pregunta.opciones[seleccion].texto,
      correcta: pregunta.opciones[indiceCorrecto].texto,
      acierto: acierto,
      explicacion: pregunta.explicacion
    });

    Array.prototype.forEach.call(respuestas.children, function (boton, numero) {
      boton.disabled = true;
      boton.classList.remove('respuesta--seleccionada');

      if (numero === indiceCorrecto) {
        boton.classList.add('respuesta--correcta');
        anadirMarca(boton, 'Correcta');
      } else if (numero === seleccion) {
        boton.classList.add('respuesta--incorrecta');
        anadirMarca(boton, 'Tu respuesta');
      }
    });

    retro.className = 'retro ' + (acierto ? 'retro--ok' : 'retro--ko');
    retro.textContent = acierto
      ? 'Respuesta correcta. ' + pregunta.explicacion
      : 'No era esa. La respuesta correcta es "' + pregunta.opciones[indiceCorrecto].texto + '". ' + pregunta.explicacion;
    retro.hidden = false;

    botonPista.disabled = true;
    botonConfirmar.disabled = false;
    botonConfirmar.textContent = indice === preguntas.length - 1 ? 'Ver resultados' : 'Siguiente pregunta';
    actualizarMarcador();
    return;
  }

  if (indice === preguntas.length - 1) {
    terminarPartida();
    return;
  }

  indice += 1;
  pintarPregunta();
}

function anadirMarca(boton, texto) {
  const marca = document.createElement('span');
  marca.className = 'respuesta__marca';
  marca.textContent = texto;
  boton.appendChild(marca);
}

function actualizarMarcador() {
  hudAciertos.textContent = aciertos;
  actualizarTiempo();
}

function actualizarTiempo() {
  hudTiempo.textContent = formatearTiempo(Math.floor((Date.now() - inicio) / 1000));
}

function terminarPartida() {
  if (temporizador) {
    window.clearInterval(temporizador);
    temporizador = null;
  }

  tiempoFinal = Math.max(1, Math.floor((Date.now() - inicio) / 1000));
  juego.hidden = true;
  resultados.hidden = false;

  resultados.innerHTML = crearResultadoHTML();
  document.getElementById('nombreJugador').value = obtenerNombreGuardado();
  document.getElementById('formGuardar').addEventListener('submit', guardarResultado);
  document.getElementById('botonRepetir').addEventListener('click', function () {
    window.location.href = 'quiz.html?quiz=' + encodeURIComponent(quiz.id);
  });

  pintarTop();
  window.scrollTo(0, 0);
}

function crearResultadoHTML() {
  const total = preguntas.length;
  const fallos = historial.filter(function (item) {
    return !item.acierto;
  });

  let repaso = '';

  if (fallos.length > 0) {
    repaso =
      '<details class="repaso">' +
        '<summary>Repasar los fallos (' + fallos.length + ')</summary>' +
        fallos.map(function (fallo) {
          return (
            '<div class="repaso__item">' +
              '<h3>' + escaparHtml(fallo.pregunta) + '</h3>' +
              '<p>Tu respuesta: ' + escaparHtml(fallo.elegida) + '</p>' +
              '<p>Respuesta correcta: ' + escaparHtml(fallo.correcta) + '</p>' +
              (fallo.explicacion ? '<p>' + escaparHtml(fallo.explicacion) + '</p>' : '') +
            '</div>'
          );
        }).join('') +
      '</details>';
  }

  return (
    '<div class="resultado">' +
      '<h1>Resultado: ' + aciertos + ' de ' + total + '</h1>' +
      '<p>Has terminado el quiz de <strong>' + escaparHtml(quiz.titulo) + '</strong>.</p>' +
      '<ul class="datos">' +
        '<li>Aciertos: <strong>' + aciertos + '</strong></li>' +
        '<li>Fallos: <strong>' + (total - aciertos) + '</strong></li>' +
        '<li>Pistas usadas: <strong>' + pistas + '</strong></li>' +
        '<li>Tiempo: <strong>' + formatearTiempo(tiempoFinal) + '</strong></li>' +
      '</ul>' +
    '</div>' +
    '<div class="columnas">' +
      '<section class="panel">' +
        '<h2>Guardar marca</h2>' +
        '<form id="formGuardar">' +
          '<div class="campo">' +
            '<label for="nombreJugador">Tu nombre</label>' +
            '<input id="nombreJugador" name="nombre" type="text" maxlength="24" minlength="2" autocomplete="nickname" required>' +
          '</div>' +
          '<button class="boton" type="submit">Guardar en el ranking</button>' +
          '<p id="mensajeGuardado" class="aviso" hidden></p>' +
        '</form>' +
      '</section>' +
      '<section class="panel">' +
        '<h2>Mejores marcas</h2>' +
        '<ol id="topResultados" class="top"></ol>' +
      '</section>' +
    '</div>' +
    repaso +
    '<div class="acciones-resultado">' +
      '<button id="botonRepetir" class="boton" type="button">Repetir quiz</button>' +
      '<a class="boton boton--secundario" href="index.html">Volver al inicio</a>' +
      '<a class="boton boton--secundario" href="ranking.html?quiz=' + encodeURIComponent(quiz.id) + '">Ver ranking</a>' +
    '</div>'
  );
}

function guardarResultado(evento) {
  evento.preventDefault();

  const campo = document.getElementById('nombreJugador');
  const nombre = campo.value.trim().replace(/\s+/g, ' ');

  if (nombre.length < 2) {
    mostrarAviso('Escribe un nombre de al menos 2 caracteres.', true);
    campo.focus();
    return;
  }

  const resultado = guardarMarca(quiz.id, {
    nombre: nombre,
    aciertos: aciertos,
    total: preguntas.length,
    pistas: pistas,
    tiempo: tiempoFinal,
    fecha: new Date().toISOString()
  });

  if (!resultado.ok) {
    mostrarAviso('No se pudo guardar la marca.', true);
    return;
  }

  guardarNombre(nombre);
  pintarTop(nombre);

  if (resultado.estado === 'conservada') {
    mostrarAviso('Ya tenías una marca mejor con ese nombre.', false);
  } else {
    mostrarAviso('Marca guardada en el ranking.', false);
  }
}

function mostrarAviso(texto, esError) {
  const aviso = document.getElementById('mensajeGuardado');
  aviso.textContent = texto;
  aviso.hidden = false;
  aviso.className = esError ? 'aviso aviso--error' : 'aviso';
}

function pintarTop(nombreDestacado) {
  const lista = document.getElementById('topResultados');
  const marcas = ordenarMarcas(obtenerMarcas(quiz.id)).slice(0, 5);

  if (marcas.length === 0) {
    lista.innerHTML = '<li>Todavía no hay marcas guardadas.</li>';
    return;
  }

  lista.innerHTML = marcas.map(function (marca) {
    const clase = nombreDestacado && normalizarNombre(marca.nombre) === normalizarNombre(nombreDestacado)
      ? ' class="destacado"'
      : '';

    return '<li' + clase + '>' + escaparHtml(marca.nombre) + ': ' + marca.aciertos + '/' + marca.total + '</li>';
  }).join('');
}

function mostrarError(mensaje) {
  estadoCarga.hidden = true;
  juego.hidden = true;
  resultados.hidden = true;
  estadoError.hidden = false;
  errorDetalle.textContent = mensaje;
}

botonPista.addEventListener('click', mostrarPista);
botonConfirmar.addEventListener('click', confirmarRespuesta);

preguntaImagen.addEventListener('error', function () {
  preguntaMedia.hidden = true;
});

iniciar();
