'use strict';

const CATALOGO = [
  { id: 'ciencias', archivo: 'ciencias.json' },
  { id: 'cultura', archivo: 'cultura.json' },
  { id: 'historia', archivo: 'historia.json' },
  { id: 'arte', archivo: 'arte.json' }
];

const PREGUNTAS_POR_PARTIDA = 10;
const CLAVE_RANKING = 'quizCultural.ranking.v1';
const CLAVE_NOMBRE = 'quizCultural.ultimoNombre';

function cargarJSON(archivo) {
  return fetch(archivo).then(function (respuesta) {
    if (!respuesta.ok) {
      throw new Error('No se pudo cargar ' + archivo + '.');
    }
    return respuesta.json();
  });
}

function cargarCatalogo() {
  return Promise.all(CATALOGO.map(function (item) {
    return cargarJSON(item.archivo).then(function (datos) {
      return {
        id: item.id,
        datos: datos
      };
    });
  }));
}

function ayudaCarga() {
  if (window.location.protocol === 'file:') {
    return 'Abre el proyecto con Live Server de VS Code.';
  }
  return 'Comprueba que los archivos JSON están en la misma carpeta.';
}

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, function (caracter) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[caracter];
  });
}

function mezclar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporal = copia[i];
    copia[i] = copia[j];
    copia[j] = temporal;
  }
  return copia;
}

function formatearTiempo(segundos) {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return String(minutos).padStart(2, '0') + ':' + String(resto).padStart(2, '0');
}

function formatearFecha(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) {
    return '-';
  }
  return valor.toLocaleDateString('es-ES');
}

function normalizarNombre(nombre) {
  return String(nombre).trim().replace(/\s+/g, ' ').toLowerCase();
}

function leerRanking() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_RANKING));
    return datos && typeof datos === 'object' ? datos : {};
  } catch (error) {
    return {};
  }
}

function guardarRanking(ranking) {
  try {
    localStorage.setItem(CLAVE_RANKING, JSON.stringify(ranking));
    return true;
  } catch (error) {
    return false;
  }
}

function obtenerMarcas(quizId) {
  const ranking = leerRanking();
  return Array.isArray(ranking[quizId]) ? ranking[quizId] : [];
}

function compararMarcas(a, b) {
  const totalA = Number(a.total) || 10;
  const totalB = Number(b.total) || 10;
  const diferencia = (Number(b.aciertos) / totalB) - (Number(a.aciertos) / totalA);

  if (diferencia !== 0) {
    return diferencia;
  }
  if (Number(a.pistas) !== Number(b.pistas)) {
    return Number(a.pistas) - Number(b.pistas);
  }
  return Number(a.tiempo) - Number(b.tiempo);
}

function ordenarMarcas(marcas) {
  return marcas.slice().sort(compararMarcas);
}

function mejorMarca(quizId) {
  const marcas = ordenarMarcas(obtenerMarcas(quizId));
  return marcas.length ? marcas[0] : null;
}

function guardarMarca(quizId, marca) {
  const lista = obtenerMarcas(quizId);
  const nombre = normalizarNombre(marca.nombre);
  const indice = lista.findIndex(function (item) {
    return normalizarNombre(item.nombre) === nombre;
  });

  let estado = 'nueva';

  if (indice === -1) {
    lista.push(marca);
  } else if (compararMarcas(marca, lista[indice]) < 0) {
    lista[indice] = marca;
    estado = 'mejorada';
  } else {
    estado = 'conservada';
  }

  lista.sort(compararMarcas);

  const ranking = leerRanking();
  ranking[quizId] = lista.slice(0, 100);

  return {
    ok: guardarRanking(ranking),
    estado: estado,
    marcas: ranking[quizId]
  };
}

function borrarTodoElRanking() {
  try {
    localStorage.removeItem(CLAVE_RANKING);
    return true;
  } catch (error) {
    return false;
  }
}

function obtenerNombreGuardado() {
  try {
    return localStorage.getItem(CLAVE_NOMBRE) || '';
  } catch (error) {
    return '';
  }
}

function guardarNombre(nombre) {
  try {
    localStorage.setItem(CLAVE_NOMBRE, nombre);
  } catch (error) {}
}
