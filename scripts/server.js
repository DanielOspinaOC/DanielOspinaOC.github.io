const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser'); // Import body-parser
const calendar = google.calendar('v3');
const OAuth2 = google.auth.OAuth2;
const cors = require('cors');

const app = express();
const path = require('path');
const port = 5501;
const corsOptions = {
  origin: ['https://vibrandomm.com', 'https://www.vibrandomm.com'], // Dominios permitidos en producción
  methods: ['GET', 'POST']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
// Configura el cliente OAuth2 con tus credenciales
const oauth2Client = new OAuth2(
  '1029473679217-uecq0nnjqbor12fu2dju41vvedctsqd6.apps.googleusercontent.com',
  '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',
  'http://127.0.0.1:5501/oauth2callback'  // Cambia según el puerto y ruta de tu servidor
);

// Establecer credenciales (access_token y refresh_token)
oauth2Client.setCredentials({
  access_token: 'ya29.a0AcM612yRhC5aS2DcyDU2-wLZUude4hCjrpndD-f7kHHPHdSrmCRqPWvYUQ9Tf0Qyogf0UaO-ezd-5gaTYXa-7DiMczNn5m5SbtZE9iJmRPDIbWBz7MamsI6CGGQOgSBgt7EuolscdgSbn52Y_ngKUPhCNjlwcKfI8oC2imToaCgYKAUgSARESFQHGX2Mi6owpE1mxfN94BOMW-eSMIA0175',  // Coloca aquí tu access_token
  refresh_token: '1//01UjwRLIMo83sCgYIARAAGAESNwF-L9IrK5pzbPmZ1IlCPbwxQhBdwMb6ymUd2mfZSvYEajee3XciAyyh2EpaYq6n5aC8HgFpXqY',  // Coloca aquí tu refresh_token
  'https://vibrandomm.com/oauth2callback'
});



// Función para agregar evento al calendario
async function agregarEventoAlCalendario(fecha, horaInicio, horaFin, resumen, descripcion) {
  const event = {
    summary: resumen,
    description: descripcion,
    start: {
      dateTime: `${fecha}T${horaInicio}-05:00`,  // Asegúrate de que esté correctamente formateado
      timeZone: 'America/Bogota',
    },
    end: {
      dateTime: `${fecha}T${horaFin}-05:00`,  // Misma validación para la hora de fin
      timeZone: 'America/Bogota',
    },
  };
  

  try {
      const response = await calendar.events.insert({
          auth: oauth2Client,
          calendarId: 'primary',
          resource: event,
      });
     
  } catch (error) {
      console.error('Error al crear evento:', error);
  }
}


// Ruta para agregar un evento de ejemplo (puedes cambiar la fecha y horas)
app.post('/agregar-evento', (req, res) => {
  const { fecha, horaInicio, horaFin, resumen, descripcion } = req.body;

  if (!fecha || !horaInicio || !horaFin || !resumen || !descripcion) {
      return res.status(400).send('Faltan datos para crear el evento.');
  }

  agregarEventoAlCalendario(fecha, horaInicio, horaFin, resumen, descripcion);
  res.send('Intentando agregar evento al calendario...');
});


// Inicia el servidor en el puerto especificado
app.listen(port, () => {
  
});