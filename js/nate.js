// JavaScript source code

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
