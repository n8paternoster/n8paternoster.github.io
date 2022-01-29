var sudokuBoard = document.getElementById("sudoku-board");

const newSavedPuzzles = new Map([
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

    clues = Array(Board.numCells).fill(0);          // 1-indexed
    cellSolutions = Array(Board.numCells).fill(0);  // 1-indexed
    cellCandidates = Array(Board.numCells).fill().map(() => Array(Board.N).fill(1));

    constructor(clueStr) {
        this.clues = clueStr.split('').map(Number);
        this.cellSolutions = clueStr.split('').map(Number);
        this.cellCandidates = Array(Board.numCells).fill().map(() => Array(Board.N).fill(0));
        for (var cell = 0; cell < Board.numCells; cell++) {
            if (clueStr.charAt(cell) == '0') {
                this.cellCandidates[cell].fill(1);
            }
        }
        this.resetStep();
    }

    /* set data */
    setClues(clueStr) { // also resets cellSolutions and cellCandidates
        if (clueStr == null || clueStr.length != Board.numCells) return;
        for (var cell = 0; cell < Board.numCells; cell++) {
            var val = clueStr.charAt(cell);
            if (val >= '1' && val <= ' 9') {
                this.clues[cell] = Number(val);
                this.cellSolutions[cell] = Number(val);
                this.cellCandidates[cell].fill(0);  // remove candidates from this cell
                Board.drawCellSolution(cellEleFromIndex(cell), val, true);
                Board.lockCell(cellEleFromIndex(cell));
            } else {
                Board.unlockCell(cellEleFromIndex(cell));
            }
        }
    }
    setData(solutionsStr, candidatesStr = Array(Board.numCells * Board.N + 1).join('0')) {
        if (solutionsStr == null || solutionsStr.length != Board.numCells) return;
        if (candidatesStr == null || candidatesStr.length != Board.numCells * Board.N) return;
        for (var cell = 0; cell < Board.numCells; cell++) {
            if (this.clues[cell]) continue;
            var ele = cellEleFromIndex(cell);
            var solution = solutionsStr.charAt(cell);
            if (solution >= '1' && solution <= '9') {
                // set the solution in this cell
                this.cellSolutions[cell] = Number(solution);
                this.cellCandidates[cell].fill(0);  // remove candidates from this cell
                Board.drawCellSolution(ele, solution);
            } else {
                // set the candidates in this cell
                for (var can = 0; can < Board.N; can++) {
                    let set = (candidatesStr.charAt(cell * Board.N + can) == '1');
                    this.cellCandidates[cell][can] = Number(set);
                    Board.drawCellCandidate(ele, (can + 1).toString(), set);
                }
                this.cellSolutions[cell] = 0;   // set the cell solution to 0
            }
        }
    }
    setCellSolution(cellNum, solutionNum) { // cellNum 0-indexed, solutionNum 0-indexed
        if (cellNum < 0 || cellNum >= Board.numCells) return;
        if (solutionNum < 0 || solutionNum >= Board.N) return;
        this.cellSolutions[cellNum] = Number(solutionNum + 1); // set the cell value
        this.cellCandidates[cellNum].fill(0);               // remove candidates from this cell
        Board.drawCellSolution(cellEleFromIndex(cellNum), (solutionNum + 1).toString());
    }
    setCellCandidate(cellNum, candidateNum, set) {  // cellNum 0-indexed, candidateNum 0-indexed
        if (cellNum < 0 || cellNum >= Board.numCells) return;
        if (candidateNum < 0 || candidateNum >= Board.N) return;
        this.cellCandidates[cellNum][candidateNum] = Number(set);
        Board.drawCellCandidate(cellEleFromIndex(cellNum), (candidateNum + 1).toString(), set);
    }
    resetCell(cellNum) {
        if (cellNum < 0 || cellNum >= Board.numCells) return;
        this.cellSolutions[cellNum] = 0;
        this.cellCandidates[cellNum].fill(0);           // maybe need to change this
        Board.clearCell(cellEleFromIndex(cellNum));
    }
    reset() {
        this.clues = Array(Board.numCells).fill(0);
        this.cellSolutions = Array(Board.numCells).fill(0);
        this.cellCandidates = Array(Board.numCells).fill().map(() => Array(Board.N).fill(0));
        /* empty all cells */
        var cells = sudokuBoard.querySelectorAll("input");
        cells.forEach((cell) => Board.clearCell(cell));
        /* reset step state */
        this.resetStep();
    }
    loadPuzzle(puzzleName) {
        /* Loads a puzzle into currentPuzzle and displays it on sudokuBoard */

        /* load puzzle data */
        var clues = newSavedPuzzles.get(puzzleName);
        if (clues === undefined) return;
        currentPuzzle = puzzleName;
        this.reset();
        this.clues = clues.split('').map(Number);
        this.cellSolutions = clues.split('').map(Number);
        this.cellCandidates = Array(Board.numCells).fill().map(() => Array(Board.N).fill(0));

        /* draw each cell */
        for (var cell = 0; cell < Board.numCells; cell++) {
            let ele = cellEleFromIndex(cell);
            if (this.clues[cell]) { // draw the clue and lock the cell
                Board.drawCellSolution(ele, this.clues[cell].toString(), true);
                Board.lockCell(ele);
            } else {                // set all candidates to 1 and unlock the cell
                this.cellCandidates[cell].fill(1);
                Board.unlockCell(ele);
                for (var can = 0; can < Board.N; can++)
                    Board.drawCellCandidate(ele, (can + 1).toString(), true);
            }
        }

        /* set the puzzle select input */
        document.getElementById("puzzle-select").value = puzzleName;

        /* show/hide custom editor */
        var customEditor = document.getElementById("show-custom-editor");
        if (puzzleName === "Custom") {
            var editor = document.getElementById("show-custom-editor");
            customEditor.style.maxHeight = editor.scrollHeight + "px";
        } else {
            customEditor.style.maxHeight = 0;
        }

        saveSessionData();
    }
    loadUserData() {
        if (currentPuzzle != "Custom") return;  // load puzzle instead?
        this.reset();
        let userSolutions = userData.cellSolutions.join('');
        let userCandidates = userData.cellCandidates.map(cell => cell.join('')).join('');
        this.setData(userSolutions, userCandidates);
    }

    /* get data */
    getCluesStr() {
        return this.clues.join('');
    }
    getSolutionsStr() {
        return this.cellSolutions.join('');
    }
    getCandidatesStr() {
        return this.cellCandidates.map(cell => cell.join('')).join('');
    }

    /* UI functions */
    static lockCell(cell) {
        if (cell == null) return;
        cell.classList.add("cell-input-locked");
        cell.disabled = true;
    }
    static unlockCell(cell) {
        if (cell == null) return;
        cell.classList.remove("cell-input-locked");
        cell.disabled = false;
    }
    static drawCellSolution(cell, valStr, isClue = false) {
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
    static drawCellCandidate(cell, valStr, isSet) {
        if (cell == null) return;
        if (valStr >= '1' && valStr <= '9') {
            var candidateEle = cell.nextElementSibling.querySelector(".can" + valStr);
            if (candidateEle) {
                if (isSet) candidateEle.classList.add("candidate-active");
                else candidateEle.classList.remove("candidate-active");
            }
        }
    }
    static clearCell(cell) {
        if (cell == null) return;
        cell.value = "";
        cell.classList.remove("clue-cell");
        cell.classList.remove("cell-input-locked");
        cell.disabled = false;
        // add all candidates to this cell
        var candidates = cell.nextElementSibling.children;
        for (let i = 0; i < candidates.length; i++) 
            candidates[i].classList.remove("candidate-active", "candidate-eliminated", "candidate-solution");
    }

    /* Step function */
    prevStrategy = null;
    resetStep() {
        if (this.prevStrategy) {
            this.prevStrategy.delete();
            this.prevStrategy = null;
        }
        let outputEle = document.getElementById("strategy-output");
        if (outputEle) {
            outputEle.textContent = "";
            let pushEle = document.createElement('span');
            pushEle.id = "strategy-push";
            outputEle.appendChild(pushEle);
        }
    }
    step() {
        let outputEle = document.getElementById("strategy-output");
        let pushEle = document.getElementById("strategy-push");

        // Apply changes from previous step
        if (this.prevStrategy) {
            for (let i = 0; i < Board.numCells; i++) {
                for (let j = 0; j < Board.N; j++) {
                    if (this.cellCandidates[i][j] == 1) {
                        let canEle = candidateEleFromIndex(i, j);
                        if (canEle) canEle.classList.remove("candidate-highlighted");
                    }
                }
            }
            let solutions = this.prevStrategy.solutions;
            for (var i = 0; i < solutions.size(); i++) {
                let s = solutions.get(i);
                let cellNum = Number(s.row) * Board.N + Number(s.col);
                let candidate = Number(s.candidate);
                let canEle = candidateEleFromIndex(cellNum, candidate);
                if (canEle) canEle.classList.remove("candidate-solution");
                if (this.cellSolutions[cellNum] == 0) this.setCellSolution(cellNum, candidate);
            }
            let elims = this.prevStrategy.eliminations;
            for (var i = 0; i < elims.size(); i++) {
                let e = elims.get(i);
                let cellNum = Number(e.row) * Board.N + Number(e.col);
                let candidate = Number(e.candidate);
                let canEle = candidateEleFromIndex(cellNum, candidate);
                if (canEle) canEle.classList.remove("candidate-eliminated");
                if (this.cellSolutions[cellNum] == 0) this.setCellCandidate(cellNum, candidate, false);
            }
            this.prevStrategy.delete();
            this.prevStrategy = null;
            outputEle.insertBefore(document.createElement('br'), pushEle);
        }

        // Get the strategy info for this step
        let solver = new Module.SudokuBoard();
        solver.setSolutions(this.getSolutionsStr());
        solver.setCandidates(this.getCandidatesStr());
        let strategy = solver.step();

        // Display strategy info
        let title = "";
        switch (strategy.id) {
            case Module.StrategyID.NotFound:
                title += "Not Found\r\n";
                break;
            case Module.StrategyID.CandidateRemoval:
                title += "Invalid Candidate(s)\r\n";
                break;
            case Module.StrategyID.NakedSingle:
                title += "Naked Single(s)\r\n";
                break;
            case Module.StrategyID.HiddenSingle:
                title += "Hidden Single(s)\r\n";
                break;
            case Module.StrategyID.NakedPair:
                title += "Naked Pair(s)\r\n";
                break;
            case Module.StrategyID.NakedTriplet:
                title += "Naked Triplet(s)\r\n";
                break;
            case Module.StrategyID.NakedQuad:
                title += "Naked Quad(s)\r\n";
                break;
            case Module.StrategyID.HiddenPair:
                title += "Hidden Single(s)\r\n";
                break;
            case Module.StrategyID.HiddenTriplet:
                title += "Hidden Triplet(s)\r\n";
                break;
            case Module.StrategyID.HiddenQuad:
                title += "Hidden Quad(s)\r\n";
                break;
            case Module.StrategyID.Pointing:
                title += "Pointing Pair(s)/Triplet(s)\r\n";
                break;
            case Module.StrategyID.BoxLine:
                title += "Box/Line\r\n";
                break;
            case Module.StrategyID.XWing:
                title += "X-Wing\r\n";
                break;
            case Module.StrategyID.Swordfish:
                title += "Swordfish\r\n";
                break;
            case Module.StrategyID.Jellyfish:
                title += "Jellyfish\r\n";
                break;
            case Module.StrategyID.YWing:
                title += "Y-Wing\r\n";
                break;
            case Module.StrategyID.XYZWing:
                title += "XYZ-Wing\r\n";
                break;
            case Module.StrategyID.WXYZWing:
                title += "WXYZ-Wing\r\n";
                break;
            case Module.StrategyID.VWXYZWing:
                title += "VWXYZ-Wing\r\n";
                break;
            case Module.StrategyID.SinglesChain:
                title += "Single's Chain\r\n";
                break;
            case Module.StrategyID.Medusa:
                title += "3D Medusa\r\n";
                break;
            case Module.StrategyID.XCycle:
                title += "X-Cycle\r\n";
                break;
            case Module.StrategyID.AlternatingInferenceChain:
                title += "Alternating Inference Chain\r\n";
                break;
            default:
                title += "Invalid strategy/Puzzle solved\r\n";
                break;
        }
        let titleEle = document.createElement('span');
        titleEle.style.fontWeight = 'bold';
        titleEle.textContent = title;
        if (outputEle) outputEle.insertBefore(titleEle, pushEle);

        switch (strategy.id) {
            case Module.StrategyID.NakedPair:
            case Module.StrategyID.NakedTriplet:
            case Module.StrategyID.NakedQuad:
            case Module.StrategyID.HiddenPair:
            case Module.StrategyID.HiddenTriplet:
            case Module.StrategyID.HiddenQuad:
            case Module.StrategyID.Pointing:
            case Module.StrategyID.BoxLine:
            case Module.StrategyID.XWing:
            case Module.StrategyID.Swordfish:
            case Module.StrategyID.Jellyfish:
                let sets = strategy.sets;
                for (let i = 0; i < sets.size(); i++) {
                    let p = sets.get(i);
                    let candidates = [];
                    for (let can = 0; can < p.candidates.length; can++)
                        if (p.candidates[can] === '1') candidates.push(can);
                    for (let cell = 0; cell < p.cells.length; cell++)
                        if (p.cells[cell] === '1') {
                            candidates.forEach(can => {
                                if (this.cellCandidates[Board.numCells - 1 - cell][Board.N - 1 - can] == 1) {
                                    let ele = candidateEleFromIndex(Board.numCells - 1 - cell, Board.N - 1 - can);
                                    if (ele) ele.classList.add("candidate-highlighted");
                                }
                            });
                        }
                }
        }

        let elims = strategy.eliminations;
        for (var i = 0; i < elims.size(); i++) {
            let e = elims.get(i);
            let row = Number(e.row), col = Number(e.col), can = Number(e.candidate);
            let cellNum = row * Board.N + col;
            let string = (can + 1).toString() + " removed from (" + (row + 1).toString() + ", " + (col + 1).toString() + ")\r\n";
            if (outputEle) {
                let ele = document.createElement('span');
                ele.textContent = string;
                outputEle.insertBefore(ele, pushEle);
            }
            let canEle = candidateEleFromIndex(cellNum, can);
            if (canEle) canEle.classList.add("candidate-eliminated");
        }
        let solutions = strategy.solutions;
        for (var i = 0; i < solutions.size(); i++) {
            let s = solutions.get(i);
            let row = Number(s.row), col = Number(s.col), can = Number(s.candidate);
            let cellNum = row * Board.N + col;
            let string = "(" + (row + 1).toString() + ", " + (col + 1).toString() + ") set to " + (can + 1).toString() + "\r\n";
            if (outputEle) {
                let ele = document.createElement('span');
                ele.textContent = string;
                outputEle.insertBefore(ele, pushEle);
            }
            let canEle = candidateEleFromIndex(cellNum, can);
            if (canEle) canEle.classList.add("candidate-solution");
        }

        /* Push the strategy info to the top of the output box */
        if (outputEle) {
            pushEle.style.height = 0;
            titleEle.scrollIntoView();
            let offset = parseInt(titleEle.offsetTop - outputEle.scrollTop);
            if (offset > 0) {
                if (pushEle) pushEle.style.height = offset + 'px';
                titleEle.scrollIntoView();
            }
        }

        // Store this step info
        this.prevStrategy = strategy;
        solver.delete();
    };
};
var board = new Board(newSavedPuzzles.get(currentPuzzle));

var userData = {
    cellSolutions: Array(Board.numCells).fill(0),  // 1-indexed
    cellCandidates: Array(Board.numCells).fill().map(() => Array(Board.N).fill(0))
};

var cellInputSelection = -1;    /* currently selected cell */
var digitInputSelection = -1;   /* currently selected digit button */
var digitInputIsSolution = true;/* (true): digit input treated as solution, (false): digit input treated as candidate toggle */

/* ----------------- helper functions ----------------- */

/* get cell/digit elements from index */
function cellEleFromIndex(index) {
    if (index < 0 || index >= Board.numCells) return null;
    let id = ((index < 10) ? "0" : "") + index.toString();
    return sudokuBoard.querySelector("[id='" + id + "']");
}
function candidateEleFromIndex(cellNum, candidate) {
    if (candidate < 0 || candidate >= Board.N) return null;
    let cell = cellEleFromIndex(cellNum);
    if (cell == null) return null;
    return cell.nextElementSibling.querySelector(".can" + (candidate + 1).toString());
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
    //button.classList.remove("digit-input-locked");
    //digitInputIsLocked = false;

    /* Set the digit selection */
    let digit = parseInt(button.id.charAt(button.id.length - 1), 10);
    digitInputSelection = digit;
}
function deselectDigitButton(button) {
    if (button == null);

    /* Remove selected and locked classes */
    //button.classList.remove("digit-input-selected", "digit-input-locked");
    button.classList.remove("digit-input-selected");

    // Remove hovering from the board */
    sudokuBoard.classList.remove("sudoku-board-hover");

    /* Reset the digit selection */
    digitInputSelection = -1;
    digitInputIsLocked = false;
}

/* sudoku board UI */
function displayTextPopup(popup, ms) {
    popup.classList.add("text-popup-active");
    setTimeout(() => {
        popup.classList.remove("text-popup-active");
    }, ms);
}

// not used
//function reset() {
//    /* Reset all saved values, set board to custom */
//    /* clear board */
//    board.reset();
//    /* clear digit and cell selection */
//    if (digitInputSelection != -1)
//        deselectDigitButton(digitButtonEleFromIndex(digitInputSelection));
//    if (cellInputSelection != -1)
//        deselectCellInput(cellEleFromIndex(cellInputSelection));
//    /* change cell input type to solution */
//    document.getElementById("digit-input-solution").classList.add("digit-input-toggle-active");
//    document.getElementById("digit-input-candidate").classList.remove("digit-input-toggle-active");
//    digitInputIsSolution = true;
//    /* load custom puzzle */
//    board.loadPuzzle("Custom");
//    /* reset custom puzzle data */
//    userData.cellSolutions.fill(0);
//    userData.cellCandidates.fill().map(() => Array(Board.N).fill(0));
//}

/* ----------------- document handlers ----------------- */

document.addEventListener("DOMContentLoaded", function (e) {
    /* add saved puzzles to puzzle select */
    var select = document.getElementById("puzzle-select");
    newSavedPuzzles.forEach(function (_value, key) {
        var opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
    });

    /* load the default puzzle */
    if (!currentPuzzle) currentPuzzle = "Easy Example";
    board.loadPuzzle(currentPuzzle);
});
document.addEventListener("click", function (e) {
    /* Deselect the selected cell or digit input when click occurs outside selected elements */
    let clickCancelsCellSelection = !e.composedPath().some((obj) => {
        return (obj instanceof Element && obj.classList.contains("cell"));
    });

    //let clickCancelsDigitSelection = !(
    //    /* don't cancel digit selection if click contains any of: */
    //    e.target.classList.contains("digit-button") ||
    //    e.target.id === "digit-input-candidate" ||
    //    e.target.id === "digit-input-solution"
    //);

    if (clickCancelsCellSelection && cellInputSelection !== -1) {
        /* deselect the selected cell */
        deselectCellInput(cellEleFromIndex(cellInputSelection));
    }
    //if (clickCancelsDigitSelection && digitInputSelection !== -1) {
    //    /* deselect the selected digit input button */
    //    if (!digitInputIsLocked) deselectDigitButton(digitButtonEleFromIndex(digitInputSelection));
    //}
});

function saveSessionData() {
    window.sessionStorage.setItem("currentPuzzle", currentPuzzle);
    window.sessionStorage.setItem("boardClues", board.getCluesStr());
    window.sessionStorage.setItem("boardCellSolutions", board.getSolutionsStr());
    window.sessionStorage.setItem("boardCellCandidates", board.getCandidatesStr());
    window.sessionStorage.setItem("userCellSolutions", userData.cellSolutions.join(''));
    window.sessionStorage.setItem("userCellCandidates", userData.cellCandidates.map(cell => cell.join('')).join(''));
    console.log("boardCellSolutions saved as: ", window.sessionStorage.getItem("boardCellSolutions"));
    console.log("boardCellCandidates saved as: ", window.sessionStorage.getItem("boardCellCandidates"));
}
function loadSessionData() {
    currentPuzzle = window.sessionStorage.getItem("currentPuzzle");
    board.setClues(window.sessionStorage.getItem("boardClues"));
    let solutions = window.sessionStorage.getItem("boardCellSolutions");
    let candidates = window.sessionStorage.getItem("boardCellCandidates");
    board.setData(solutions, candidates);
    userData.cellSolutions = window.sessionStorage.getItem("userCellSolutions").split('').map(Number);
    let userCandidates = window.sessionStorage.getItem("userCellCandidates");
    userData.cellCandidates = Array(Board.numCells);
    for (let cell = 0; cell < Board.numCells; cell++) {
        userData.cellCandidates[cell] = userCandidates.substr(cell * Board.N, Board.N).split('').map(Number);
    }
    console.log("boardCellSolutions loaded from: ", window.sessionStorage.getItem("boardCellSolutions"));
    console.log("boardCellCandidates loaded from: ", window.sessionStorage.getItem("boardCellCandidates"));
}

/* on page refresh, load the current puzzle */
if (window.sessionStorage.getItem("currentPuzzle")) {
    loadSessionData();
    //board.loadPuzzle(currentPuzzle);
}

/* ----------------- sudokuBoard handlers ----------------- */

function sudokuBoardHandleClick(e) {
    if (e.target.tagName === "INPUT") {
        e.stopPropagation();    /* prevent document click handler from deselecting digit button */
        let cell = e.target;
        let cellNum = parseInt(cell.id, 10);

        /* digit button is currently selected, set the cell value */
        if (digitInputSelection >= 0 && digitInputSelection <= 9) {
            if (digitInputSelection == 0) {
                if (!cell.classList.contains("cell-input-locked"))
                    board.resetCell(cellNum);
            } else {
                let val = digitInputSelection - 1;
                if (digitInputIsSolution) {
                    board.setCellSolution(cellNum, val);
                } else {
                    // set candidate only if no solution in cell
                    if (board.cellSolutions[cellNum] == 0) {
                        let canIsSet = (board.cellCandidates[cellNum][val] == 1);
                        board.setCellCandidate(cellNum, val, !canIsSet);
                    }
                }
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
            newCell = cellEleFromIndex(newIndex);
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
            newCell = cellEleFromIndex(newIndex);
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
            newCell = cellEleFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked") && allowNav);
        if (allowNav) newCell.select();
    } else if (e.key === "Home") {
        /* navigate to the top left cell */
        e.preventDefault();
        let newIndex = 0;
        let newCell = cellEleFromIndex(newIndex);
        do {/* skip over locked cells */
            newIndex++;
            if (newIndex > 80) return;  /* no unlocked cells */
            newCell = cellEleFromIndex(newIndex);
        } while (newCell.classList.contains("cell-input-locked"));
        newCell.select();
    } else if (e.key === "End") {
        /* navigate to the bottom right cell */
        e.preventDefault();
        let newIndex = 80;
        let newCell = cellEleFromIndex(newIndex);
        do {/* skip over locked cells */
            newIndex--;
            if (newIndex < 0) return;   /* no unlocked cells */
            newCell = cellEleFromIndex(newIndex);
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
    let cellNum = parseInt(cell.id, 10);
    if (cell.value.length === 1) {
        e.preventDefault();
        /* Set this cell */
        if (cell.value >= 1 && cell.value <= 9) {
            var val = Number(cell.value) - 1;
            if (digitInputIsSolution) {
                board.setCellSolution(cellNum, val);
            } else {
                // set candidate only if no solution in cell
                if (board.cellSolutions[cellNum] == 0) {
                    cell.value = "";
                    let canIsSet = board.cellCandidates[cellNum][val] == 1;
                    board.setCellCandidate(cellNum, val, !canIsSet);
                }
            }
        } else {
            board.resetCell(cellNum);
        }
        /* Tab to the next cell */
        if (digitInputIsSolution) {
            let newNum = cellNum;
            let nextCell = cell;
            do {
                newNum = (newNum + 1) % 81;
                if (newNum === cellNum) return; /* no unlocked cells */
                nextCell = cellEleFromIndex(newNum);
            } while (nextCell.classList.contains("cell-input-locked"));
            nextCell.select();
        }
    } else if (cell.value.length > 1) {
        board.resetCell(cellNum);
        e.preventDefault();
    }
}
function sudokuBoardHandlePaste(e) {
    let pastedData = (event.clipboardData || window.clipboardData).getData("text");
    let cell = e.target;
    let cellNum = parseInt(cell.id, 10);
    if (pastedData.length === 1) {
        e.preventDefault();
        /* Set this cell */
        if (pastedData >= '1' && pastedData <= '9') {
            var val = Number(pastedData) - 1;
            if (digitInputIsSolution) {
                board.setCellSolution(cellNum, val);
            } else {
                // set candidate only if no solution in cell
                if (board.cellSolutions[cellNum] == 0) {
                    let canIsSet = (board.cellCandidates[cellNum][val] == 1);
                    board.setCellCandidate(cellNum, val, !canIsSet);
                }
            }
        } else {
            board.resetCell(cellNum);
        }
        /* Tab to the next cell */
        if (digitInputIsSolution) {
            let index = parseInt(cell.id, 10);
            let newIndex = index;
            let nextCell = cell;
            do {
                newIndex = (newIndex + 1) % 81;
                if (newIndex === index) return; /* no unlocked cells */
                nextCell = cellEleFromIndex(newIndex);
            } while (nextCell.classList.contains("cell-input-locked"));
            nextCell.select();
        }
    } else if (pastedData.length > 1) {
        board.resetCell(cellNum);
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

        /* if a different digit button is selected/locked, deselect it and select this button */
        if (digitInputSelection >= 0 && digitInputSelection <= 9) {
            deselectDigitButton(digitButtonEleFromIndex(digitInputSelection));
            selectDigitButton(button);
        } else {
            /* otherwise set the cell value */
            if (digit == 0) {
                board.resetCell(cellInputSelection);
            } else if (digit >= 1 && digit <= 9) {
                let val = digit - 1;
                if (digitInputIsSolution) {
                    board.setCellSolution(cellInputSelection, val);
                } else {
                    // set candidate only if no solution in cell
                    if (board.cellSolutions[cellNum] == 0) {
                        let canIsSet = (board.cellCandidates[cellInputSelection][val] == 1);
                        board.setCellCandidate(cellInputSelection, val, !canIsSet);
                    }
                }
            }
        }
        /* deselect the cell*/
        deselectCellInput(cellEleFromIndex(cellInputSelection));
    }

    /* no cell is selected */
    else {
        if (digit === digitInputSelection) {    /* deselect this button */
            deselectDigitButton(button);
        } else {                                /* select this button */
            if (digitInputSelection !== -1) {   /* a different button is selected */
                var otherButton = digitButtonEleFromIndex(digitInputSelection);
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
    board.loadPuzzle(puzzle);
}
function puzzleHelpHandler(e) {
    /* navigate page to help section */
}
function puzzleRestartHandler(e) {
    board.loadPuzzle(currentPuzzle);
}

document.getElementById("puzzle-select").addEventListener("change", puzzleSelectHandler);
document.getElementById("help-button").addEventListener("click", puzzleHelpHandler);
document.getElementById("restart-button").addEventListener("click", puzzleRestartHandler);

/* ---- Custom board editor ---- */

function customClearHandler(e) {
    board.reset();
    saveSessionData();
}
function customLoadHandler(e) {
    board.loadUserData();
    saveSessionData();
}
function customSaveHandler(e) {

    userData.cellSolutions = board.cellSolutions.slice();                   // shallow copy
    userData.cellCandidates = board.cellCandidates.map(arr => arr.slice()); // shallow copy

    saveSessionData();

    /* display saved message */
    let popup = e.target.querySelector(".text-popup");
    displayTextPopup(popup, 1200);
}

document.getElementById("custom-clear-button").addEventListener("click", customClearHandler);
document.getElementById("custom-load-button").addEventListener("click", customLoadHandler);
document.getElementById("custom-save-button").addEventListener("click", customSaveHandler);

/* ---- Step/Solve Buttons ---- */

function stepHandler(e) {
    if (board) return board.step();
}
function solveBoard() {
    /* Get solved data */
    var solver = new Module.SudokuBoard();
    let data = currentPuzzle === "Custom" ? board.getSolutionsStr() : board.getCluesStr();
    solver.setSolutions(data);
    solver.solve();
    board.setData(solver.getSolutions());

    solver.delete();
}

document.getElementById("solve-button").addEventListener("click", solveBoard);
document.getElementById("step-button").addEventListener("click", stepHandler);