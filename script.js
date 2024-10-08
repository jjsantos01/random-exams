let preguntasRespuestas = {};

function cargarPreguntas() {
  const input = document.getElementById('fileInput');
  const file = input.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      preguntasRespuestas = {};
      for (let i = 0; i < rows.length; i++) {
        const pregunta = rows[i][0];
        const opciones = rows[i].slice(1).filter(opcion => opcion != null);
        preguntasRespuestas[i + 1] = {
          pregunta: pregunta,
          opciones: opciones
        };
      }

      crearTablaPreguntas();
      const labelInput = document.getElementById('fileInputLabel');
      labelInput.textContent = file.name;
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Por favor, seleccione un archivo.');
  }
}

function crearTablaPreguntas() {
  const tablaDiv = document.getElementById('tablaPreguntas');
  tablaDiv.innerHTML = '';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headerRow = document.createElement('tr');
  const headerPregunta = document.createElement('th');
  headerPregunta.textContent = 'Pregunta';
  headerRow.appendChild(headerPregunta);

  const headerOpciones = document.createElement('th');
  headerOpciones.textContent = 'Opciones';
  headerRow.appendChild(headerOpciones);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (const [numPregunta, pregunta] of Object.entries(preguntasRespuestas)) {
    const row = document.createElement('tr');

    const cellPregunta = document.createElement('td');
    cellPregunta.textContent = pregunta.pregunta;
    row.appendChild(cellPregunta);

    const cellOpciones = document.createElement('td');
    cellOpciones.innerHTML = pregunta.opciones.join('<br>');
    row.appendChild(cellOpciones);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  tablaDiv.appendChild(table);
}

async function crearOpcionCirculo(opcion, sombreado) {
  const canvas = document.createElement('canvas');
  canvas.width = 20;
  canvas.height = 20;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(10, 10, 8, 0, 2 * Math.PI);
  ctx.fillStyle = sombreado ? '#D3D3D3' : '#FFFFFF';
  ctx.fill();
  ctx.stroke();
  ctx.font = '10px Arial';
  ctx.fillStyle = '#000000';
  ctx.fillText(opcion, 7, 14);
  return canvas;
}

async function generarExamenesYRespuestas(e) {
  e.preventDefault();
  if (Object.keys(preguntasRespuestas).length === 0) {
    alert('Por favor, cargue un archivo Excel con las preguntas antes de generar los exámenes.');
    return;
  }

  let numEstudiantes = 5; // Puedes ajustar esto o pedir al usuario que lo ingrese
  let numPreguntas = 10; // Puedes ajustar esto o pedir al usuario que lo ingrese

  // Get the number of questions
  const userInput = document.getElementById('numPreguntas').value;
  if (userInput) {
    numPreguntas = parseInt(userInput);
  }

  const { jsPDF } = window.jspdf;
  const pdfExamenes = new jsPDF();
  const pdfRespuestas = new jsPDF();
  const pdfHojaRespuestas = new jsPDF();

  const estudiantesInput = document.getElementById('estudiantesInput');
  const estudiantes = estudiantesInput.value.split('\n').filter(estudiante => estudiante.trim() !== '');

  for (let estudiante = 0; estudiante < estudiantes.length; estudiante++) {
    const preguntas = Object.entries(preguntasRespuestas).sort(() => Math.random() - 0.5).slice(0, numPreguntas);
    let yExamen = 10;
    let yRespuestas = 10;
    let yHojaRespuestas = 10;

    pdfExamenes.setFontSize(16);
    pdfExamenes.text(`Nombre: ${estudiantes[estudiante]}`, 10, yExamen);
    yExamen += 10;

    pdfRespuestas.setFontSize(16);
    pdfRespuestas.text(`Hoja de Respuestas - Examen ${estudiantes[estudiante]}`, 10, yRespuestas);
    yRespuestas += 15;

    pdfHojaRespuestas.setFontSize(16);
    pdfHojaRespuestas.text(`Hoja de Evaluación - Examen ${estudiantes[estudiante]}`, 10, yHojaRespuestas);
    yHojaRespuestas += 15;

    const opcionesRespuesta = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < preguntas.length; i++) {
      const [numPregunta, pregunta] = preguntas[i];
      const opciones = pregunta.opciones.slice();
      const respuestaCorrecta = opciones[0];
      opciones.sort(() => Math.random() - 0.5);

      pdfExamenes.setFontSize(12);
      const preguntaDividida = pdfExamenes.splitTextToSize(`${i + 1}. ${pregunta.pregunta}`, 180);
      pdfExamenes.text(preguntaDividida, 10, yExamen);
      yExamen += preguntaDividida.length * 7;

      for (let j = 0; j < opciones.length; j++) {
        const opcionDividida = pdfExamenes.splitTextToSize(`    ${String.fromCharCode(65 + j)}) ${opciones[j]}`, 180);
        pdfExamenes.text(opcionDividida, 10, yExamen);
        yExamen += opcionDividida.length * 7;
      }
      yExamen += 5;

      const opcionesCanvas = await Promise.all(opcionesRespuesta.map(async (letra, index) => {
        const sombreado = opciones[index] === respuestaCorrecta;
        return crearOpcionCirculo(letra, sombreado);
      }));

      const opcionesCanvasHoja = await Promise.all(opcionesRespuesta.map(async (letra, index) => {
        return crearOpcionCirculo(letra, false);
      }));

      pdfRespuestas.setFontSize(12);
      pdfRespuestas.text(`${i + 1}`, 10, yRespuestas - 5);

      pdfHojaRespuestas.setFontSize(12);
      pdfHojaRespuestas.text(`${i + 1}`, 10, yHojaRespuestas - 5);

      for (let k = 0; k < opcionesCanvas.length; k++) {
        const imgData = opcionesCanvas[k].toDataURL('image/png');
        pdfRespuestas.addImage(imgData, 'PNG', 20 + (k * 20), yRespuestas - 12, 10, 10);
        const imgDataHoja = opcionesCanvasHoja[k].toDataURL('image/png');
        pdfHojaRespuestas.addImage(imgDataHoja, 'PNG', 20 + (k * 20), yHojaRespuestas - 12, 10, 10);
      }

      yRespuestas += 20;
      yHojaRespuestas += 20;

      if (yExamen > 270) {
        pdfExamenes.addPage();
        yExamen = 10;
      }
      if (yRespuestas > 270) {
        pdfRespuestas.addPage();
        yRespuestas = 10;
      }
      if (yHojaRespuestas > 270) {
        pdfHojaRespuestas.addPage();
        yHojaRespuestas = 10;
      }
    }

    if (estudiante < estudiantes.length - 1) {
      pdfExamenes.addPage();
      pdfRespuestas.addPage();
      pdfHojaRespuestas.addPage();
    }
  }

  pdfExamenes.setProperties({ title: 'Exámenes' })
  pdfRespuestas.setProperties({ title: 'Respuestas' })
  pdfHojaRespuestas.setProperties({ title: 'Hoja de evaluación' })

  const pdfExamenesBlob = pdfExamenes.output('blob');
  const pdfRespuestasBlob = pdfRespuestas.output('blob');
  const pdfHojaRespuestasBlob = pdfHojaRespuestas.output('blob');

  const examenesUrl = URL.createObjectURL(pdfExamenesBlob);
  const respuestasUrl = URL.createObjectURL(pdfRespuestasBlob);
  const hojaRespuestasUrl = URL.createObjectURL(pdfHojaRespuestasBlob);

  const examenesIframe = document.createElement('iframe');
  examenesIframe.src = examenesUrl;
  examenesIframe.width = '100%';
  examenesIframe.height = '500px';
  examenesIframe.title = 'Examenes';

  const respuestasIframe = document.createElement('iframe');
  respuestasIframe.src = respuestasUrl;
  respuestasIframe.width = '100%';
  respuestasIframe.height = '500px';
  respuestasIframe.title = 'Respuestas';

  const hojaRespuestasIframe = document.createElement('iframe');
  hojaRespuestasIframe.src = hojaRespuestasUrl;
  hojaRespuestasIframe.width = '100%';
  hojaRespuestasIframe.height = '500px';
  hojaRespuestasIframe.title = 'Hoja de Respuestas';

  const pdfContainer = document.getElementById('pdfContainer');
  pdfContainer.innerHTML = '';
  pdfContainer.appendChild(examenesIframe);
  pdfContainer.appendChild(respuestasIframe);
  pdfContainer.appendChild(hojaRespuestasIframe);
}

function setupCollapsibleSections() {
  const collapsibles = document.querySelectorAll('.collapsible-header');

  collapsibles.forEach(header => {
      header.addEventListener('click', function() {
          this.classList.toggle('active');
          const content = this.nextElementSibling;

          if (content.style.maxHeight) {
              content.style.maxHeight = null;
          } else {
              content.style.maxHeight = content.scrollHeight + "px";
          }
      });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('preguntasForm');
  const fileInput = document.getElementById('fileInput');
  form.addEventListener('submit', generarExamenesYRespuestas);
  fileInput.addEventListener('change', cargarPreguntas);
  setupCollapsibleSections();
} );
