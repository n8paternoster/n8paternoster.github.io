// JavaScript source code


/* ---- Open and close accordion panel (coursework.html) ---- */
function toggleAccordion(element) {

    /* Toggle between adding and removing the "accordion-active" class, to highlight the button that controls the panel */
    element.classList.toggle("accordion-active");

    /* Toggle between hiding and showing the active panel */
    var panel = element.nextElementSibling;
    if (panel.style.maxHeight) {    // max height is not 0
        panel.style.maxHeight = null;
    } else {                        // max height is 0
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}

/* ---- Make card elements clickable while allowing embedded links to also be clickable ---- */
var cardList = document.querySelectorAll(".clickable-card");
cardList.forEach(function (card) {

    // prevent double event triggering on links inside the card
    var clickableElements = Array.from(card.querySelectorAll(".card-link"));
    clickableElements.forEach((ele) => ele.addEventListener("click", (e) => e.stopPropagation()));

    // add a click event to the whole card
    var cardDest = card.querySelector(".card-dest");
    card.addEventListener("click", function () {
        var noTextSelected = !window.getSelection().toString();
        if (noTextSelected) {   // allow text highlighting without triggering redirect
            cardDest.click();
        }
    });
});