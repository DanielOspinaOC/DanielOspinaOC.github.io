// Función para obtener la ubicación del usuario
// Función para obtener la ubicación del usuario o usar una ubicación simulada
async function obtenerUbicacion() {
    
    try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        return data.country_code;  // Devuelve el código del país
        
    } catch (error) {
        console.error("Error obteniendo la ubicación:", error);
        return null;
    }
}

function obtenerZonaHoraria() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;  // Detectar automáticamente
}
function convertirHoraColombiaALocal(horaColombia) {
    const zonaHorariaColombia = 'America/Bogota';
    const zonaHorariaUsuario = obtenerZonaHoraria();

    const horaColombiaDT = luxon.DateTime.fromFormat(horaColombia, 'hh:mm a', { zone: zonaHorariaColombia });

    // Convertir a la hora local del usuario
    const horaLocal = horaColombiaDT.setZone(zonaHorariaUsuario);

    return horaLocal.toLocaleString(luxon.DateTime.TIME_SIMPLE); // Formato como 10:00 AM
}

function convertirHoraLocalAColombia(horaLocal) {
    const zonaHorariaColombia = 'America/Bogota';
    const zonaHorariaUsuario = obtenerZonaHoraria();

    // Asegúrate de que horaLocal esté en el formato correcto para la conversión
    const horaLocalDT = luxon.DateTime.fromFormat(horaLocal, 'h:mm a', { zone: zonaHorariaUsuario });

    // Verifica si el formato de hora local fue interpretado correctamente
    if (!horaLocalDT.isValid) {
        console.error('Hora local inválida:', horaLocal);
        return 'Invalid DateTime'; // Manejamos el error aquí
    }

    // Convertir a la zona horaria de Colombia
    const horaColombia = horaLocalDT.setZone(zonaHorariaColombia);

    return horaColombia.toLocaleString(luxon.DateTime.TIME_SIMPLE); // Regresar la hora en formato 12 horas (AM/PM)
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
        timeSlotsEl.innerHTML = '';
        
    
        var dayOfWeek = date.getDay();
        var slots = [];
    
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            slots = weekdayTimeSlots;
        } else if (dayOfWeek === 6) {
            slots = saturdayTimeSlots;
        } else {
            
            return;
        }
    
        consultarReservas(date, (reservasDelDia) => {
            
    
            // Convertir reservas a hora Colombia para hacer la comparación
            const horariosReservados = Object.values(reservasDelDia).map(reserva => reserva.horario);
            
            // Filtrar los horarios disponibles comparando con las reservas en hora Colombia
            const horariosNoReservados = slots.filter(slot => {
                const slotNormalized = slot.replace(/^0/, ''); // Remueve el cero inicial si existe
                return !horariosReservados.some(reserva => {
                    const reservaNormalized = reserva.replace(/^0/, ''); // Normaliza las reservas también
                    return reservaNormalized === slotNormalized;
                });
            });
            
            
            
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
            
            const horaLocal = selectedSlot.innerText;  // Hora local seleccionada
           
            const horaColombia = convertirHoraLocalAColombia(horaLocal);
          
            const horaInicio = convertirHora24(horaColombia);
         
            const horaFin = calcularHoraFin(horaInicio); // Suma las dos horas
           
            // Llamar a la función para agregar la reserva a Firebase con la hora de Colombia
            
              // Convertir la hora local a la hora de Colombia
            agregarReserva(formattedDate, horaColombia);  // Guardar la hora de Colombia en Firebase

            // Llamar a la función de enviar correo con la hora local (para mostrar al usuario)
            enviarCorreoReserva(formattedDate, horaLocal, countryCode, precioDolares, precioPesosColombianos, precioDolaresCanadienses);
            // Enviar los detalles al servidor para agregar el evento al calendario de Google
            fetch('http://localhost:5501/agregar-evento', {
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
            .then(response => response.text())
            .then(data => {
              
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

   

    set(nuevaReserva, {
        horario: horario,
        reservado: true,
        nombreUsuario: userName,
        correoUsuario: userEmail
    }).then(() => {
    
    }).catch((error) => {
     
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



    // Verificar si el servicio es "sesionGratis" para usar un template distinto
    let templateId;
    if (selectedService === "Sesión Gratis") {
        templateId = "template_rsx9hxn"; // Cambia esto al ID de tu template de sesión gratis
    } else {
        templateId = "template_5yhmi6p"; // Template actual
    }

    emailjs.send("service_fysygrr", templateId, templateParams)
        .then(function (response) {
       
        }, function (error) {
            console.error('Error al enviar correo:', error);
        });
}
