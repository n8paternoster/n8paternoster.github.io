var sudokuBoard = document.getElementById("sudoku-board");

var currentPuzzle = "Easy Example"; /* default puzzle */
var boardData = Array(81).fill(0);
var customPuzzleData = Array(81).fill(0);
var customLockedCells = Array(81).fill(0);

var cellInputSelection = -1;    /* currently selected cell */
var digitInputSelection = -1;   /* currently selected digit button */
var digitInputIsLocked = false; /* currently selected digit is locked */
var digitInputIsSolution = true;/* (true): digit input treated as solution, (false): digit input treated as candidate toggle */
var inputIsClue = false;        /* for custom boards true indicates input is a clue */

const savedPuzzles = new Map([
    ["Custom", "000000000000000000000000000000000000000000000000000000000000000000000000000000000"],
    ["Easy Example", "270306009040015027008090400750000004029000760800000092002030500190650040600204018"],
    ["Medium Example", "002608100000143000030000060097804520100000008085706910020000030000279000004301700"],
    ["Hard Example", "320000040004500200000000070075010068000409000280070310030000000008002100060000052"],
    ["Pointing Pairs", "500200040000603000030009007003007000007008000600000020080000003000400600000100500"],
    ["Minimum Clue Easy", "000870200640200000050000000807000300000051000000000000300700000000000051000000040"],
    ["Minimum Clue Hard", "002090300805000000100000000090060040000000058000000001070000200300500000000100000"],
    ["Looooooooooooooooooong Example", "123456789123456789123456789123456789123456789123456789123456789123456789123456789"]
]);

/* ----------------- helper functions ----------------- */

/* get cell/digit elements from index */
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

/* sudoku board cells */
function autoTabCell(e) {
    if (e.target.value.length === 1) {
        if (e.target.value === '0') e.target.value = "";
        let index = parseInt(e.target.id, 10);
        let newIndex = index;
        let nextCell = e.target;
        do {/* skip over locked cells */
            newIndex = (newIndex + 1) % 81;
            if (newIndex === index) return; /* no unlocked cells */
            nextCell = cellFromIndex(newIndex);
        } while (nextCell.classList.contains("cell-input-locked"));
        nextCell.select();
    }
}
function selectCellInput(cell) {
    if (cell == null || cell.disabled) return;
    let index = parseInt(cell.id, 10);
    if (index >= 0 && index <= 80)
        cellInputSelection = index;
}
function deselectCellInput(cell) {
    if (cell == null || cell.disabled) return;
    cell.blur();
    cellInputSelection = -1;
}
function lockCell(cell, isCustomLock = false) {
    if (cell == null) return;
    cell.classList.add("cell-input-locked");
    if (isCustomLock) {
        cell.disabled = false;
    } else {
        cell.disabled = true;
    }
}
function unlockCell(cell) {
    if (cell == null) return;
    cell.classList.remove("cell-input-locked");
    cell.disabled = false;
}
function fillCellSolution(cell, solution) {
    if (cell == null) return;
    if (solution == '0') {
        /* if erase is selected, remove all candidates and solution */
        removeAllCellCandidates(cell);
        cell.value = "";
        if (inputIsClue) {
            unlockCell(cell);
            let index = parseInt(cell.id, 10);
            customLockedCells[index] = 0;
        }
    }
    else if (solution >= '1' && solution <= '9') {
        removeAllCellCandidates(cell);
        cell.value = solution.toString();
        if (inputIsClue) {
            lockCell(cell, true);
            let index = parseInt(cell.id, 10);
            customLockedCells[index] = 1;
        }
    }
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
function removeAllCellCandidates(cell) {
    if (cell == null) return;
    var candidates = cell.nextElementSibling.children;
    for (let i = 0; i < candidates.length; i++)
        candidates[i].classList.remove("candidate-active");
}

/* digit buttons */
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

/* sudoku board */
function lockBoard(useCustomLocks = false) {
    /* change cell values to 'clues' */

    var cells = sudokuBoard.querySelectorAll("input");
    if (useCustomLocks) {
        /* lock cells specified in 'customLockedCells' (for a custom puzzle) */
        cells.forEach(function (cell) {
            if (cell.value >= '1' && cell.value <= '9') {
                let index = parseInt(cell.id, 10);
                if (customLockedCells[index] === 1) lockCell(cell, false);
            }
        });
    } else {
        /* lock all currently set cells (for saved puzzles) */
        cells.forEach(function (cell) {
            if (cell.value >= '1' && cell.value <= '9')
                lockCell(cell);
        });
    }
}
function unlockBoard() {
    /* enable all cells */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(unlockCell);
    customLockedCells.fill(0);
}
function clearBoard() {
    /* Empty entire board */

    /* remove cell values */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach((cell) => cell.value = "");

    /* unlock all cells */
    unlockBoard();

    /* hide cell candidates */
    sudokuBoard.querySelectorAll(".candidate-active").forEach((el) => el.classList.remove("candidate-active"));

    boardData.fill(0);
    saveSessionData();
}
function loadPuzzle(puzzleName, useCustomData = false) {
    /* Loads a puzzle into currentPuzzle and displays it on sudokuBoard */

    let savedData = savedPuzzles.get(puzzleName);
    if (savedData === undefined) return;

    /* clear board */
    clearBoard();

    /* fill sudokuBoard with data and lock those cells */
    if (puzzleName === "Custom" && useCustomData) {
        boardData = customPuzzleData;
        fillBoard();
        lockBoard(true);
    } else {
        boardData = savedData.;
        fillBoard();
        lockBoard();
    }

    /* show/hide custom editor */
    var customEditor = document.getElementById("show-custom-editor");
    if (puzzleName === "Custom") {
        var editor = document.getElementById("show-custom-editor");
        customEditor.style.maxHeight = editor.scrollHeight + "px";
    } else {
        customEditor.style.maxHeight = 0;
    }

    /* set the puzzle select input */
    document.getElementById("puzzle-select").value = puzzleName;

    currentPuzzle = puzzleName;
    saveSessionData();
}

function reset() {
    /* Reset all saved values, set board to custom */

    /* clear board */
    clearBoard();

    /* clear digit and cell selection */
    if (digitInputSelection != -1)
        deselectDigitButton(digitButtonFromIndex(digitInputSelection));
    if (cellInputSelection != -1)
        deselectCellInput(cellFromIndex(cellInputSelection));

    /* change cell input type to solution */
    document.getElementById("digit-input-solution").classList.add("digit-input-toggle-active");
    document.getElementById("digit-input-candidate").classList.remove("digit-input-toggle-active");
    digitInputIsSolution = true;

    /* select custom board puzzle */
    document.getElementById("puzzle-select").value = "Custom";
    currentPuzzle = "Custom";
    boardData = savedPuzzles.get(currentPuzzle);

    /* reset custom puzzle data */
    customPuzzleData = "";
}
function getBoardInput() {
    /* return a string holding the current board input values */
    var array = Array(81).fill('0');
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        if (cell.value >= '1' && cell.value <= '9') {
            let index = parseInt(cell.id, 10);
            array[index] = cell.value;
        }
    });
    return array.join('');
}
function fillBoard() {
    /* display the boardData values in the cells */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        let index = parseInt(cell.id, 10);
        fillCellSolution(cell, boardData[index]);
    });
}
function solveBoard() {
    /* Read data */
    let data = savedPuzzles.get(currentPuzzle);
    if (currentPuzzle === "Custom" || !data)
        data = getBoardInput();

    /* Solve */
    var instance = new Module.sudokuBoard();
    instance.fillData(data);
    instance.solve();

    /* Set data */
    boardData = instance.getData();
    instance.delete();

    /* Display data on board */
    fillBoard();
}
function saveSessionData() {
    window.sessionStorage.setItem("customPuzzleData", customPuzzleData);
    window.sessionStorage.setItem("customLockedCells", customLockedCells.join(''));
    window.sessionStorage.setItem("currentPuzzle", currentPuzzle);
    window.sessionStorage.setItem("currentData", boardData);
}
function getSessionData() {
    currentPuzzle = window.sessionStorage.getItem("currentPuzzle");
    boardData = window.sessionStorage.getItem("currentData");
    customPuzzleData = window.sessionStorage.getItem("customPuzzleData");
    customLockedCells = Array.from(window.sessionStorage.getItem("customLockedCells"));
}

/* ----------------- document handlers ----------------- */

document.addEventListener("DOMContentLoaded", function (e) {
    /* add saved puzzles to puzzle select */
    var select = document.getElementById("puzzle-select");
    savedPuzzles.forEach(function (value, key) {
        var opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
    });

    /* load the default puzzle */
    if (!currentPuzzle) currentPuzzle = "Custom";
    loadPuzzle(currentPuzzle);
});
document.addEventListener("click", function (e) {
    /* Deselect the selected cell or digit input when click occurs outside selected elements */
    let clickCancelsCellSelection = !e.composedPath().some((obj) => {
        return (obj instanceof Element && obj.classList.contains("cell"));
    });

    let clickCancelsDigitSelection = !(
        /* don't cancel digit selection if click contains any of: */
        e.target.classList.contains("digit-button") ||
        e.target.id === "digit-input-candidate" ||
        e.target.id === "digit-input-solution"
    );

    if (clickCancelsCellSelection && cellInputSelection !== -1) {
        /* deselect the selected cell */
        deselectCellInput(cellFromIndex(cellInputSelection));
    }
    if (clickCancelsDigitSelection && digitInputSelection !== -1) {
        /* deselect the selected digit input button */
        if (!digitInputIsLocked) deselectDigitButton(digitButtonFromIndex(digitInputSelection));
    }
});

/* on page refresh, load the current puzzle */
if (window.sessionStorage.getItem("currentPuzzle")) {
    getSessionData();
    loadPuzzle(window.sessionStorage.getItem("currentPuzzle"));
}

/* ----------------- sudokuBoard handlers ----------------- */

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
            deselectCellInput(cell);
        } else {
            /* highlight text in this cell */
            cell.select();
        }
    }
}
function sudokuBoardHandleKey(e) {
    const tabKeys = ["Tab", "Enter", " "];
    const backKeys = ["Backspace", "Delete"];
    const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

    let index = parseInt(e.target.id, 10);
    if (tabKeys.includes(e.key)) {
        /* tab forward or backward to a sequential cell */
        e.preventDefault();
        let newIndex = index;
        let newCell = e.target;
        do {/* skip over locked cells */
            newIndex = e.shiftKey ? newIndex - 1 : (newIndex + 1) % 81;
            if (newIndex < 0) newIndex = 80;
            if (newIndex === index) return; /* no unlocked cells */
            newCell = cellFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked"));
        newCell.select();
    } else if (backKeys.includes(e.key)) {
        /* delete input and tab backward */
        e.target.value = "";
        let newIndex = index;
        let newCell = e.target;
        do {/* skip over locked cells */
            newIndex = newIndex - 1;
            if (newIndex < 0) newIndex = 80;
            if (newIndex === index) return; /* no unlocked cells */
            newCell = cellFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked"));
        newCell.select();
    } else if (arrowKeys.includes(e.key)) {
        /* navigate to an adjacent cell without wrapping */
        e.preventDefault();
        let newIndex = index;
        let newCell = e.target;
        let allowNav = true; /* don't allow movement to a new row */
        do {/* skip over locked cells */
            switch (e.key) {
                case "ArrowUp": newIndex -= 9; break;
                case "ArrowDown": newIndex += 9; break;
                case "ArrowLeft": newIndex -= 1; break;
                case "ArrowRight": newIndex += 1; break;
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowRight")
                if (Math.floor(index / 9) !== Math.floor(newIndex / 9))
                    allowNav = false;
            if (newIndex < 0 || newIndex > 80 || newIndex === index)
                return; /* hit bottom/top or no unlocked cells */
            newCell = cellFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked") && allowNav);
        if (allowNav) newCell.select();
    } else if (e.key === "Home") {
        /* navigate to the top left cell */
        e.preventDefault();
        let newIndex = 0;
        let newCell = cellFromIndex(newIndex);
        do {/* skip over locked cells */
            newIndex++;
            if (newIndex > 80) return;  /* no unlocked cells */
            newCell = cellFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked"));
        newCell.select();
    } else if (e.key === "End") {
        /* navigate to the bottom right cell */
        e.preventDefault();
        let newIndex = 80;
        let newCell = cellFromIndex(newIndex);
        do {/* skip over locked cells */
            newIndex--;
            if (newIndex < 0) return;   /* no unlocked cells */
            newCell = cellFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked"));
        newCell.select();
    } else if (e.key === "Escape") {
        /* deselect current cell */
        e.target.blur();
    } else if (e.key.length === 1 && !(/\d/.test(e.key)) && !e.ctrlKey) {
        /* prevent invalid input from displaying */
        e.preventDefault();
    }
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
        selectCellInput(e.target);
    }
}, true);


/* ----------------- Digit input handlers ----------------- */

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
        deselectCellInput(cellFromIndex(cellInputSelection));
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
}

document.querySelectorAll(".digit-button").forEach(function (button) {
    button.addEventListener("click", digitInputHandleClick);
});
document.getElementById("digit-input-toggle-buttons").addEventListener("click", digitToggleHandleClick);


/* ----------------- Board input handlers ----------------- */

/* ---- Puzzles box ---- */

function puzzleSelectHandler(e) {
    var sel = e.target;
    var puzzle = sel.options[sel.selectedIndex].value;
    loadPuzzle(puzzle);
}
function puzzleHelpHandler(e) {
    /* navigate page to help section */
}
function puzzleVerifyHandler(e) {

}

document.getElementById("puzzle-select").addEventListener("change", puzzleSelectHandler);
document.getElementById("puzzle-help-button").addEventListener("click", puzzleHelpHandler);
document.getElementById("puzzle-verify-button").addEventListener("click", puzzleVerifyHandler);

/* ---- Custom board editor ---- */

function customInputTypeHandler(e) {
    if (e.target.value === "Clue") inputIsClue = true;
    else inputIsClue = false;
}
function customClearHandler(e) {
    /* clear board */
    clearBoard();
}
function customLoadHandler(e) {
    loadPuzzle("Custom", true);
}
function customSaveHandler(e) {

    /* get cell data and locked data */
    let data = Array(81).fill('0');
    let locked = Array(81).fill(0);
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        if (cell.value >= '1' && cell.value <= '9') {
            let index = parseInt(cell.id, 10);
            data[index] = cell.value;
            if (cell.classList.contains("cell-input-locked"))
                locked[index] = 1;
        }
    });
    customPuzzleData = data.join('');
    customLockedCells = locked;

    saveSessionData();
    /* TODO add popup confirming save was a success */
}

document.getElementById("radio-container").addEventListener("change", customInputTypeHandler);
document.getElementById("custom-clear-button").addEventListener("click", customClearHandler);
document.getElementById("custom-load-button").addEventListener("click", customLoadHandler);
document.getElementById("custom-save-button").addEventListener("click", customSaveHandler);

/* ---- Restart/Solve Buttons ---- */

function puzzleRestartHandler(e) {
    var puzzle = currentPuzzle;
    loadPuzzle(puzzle);
}

document.getElementById("restart-button").addEventListener("click", puzzleRestartHandler);
document.getElementById("solve-button").addEventListener("click", solveBoard);