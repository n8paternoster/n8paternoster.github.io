var sudokuBoard = document.getElementById("sudoku-board");

const newSavedPuzzles = new map([
    ["Custom", "000000000000000000000000000000000000000000000000000000000000000000000000000000000"],
    ["Easy Example", "270306009040015027008090400750000004029000760800000092002030500190650040600204018"],
    ["Medium Example", "002608100000143000030000060097804520100000008085706910020000030000279000004301700"],
    ["Hard Example", "320000040004500200000000070075010068000409000280070310030000000008002100060000052"],
    ["Pointing Pairs", "500200040000603000030009007003007000007008000600000020080000003000400600000100500"],
    ["Minimum Clue Easy", "000870200640200000050000000807000300000051000000000000300700000000000051000000040"],
    ["Minimum Clue Hard", "002090300805000000100000000090060040000000058000000001070000200300500000000100000"],
    ["Looooooooooooooooooong Example", "123456789123456789123456789123456789123456789123456789123456789123456789123456789"]
]);
var currentPuzzle = "Easy Example"; /* default puzzle */
class Board {
    static N = 9;
    static numCells = Board.N * Board.N;
    clues = Array(numCells).fill(0);
    cellSolutions = Array(numCells).fill(0);
    cellCandidates = Array(numCells).fill().map(() => Array(N).fill(1));
    constructor(clueStr) {
        this.clues = clueStr.split('').map(Number);
        this.cellSolutions = clueData.split('').map(Number);
    }
    setClues(clueStr) {
        this.clues = clueStr.split('').map(Number);
        this.cellSolutions = clueStr.split('').map(Number);
    }
    setSolutions(solutionStr) {
        this.cellSolutions = solutionStr.split('').map(Number);
    }
    setCandidates(candidateStr) {
        for (var cell = 0; cell < this.cellCandidates.length; cell++) {
            this.cellCandidates[cell] = candidateStr.substring(cell * N, cell * N + N).split('').map(Number);
        }
    }
    setCellSolution(cellNum, solutionNum) { // cellNum 0-indexed, solutionNum 1-indexed
        if (cellNum < 0 || cellNum >= numCells) return;
        if (solutionNum <= 0 || solutionNum > N) return;
        this.cellSolutions[cellNum] = Number(solution); // set the cell value
        this.cellCandidates[cellNum].fill(0);           // remove candidates from this cell
    }
    setCellCandidate(cellNum, candidateNum, set) {  // cellNum 0-indexed, candidateNum 0-indexed
        if (cellNum < 0 || cellNum >= numCells) return;
        if (candidateNum < 0 || candidateNum >= N) return;
        this.cellCandidates[cellNum][candidateNum] = Number(set);
    }
    getSolutionsStr() {
        return this.cellSolutions.join('');
    }
    getCandidatesStr() {
        return this.cellCandidates.map(e => e.join('')).join('');
    }
};
var newBoardData = new Board(newSavedPuzzles.get(currentPuzzle));

var newUserData = {
    clues: Array(Board.numCells).fill(0),
    cellSolutions: Array(Board.numCells).fill(0),
    cellCandidates: Array(Board.numCells).fill().map(() => Array(Board.N).fill(1))
};

var cellInputSelection = -1;    /* currently selected cell */
var digitInputSelection = -1;   /* currently selected digit button */
var digitInputIsLocked = false; /* (true): currently selected digit is locked */
var digitInputIsSolution = true;/* (true): digit input treated as solution, (false): digit input treated as candidate toggle */
var inputIsClue = document.querySelector("input[name='custom-input']:checked").value === "Clue";  /* for custom boards true indicates input is a clue */

/* ----------------- helper functions ----------------- */

/* get cell/digit elements from index */
function cellEleFromIndex(index) {
    if (index < 0 || index >= Board.numCells) return null;
    let id = ((index < 10) ? "0" : "") + index.toString();
    return sudokuBoard.querySelector("[id='" + id + "']");
}
function digitButtonEleFromIndex(index) {
    if (index < 0 || index >= Board.N) return null;
    let id = "digitInput" + index.toString();
    return document.getElementById(id);
}

/* cell input selection */
function selectCellInput(cell) {
    if (cell == null || cell.disabled) return;
    let index = parseInt(cell.id, 10);
    if (index >= 0 && index < Board.numCells)
        cellInputSelection = index;
}
function deselectCellInput(cell) {
    if (cell == null || cell.disabled) return;
    cell.blur();
    cellInputSelection = -1;
}

/* digit button input selection */
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

/* cell UI */
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
function drawCellSolution(cell, valStr, isClue = false) {
    if (cell == null) return;
    if (valStr >= '1' && valStr <= '9') {
        // remove candidates from this cell
        var candidates = cell.nextElementSibling.children;
        for (let i = 0; i < candidates.length; i++)
            candidates[i].classList.remove("candidate-active");
        // set the cell value
        cell.value = valStr;
        if (isClue) cell.classList.add("clue-cell");
        else cell.classList.remove("clue-cell");
    }
}
function drawCellCandidate(cell, valStr, isSet) {
    if (cell == null) return;
    if (valStr >= '1' && valStr <= '9') {
        var candidateEle = cell.nextElementSibling.querySelector(".can" + valStr);
        if (candidateEle) {
            if (isSet) candidateEle.classList.add("candidate-active");
            else candidateEle.classList.remove("candidate-active");
        }
    }
}
function clearCell(cell) {
    if (cell == null) return;
    cell.value = "";
    cell.classList.remove("clue-cell");
    cell.classList.remove("cell-input-locked");
    cell.disabled = false;
    // remove candidates from this cell
    var candidates = cell.nextElementSibling.children;
    for (let i = 0; i < candidates.length; i++)
        candidates[i].classList.remove("candidate-active");
}


//function drawCellClue(cell, valStr) {
//    if (cell == null) return;
//    if (valStr == '0') {
//        removeAllCellCandidates(cell);
//        emptyCell(cell);
//    } else if (valStr >= '1' && valStr <= '9') {
//        removeAllCellCandidates(cell);
//        cell.value = valStr;
//        cell.classList.add("clue-cell");

//        //let index = parseInt(cell.id, 10);
//        //boardData.cellData[index] = parseInt(clue, 10);
//        //boardData.clueData[index] = 1;
//    }
//}
//function fillCellSolution(cell, solution) {
//    if (cell == null) return;
//    if (solution == '0') {
//        removeAllCellCandidates(cell);
//        emptyCell(cell);
//    } else if (solution >= '1' && solution <= '9') {
//        removeAllCellCandidates(cell);
//        cell.value = solution.toString();
//        cell.classList.remove("clue-cell");
//        cell.classList.remove("cell-input-locked");
//        cell.disabled = false;
//        let index = parseInt(cell.id, 10);
//        boardData.cellData[index] = parseInt(solution, 10);
//        boardData.clueData[index] = 0;
//    }
//}
//function toggleCellCandidate(cell, candidate) {
//    if (cell == null) return;
//    if (candidate == '0') {
//        /* if erase is selected, remove all candidates and solution */
//        removeAllCellCandidates(cell);
//        emptyCell(cell);
//    } else if (cell.value) {
//        /* if cell is solved return */
//        return;
//    } else if (candidate >= '1' && candidate <= '9') {
//        /* toggle this candidate on/off */
//        var candidateDiv = cell.nextElementSibling.querySelector(".can" + candidate.toString());
//        if (candidateDiv) candidateDiv.classList.toggle("candidate-active");
//    }
//}
//function removeAllCellCandidates(cell) {
//    if (cell == null) return;
//    var candidates = cell.nextElementSibling.children;
//    for (let i = 0; i < candidates.length; i++)
//        candidates[i].classList.remove("candidate-active");
//}
//function emptyCell(cell) {
//    /* does NOT remove cell candidates */
//    if (cell == null) return;
//    cell.value = "";
//    cell.classList.remove("clue-cell");
//    cell.classList.remove("cell-input-locked");
//    cell.disabled = false;
//    let index = parseInt(cell.id, 10);
//    boardData.cellData[index] = 0;
//    boardData.clueData[index] = 0;
//}

/* sudoku board UI */
function drawBoard(board) {
    for (var i = 0; i < Board.numCells; i++) {
        var cell = cellEleFromIndex(i);
        if (board.clues[i]) {
            drawCellSolution(cell, board.clues[i].toString(), true);
            lockCell(cell);
        } else if (board.cellSolutions[i]) {
            drawCellSolution(cell, board.cellSolutions[i].toString());
            unlockCell(cell);
        } else {
            unlockCell(cell);
            for (var can = 0; can < Board.N; can++) {
                drawCellCandidate(cell, can.toString(), board.cellCandidates[i][can]);
            }
        }
    }
}
function clearBoard() {
    /* empty all cells */
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach((cell) => clearCell(cell));
}
function loadPuzzle(puzzleName, useCustomData = false) {
    /* Loads a puzzle into currentPuzzle and displays it on sudokuBoard */

    var puzzle = newSavedPuzzles.get(puzzleName);
    if (puzzle === undefined) return;

    /* clear board */
    clearBoard();

    /* fill the board and set data */
    currentPuzzle = puzzleName;
    if (puzzleName !== "Custom") useCustomData = false;
    let solutions = useCustomData ? userData.cellData.slice() : puzzle.cells.split('').map(Number);
    let clues = useCustomData ? userData.clueData.slice() : puzzle.clues.split('').map(Number);
    fillBoard(solutions, clues, !useCustomData);

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

    saveSessionData();
}
function displayTextPopup(popup, ms) {
    popup.classList.add("text-popup-active");
    setTimeout(() => {
        popup.classList.remove("text-popup-active");
    }, ms);
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

    /* load custom puzzle */
    loadPuzzle("Custom", false);

    /* reset custom puzzle data */
    userData.cellData.fill(0);
    userData.clueData.fill(0);
}
function getBoardInput() {
    /* return a string holding the current board input values */
    var array = Array(81).fill(0);
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        if (cell.value >= '1' && cell.value <= '9') {
            let index = parseInt(cell.id, 10);
            array[index] = cell.value;
        }
    });
    return array.join('');
}
function solveBoard() {
    /* Read data */
    let puzzle = savedPuzzles.get(currentPuzzle);
    let isCustomPuzzle = (puzzle === "Custom");
    let data = puzzle.cells;
    if (isCustomPuzzle)
        data = getBoardInput();

    /* Solve */
    var board = new Module.SudokuBoard();
    board.fillData(data);
    info = board.solve();
    data = board.getData();
    board.delete();

    /* Fill board and set data */
    let solutions = data.split('').map(Number);
    let clues = boardData.clueData;
    fillBoard(solutions, clues, !isCustomPuzzle);
}

function saveSessionData() {
    window.sessionStorage.setItem("currentPuzzle", currentPuzzle);
    window.sessionStorage.setItem("boardCellData", boardData.cellData.join(''));
    window.sessionStorage.setItem("boardClueData", boardData.clueData.join(''));
    window.sessionStorage.setItem("userCellData", userData.cellData.join(''));
    window.sessionStorage.setItem("userClueData", userData.clueData.join(''));
}
function getSessionData() {
    currentPuzzle = window.sessionStorage.getItem("currentPuzzle");
    boardData.cellData = (window.sessionStorage.getItem("boardCellData")).split('').map(Number);
    boardData.clueData = (window.sessionStorage.getItem("boardClueData")).split('').map(Number);
    userData.cellData = (window.sessionStorage.getItem("userCellData")).split('').map(Number);
    userData.clueData = (window.sessionStorage.getItem("userClueData")).split('').map(Number);
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
    loadPuzzle(currentPuzzle, false);
}

/* ----------------- sudokuBoard handlers ----------------- */

function sudokuBoardHandleClick(e) {
    if (e.target.tagName === "INPUT") {
        e.stopPropagation();    /* prevent document click handler from deselecting digit button */
        var cell = e.target;

        /* digit button is currently selected */
        if (digitInputSelection >= 0 && digitInputSelection <= 9) {

            /* fill this cell */
            if (digitInputIsSolution) {
                if (currentPuzzle === "Custom" && inputIsClue)
                    fillCellClue(cell, digitInputSelection, false);
                else fillCellSolution(cell, digitInputSelection);
            } else toggleCellCandidate(cell, digitInputSelection);

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
        e.preventDefault();
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
        e.preventDefault();
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
function sudokuBoardHandleInput(e) {
    let cell = e.target;
    if (cell.value.length === 1) {
        /* Fill this cell */
        if (currentPuzzle === "Custom" && inputIsClue)
            fillCellClue(cell, cell.value, false);
        else
            fillCellSolution(cell, cell.value);
        e.preventDefault();
        /* Tab to the next cell */
        let index = parseInt(cell.id, 10);
        let newIndex = index;
        let nextCell = cell;
        do {
            newIndex = (newIndex + 1) % 81;
            if (newIndex === index) return; /* no unlocked cells */
            nextCell = cellFromIndex(newIndex);
        } while (nextCell.classList.contains("cell-input-locked"));
        nextCell.select();
    } else if (cell.value.length > 1) {
        emptyCell(cell);
        e.preventDefault();
    }
}
function sudokuBoardHandlePaste(e) {
    let pastedData = (event.clipboardData || window.clipboardData).getData("text");
    let cell = e.target;
    if (pastedData.length === 1 && pastedData >= '0' && pastedData <= '9') {
        /* Fill this cell */
        if (currentPuzzle === "Custom" && inputIsClue)
            fillCellClue(cell, pastedData, false);
        else
            fillCellSolution(cell, pastedData);
        e.preventDefault();
        /* Tab to the next cell */
        let index = parseInt(cell.id, 10);
        let newIndex = index;
        let nextCell = cell;
        do {
            newIndex = (newIndex + 1) % 81;
            if (newIndex === index) return; /* no unlocked cells */
            nextCell = cellFromIndex(newIndex);
        } while (nextCell.classList.contains("cell-input-locked"));
        nextCell.select();
    } else if (pastedData.length > 1) {
        emptyCell(cell);
        e.preventDefault();
    }
}

/* prevent non-numeric input from displaying, handle key navigation */
sudokuBoard.addEventListener("keydown", sudokuBoardHandleKey);

/* enter digit input if selected, otherwise highlight text */
sudokuBoard.addEventListener("click", sudokuBoardHandleClick, true);

/* save inputted data and auto-tab */
sudokuBoard.addEventListener("input", sudokuBoardHandleInput);
sudokuBoard.addEventListener("paste", sudokuBoardHandlePaste);

/* get the selected cell when focused */
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
            if (digitInputIsSolution) {
                if (currentPuzzle === "Custom" && inputIsClue)
                    fillCellClue(cell, digit, false);
                else fillCellSolution(cell, digit);
            } else toggleCellCandidate(cell, digit);
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
    inputIsClue = (e.target.value === "Clue");
}
function customClearHandler(e) {
    clearBoard();
    saveSessionData();
}
function customLoadHandler(e) {
    loadPuzzle("Custom", true);
}
function customSaveHandler(e) {

    /* get cell data and clue data */
    let cellData = Array(81).fill(0);
    let clueData = Array(81).fill(0);
    var cells = sudokuBoard.querySelectorAll("input");
    cells.forEach(function (cell) {
        if (cell.value >= '1' && cell.value <= '9') {
            let index = parseInt(cell.id, 10);
            cellData[index] = parseInt(cell.value, 10);
            if (cell.classList.contains("clue-cell"))
                clueData[index] = 1;
        }
    });
    userData.cellData = cellData;
    userData.clueData = clueData;
    saveSessionData();

    /* display saved message */
    let popup = e.target.querySelector(".text-popup");
    displayTextPopup(popup, 1200);
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