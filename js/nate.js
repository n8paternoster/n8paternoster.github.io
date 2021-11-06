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

/* ---- Add a click event to a card ---- */
function addCardClickEvent(card) {

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
}

/* ---- Make card elements clickable while allowing embedded links to also be clickable ---- */
const cardList = document.querySelectorAll(".clickable-card");
cardList.forEach(addCardClickEvent);

/* ---- For carousel cards, change behavior depending on device:
 *          (1) Device with hover capability (computers):
 *                  Make the card element clickable while allowing embedded links
 *          (2) Device without hover capability (mobile devices)
 *                  Slide card up on click and display link to card's destination
 */
const ccardList = document.querySelectorAll(".carousel-card");
const isHoverableDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (isHoverableDevice) {
    ccardList.forEach(addCardClickEvent);
} else {
    ccardList.forEach(function (ccard) {
        ccard.addEventListener("click", function () {
            // add the active class to this carousel card
            this.classList.toggle("carousel-card-active");
            var isActive = this.classList.contains("carousel-card-active");
            if (this.classList.contains("carousel-card-shifted"))
                this.classList.remove("carousel-card-shifted");

            // remove the active class from all other carousel cards
            var sibling = this.parentNode.firstElementChild;
            while (sibling) {
                if (sibling !== this) {
                    if (sibling.classList.contains("carousel-card-active"))
                        sibling.classList.remove("carousel-card-active");
                }
                sibling = sibling.nextElementSibling;
            }

            // shift all left carousel cards back
            var leftSibling = this.parentNode.firstElementChild;
            while (leftSibling && leftSibling !== this) {
                if (leftSibling.classList.contains("carousel-card-shifted"))
                    leftSibling.classList.remove("carousel-card-shifted");
                leftSibling = leftSibling.nextElementSibling;
            }

            // shift all right carousel cards if the current card is active
            var rightSibling = this.nextElementSibling;
            while (rightSibling) {
                if (!isActive && rightSibling.classList.contains("carousel-card-shifted"))
                    rightSibling.classList.remove("carousel-card-shifted");
                else rightSibling.classList.add("carousel-card-shifted");
                rightSibling = rightSibling.nextElementSibling;
            }
        });
    });
}

/* ---- Add click event to .copyable-text elements to copy contents to clipboard ---- */
const copyableElements = document.querySelectorAll(".copyable-text");
copyableElements.forEach(ele => {
    ele.addEventListener("click", () => {
        // Create a range and set it to the contents of this .copyable-text element
        const range = document.createRange();
        range.setStart(ele, 0);
        range.setEnd(ele, 1);

        // Create a selection from this range
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            // Copy the selection to the clipboard
            document.execCommand("copy");
            selection.removeAllRanges();
            // Display the Copied! popup if successful
            const popup = ele.querySelector(".copyable-popup");
            popup.classList.add("copyable-popup-active");
            setTimeout(() => {
                popup.classList.remove("copyable-popup-active");
            }, 1200);
        } catch (e) {
            // Do nothing on failure
        }
    });
});
