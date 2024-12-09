// Función para obtener la ubicación del usuario
// Función para obtener la ubicación del usuario o usar una ubicación simulada
async function obtenerUbicacion() {
    
    try {
        console.log("Obteniendo ubicación...");
        const response = await fetch("https://ipapi.co/json/");
        console.log("Respuesta del API:", response);
        const data = await response.json();
        console.log("Datos obtenidos del API:", data);
        return data.country_code;  // Devuelve el código del país
        
    } catch (error) {
        console.error("Error obteniendo la ubicación:", error);
        return null;
    }
}

function obtenerZonaHoraria() {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("Zona horaria detectada:", timeZone);
    return timeZone;
}
function convertirHoraColombiaALocal(horaColombia) {
    console.log("Hora en Colombia recibida para conversión:", horaColombia);
    const zonaHorariaColombia = 'America/Bogota';
    const zonaHorariaUsuario = obtenerZonaHoraria();
    console.log("Zona horaria del usuario:", zonaHorariaUsuario);
    const horaColombiaDT = luxon.DateTime.fromFormat(horaColombia, 'hh:mm a', { zone: zonaHorariaColombia });
    console.log("Hora en formato Luxon para Colombia:", horaColombiaDT.toISO());
    // Convertir a la hora local del usuario
    const horaLocal = horaColombiaDT.setZone(zonaHorariaUsuario);
    console.log("Hora convertida a hora local:", horaLocal.toLocaleString(luxon.DateTime.TIME_SIMPLE));

    return horaLocal.toLocaleString(luxon.DateTime.TIME_SIMPLE); // Formato como 10:00 AM
}

function convertirHoraLocalAColombia(horaLocal) {
    console.log("Hora local recibida para conversión a Colombia:", horaLocal);
    const zonaHorariaColombia = 'America/Bogota';
    const zonaHorariaUsuario = obtenerZonaHoraria();

    // Normaliza la hora local
    const normalizadaHoraLocal = horaLocal.trim(); // Elimina espacios innecesarios

    // Intenta convertir usando formatos compatibles
    let horaLocalDT = luxon.DateTime.fromFormat(normalizadaHoraLocal, 'HH:mm', { zone: zonaHorariaUsuario });

    if (!horaLocalDT.isValid) {
        console.warn("Formato 24h fallido, intentando con formato 12h (h:mm a)...");
        horaLocalDT = luxon.DateTime.fromFormat(normalizadaHoraLocal, 'h:mm a', { zone: zonaHorariaUsuario });
    }

    if (!horaLocalDT.isValid) {
        console.error('Hora local inválida:', normalizadaHoraLocal);
        return 'Invalid DateTime'; // Manejo del error
    }

    // Convertir a la zona horaria de Colombia
    const horaColombia = horaLocalDT.setZone(zonaHorariaColombia);

    // Forzar salida en formato 12 horas con AM/PM
    const horaFormateada = horaColombia.toFormat('h:mm a');
    console.log("Hora convertida a Colombia:", horaFormateada);

    return horaFormateada;
}



// Importar Firebase
import { ref, set, get, push } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";
import { preciosServicios } from './precios.js';
document.addEventListener("DOMContentLoaded", async function () {
    var reserveButton = document.getElementById('reserve-button');
    var timeSlotsEl = document.getElementById('time-slots');
    var selectedSlot = null;
    var selectedDate = null;  // Almacena la fecha seleccionada
   
    var servicio = window.servicioId;

    // Mostrar precio según ubicación
    if (!servicio || !preciosServicios[servicio]) {
        console.error("El servicio no está definido o no tiene precios en variables.js");
        return;
    }

    // Obtener precios del servicio actual
    var precioDolares = preciosServicios[servicio].dolares;
    var precioPesosColombianos = preciosServicios[servicio].pesosColombianos;
    var precioDolaresCanadienses = preciosServicios[servicio].dolaresCanadienses;
    

    
    

    var precioElemento = document.getElementById('precio-servicio');
    const countryCode = await obtenerUbicacion();

    if (countryCode === "CO") {
        precioElemento.innerText = `Valor: ${precioPesosColombianos} COP`;  // Mostrar en pesos colombianos
    } 
    else if (countryCode === "CA") {
        precioElemento.innerText = `Valor: ${precioDolaresCanadienses} CAD`;  // Mostrar en pesos colombianos
    }
    else {
        precioElemento.innerText = `Valor: ${precioDolares} USD`;  // Mostrar en dólares canadienses
    }

    // Validar nombre y correo
    const userNameInput = document.getElementById('user_name');
    const userEmailInput = document.getElementById('user_email');

    function validateForm() {
        const userName = userNameInput.value.trim();
        const userEmail = userEmailInput.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (userName && emailPattern.test(userEmail) && selectedSlot && selectedDate) {
            reserveButton.disabled = false;  // Habilitar solo si todo está bien
        } else {
            reserveButton.disabled = true;   // Mantener deshabilitado si falta algo
        }
    }

    userNameInput.addEventListener('input', validateForm);
    userEmailInput.addEventListener('input', validateForm);

    // Horarios disponibles
    var weekdayTimeSlots = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'];
    var saturdayTimeSlots = ['09:00 AM', '11:00 AM'];

    function renderTimeSlots(date) {
        console.log("Fecha seleccionada para horarios:", date);
        timeSlotsEl.innerHTML = '';
        
    
        var dayOfWeek = date.getDay();
        console.log("Día de la semana:", dayOfWeek);
        var slots = [];
    
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            slots = weekdayTimeSlots;
        } else if (dayOfWeek === 6) {
            slots = saturdayTimeSlots;
        } else {
            
            return;
        }
    
        consultarReservas(date, (reservasDelDia) => {
            
            console.log("Reservas del día consultadas:", reservasDelDia);
            // Convertir reservas a hora Colombia para hacer la comparación
            const horariosReservados = Object.values(reservasDelDia).map(reserva => reserva.horario);
            console.log("Horarios ya reservados:", horariosReservados);

            // Filtrar los horarios disponibles comparando con las reservas en hora Colombia
            const horariosNoReservados = slots.filter(slot => {
                const slotNormalized = slot.replace(/^0/, ''); // Remueve el cero inicial si existe
                return !horariosReservados.some(reserva => {
                    const reservaNormalized = reserva.replace(/^0/, ''); // Normaliza las reservas también
                    return reservaNormalized === slotNormalized;
                    
                });
            });
            console.log("Horarios disponibles:", horariosNoReservados);
            
            
            horariosNoReservados.forEach(function (slot) {
                const horaLocal = convertirHoraColombiaALocal(slot); // Mostrar hora local al usuario
    
                const button = document.createElement('button');
                button.innerText = `${horaLocal}`; 
                button.classList.add('time-slot-btn');
    
                button.onclick = function () {
                    if (selectedSlot) {
                        selectedSlot.classList.remove('selected');
                    }
                    button.classList.add('selected');
                    selectedSlot = button;
    
                   
                    reserveButton.style.display = 'block';
                    validateForm();
                };
    
                timeSlotsEl.appendChild(button);
            });
        });
    
        document.getElementById('time-slots').style.display = 'block';
    }
    
          
    // Manejar la reserva al hacer clic en el botón de reservar
    reserveButton.onclick = function () {
        if (selectedSlot && selectedDate) {
            const userName = userNameInput.value.trim();
            const userEmail = userEmailInput.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
            if (!userName || !emailPattern.test(userEmail)) {
                alert('Por favor, completa tu nombre y un correo válido.');
                return;
            }
    
            const formattedDate = selectedDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).toLowerCase(); // Formatear en español antes de guardar
            console.log("Reserva activada...");
            console.log("Usuario seleccionado:", userNameInput.value);
            console.log("Correo del usuario:", userEmailInput.value);
            console.log("Fecha seleccionada:", selectedDate);
            console.log("Horario seleccionado:", selectedSlot ? selectedSlot.innerText : "Ninguno");
            const horaLocal = selectedSlot.innerText;  // Hora local seleccionada
           
            const horaColombia = convertirHoraLocalAColombia(horaLocal);
            console.log("Hora en Colombia:", horaColombia);
            const horaInicio = convertirHora24(horaColombia);
         
            const horaFin = calcularHoraFin(horaInicio); // Suma las dos horas
           
            // Llamar a la función para agregar la reserva a Firebase con la hora de Colombia
            
              // Convertir la hora local a la hora de Colombia
            agregarReserva(formattedDate, horaColombia);  // Guardar la hora de Colombia en Firebase

            // Llamar a la función de enviar correo con la hora local (para mostrar al usuario)
            enviarCorreoReserva(formattedDate, horaLocal, countryCode, precioDolares, precioPesosColombianos, precioDolaresCanadienses);
            // Enviar los detalles al servidor para agregar el evento al calendario de Google
            fetch('https://vibrandomm.com/agregar-evento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha: selectedDate.toISOString().split('T')[0],
                    horaInicio: `${horaInicio}:00`, // Agregar segundos para que sea HH:MM:SS
                    horaFin: `${horaFin}:00`, // Agregar segundos
                    resumen: `Consulta de ${userName}`,
                    descripcion: `Reserva realizada por ${userName}, correo: ${userEmail}, servicio ${window.servicioId}`
                }),
            })
            .then(response => {
                console.log("Respuesta del servidor al enviar evento:", response);
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                console.log("Datos procesados del servidor:", data);
                alert('¡Reserva exitosa, recibirás un correo con información detallada de tu cita!');
            })
            .catch(error => {
                console.error('Error al reservar:', error);
                alert('Error al realizar la reserva.');
            });
        } else {
            alert('Por favor selecciona un horario y una fecha antes de reservar.');
        }
    };
    
    
            

    // Iniciar Flatpickr y configurar idioma a español
    flatpickr("#datepicker", {
        inline: true,
        minDate: "today",
        locale: "es",  // Cambiar el calendario a español
        disable: [function (date) {
            return (date.getDay() === 0); // Deshabilitar domingos
        }],
        onChange: function (selectedDates) {
            selectedDate = selectedDates[0];  // Guardar la fecha seleccionada
            
            renderTimeSlots(selectedDate);
            validateForm();  // Asegurar que la validación se actualice
        }
    });flatpickr("#datepicker", {
        inline: true,
        minDate: "today",
        maxDate: new Date().fp_incr(60),
        locale: "es",  // Cambiar el calendario a español
        disable: [function (date) {
            const today = new Date();
            const diffInMilliseconds = date.getTime() - today.getTime();
            const diffInHours = diffInMilliseconds / 1000 / 60 / 60;
            return date.getDay() === 0 || diffInHours < 24; // Deshabilitar domingos y fechas con menos de 24 horas
        }],
        onChange: function (selectedDates) {
            selectedDate = selectedDates[0];  // Guardar la fecha seleccionada
           
            renderTimeSlots(selectedDate);
            validateForm();  // Asegurar que la validación se actualice
        }
    });
});

// Función para calcular la hora de fin (2 horas después de la hora de inicio)
function calcularHoraFin(horaInicio) {
    
    let [hour, minute] = horaInicio.split(":"); 
    hour = parseInt(hour);
    hour += 2; // Sumar dos horas

    if (hour >= 24) {
        hour -= 24; // Ajustar si supera las 24 horas
    }

    return `${hour < 10 ? '0' : ''}${hour}:${minute}`;
}

function convertirHora24(horaAMPM) {
    let [hour, minute, period] = horaAMPM.split(/[: ]/);
    hour = parseInt(hour);
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour < 10 ? '0' : ''}${hour}:${minute}`; // Retorna en formato 24h
}


// Firebase - Consultar reservas y agregar nuevas
import { db } from './firebase.js';

function agregarReserva(fecha, horario) {
    // Ya no necesitas convertir fecha, solo la usas directamente
    const userName = document.getElementById('user_name').value.trim();
    const userEmail = document.getElementById('user_email').value.trim();
    const reservasRef = ref(db, 'reservas/' + fecha);
    const nuevaReserva = push(reservasRef);
    console.log("Agregando reserva...");
    console.log("Fecha:", fecha);
    console.log("Horario:", horario);
   

    set(nuevaReserva, {
        horario: horario,
        reservado: true,
        nombreUsuario: userName,
        correoUsuario: userEmail
    }).then(() => {
        console.log("Reserva guardada exitosamente en Firebase.");
    }).catch((error) => {
        console.error("Error al guardar la reserva en Firebase:", error);
    });
}



function consultarReservas(date, callback) {
    const formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).toLowerCase();

  

    const reservasRef = ref(db, 'reservas/' + formattedDate);
    get(reservasRef).then((snapshot) => {
        const reservasDelDia = snapshot.val();
       
        callback(reservasDelDia || {});  // Enviar las reservas sin conversiones
    }).catch((error) => {
        console.error("Error consultando reservas:", error);
    });
}



// Enviar correo de confirmación
function enviarCorreoReserva(fecha, horario, countryCode, precioDolares, precioPesosColombianos, precioDolaresCanadienses) {
    console.log("Preparando envío de correo...");
    console.log("Fecha:", fecha);
    console.log("Horario:", horario);
    console.log("Country Code:", countryCode);
    const userName = document.getElementById('user_name').value;
    const userEmail = document.getElementById('user_email').value;
    const selectedService = window.servicioId;
    const fromName = "VibrandOmm"
    const metodosPago = {
        CO: "Nequi: 3102261387, Bancolombia: Ahorros , PayPal: d.pipe11@gmail.com",
        CA: "e-Transfer: elita-96@hotmail.com, PayPal: d.pipe11@gmail.com",
        default: "PayPal: d.pipe11@gmail.com"
    };
    let precio = '';
    let metodos = metodosPago.default;  // Método por defecto
    if (countryCode === "CO") {
        precio = `${precioPesosColombianos} COP`;  // Usa la variable local para pesos colombianos
        metodos = metodosPago.CO;
    } else if (countryCode === "CA") {
        precio = `${precioDolaresCanadienses} CAD`;  // Usa la variable local para dólares canadienses
        metodos = metodosPago.CA;
    } else {
        precio = `${precioDolares} USD`;  
    }
    console.log(precio);
    const templateParams = {
        from_name: fromName,
        nombre: userName,
        email: userEmail,
        fecha: fecha,
        horario: horario,
        servicio: selectedService,
        precio: precio,
        metodos: metodos
    };

    console.log("Parámetros enviados al correo:", templateParams);

    // Verificar si el servicio es "sesionGratis" para usar un template distinto
    let templateId;
    if (selectedService === "Sesión Gratis") {
        templateId = "template_rsx9hxn"; // Cambia esto al ID de tu template de sesión gratis
    } else {
        templateId = "template_5yhmi6p"; // Template actual
    }

    emailjs.send("service_fysygrr", templateId, templateParams)
        .then(function (response) {
            console.log("Correo enviado exitosamente:", response);
        }, function (error) {
            console.error('Error al enviar correo:', error);
        });
}
