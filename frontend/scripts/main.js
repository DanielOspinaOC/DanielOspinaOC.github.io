document.addEventListener("DOMContentLoaded", function () {
    const footerContainer = document.querySelector('[include-html]');

    if (footerContainer) {
        const file = footerContainer.getAttribute("include-html");
        fetch(file)
            .then(response => {
                if (response.ok) return response.text();
                throw new Error(`Failed to load ${file}`);
            })
            .then(data => {
                footerContainer.innerHTML = data;
            })
            .catch(error => console.error("Error loading footer:", error));
    } else {
        console.error("Footer container not found.");
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const testimonios = document.querySelectorAll(".testimonio-item");
    let currentTestimonioIndex = 0;

    // Ocultar todos los testimonios y mostrar solo el primero al cargar la página
    testimonios.forEach((testimonio, index) => {
        testimonio.classList.toggle("active", index === currentTestimonioIndex);
    });

    // Función para mostrar el testimonio actual y ocultar los demás
    function showTestimonio(index) {
        testimonios.forEach((testimonio, i) => {
            testimonio.classList.toggle("active", i === index);
        });
    }

    // Flechas de navegación
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");

    // Evento para la flecha izquierda
    prevButton.addEventListener("click", function () {
        currentTestimonioIndex = (currentTestimonioIndex - 1 + testimonios.length) % testimonios.length;
        showTestimonio(currentTestimonioIndex);
    });

    // Evento para la flecha derecha
    nextButton.addEventListener("click", function () {
        currentTestimonioIndex = (currentTestimonioIndex + 1) % testimonios.length;
        showTestimonio(currentTestimonioIndex);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const headerContainer = document.getElementById("header-container");

    if (headerContainer) {
        fetch('../includes/header.html')
            .then(response => response.text())
            .then(data => {
                headerContainer.innerHTML = data;

                // Activar el menú hamburguesa después de cargar el header
                const menuToggle = document.querySelector(".menu-toggle");
                const mobileMenu = document.getElementById("mobileMenu");

                if (menuToggle && mobileMenu) {
                    menuToggle.addEventListener("click", function () {
                        mobileMenu.classList.toggle("menu-open");
                    });
                    
                    // Opcional: Cerrar el menú cuando se hace clic en el botón de cierre "X"
                    const closeMenu = document.querySelector(".close-menu");
                    if (closeMenu) {
                        closeMenu.addEventListener("click", function () {
                            mobileMenu.classList.remove("menu-open");
                        });
                    }
                } else {
                    console.error("menuToggle o mobileMenu no encontrado.");
                }
            })
            .catch(error => console.error("Error cargando el header:", error));
    } else {
        console.error("Contenedor header-container no encontrado.");
    }
});


