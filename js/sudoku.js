var sudokuBoard = document.getElementById("sudoku-board");
var boardData;

var cellInputSelection = -1;    /* currently selected cell */
var digitInputSelection = -1;   /* currently selected digit button */
var digitInputIsLocked = false; /* currently selected digit is locked */
var digitInputIsSolution = true;/* (true): digit input treated as solution, (false): digit input treated as candidate toggle */

function cellFromIndex(index) {
    if (index < 0 || index > 80) return null;
    let id = ((index < 10) ? "0" : "") + index.toString();
    return sudokuBoard.querySelector("[id='" + id + "']");
}
function digitButtonFromIndex(index) {
    if (index < 0 || index > 9) return null;
    let id = "digitInput" + index.toString();
    return document.getElementById(id);
}

/* ----------------- document handlers ----------------- */

document.addEventListener("click", function (e) {
    let clickIsOutsideBoard = !e.composedPath().some((obj) => { return (obj instanceof Element) ? obj.classList.contains("cell") : false; });
    let clickIsOutsideDigits = !e.target.classList.contains("digit-button");
    if (clickIsOutsideBoard && cellInputSelection !== -1) {
        /* deselect the selected cell */
        deselectCell(cellFromIndex(cellInputSelection));
    }
    if (clickIsOutsideDigits && digitInputSelection !== -1) {
        /* deselect the selected digit input button */
        if (!digitInputIsLocked) deselectDigitButton(digitButtonFromIndex(digitInputSelection));
    }
});

/* ----------------- sudokuBoard handlers ----------------- */

function sudokuBoardHandleKey(e) {
    const tabKeys = ["Tab", "Enter", " "];
    const backKeys = ["Backspace", "Delete"];
    const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

    let index = parseInt(e.target.id, 10);
    if (tabKeys.includes(e.key)) {
        /* tab forward or backward to a sequential cell */
        e.preventDefault();
        let newIndex = e.shiftKey ? index - 1 : (index + 1) % 81;
        if (newIndex < 0) newIndex = 80;
        cellFromIndex(newIndex).select();
    } else if (backKeys.includes(e.key)) {
        /* delete input and tab backward */
        let newIndex = index - 1;
        if (newIndex < 0) newIndex = 80;
        cellFromIndex(newIndex).select();
    } else if (arrowKeys.includes(e.key)) {
        /* navigate to an adjacent cell */
        e.preventDefault();
        let newIndex = index;
        let allowNav = true;
        switch (e.key) {
            case "ArrowUp": newIndex -= 9; break;
            case "ArrowDown": newIndex += 9; break;
            case "ArrowLeft":
                newIndex -= 1;
                if (Math.floor(index / 9) !== Math.floor(newIndex / 9))
                    allowNav = false;
                break;
            case "ArrowRight":
                newIndex += 1;
                if (Math.floor(index / 9) !== Math.floor(newIndex / 9))
                    allowNav = false;
                break;
        }
        if (allowNav && newIndex >= 0 && newIndex <= 80)
            cellFromIndex(newIndex).select();
    } else if (e.key === "Home") {
        /* navigate to the top left cell */
        e.preventDefault();
        let newIndex = 0;
        cellFromIndex(newIndex).select();
    } else if (e.key === "End") {
        /* navigate to the bottom right cell */
        e.preventDefault();
        let newIndex = 80;
        cellFromIndex(newIndex).select();
    } else if (e.key === "Escape") {
        /* deselect current cell */
        e.target.blur();
    } else if (e.key.length === 1 && /\D/.test(e.key) && !e.ctrlKey) {
        /* prevent invalid input from displaying */
        e.preventDefault();
    }
}

function sudokuBoardHandleClick(e) {
    if (e.target.tagName === "INPUT") {
        e.stopPropagation();    /* prevent document click handler from deselecting digit button */
        var cell = e.target;

        /* digit button is currently selected */
        if (digitInputSelection >= 0 && digitInputSelection <= 9) {
            /* enter selected digit value into this cell */
            cell.value = digitInputSelection === 0 ? "" : digitInputSelection.toString();
            if (!digitInputIsLocked) {
                /* deselect the digit input button */
                deselectDigitButton(digitButtonFromIndex(digitInputSelection));
                document.documentElement.style.cursor = "default";  /* change cursor immediately */
            }
            /* deselect the cell */
            deselectCell(cell);
        } else {
            /* highlight text in this cell */
            cell.select();
        }
    }
}

function autoTabCell(e) {
    if (e.target.value.length === 1) {
        if (e.target.value === '0') e.target.value = "";
        let index = parseInt(e.target.id, 10);
        let newIndex = (index + 1) % 81;
        cellFromIndex(newIndex).select();
    }
}

function selectCell(cell) {
    let index = parseInt(cell.id, 10);
    if (index >= 0 && index <= 80)
        cellInputSelection = index;
}

function deselectCell(cell) {
    cellInputSelection = -1;
}

/* prevent non-numeric input from displaying, handle tab presses */
sudokuBoard.addEventListener("keydown", sudokuBoardHandleKey);

/* enter digit input if selected, otherwise highlight text */
sudokuBoard.addEventListener("click", sudokuBoardHandleClick, true);

/* auto tab after a number is entered */
sudokuBoard.addEventListener("input", autoTabCell);

/* prevent invalid numeric input from displaying */
sudokuBoard.addEventListener("change", function (e) {
    if (e.target.value.length > 1) e.target.value = "";
});

/* save the selected cell when focused */
sudokuBoard.addEventListener("focusin", function (e) {
    if (e.target.tagName === "INPUT") {
        e.stopPropagation();
        selectCell(e.target);
    }
}, true);


/* ----------------- Digit input handlers ----------------- */

function selectDigitButton(button) {
    /* Add selected class to this button and allow hovering on the board */
    button.classList.add("digit-input-selected");
    sudokuBoard.classList.add("sudoku-board-hover");

    /* Remove locked class and locked property */
    button.classList.remove("digit-input-locked");
    digitInputIsLocked = false;

    /* Set the digit selection */
    let digit = parseInt(button.id.charAt(button.id.length - 1), 10);
    digitInputSelection = digit;
}

function lockDigitButton(button) {
    /* Add locked class and allow hovering on the board */
    button.classList.add("digit-input-locked");
    sudokuBoard.classList.add("sudoku-board-hover");

    /* Remove selected class */
    button.classList.remove("digit-input-selected");

    /* Set the digit selection */
    let digit = parseInt(button.id.charAt(button.id.length - 1), 10);
    digitInputSelection = digit;
    digitInputIsLocked = true;
}

function deselectDigitButton(button) {
    /* Remove selected and locked classes */
    button.classList.remove("digit-input-selected", "digit-input-locked");

    // Remove hovering from the board */
    sudokuBoard.classList.remove("sudoku-board-hover");

    /* Reset the digit selection */
    digitInputSelection = -1;
    digitInputIsLocked = false;
}

function digitInputHandleClick(e) {
    e.stopPropagation();    /* prevent document click handler from deselecting cell */
    let button = e.target;
    let digit = parseInt(button.id.charAt(button.id.length - 1), 10);

    /* cell is currently selected */
    if (cellInputSelection >= 0 && cellInputSelection <= 80) {

        /* if a different digit button is selected/locked, deselect it and select this button; otherwise set the cell's value */
        if (digitInputSelection >= 0 && digitInputSelection <= 9) {
            deselectDigitButton(digitButtonFromIndex(digitInputSelection));
            selectDigitButton(button);
        } else {
            cellFromIndex(cellInputSelection).value = digit === 0 ? "" : digit.toString();
        }
        /* deselect the cell*/
        deselectCell(cellFromIndex(cellInputSelection));
    }

    /* no cell is selected */
    else {
        /* cycle between (deselected -> selected -> locked), only one digit can be selected at a time */
        if (digit === digitInputSelection) {
            if (digitInputIsLocked) deselectDigitButton(button);/* button is locked */
            else lockDigitButton(button);                       /* button is selected */
        } else {                                                /* button is deselected */
            if (digitInputSelection !== -1) {                   /* a different button is selected/locked */
                var otherButton = digitButtonFromIndex(digitInputSelection);
                deselectDigitButton(otherButton);
            }
            selectDigitButton(button);
        }
    }
}

document.querySelectorAll(".digit-button").forEach(function (button) {
    button.addEventListener("click", digitInputHandleClick);
});







/* ----------------- Solve/Clear Buttons ----------------- */

function readBoardInput() {
    var array = Array(81).fill('0');
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        let index = parseInt(cell.id, 10);
        if (cell.value) array[index] = cell.value;
    });
    boardData = array.join('');
}

function fillBoard() {
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        let index = parseInt(cell.id, 10);
        if (boardData[index]) cell.value = boardData[index];
    });
}

function clearBoard() {
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        cell.value = "";
    });
    boardData = "";
}

function solveBoard() {
    /* Read data */
    readBoardInput();

    /* Solve */
    var instance = new Module.sudokuBoard();
    instance.fillData(boardData);
    console.log(boardData);
    instance.solve();

    /* Set data */
    boardData = instance.getData();
    instance.delete();

    /* Display data on board */
    fillBoard();
}

document.getElementById("solve-button").addEventListener("click", solveBoard);
document.getElementById("clear-button").addEventListener("click", clearBoard);