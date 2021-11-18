// JavaScript source code

/* ---- Add click event on .accordion elements to open/close contents ---- */
const accordionList = document.querySelectorAll(".accordion");
function toggleAccordion() {
    /* Toggle between adding and removing the "accordion-active" class, to highlight the button that controls the panel */
    this.classList.toggle("accordion-active");

    /* Toggle between hiding and showing the active panel */
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {    // max height is not 0
        /* First disable transitions and return the max-height to the panel's scroll height */
        panel.style.transition = "none";
        panel.style.maxHeight = panel.scrollHeight + "px";
        /* Then, after a 10ms delay, re-enable transitions and set the height to 0 to allow a smooth scroll down to 0 */
        setTimeout(function () {
            panel.style.transition = "";
            panel.style.maxHeight = null;
        }, 10);
    } else {                        // max height is 0
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}
function allowResizing() {
    /* Set the maxHeight property of the accordion panel to a larger number to allow dynamic resizing */
    if (this.style.maxHeight) {
        this.style.maxHeight = "9999px";
    }
}
accordionList.forEach(function (accordion) {
    accordion.addEventListener("click", toggleAccordion, false);    // Open the accordion
    var panel = accordion.nextElementSibling;
    panel.addEventListener("transitionend", allowResizing, false);  // After it's opened, set the max-height higher
});

/* ---- Add a click event on .card elements while allowing embedded links to also be clickable ---- */
const cardList = document.querySelectorAll(".clickable-card");
function addCardClickEvent(card) {
    // prevent double event triggering on links inside the card
    var clickableElements = Array.from(card.querySelectorAll(".clickable-card-link"));
    clickableElements.forEach((ele) => ele.addEventListener("click", (e) => e.stopPropagation()));

    // add a click event to the whole card
    var cardDest = card.querySelector(".clickable-card-dest");
    card.addEventListener("click", function () {
        var noTextSelected = !window.getSelection().toString();
        if (noTextSelected) {   // allow text highlighting without triggering redirect
            cardDest.click();
        }
    });
}
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

/* ---- Add click event to .carousel-container navigation arrows to scroll carousel on mousedown ---- */
var carouselList = document.querySelectorAll(".carousel-container");
var scrollSpeed = 10;
var scrolling = false;
function scrollCarousel(element, leftScroll) {
    const maxScroll = element.scrollWidth - element.clientWidth;
    var travelDistance = leftScroll ? -scrollSpeed : scrollSpeed;
    element.scrollLeft += travelDistance;
    if (scrolling && element.scrollLeft > 0 && element.scrollLeft < maxScroll ) {
        window.requestAnimationFrame(function () {
            scrollCarousel(element, leftScroll);
        });
    }
}
carouselList.forEach(function (carousel) {
    var carouselLeftArrow = carousel.querySelector(".carousel-left-arrow");
    var carouselRightArrow = carousel.querySelector(".carousel-right-arrow");
    var carouselCardContainer = carousel.querySelector(".carousel-card-container");
    if (carouselLeftArrow && carouselCardContainer) {
        carouselLeftArrow.addEventListener("mousedown", function () {
            scrolling = true;
            window.requestAnimationFrame(function () {
                scrollCarousel(carouselCardContainer, true);
            });
        });
    }
    if (carouselRightArrow && carouselCardContainer) {
        carouselRightArrow.addEventListener("mousedown", function () {
            scrolling = true;
            window.requestAnimationFrame(function () {
                scrollCarousel(carouselCardContainer, false);
            });
        });
    }
    document.addEventListener("mouseup", () => {
        scrolling = false;
    });
});



/* ---- Add click event to .copyable-text elements to copy contents to clipboard ---- */
const copyableElements = document.querySelectorAll(".copyable-text");
function copyContentsToClipboard() {
    // Create a range and set it to the contents of this .copyable-text element
    const range = document.createRange();
    range.setStart(this, 0);
    range.setEnd(this, 1);

    // Create a selection from this range
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        // Copy the selection to the clipboard
        document.execCommand("copy");
        selection.removeAllRanges();

        // Display the Copied! popup if successful
        const popup = this.querySelector(".copyable-popup");
        popup.classList.add("copyable-popup-active");
        setTimeout(() => {
            popup.classList.remove("copyable-popup-active");
        }, 1200);
    } catch (e) {
        // Do nothing on failure
    }
}
copyableElements.forEach(function (ele) {
    ele.addEventListener("click", copyContentsToClipboard, false);
});
