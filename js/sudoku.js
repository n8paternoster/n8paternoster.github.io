var sudokuBoard = document.getElementById("sudoku-board");
var boardData = "";

var currentPuzzle = "Easy Example"; /* default puzzle */

var customPuzzleIsValid = false;/* true once custom puzzle is validated */
var customPuzzleData = "";      /* data saved only after it's validated */

var cellInputSelection = -1;    /* currently selected cell */
var digitInputSelection = -1;   /* currently selected digit button */
var digitInputIsLocked = false; /* currently selected digit is locked */
var digitInputIsSolution = true;/* (true): digit input treated as solution, (false): digit input treated as candidate toggle */

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
function lockCell(cell) {
    if (cell == null) return;
    cell.classList.add("cell-input-locked");
    cell.disabled = true;
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
    }
    else if (solution >= '1' && solution <= '9') {
        cell.value = solution.toString();
        removeAllCellCandidates(cell);
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
function lockBoard() {
    /* change the current cell values to uneditable 'clues' */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        if (cell.value >= '1' && cell.value <= '9')
            lockCell(cell); 
    });
}
function unlockBoard() {
    /* enable all cells */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(unlockCell);
}
function loadPuzzle(puzzleName) {
    /* Loads a puzzle into currentPuzzle and displays it on sudokuBoard */

    let savedPuzzleData = savedPuzzles.get(puzzleName);
    if (savedPuzzleData === undefined) return;

    /* reset board */
    clearBoard();           

    /* get puzzle data */
    if (puzzleName === "Custom" && customPuzzleIsValid) boardData = customPuzzleData;
    else boardData = savedPuzzleData;

    /* fill sudokuBoard with data and lock those cells */
    fillBoard();
    lockBoard();

    /* set the puzzle select input */
    document.getElementById("puzzle-select").value = puzzleName;

    /* change puzzle buttons depending on whether the new puzzle is custom or not */ 
    if (puzzleName === "Custom" && !customPuzzleIsValid) {
        document.getElementById("puzzle-restart-button").textContent = "Reset";
        document.getElementById("puzzle-verify-button").textContent = "Validate";
    } else {
        document.getElementById("puzzle-restart-button").textContent = "Restart";
        document.getElementById("puzzle-verify-button").textContent = "Verify";
    }

    currentPuzzle = puzzleName;
}
function reloadPuzzle() {
    /* sets board to currentPuzzle data, does not change currentPuzzle, removes candidates and added cell solutions but does not add clues */

    let puzzleData = savedPuzzles.get(currentPuzzle);
    if (puzzleData === undefined) return;

    /* remove cell solutions from non-clue cells */
    var cells = sudokuBoard.querySelectorAll("input:not(.cell-input-locked)");
    cells.forEach((cell) => cell.value = "");

    /* remove cell candidates */
    sudokuBoard.querySelectorAll(".candidate-active").forEach((el) => el.classList.remove("candidate-active"));

    /* clear digit and cell selection */
    if (digitInputSelection != -1)
        deselectDigitButton(digitButtonFromIndex(digitInputSelection));
    if (cellInputSelection != -1)
        deselectCellInput(cellFromIndex(cellInputSelection));

    /* change cell input type to solution */
    document.getElementById("digit-input-solution").classList.add("digit-input-toggle-active");
    document.getElementById("digit-input-candidate").classList.remove("digit-input-toggle-active");
    digitInputIsSolution = true;

    /* reset board data, if current puzzle is a validated custom puzzle use that data */
    if (currentPuzzle === "Custom" && !customPuzzleIsValid) boardData = puzzleData;
    else boardData = getBoardInput();
    //if (currentPuzzle === "Custom" && customPuzzleIsValid) boardData = customPuzzleData;
    //else boardData = puzzleData;
}
function clearBoard() {

    /* remove cell solutions */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach((cell) => cell.value = "");

    /* remove cell candidates */
    sudokuBoard.querySelectorAll(".candidate-active").forEach((el) => el.classList.remove("candidate-active"));

    /* clear digit and cell selection */
    if (digitInputSelection != -1)
        deselectDigitButton(digitButtonFromIndex(digitInputSelection));
    if (cellInputSelection != -1)
        deselectCellInput(cellFromIndex(cellInputSelection));

    /* change cell input type to solution */
    document.getElementById("digit-input-solution").classList.add("digit-input-toggle-active");
    document.getElementById("digit-input-candidate").classList.remove("digit-input-toggle-active");
    digitInputIsSolution = true;

    /* unlock all cells */
    unlockBoard();

    /* if the current puzzle is a validated custom puzzle, invalidate it */
    if (currentPuzzle === "Custom" && customPuzzleIsValid) {
        customPuzzleIsValid = false;
        customPuzzleData = "";
    }

    /* TODO: invalidate custom puzzle in every case?

    /* select custom board puzzle */
    document.getElementById("puzzle-select").value = "Custom";
    currentPuzzle = "Custom";

    /* if the custom board was validated, load that data */
    if (customPuzzleIsValid) {
        document.getElementById("puzzle-restart-button").textContent = "Restart";
        document.getElementById("puzzle-verify-button").textContent = "Verify";
        boardData = customPuzzleData;
        fillBoard();
    } else {
        document.getElementById("puzzle-restart-button").textContent = "Reset";
        document.getElementById("puzzle-verify-button").textContent = "Validate";
        boardData = savedPuzzles.get(currentPuzzle);
    }
}
function getBoardInput() {
    /* get a string holding the current board input values */
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
function setCustomPuzzleValidation() {
    /* If current input board data has only 1 valid solution, set customPuzzleData and customPuzzleIsValid, return true */
    /* Else unset customPuzzleData and customPuzzleIsValid, return false */
    var data = getBoardInput();

    /* TO DO: add external function call here to validate board data */
    /* if (Module.isValidBoard(data)) { */
    customPuzzleIsValid = true;
    customPuzzleData = data;
    return true;
    /* } else { */
    // customPuzzleIsValid = false;
    // customPuzzleData = "";
    // return false;
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

/* Deselect the selected cell or digit input when click occurs outside selected elements */
document.addEventListener("click", function (e) {
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

/* ---- Puzzle select ---- */

function puzzleSelectHandler(e) {
    var sel = e.target;
    var puzzle = sel.options[sel.selectedIndex].value;
    loadPuzzle(puzzle);
}

function puzzleRestartHandler(e) {

}

document.getElementById("puzzle-select").addEventListener("change", puzzleSelectHandler);

document.getElementById("puzzle-restart-button").addEventListener("click", reloadPuzzle);

/* ---- Solve/Clear Buttons ---- */

document.getElementById("solve-button").addEventListener("click", solveBoard);
document.getElementById("clear-button").addEventListener("click", clearBoard);