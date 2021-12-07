var sudokuBoard = document.getElementById("sudoku-board");
var boardData;

var cellInputSelection = -1;    /* currently selected cell */
var digitInputSelection = -1;   /* currently selected digit button */
var digitInputIsLocked = false; /* currently selected digit is locked */
var digitInputIsSolution = true;/* (true): digit input treated as solution, (false): digit input treated as candidate toggle */

const savedPuzzles = new Map([
    ["Custom", "000000000000000000000000000000000000000000000000000000000000000000000000000000000"],
    ["Easy Example", "270306009040015027008090400750000004029000760800000092002030500190650040600204018"],
    ["Medium Example", "002608100000143000030000060097804520100000008085706910020000030000279000004301700"],
    ["Hard Example", "320000040004500200000000070075010068000409000280070310030000000008002100060000052"],
    ["Looooooooooooooooooong Example", "123456789123456789123456789123456789123456789123456789123456789123456789123456789"]
]);

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

document.addEventListener("DOMContentLoaded", function (e) {
    /* add saved puzzles to puzzle select */
    var select = document.getElementById("puzzle-select");
    savedPuzzles.forEach(function (value, key) {
        var opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
    });
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

            /* fill this cell */
            if (digitInputIsSolution) fillCellSolution(cell, digitInputSelection);
            else toggleCellCandidate(cell, digitInputSelection);

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
    cell.blur();
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

function fillCellSolution(cell, solution) {
    if (cell == null) return;
    if (solution == '0') {
        /* if erase is selected, remove all candidates and solution */
        removeAllCellCandidates(cell);
        cell.value = "";
    }
    else if (solution >= '1' && solution <= '9') {
        cell.value = solution.toString();
        removeAllCellCandidates(cell);
    }
}

function removeAllCellCandidates(cell) {
    if (cell == null) return;
    var candidates = cell.nextElementSibling.children;
    for (let i = 0; i < candidates.length; i++)
        candidates[i].classList.remove("candidate-active");
}

function toggleCellCandidate(cell, candidate) {
    if (cell == null) return;
    if (candidate == '0') {
        /* if erase is selected, remove all candidates and solution */
        removeAllCellCandidates(cell);
        cell.value = "";
    } else if (cell.value) {
        /* if cell is solved return */
        return;
    } else if (candidate >= '1' && candidate <= '9') {
        /* toggle this candidate on/off */
        var candidateDiv = cell.nextElementSibling.querySelector(".can" + candidate.toString());
        if (candidateDiv) candidateDiv.classList.toggle("candidate-active");
    }
}

function selectDigitButton(button) {
    if (button == null) return;

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
    if (button == null) return;

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
    if (button == null);

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
            let cell = cellFromIndex(cellInputSelection);
            if (digitInputIsSolution) fillCellSolution(cell, digit);
            else toggleCellCandidate(cell, digit);
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

function digitToggleHandleClick(e) {
    let button = e.target;
    let otherButton;
    if (button.id === "digit-input-solution") {
        otherButton = button.parentElement.querySelector("[id='digit-input-candidate']");
        digitInputIsSolution = true;
    } else if (button.id === "digit-input-candidate") {
        otherButton = button.parentElement.querySelector("[id='digit-input-solution']");
        digitInputIsSolution = false;
    } else {
        return;
    }
    /* swap which has the active classes */
    otherButton.classList.remove("digit-input-toggle-active");
    button.classList.add("digit-input-toggle-active");

    /* if another digit input cell is selected, deselect it */
    if (digitInputSelection !== -1) {
        var digitButton = digitButtonFromIndex(digitInputSelection);
        deselectDigitButton(digitButton);
    }
}

document.querySelectorAll(".digit-button").forEach(function (button) {
    button.addEventListener("click", digitInputHandleClick);
});

document.getElementById("digit-input-toggle-buttons").addEventListener("click", digitToggleHandleClick);


/* ----------------- Board input handlers ----------------- */

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
        fillCellSolution(cell, boardData[index]);
    });
}

function clearBoard() {

    /* remove cell solutions */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        cell.value = "";
    });

    /* remove cell candidates */
    sudokuBoard.querySelectorAll(".candidate-active").forEach((el) => el.classList.remove("candidate-active"));

    /* reset board data */
    boardData = "";

    /* clear selected digit/cell */
    if (digitInputSelection != -1)
        deselectDigitButton(digitButtonFromIndex(digitInputSelection));
    if (cellInputSelection != -1)
        deselectCell(cellFromIndex(cellInputSelection));

    /* select custom board puzzle */
    document.getElementById("puzzle-select").value = "Custom";
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

/* ---- Puzzle select ---- */

function puzzleSelectHandler(e) {
    var select = e.target;
    var value = select.options[select.selectedIndex].value;
    var data = savedPuzzles.get(value);
    if (data) {
        boardData = data;
        fillBoard();
    }
    if (value === "custom") {
        // additional displays for custom boards
    }
}

document.getElementById("puzzle-select").addEventListener("change", puzzleSelectHandler);

/* ---- Solve/Clear Buttons ---- */

document.getElementById("solve-button").addEventListener("click", solveBoard);
document.getElementById("clear-button").addEventListener("click", clearBoard);