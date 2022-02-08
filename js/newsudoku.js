var sudokuBoard = document.getElementById("sudoku-board");

const newSavedPuzzles = new Map([
    ["Custom", "000000000000000000000000000000000000000000000000000000000000000000000000000000000"],
    ["Easy Example", "270306009040015027008090400750000004029000760800000092002030500190650040600204018"],
    ["Medium Example", "002608100000143000030000060097804520100000008085706910020000030000279000004301700"],
    ["Hard Example", "320000040004500200000000070075010068000409000280070310030000000008002100060000052"],
    ["Pointing Pairs", "500200040000603000030009007003007000007008000600000020080000003000400600000100500"],
    ["Minimum Clue Easy", "000870200640200000050000000807000300000051000000000000300700000000000051000000040"],
    ["Minimum Clue Hard", "002090300805000000100000000090060040000000058000000001070000200300500000000100000"],
]);
var currentPuzzle = "Easy Example"; /* default puzzle */

class Board {
    static N = 9;
    static numCells = Board.N * Board.N;
    static colors = Array('red', 'orange', 'yellow', 'green', 'blue', 'purple');

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
        Board.clearCanvas();
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
        this.resetStep();    // invalidate step data
        for (var cell = 0; cell < Board.numCells; cell++) {
            var ele = cellEleFromIndex(cell);
            Board.clearCell(ele);
            var solution = this.clues[cell] ? this.clues[cell] : solutionsStr.charAt(cell);
            if (solution >= '1' && solution <= '9') {
                // set the solution in this cell
                this.cellSolutions[cell] = Number(solution);
                this.cellCandidates[cell].fill(0);  // remove candidates from this cell
                Board.drawCellSolution(ele, solution);
            } else {
                // set the cell to 0
                this.cellSolutions[cell] = 0;   // set the cell solution to 0
                // set the candidates in this cell
                for (var can = 0; can < Board.N; can++) {
                    let set = (candidatesStr.charAt(cell * Board.N + can) == '1');
                    this.cellCandidates[cell][can] = Number(set);
                    Board.drawCellCandidate(ele, (can + 1).toString(), set);
                }
                
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
        /* clear canvas */
        Board.clearCanvas();
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
        cell.classList.remove("clue-cell", "cell-input-locked", "cell-highlighted-red", "cell-highlighted-orange", "cell-highlighted-yellow", "cell-highlighted-green", "cell-highlighted-blue", "cell-highlighted-purple");
        cell.disabled = false;
        // remove all candidates from this cell
        var candidates = cell.nextElementSibling.children;
        for (let i = 0; i < candidates.length; i++) 
            candidates[i].classList.remove("candidate-active", "candidate-eliminated", "candidate-solution", "candidate-highlighted-red", "candidate-highlighted-orange", "candidate-highlighted-yellow", "candidate-highlighted-green", "candidate-highlighted-blue", "candidate-highlighted-purple");
    }
    static highlightRow(row, color) {
        if (row < 0 || row >= Board.N || !Board.colors.includes(color)) return;
        let cells = [];
        for (let cellNum = row * Board.N; cellNum < (row + 1) * Board.N; cellNum++)
            cells.push(cellEleFromIndex(cellNum));
        let className = "cell-highlighted-" + color;
        cells.forEach(cell => cell.classList.add(className));
    }
    static highlightCol(col, color) {
        if (col < 0 || col >= Board.N || !Board.colors.includes(color)) return;
        let cells = [];
        for (let cellNum = col; cellNum < Board.numCells; cellNum += Board.N)
            cells.push(cellEleFromIndex(cellNum));
        let className = "cell-highlighted-" + color;
        cells.forEach(cell => cell.classList.add(className));
    }
    static highlightCell(cell, color) {
        if (cell == null || !Board.colors.includes(color)) return;
        let className = "cell-highlighted-" + color;
        cell.classList.add(className);
    }
    static highlightCandidate(can, color) {
        if (can == null || !Board.colors.includes(color)) return;
        let className = "candidate-highlighted-" + color;
        can.classList.add(className);
    }
    static drawLink(aRow, aCol, aCan, bRow, bCol, bCan, isStrongLink, ctx) {
        let aEle = candidateEleFromIndex(aRow * Board.N + aCol, aCan);
        let bEle = candidateEleFromIndex(bRow * Board.N + bCol, bCan);
        if (sudokuBoard == null || aEle == null || bEle == null) return;
        let canvasRect = sudokuBoard.getBoundingClientRect();

        // get which corners of each vertex the link should be drawn from
        let aRIGHT = (aCol < bCol) ? 1 : -1;
        let aDOWN = (aRow < bRow) ? 1 : -1;
        let bRIGHT = (bCol < aCol) ? 1 : -1;
        let bDOWN = (bRow < aRow) ? 1 : -1;
        if (aCol == bCol && aRow == bRow) {
            aRIGHT = (aCan % 3 < bCan % 3) ? 1 : -1;
            aDOWN = (aCan < bCan) ? 1 : -1;
            bRIGHT = (bCan % 3 < aCan % 3) ? 1 : -1;
            bDOWN = (bCan < aCan) ? 1 : -1;
        } else if (aCol == bCol) {  // try to avoid overlap with grid lines
            let aCanCol = aCan % 3, bCanCol = bCan % 3;
            if (aCanCol == 0 && bCanCol == 0) {
                aRIGHT = 1;
                bRIGHT = 1;
            } else if (aCanCol == 2 && bCanCol == 2) {
                aRIGHT = -1;
                bRIGHT = -1;
            }
        } else if (aRow == bRow) {  // try to avoid overlap with grid lines
            let aCanRow = Math.floor(aCan / 3), bCanRow = Math.floor(bCan / 3);
            if (aCanRow == 0 && bCanRow == 0) {
                aDOWN = 1;
                bDOWN = 1;
            } else if (aCanRow == 2 && bCanRow == 2) {
                aDOWN = -1;
                bDOWN = -1;
            }
        }

        // coordinates for a
        let aRect = aEle.getBoundingClientRect();
        let x1c = aRect.left - canvasRect.left + aRect.width / 2;
        let y1c = aRect.top - canvasRect.top + aRect.height / 2;
        let r1 = aRect.height / 2;
        let x1 = x1c + aRIGHT * (r1 * Math.cos(Math.PI / 4));
        let y1 = y1c + aDOWN * (r1 * Math.sin(Math.PI / 4));

        // coordinates for b
        let bRect = bEle.getBoundingClientRect();
        let x2c = bRect.left - canvasRect.left + bRect.width / 2;
        let y2c = bRect.top - canvasRect.top + bRect.height / 2;
        let r2 = bRect.height / 2;
        let x2 = x2c + bRIGHT * (r2 * Math.cos(Math.PI / 4));
        let y2 = y2c + bDOWN * (r2 * Math.sin(Math.PI / 4));

        // control point
        let scaleX = (aRIGHT == bRIGHT) ? 1 + 0.05 * aRIGHT : 1;
        let scaleY = (aDOWN == bDOWN) ? 1 + 0.05 * aDOWN : 1;
        let cx = scaleX * ((x1 + x2) / 2);
        let cy = scaleY * ((y1 + y2) / 2);

        if (isStrongLink) ctx.setLineDash([0]);
        else ctx.setLineDash([5, 2]);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
    }
    static drawVertex(row, col, can, color, ctx) {
        let ele = candidateEleFromIndex(row * Board.N + col, can);
        if (sudokuBoard == null || ele == null || !Board.colors.includes(color)) return;

        let canvasRect = sudokuBoard.getBoundingClientRect();
        let rect = ele.getBoundingClientRect();
        let x = rect.left - canvasRect.left + rect.width / 2;
        let y = rect.top - canvasRect.top + rect.height / 2;
        let r = rect.height / 2;

        let className = "candidate-highlighted-" + color;
        ele.classList.add(className);
        let vtxColor = window.getComputedStyle(ele).backgroundColor;
        ele.classList.remove(className);
        ctx.fillStyle = vtxColor;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
    }
    static clearCanvas() {
        let canvas = document.getElementById("sudoku-board-canvas");
        let ctx = canvas.getContext('2d');
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    static writeToOutput(string, bold) {
        let outputEle = document.getElementById("strategy-output");
        let pushEle = document.getElementById("strategy-push");
        if (!outputEle || !pushEle || string.length === 0) return;
        let ele = document.createElement('span');
        if (bold) ele.style.fontWeight = 'bold';
        string += "\r\n";
        ele.textContent = string;
        outputEle.insertBefore(ele, pushEle);
        outputEle.insertBefore(document.createElement('br'), pushEle);
    }

    /* Step function */
    solvePath = [];
    resetStep() {
        while (this.solvePath.length) {
            let strategy = this.solvePath.pop();
            strategy.singles.delete();  // vector of value objects
            for (let i = 0; i < strategy.sets.size; i++) {
                let set = strategy.sets.get(i);
                set.size.delete();
                set.cells.delete();
                set.candidates.delete();
                set.rows.delete();
                set.cols.delete();
                set.boxes.delete();
                set.eliminations.delete();
                set.elimUnitType.delete();
                set.delete();
            }
            strategy.sets.delete();     // vector of objects
            for (let i = 0; i < strategy.bentSets.size; i++) {
                let bentSet = strategy.bentSets.get(i);
                bentSet.size.delete();
                bentSet.cells.delete();
                bentSet.hingeCells.delete();
                bentSet.nonRestCanCells.delete();
                bentSet.candidates.delete();
                bentSet.elimCandidates.delete();
                bentSet.eliminations.delete();
                bentSet.rule.delete();
                bentSet.delete();
            }
            strategy.bentSets.delete(); // vector of objects

            strategy.coloring.vertices.delete();
            strategy.coloring.links.delete();
            strategy.coloring.delete(); // object

            strategy.cycle.links.delete();
            strategy.cycle.delete();    // object

            strategy.eliminations.delete(); // vector of value objects
            strategy.solutions.delete();    // vector of value objects
            strategy.delete();
        }
        let outputEle = document.getElementById("strategy-output");
        if (outputEle) {
            outputEle.textContent = "";
            let pushEle = document.createElement("span");
            pushEle.id = "strategy-push";
            outputEle.appendChild(pushEle);
        }
        Board.clearCanvas();
    }
    printStrategy(strategy) {
        // Print strategy info to the output box
        let outputEle = document.getElementById("strategy-output");
        if (!outputEle) return;
        let pushEle = document.getElementById("strategy-push");

        // Print title
        let title = "";
        switch (strategy.id) {
            case Module.StrategyID.Solved: title += "Solution found\r\n"; break;
            case Module.StrategyID.Error: title += "Errors on board\r\n"; break;
            case Module.StrategyID.None: title += "Ran out of strategies\r\n"; break;
            case Module.StrategyID.CandidateRemoval: title += "Invalid Candidate(s)\r\n"; break;
            case Module.StrategyID.NakedSingle: title += "Naked Single(s)\r\n"; break;
            case Module.StrategyID.HiddenSingle: title += "Hidden Single(s)\r\n"; break;
            case Module.StrategyID.NakedPair: title += "Naked Pair(s)\r\n"; break;
            case Module.StrategyID.NakedTriplet: title += "Naked Triplet(s)\r\n"; break;
            case Module.StrategyID.NakedQuad: title += "Naked Quad(s)\r\n"; break;
            case Module.StrategyID.HiddenPair: title += "Hidden Pair(s)\r\n"; break;
            case Module.StrategyID.HiddenTriplet: title += "Hidden Triplet(s)\r\n"; break;
            case Module.StrategyID.HiddenQuad: title += "Hidden Quad(s)\r\n"; break;
            case Module.StrategyID.Pointing: title += "Pointing Pair(s)/Triplet(s)\r\n"; break;
            case Module.StrategyID.BoxLine: title += "Box/Line\r\n"; break;
            case Module.StrategyID.XWing: title += "X-Wing\r\n"; break;
            case Module.StrategyID.Swordfish: title += "Swordfish\r\n"; break;
            case Module.StrategyID.Jellyfish: title += "Jellyfish\r\n"; break;
            case Module.StrategyID.YWing: title += "Y-Wing\r\n"; break;
            case Module.StrategyID.XYZWing: title += "XYZ-Wing\r\n"; break;
            case Module.StrategyID.WXYZWing: title += "WXYZ-Wing\r\n"; break;
            case Module.StrategyID.VWXYZWing: title += "VWXYZ-Wing\r\n"; break;
            case Module.StrategyID.SinglesChain: title += "Single's Chain\r\n"; break;
            case Module.StrategyID.Medusa: title += "3D Medusa\r\n"; break;
            case Module.StrategyID.XCycle: title += "X-Cycle\r\n"; break;
            case Module.StrategyID.AlternatingInferenceChain: title += "Alternating Inference Chain\r\n"; break;
            default: title += "Invalid strategy/Puzzle solved\r\n"; break;
        }
        let titleEle = document.createElement('span');
        titleEle.style.fontWeight = 'bold';
        titleEle.textContent = title;
        outputEle.insertBefore(titleEle, pushEle);

        // Print strategy specific details
        switch (strategy.id) {
            case Module.StrategyID.Solved:
            case Module.StrategyID.Error:
            case Module.StrategyID.None:
                // No specific details
                break;
            case Module.StrategyID.CandidateRemoval:
                // "X removed from Y"
                for (var i = 0; i < strategy.eliminations.size(); i++) {
                    let e = strategy.eliminations.get(i);
                    let string = (e.candidate + 1).toString() + " removed from (" + (e.row + 1).toString() + ", " + (e.col + 1).toString() + ")\r\n";
                    if (outputEle) {
                        let ele = document.createElement('span');
                        ele.textContent = string;
                        outputEle.insertBefore(ele, pushEle);
                    }
                }
                break;
            case Module.StrategyID.NakedSingle:
                // "X is the only candidate left in Y"
                for (let i = 0; i < strategy.singles.size(); i++) {
                    let s = strategy.singles.get(i);
                    let string = (s.candidate + 1).toString() + " is the only candidate left in (" + (Math.floor(s.cell/Board.N) + 1).toString() + ", " + (s.cell%Board.N + 1).toString() + ")\r\n";
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                }
                break;
            case Module.StrategyID.HiddenSingle:
                // "X in Y is unique to row/col/box Z"
                for (let i = 0; i < strategy.singles.size(); i++) {
                    let s = strategy.singles.get(i);
                    let can = "", cell = "", unit = "";
                    can = (s.candidate + 1).toString();
                    cell = "(" + (Math.floor(s.cell / Board.N) + 1).toString() + ", " + (s.cell % Board.N + 1).toString() + ")";
                    if (s.uniqueRow >= 0 && s.uniqueRow < Board.N)
                        unit += " row " + (s.uniqueRow + 1).toString() + ",";
                    if (s.uniqueCol >= 0 && s.uniqueCol < Board.N)
                        unit += " col " + (s.uniqueCol + 1).toString() + ",";
                    if (s.uniqueBox >= 0 && s.uniqueBox < Board.N)
                        unit += " box " + (s.uniqueBox + 1).toString() + ",";
                    unit = unit.slice(0, -1);  // remove final comma
                    let string = can + " in " + cell + " is unique to" + unit + "\r\n";
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                }
                break;
            case Module.StrategyID.NakedPair:
            case Module.StrategyID.NakedTriplet:
            case Module.StrategyID.NakedQuad:
            case Module.StrategyID.HiddenPair:
            case Module.StrategyID.HiddenTriplet:
            case Module.StrategyID.HiddenQuad:
                // Naked: "In row/col/box X, cells Y only contain candidates Z:"
                let naked = (strategy.id === Module.StrategyID.NakedPair || strategy.id === Module.StrategyID.NakedTriplet || strategy.id === Module.StrategyID.NakedQuad);
                // Hidden: "In row/col/box X, candidates Y can only be found in cells Z:"
                let hidden = (strategy.id === Module.StrategyID.HiddenPair || strategy.id === Module.StrategyID.HiddenTriplet || strategy.id === Module.StrategyID.HiddenQuad);
                for (let i = 0; i < strategy.sets.size(); i++) {
                    let set = strategy.sets.get(i);
                    let unit = "", cans = "", cells = "";
                    if (set.rows.includes('1')) {
                        unit += "row " + (set.rows.indexOf('1') + 1).toString();
                    } else if (set.cols.includes('1')) {
                        unit += "col " + (set.cols.indexOf('1') + 1).toString();
                    } else if (set.boxes.includes('1')) {
                        unit += "box " + (set.boxes.indexOf('1') + 1).toString();
                    } else continue;
                    for (let c = 0; c < set.cells.length; c++)
                        if (set.cells[c] === '1') cells += " (" + (Math.floor(c / Board.N) + 1).toString() + ", " + (c % Board.N + 1).toString() + "),";
                    cells = cells.slice(0, -1);   // remove the final comma
                    for (let c = 0; c < set.candidates.length; c++)
                        if (set.candidates[c] == '1') cans += " " + (c + 1).toString() + ",";
                    cans = cans.slice(0, -1);  // remove the final comma
                    let string = "";
                    if (naked) string = "In " + unit + ", cells" + cells + " only contain candidates" + cans + ":\r\n";
                    else if (hidden) string = "In " + unit + ", candidates" + cans + " can only be found in cells" + cells + ":\r\n";
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    let map = new Map();
                    for (let i = 0; i < set.eliminations.size(); i++) {
                        let e = set.eliminations.get(i);
                        let cell = e.row * Board.N + e.col;
                        if (!map.has(cell)) map.set(cell, []);
                        map.get(cell).push(e.candidate);
                    }
                    map.forEach(function (candidates, cell) {
                        let str = "\t";
                        for (let i = 0; i < candidates.length; i++)
                            str += (candidates[i] + 1).toString() + (i + 1 < candidates.length ? ", " : " ");
                        str += "removed from (" + (Math.floor(cell / Board.N) + 1).toString() + ", " + (cell % Board.N + 1).toString() + ")\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    });
                }
                break;
            case Module.StrategyID.Pointing:
            case Module.StrategyID.BoxLine:
                // Pointing: "In box X, candidate Y can only be found in row/col Z:"
                // Box/Line: "In row/col X, candidate Y can only be found in box Z:"
                for (let i = 0; i < strategy.sets.size(); i++) {
                    let set = strategy.sets.get(i);
                    let unit = "", can = "", box = "";
                    if (set.rows.includes('1')) {
                        unit += "row " + (set.rows.indexOf('1') + 1).toString();
                    } else if (set.cols.includes('1')) {
                        unit += "col " + (set.cols.indexOf('1') + 1).toString();
                    } else continue;
                    if (set.boxes.includes('1')) {
                        box += (set.boxes.indexOf('1') + 1).toString();
                    } else continue;
                    if (set.candidates.includes('1')) {
                        can += (set.candidates.indexOf('1') + 1).toString();
                    } else continue;
                    let string = "";
                    if (strategy.id === Module.StrategyID.Pointing)
                        string = "In box " + box + ", candidate " + can + " can only be found in " + unit + ":\r\n";
                    else if (strategy.id === Module.StrategyID.BoxLine)
                        string = "In " + unit + ", candidate " + can + " can only be found in box " + box + ":\r\n";
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    for (let j = 0; j < set.eliminations.size(); j++) {
                        let e = set.eliminations.get(j);
                        let str = "\t" + (e.candidate + 1).toString() + " removed from (" + (e.row + 1).toString() + ", " + (e.col + 1).toString() + ")\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                }
                break;
            case Module.StrategyID.XWing:
            case Module.StrategyID.Swordfish:
            case Module.StrategyID.Jellyfish:
                // "On rows/cols X, candidate Y can only be found on cols/rows Z:"
                for (let i = 0; i < strategy.sets.size(); i++) {
                    let set = strategy.sets.get(i);
                    let can = "", units = "", elimUnits = "";
                    if (set.candidates.includes('1')) {
                        can += (set.candidates.indexOf('1') + 1).toString();
                    } else continue;
                    if (set.elimUnitType === Module.StrategyUnit.Row) {
                        units += "cols";
                        for (let c = 0; c < set.cols.length; c++)
                            if (set.cols[c] == '1') units += " " + (c + 1).toString() + ",";
                        elimUnits += "rows";
                        for (let r = 0; r < set.rows.length; r++)
                            if (set.rows[r] == '1') elimUnits += " " + (r + 1).toString() + ",";
                    } else if (set.elimUnitType === Module.StrategyUnit.Col) {
                        units += "rows";
                        for (let r = 0; r < set.rows.length; r++)
                            if (set.rows[r] == '1') units += " " + (r + 1).toString() + ",";
                        elimUnits += "cols";
                        for (let c = 0; c < set.cols.length; c++)
                            if (set.cols[c] == '1') elimUnits += " " + (c + 1).toString() + ",";
                    } else continue;
                    units = units.slice(0, -1);         // remove final comma
                    elimUnits = elimUnits.slice(0, -1); // remove final comma
                    let string = "On " + units + ", candidate " + can + " can only be found on " + elimUnits + ":\r\n";
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    for (let j = 0; j < set.eliminations.size(); j++) {
                        let e = set.eliminations.get(j);
                        let str = "\t" + (e.candidate + 1).toString() + " removed from (" + (e.row + 1).toString() + ", " + (e.col + 1).toString() + ")\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                }
                break;
            case Module.StrategyID.YWing:
            case Module.StrategyID.XYZWing:
            case Module.StrategyID.WXYZWing:
            case Module.StrategyID.VWXYZWing:
                // "Cells X contain the candidates Y, and only Z is not restricted to one unit"
                // "Cells X contain the candidates Y, and all the candidates are restricted to one unit"
                for (let i = 0; i < strategy.bentSets.size(); i++) {
                    let wing = strategy.bentSets.get(i);
                    let cells = "", cans = "";
                    for (let c = 0; c < wing.cells.length; c++)
                        if (wing.cells[c] === '1') cells += " (" + (Math.floor(c / Board.N) + 1).toString() + ", " + (c % Board.N + 1).toString() + "),";
                    cells = cells.slice(0, -1);   // remove the final comma
                    for (let c = 0; c < wing.candidates.length; c++)
                        if (wing.candidates[c] == '1') cans += " " + (c + 1).toString() + ",";
                    cans = cans.slice(0, -1);  // remove the final comma
                    let string = "";
                    if (wing.rule === Module.BentsetRule.NonRestCan) {
                        let elimCan = "";
                        if (wing.elimCandidates.includes('1')) {
                            elimCan += (wing.elimCandidates.indexOf('1') + 1).toString();
                        } else continue;
                        string = "Cells" + cells + " contain" + cans + ", and only " + elimCan + " is not restricted to one unit:\r\n";
                    } else if (wing.rule === Module.BentsetRule.Locked) {
                        string = "Cells" + cells + " contain" + cans + ", and every candidate is restricted to one unit:\r\n";
                    } else continue;
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    for (let j = 0; j < wing.eliminations.size(); j++) {
                        let e = wing.eliminations.get(j);
                        let str = "\t" + (e.candidate + 1).toString() + " removed from (" + (e.row + 1).toString() + ", " + (e.col + 1).toString() + ")\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                }
                break;
            case Module.StrategyID.SinglesChain:
            case Module.StrategyID.Medusa:
                {
                    let string = "";
                    if (strategy.coloring.rule === Module.ColoringRule.Color) {
                        let can = "", unit = "", elimColor = "red";
                        if (strategy.coloring.conflictUnitType === Module.StrategyUnit.Cell)
                            can += "candidates";
                        else if (strategy.coloring.conflictCandidates.includes('1'))
                            can += (strategy.coloring.conflictCandidates.indexOf('1') + 1).toString() + "'s";
                        let conflictUnit = strategy.coloring.conflictUnit;
                        switch (strategy.coloring.conflictUnitType) {
                            case Module.StrategyUnit.Row:
                                unit += "row " + (conflictUnit + 1).toString();
                                break;
                            case Module.StrategyUnit.Col:
                                unit += "col " + (conflictUnit + 1).toString();
                                break;
                            case Module.StrategyUnit.Box:
                                unit += "box " + (conflictUnit + 1).toString();
                                break;
                            case Module.StrategyUnit.Cell:
                                unit += "cell (" + (Math.floor(conflictUnit / Board.N) + 1).toString() + ", " + (conflictUnit % Board.N + 1).toString();
                                break;
                        }
                        string = "All of the " + can + " in " + unit + " can see a " + elimColor + " candidate; all " + elimColor + " candidates can be removed and all green candidates are solutions:\r\n";
                    } else if (strategy.coloring.rule === Module.ColoringRule.Candidate) {
                        string = "Either the blue candidates are the solutions or the green candidates are the solutions; some candidates can see both colors and can be removed:\r\n";
                    }
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    for (let i = 0; i < strategy.eliminations.size(); i++) {
                        let e = strategy.eliminations.get(i);
                        let str = "\t" + (e.candidate + 1).toString() + " removed from (" + (e.row + 1).toString() + ", " + (e.col + 1).toString() + ")\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    // "X set to Y"
                    for (let i = 0; i < strategy.solutions.size(); i++) {
                        let s = strategy.solutions.get(i);
                        let str = "\t(" + (s.row + 1).toString() + ", " + (s.col + 1).toString() + ") set to " + (s.candidate + 1).toString() + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                }
                break;
            case Module.StrategyID.XCycle:
            case Module.StrategyID.AlternatingInferenceChain:
                {
                    let string = "";
                    if (strategy.cycle.rule === Module.CycleRule.Continuous) {
                        string += "The chain implies that either all blue candidates are the solution or all purple candidates are the solution; some candidates can see both colors and can be removed:\r\t";
                    } else {
                        let cell = strategy.cycle.discontinuity;
                        let disc = "(" + (Math.floor(cell.row / Board.N) + 1).toString() + ", " + (cell.col % Board.N + 1).toString() + ")";
                        let can = (cell.candidate + 1).toString();
                        if (strategy.cycle.rule === Module.CycleRule.WeakDiscontinuity)
                            string += "When " + disc + " is set to " + can + " the chain implies that it can't be " + can + ":\r\n";
                        else if (strategy.cycle.rule === Module.CycleRule.StrongDiscontinuity)
                            string += "When " + can + " is removed from " + disc + " the chain implies that it must be " + can + ":\r\n";
                    }
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    for (let i = 0; i < strategy.eliminations.size(); i++) {
                        let e = strategy.eliminations.get(i);
                        let str = "\t" + (e.candidate + 1).toString() + " removed from (" + (e.row + 1).toString() + ", " + (e.col + 1).toString() + ")\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    // "X set to Y"
                    for (let i = 0; i < strategy.solutions.size(); i++) {
                        let s = strategy.solutions.get(i);
                        let str = "\t(" + (s.row + 1).toString() + ", " + (s.col + 1).toString() + ") set to " + (s.candidate + 1).toString() + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                }
                break;
        }

        // Space between steps
        outputEle.insertBefore(document.createElement('br'), pushEle);

        // Push the details to the top of the output box
        pushEle.style.height = 0;
        titleEle.scrollIntoView();
        let offset = parseInt(titleEle.offsetTop - outputEle.scrollTop);
        if (offset > 0) {
            if (pushEle) pushEle.style.height = offset + 'px';
            titleEle.scrollIntoView();
        }
    }
    highlightStrategy(strategy) {
        // Highlight strategy specific details on board
        switch (strategy.id) {
            case Module.StrategyID.Error:
                // Highlight error cells
                for (let i = 0; i < strategy.singles.size(); i++) {
                    let error = strategy.singles.get(i);
                    Board.highlightCell(cellEleFromIndex(error.cell), 'red');
                }
                return;
            case Module.StrategyID.None:
            case Module.StrategyID.CandidateRemoval:
            case Module.StrategyID.NakedSingle:
            case Module.StrategyID.HiddenSingle:
                // No specific details
                break;
            case Module.StrategyID.NakedPair:
            case Module.StrategyID.NakedTriplet:
            case Module.StrategyID.NakedQuad:
            case Module.StrategyID.HiddenPair:
            case Module.StrategyID.HiddenTriplet:
            case Module.StrategyID.HiddenQuad:
            case Module.StrategyID.Pointing:
            case Module.StrategyID.BoxLine:
                // Sets, highlight candidates in each set
                for (let i = 0; i < strategy.sets.size(); i++) {
                    let set = strategy.sets.get(i);
                    let candidates = [];
                    for (let can = 0; can < set.candidates.length; can++)
                        if (set.candidates[can] === '1') candidates.push(can);
                    for (let cell = 0; cell < set.cells.length; cell++)
                        if (set.cells[cell] === '1') {
                            candidates.forEach(can => {
                                if (this.cellCandidates[cell][can] == 1) {
                                    Board.highlightCandidate(candidateEleFromIndex(cell, can), 'blue');
                                }
                            });
                        }
                }
                break;
            case Module.StrategyID.XWing:
            case Module.StrategyID.Swordfish:
            case Module.StrategyID.Jellyfish:
                // Fish, highlight candidates and rows or cols the fish is aligned on
                for (let i = 0; i < strategy.sets.size(); i++) {
                    let fish = strategy.sets.get(i);
                    switch (fish.elimUnitType) {
                        case Module.StrategyUnit.Row:
                            for (let c = 0; c < fish.cols.length; c++)
                                if (fish.cols[c] == '1') Board.highlightCol(c, 'blue');
                            break;
                        case Module.StrategyUnit.Col:
                            for (let r = 0; r < fish.rows.length; r++)
                                if (fish.rows[r] == '1') Board.highlightRow(r, 'blue');
                            break;
                    }
                    let candidates = [];
                    for (let can = 0; can < fish.candidates.length; can++)
                        if (fish.candidates[can] === '1') candidates.push(can);
                    for (let cell = 0; cell < fish.cells.length; cell++)
                        if (fish.cells[cell] === '1') {
                            candidates.forEach(can => {
                                if (this.cellCandidates[cell][can] == 1) {
                                    Board.highlightCandidate(candidateEleFromIndex(cell, can), 'yellow');
                                }
                            });
                        }
                }
                break;
            case Module.StrategyID.YWing:
            case Module.StrategyID.XYZWing:
            case Module.StrategyID.WXYZWing:
            case Module.StrategyID.VWXYZWing:
                // Bent sets, highlight the cells and elim candidates in the bent set
                for (let i = 0; i < strategy.bentSets.size(); i++) {
                    let bentSet = strategy.bentSets.get(i);
                    let elimCandidates = [];
                    for (let can = 0; can < bentSet.elimCandidates.length; can++)
                        if (bentSet.elimCandidates[can] == '1') elimCandidates.push(can);
                    for (let cell = 0; cell < bentSet.cells.length; cell++) {
                        if (bentSet.cells[cell] == '1') {
                            let color = (bentSet.hingeCells[cell] == '1') ? 'orange' : 'blue';
                            Board.highlightCell(cellEleFromIndex(cell), color);
                            elimCandidates.forEach(can => {
                                if (this.cellCandidates[cell][can] == 1)
                                    Board.highlightCandidate(candidateEleFromIndex(cell, can), 'yellow');
                            });
                        }
                    }
                    //switch (bentSet.rule) {
                    //    // Rule 1: 1 non-restricted candidate, highlight hinge cells and the cells containing the non-restricted candidate separately
                    //    case Module.BentsetRule.NonRestCan:
                    //        // hinge cells
                    //        for (let c = 0; c < bentSet.hingeCells.length; c++)
                    //            if (bentSet.hingeCells[c] == '1')
                    //                Board.highlightCell(cellEleFromIndex(c), 'orange');
                    //        // cells containing the non-restr can
                    //        for (let c = 0; c < bentSet.nonRestCanCells.length; c++)
                    //            if (bentSet.nonRestCanCells[c] == '1') {
                    //                Board.highlightCell(cellEleFromIndex(c), 'blue');
                    //                elimCandidates.forEach(can => {
                    //                    if (this.cellCandidates[c][can] == 1)
                    //                        Board.highlightCandidate(candidateEleFromIndex(c, can), 'blue');
                    //                });
                    //            }
                    //        break;
                    //    // Rule 2: 0 non-restricted candidates, highlight all cells
                    //    case Module.BentsetRule.Locked:
                    //        for (let c = 0; c < bentSet.cells.length; c++)
                    //            if (bentSet.cells[c] == '1') {
                    //                Board.highlightCell(cellEleFromIndex(c), 'blue')
                    //                elimCandidates.forEach(can => {
                    //                    if (this.cellCandidates[c][can] == 1)
                    //                        Board.highlightCandidate(candidateEleFromIndex(c, can), 'blue');
                    //                });
                    //            }
                    //        break;
                    //}
                }
                break;
            case Module.StrategyID.SinglesChain:
            case Module.StrategyID.Medusa:
                // Coloring, highlight candidates and connections in the graph, highlight conflict cells/candidates                   
                {   
                    let canvas = document.getElementById("sudoku-board-canvas");
                    let ctx = canvas.getContext('2d');
                    let coloring = strategy.coloring;
                    // Map the graph's colors to display colors
                    let mapColors = ['blue', 'green'];
                    let map = new Map();
                    for (let i = 0; i < coloring.vertices.size(); i++) {
                        let v = coloring.vertices.get(i);
                        if (!map.has(v.color) && mapColors.length)
                            map.set(v.color, mapColors.pop());
                    }
                    // Color vertices
                    for (let i = 0; i < coloring.vertices.size(); i++) {
                        let v = coloring.vertices.get(i);
                        let color = map.get(v.color);
                        if (coloring.rule == Module.ColoringRule.Color)
                            color = (v.color == coloring.solutionColor) ? 'green' : 'red';
                        Board.drawVertex(v.row, v.col, v.candidate, color, ctx);
                    }
                    // Draw links
                    for (let i = 0; i < coloring.links.size(); i++) {
                        let l = coloring.links.get(i);
                        let strong = l.link === Module.Link.Strong;
                        Board.drawLink(l.fromRow, l.fromCol, l.fromCan, l.toRow, l.toCol, l.toCan, strong, ctx);
                    }
                    // Color conflict cells/candidates
                    if (coloring.rule == Module.ColoringRule.Color) {
                        let conflictColor = 'yellow';
                        let conflictCans = [];
                        for (let can = 0; can < coloring.conflictCandidates.length; can++)
                            if (coloring.conflictCandidates[can] == '1')
                                conflictCans.push(can);
                        for (let cell = 0; cell < coloring.conflictCells.length; cell++) {
                            if (coloring.conflictCells[cell] == '1') {
                                conflictCans.forEach(can => {
                                    if (this.cellCandidates[cell][can] == 1)
                                        Board.drawVertex(Math.floor(cell / Board.N), cell % Board.N, can, conflictColor, ctx);
                                });
                            }
                        }
                    }
                    if (coloring.rule === Module.ColoringRule.Candidate) break;
                    else return;
                }
            case Module.StrategyID.XCycle:
            case Module.StrategyID.AlternatingInferenceChain:
                // Cycles, highlight candidates and connections in the graph
                {
                    let canvas = document.getElementById("sudoku-board-canvas");
                    let ctx = canvas.getContext('2d');
                    let cycle = strategy.cycle;
                    let cycleIsDisc = (cycle.rule === Module.CycleRule.WeakDiscontinuity || cycle.rule === Module.CycleRule.StrongDiscontinuity);
                    let disc = cycle.discontinuity;
                    let cycleColors = ['blue', 'purple'];
                    let colorOne = true;    // alternate colors
                    for (let i = 0; i < cycle.links.size(); i++) {
                        let l = cycle.links.get(i);
                        let strong = l.link === Module.Link.Strong;
                        let color = colorOne ? cycleColors[0] : cycleColors[1];
                        if (cycleIsDisc && l.fromRow === disc.row && l.fromCol === disc.col && l.fromCan === disc.candidate) {
                            color = (cycle.rule === Module.CycleRule.WeakDiscontinuity) ? 'red' : 'green';
                        } else colorOne = !colorOne;
                        Board.drawVertex(l.fromRow, l.fromCol, l.fromCan, color, ctx);
                        Board.drawLink(l.fromRow, l.fromCol, l.fromCan, l.toRow, l.toCol, l.toCan, strong, ctx);
                    }
                    if (cycle.rule === Module.CycleRule.Continuous) break;
                    else return;
                }
        }

        // Highlight solution/elimination candidates
        let elims = strategy.eliminations;
        for (var i = 0; i < elims.size(); i++) {
            let e = elims.get(i);
            let cellNum = Number(e.row) * Board.N + Number(e.col);
            let canEle = candidateEleFromIndex(cellNum, Number(e.candidate));
            if (canEle) canEle.classList.add("candidate-eliminated");
        }
        let solutions = strategy.solutions;
        for (var i = 0; i < solutions.size(); i++) {
            let s = solutions.get(i);
            let cellNum = Number(s.row) * Board.N + Number(s.col);
            let canEle = candidateEleFromIndex(cellNum, Number(s.candidate));
            if (canEle) canEle.classList.add("candidate-solution");
        }
    }
    step() {
        let endStrategies = [Module.StrategyID.Solved, Module.StrategyID.Error, Module.StrategyID.None];
        // Handle the previous step
        let prevStep = this.solvePath[this.solvePath.length - 1];
        if (this.solvePath.length === 0) {
            // This is the first step, fill any 0-candidate cells with all candidates
            let cansAdded = false;
            for (let cell = 0; cell < Board.numCells; cell++) {
                if (this.cellSolutions[cell] || this.cellCandidates[cell].some(can => can == 1)) continue;
                for (let can = 0; can < Board.N; can++)
                    this.setCellCandidate(cell, can, true);
                cansAdded = true;
            }
            if (cansAdded) return;
        } else if (endStrategies.includes(prevStep.id)) {
            // Check for any changes on the board
            this.solvePath.pop();
        } else {
            // Apply changes from previous step
            let solutions = prevStep.solutions;
            for (let i = 0; i < solutions.size(); i++) {
                let s = solutions.get(i);
                let cellNum = Number(s.row) * Board.N + Number(s.col);
                let candidate = Number(s.candidate);
                if (this.cellSolutions[cellNum] == 0) this.setCellSolution(cellNum, candidate);
            }
            let elims = prevStep.eliminations;
            for (let i = 0; i < elims.size(); i++) {
                let e = elims.get(i);
                let cellNum = Number(e.row) * Board.N + Number(e.col);
                let candidate = Number(e.candidate);
                if (this.cellSolutions[cellNum] == 0) this.setCellCandidate(cellNum, candidate, false);
            }
            // Remove highlighting from board
            Board.clearCanvas();
            for (let cell = 0; cell < Board.numCells; cell++) {
                let cellEle = cellEleFromIndex(cell);
                if (cellEle) cellEle.classList.remove("cell-highlighted-red", "cell-highlighted-orange", "cell-highlighted-yellow", "cell-highlighted-green", "cell-highlighted-blue", "cell-highlighted-purple");
                for (let can = 0; can < Board.N; can++) {
                    if (this.cellCandidates[cell][can] == 1) {
                        let canEle = candidateEleFromIndex(cell, can);
                        if (canEle) canEle.classList.remove("candidate-solution", "candidate-eliminated", "candidate-highlighted-red", "candidate-highlighted-orange", "candidate-highlighted-yellow", "candidate-highlighted-green", "candidate-highlighted-blue", "candidate-highlighted-purple");
                    }
                }
            }
        }

        // Get the strategy info for this step
        let solver = new Module.SudokuBoard();
        solver.setSolutions(this.getSolutionsStr());
        solver.setCandidates(this.getCandidatesStr());
        let strategy = solver.step();
        solver.delete();

        // Display strategy info
        let display = true;
        if (prevStep && endStrategies.includes(prevStep.id)) {
            if (prevStep.id === strategy.id) display = false;
        }
        if (display) {
            this.highlightStrategy(strategy);   // on board
            this.printStrategy(strategy);       // in output box
        }

        this.solvePath.push(strategy);
        return strategy;
    }
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
    if (index < 0 || index > Board.N) return null;
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

    /* Set the digit selection */
    let digit = parseInt(button.id.charAt(button.id.length - 1), 10);
    digitInputSelection = digit;
}
function deselectDigitButton(button) {
    if (button == null) return;

    /* Remove selected and locked classes */
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

    /* set the board canvas element size */
    let canvas = document.getElementById("sudoku-board-canvas");
    if (canvas) {
        let canvasRect = sudokuBoard.getBoundingClientRect();
        canvas.style.width = canvasRect.width + "px";
        canvas.style.height = canvasRect.height + "px";
        var scale = window.devicePixelRatio;
        canvas.width = Math.floor(canvasRect.width*scale);
        canvas.height = Math.floor(canvasRect.height * scale);

        if (canvas.getContext) {
            let ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
        }
    }
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
            deselectDigitButton(digitButtonEleFromIndex(digitInputSelection));
        } else {                                /* select this button */
            if (digitInputSelection !== -1) {   /* a different button is selected */
                var otherButton = digitButtonEleFromIndex(digitInputSelection);
                deselectDigitButton(otherButton);
            }
            selectDigitButton(digitButtonEleFromIndex(digit));
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

function customInputHandler(e) {
    let ele = document.getElementById("custom-input");
    if (!ele) return;
    // TODO : remove error message clipping
    let input = ele.value;
    if (input.length != Board.numCells) {
        /* display error message */
        let popup = e.target.querySelector(".text-popup");
        popup.textContent = "Input must contain 81 characters";
        displayTextPopup(popup, 1000);
        return;
    }
    let solutionStr = input.replace(/[^1-9]/g, '0');
    if (solutionStr.split('').every(c => c === '0')) {
        /* display error message */
        let popup = e.target.querySelector(".text-popup");
        popup.textContent = "Input must contain at least 1 number";
        displayTextPopup(popup, 1000);
        return;
    }
    board.setData(solutionStr);
    ele.value = "";
    saveSessionData();
}
function customClearHandler(e) {
    board.reset();
    saveSessionData();
}
function customLoadHandler(e) {
    board.loadUserData();
    saveSessionData();
}
function customSaveHandler(e) {
    // TODO : change to deep copy to keep custom data on board through page refresh?
    userData.cellSolutions = board.cellSolutions.slice();                   // shallow copy
    userData.cellCandidates = board.cellCandidates.map(arr => arr.slice()); // shallow copy
    saveSessionData();

    /* display saved message */
    let popup = e.target.querySelector(".text-popup");
    popup.textContent = "Saved!";
    displayTextPopup(popup, 1200);
}

document.getElementById("custom-input-submit").addEventListener("click", customInputHandler);
document.getElementById("custom-clear-button").addEventListener("click", customClearHandler);
document.getElementById("custom-load-button").addEventListener("click", customLoadHandler);
document.getElementById("custom-save-button").addEventListener("click", customSaveHandler);

/* ---- Step/Solve Buttons ---- */

function stepHandler(e) {
    if (board) return board.step();
}
function solveBoard() {
    // TODO : add isSolved binding to Module.SudokuBoard, add ret value to solve fnc

    function stepThroughStrategies(ms) {
        return new Promise((resolve, reject) => {
            let endStrategies = [Module.StrategyID.Solved, Module.StrategyID.Error, Module.StrategyID.None];
            const maxSteps = 100;
            let counter = 0;
            setTimeout(function stepStrategy() {
                let lastStep = board.step();
                console.log(counter);
                if (counter++ > maxSteps || (lastStep && endStrategies.includes(lastStep.id))) {
                    if (lastStep === undefined)
                        reject("Error loading solver");
                    else
                        resolve(lastStep);
                } else setTimeout(stepStrategy, ms);
            }, ms);
        });
    }
    function bruteForce() {
        let solver = new Module.SudokuBoard();
        solver.setSolutions(board.getSolutionsStr());
        solver.setCandidates(board.getCandidatesStr());
        solver.solve();
        // TODO : check for solve validity
        let solutions = solver.getSolutions();
        solver.delete();
        for (let cell = 0; cell < solutions.length; cell++) {
            if (board.clues[cell]) continue;
            Board.clearCell(cellEleFromIndex(cell));
            var solution = Number(solutions.charAt(cell)) - 1;
            board.setCellSolution(cell, solution);
        }
        solutions.delete();
        return true;
    }

    stepThroughStrategies(100)
    .then(lastStep => {
        if (lastStep.id === Module.StrategyID.None) {
            Board.writeToOutput("Using brute force to find a unique solution...");
            if (bruteForce()) {
                Board.writeToOutput("Solution found", true);
            } else {
                Board.writeToOutput("Puzzle contains more than one solution", true);
            }
        }
    })
    .catch(e => {
        Board.writeToOutput(e);
    });
}

document.getElementById("solve-button").addEventListener("click", solveBoard);
document.getElementById("step-button").addEventListener("click", stepHandler);