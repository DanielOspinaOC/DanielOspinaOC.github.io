document.addEventListener("DOMContentLoaded", () => {
    const questions = document.querySelectorAll(".faq-question");
    const answers = document.querySelectorAll(".faq-answer");
    
        questions.forEach((question, index) => {
            question.addEventListener("click", () => {
                // Ocultar todas las respuestas menos la seleccionada
                answers.forEach((answer, answerIndex) => {
                    if (answerIndex === index) {
                        answer.style.display = answer.style.display === "block" ? "none" : "block";
                    } else {
                        answer.style.display = "none";
                    }
                });
            });
        });
    });
    
