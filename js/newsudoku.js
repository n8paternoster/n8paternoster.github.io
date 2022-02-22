var sudokuBoard = document.getElementById("sudoku-board");

const newSavedPuzzles = new Map([
    ["Custom", "000000000000000000000000000000000000000000000000000000000000000000000000000000000"],
    ["Easy 1", "270306009040015027008090400750000004029000760800000092002030500190650040600204018"],
    ["Medium 1", "002608100000143000030000060097804520100000008085706910020000030000279000004301700"],
    ["Hard 1", "320000040004500200000000070075010068000409000280070310030000000008002100060000052"],
    ["Evil 1", "963000000100008000000205000040800000010000700000030025700000030009020407000000900"],
    ["Evil 2", "097035000801000005000080960000840500200501008005072000029010000500000104000350270"],
    ["Pointing Pairs", "500200040000603000030009007003007000007008000600000020080000003000400600000100500"],
    ["Hidden Quad",
      "000007095000001000860020000020073008500000060003004900305000417240000000000000000"],
    ["X-Wings", "100200300300400500006007002007002005000000000500300100800100200002003001005008006"],
    ["Minimum Clue Easy", "000870200640200000050000000807000300000051000000000000300700000000000051000000040"],
    ["Minimum Clue Hard", "002090300805000000100000000090060040000000058000000001070000200300500000000100000"],
]);
var currentPuzzle = "Easy 1"; /* default puzzle */

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
            if (val >= '1' && val <= '9') {
                this.clues[cell] = Number(val);
                this.cellSolutions[cell] = Number(val);
                this.cellCandidates[cell].fill(0);  // remove candidates from this cell
                Board.drawCellSolution(cellEleFromIndex(cell), val, true);
                Board.lockCell(cellEleFromIndex(cell));
            } else {
                this.clues[cell] = 0;
                // add candidates?
                Board.unlockCell(cellEleFromIndex(cell));
            }
        }
    }
    setData(solutionsStr, candidatesStr = Array(Board.numCells * Board.N + 1).join('0')) {
        if (solutionsStr == null || solutionsStr.length != Board.numCells) return;
        if (candidatesStr == null || candidatesStr.length != Board.numCells * Board.N) return;
        this.resetStep();    // invalidate step data
        for (var cell = 0; cell < Board.numCells; cell++) {
            if (this.clues[cell] >= '1' && this.clues[cell] <= '9') continue;
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
    fillEmptyCells() {
        let cellsFilled = false;
        for (let cell = 0; cell < Board.numCells; cell++) {
            if (this.cellSolutions[cell] || this.cellCandidates[cell].some(can => can == 1)) continue;
            else {
                for (let can = 0; can < Board.N; can++)
                    this.setCellCandidate(cell, can, true);
                cellsFilled = true;
            }
        }
        return cellsFilled;
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
            customEditor.classList.add("show-overflow");
        } else {
            customEditor.style.maxHeight = 0;
            customEditor.classList.remove("show-overflow");
        }
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
    static writeToOutput(string, bold = false) {
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
    static showLoader() {
        let loader = document.getElementById("strategy-loader");
        if (loader) {
            loader.classList.add("loading");
            //let push = loader.parentElement;
            //push.style.height = push.parentElement.clientHeight + 'px';
            //loader.scrollIntoView();
        }
    }
    static hideLoader() {
        let loader = document.getElementById("strategy-loader");
        if (loader) loader.classList.remove("loading");
    }

    /* Step/Solve */
    solvePath = [];
    solving = false;
    isSolved() {
        for (let i = 0; i < Board.N; i++) {
            let rowCount = Array(Board.N).fill(0);
            let colCount = Array(Board.N).fill(0);
            let boxCount = Array(Board.N).fill(0);
            for (let j = 0; j < Board.N; j++) {
                let rowVal = this.cellSolutions[i * Board.N + j];
                let colVal = this.cellSolutions[j * Board.N + i];
                let boxR = Math.floor(i / 3) * 3 + Math.floor(j / 3);
                let boxC = (i % 3) * 3 + (j % 3);
                let boxVal = this.cellSolutions[boxR * Board.N + boxC];
                if (rowVal < 1 || rowVal > Board.N) return false;
                if (colVal < 1 || colVal > Board.N) return false;
                if (boxVal < 1 || boxVal > Board.N) return false;
                rowCount[rowVal - 1]++;
                colCount[colVal - 1]++;
                boxCount[boxVal - 1]++;
            }
            if (rowCount.some(count => count != 1)) return false;
            if (colCount.some(count => count != 1)) return false;
            if (boxCount.some(count => count != 1)) return false;
        }
        return true;
    }
    resetStep() {
        // delete strategy objects
        while (this.solvePath.length) {
            let strategy = this.solvePath.pop();
            strategy.delete();
        }
        // clear the strategy output
        let outputEle = document.getElementById("strategy-output");
        if (outputEle) {
            outputEle.textContent = "";
            let loadEle = document.createElement("span");
            loadEle.id = "strategy-loader";
            let pushEle = document.createElement("span");
            pushEle.id = "strategy-push";
            pushEle.appendChild(loadEle);
            outputEle.appendChild(pushEle);
        }
        // remove highlighting from the board
        this.removeHighlighting();
    }
    printStrategy(strategy) {
        // Print strategy info to the output box
        if (!strategy) return;
        let outputEle = document.getElementById("strategy-output");
        if (!outputEle) return;
        let pushEle = document.getElementById("strategy-push");
        if (!pushEle) {
            pushEle = document.createElement("span");
            pushEle.id = "strategy-push";
            outputEle.appendChild(pushEle);
        }
        const alphaChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        const numerChar = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

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
            case Module.StrategyID.BoxLine: title += "Box/Line Reduction(s)\r\n"; break;
            case Module.StrategyID.XWing: title += "X-Wing\r\n"; break;
            case Module.StrategyID.Swordfish: title += "Swordfish\r\n"; break;
            case Module.StrategyID.Jellyfish: title += "Jellyfish\r\n"; break;
            case Module.StrategyID.YWing: title += "Bent Triplet (Y-Wing)\r\n"; break;
            case Module.StrategyID.XYZWing: title += "Bent Triplet (XYZ-Wing)\r\n"; break;
            case Module.StrategyID.WXYZWing: title += "Bent Quad (WXYZ-Wing)\r\n"; break;
            case Module.StrategyID.VWXYZWing: title += "Bent Quint (VWXYZ-Wing)\r\n"; break;
            case Module.StrategyID.SinglesChain: title += "Simple coloring\r\n"; break;
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
                {
                    let elims = strategy.eliminations;
                    for (var i = 0; i < elims.size(); i++) {
                        let e = elims.get(i);
                        let string = numerChar[e.candidate] + " removed from " + alphaChar[e.row] + numerChar[e.col] + "\r\n";
                        if (outputEle) {
                            let ele = document.createElement('span');
                            ele.textContent = string;
                            outputEle.insertBefore(ele, pushEle);
                        }
                    }
                    elims.delete();
                    break;
                }
            case Module.StrategyID.NakedSingle:
                // "X is the only candidate left in Y"
                {
                    let singles = strategy.singles;
                    for (let i = 0; i < singles.size(); i++) {
                        let s = singles.get(i);
                        let string = numerChar[s.candidate] + " is the only candidate left in " + alphaChar[Math.floor(s.cell / Board.N)] + numerChar[s.cell % Board.N] + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = string;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    singles.delete();
                    break;
                }
            case Module.StrategyID.HiddenSingle:
                // "X in Y is unique to row/col/box Z"
                {
                    let singles = strategy.singles;
                    for (let i = 0; i < singles.size(); i++) {
                        let s = singles.get(i);
                        let can = "", cell = "", unit = "";
                        can = numerChar[s.candidate];
                        cell = alphaChar[Math.floor(s.cell / Board.N)] + numerChar[s.cell % Board.N];
                        if (s.uniqueRow >= 0 && s.uniqueRow < Board.N)
                            unit += " row " + alphaChar[s.uniqueRow] + ",";
                        if (s.uniqueCol >= 0 && s.uniqueCol < Board.N)
                            unit += " col " + numerChar[s.uniqueCol] + ",";
                        if (s.uniqueBox >= 0 && s.uniqueBox < Board.N)
                            unit += " box " + numerChar[s.uniqueBox] + ",";
                        unit = unit.slice(0, -1);  // remove final comma
                        let string = can + " in " + cell + " is unique to" + unit + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = string;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    singles.delete();
                    break;
                }
            case Module.StrategyID.NakedPair:
            case Module.StrategyID.NakedTriplet:
            case Module.StrategyID.NakedQuad:
            case Module.StrategyID.HiddenPair:
            case Module.StrategyID.HiddenTriplet:
            case Module.StrategyID.HiddenQuad:
                // Naked: "In row/col/box X, cells Y only contain candidates Z:"
                // Hidden: "In row/col/box X, candidates Y can only be found in cells Z:"
                {
                    let naked = (strategy.id === Module.StrategyID.NakedPair || strategy.id === Module.StrategyID.NakedTriplet || strategy.id === Module.StrategyID.NakedQuad);
                    let hidden = (strategy.id === Module.StrategyID.HiddenPair || strategy.id === Module.StrategyID.HiddenTriplet || strategy.id === Module.StrategyID.HiddenQuad);
                    let sets = strategy.sets;
                    for (let i = 0; i < sets.size(); i++) {
                        let set = sets.get(i);
                        let unit = "", cans = "", cells = "";
                        if (set.rows.includes('1')) {
                            unit += "row " + alphaChar[set.rows.indexOf('1')];
                        } else if (set.cols.includes('1')) {
                            unit += "col " + numerChar[set.cols.indexOf('1')];
                        } else if (set.boxes.includes('1')) {
                            unit += "box " + numerChar[set.boxes.indexOf('1')];
                        } else continue;
                        for (let c = 0; c < set.cells.length; c++)
                            if (set.cells[c] === '1') cells += " " + alphaChar[Math.floor(c / Board.N)] + numerChar[c % Board.N] + ",";
                        cells = cells.slice(0, -1);   // remove the final comma
                        for (let c = 0; c < set.candidates.length; c++)
                            if (set.candidates[c] == '1') cans += " " + numerChar[c] + ",";
                        cans = cans.slice(0, -1);  // remove the final comma
                        let string = "";
                        if (naked) string = "In " + unit + ", cells" + cells + " only contain candidates" + cans + ":\r\n";
                        else if (hidden) string = "In " + unit + ", candidates" + cans + " can only be found in cells" + cells + ":\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = string;
                        outputEle.insertBefore(ele, pushEle);
                        // "X removed from Y"
                        let map = new Map();
                        let elims = set.eliminations;
                        for (let i = 0; i < elims.size(); i++) {
                            let e = elims.get(i);
                            let cell = e.row * Board.N + e.col;
                            if (!map.has(cell)) map.set(cell, []);
                            map.get(cell).push(e.candidate);
                        }
                        elims.delete();
                        map.forEach(function (candidates, cell) {
                            let str = "\t";
                            for (let i = 0; i < candidates.length; i++)
                                str += numerChar[candidates[i]] + (i + 1 < candidates.length ? ", " : " ");
                            str += "removed from " + alphaChar[Math.floor(cell / Board.N)] + numerChar[cell % Board.N] + "\r\n";
                            let ele = document.createElement('span');
                            ele.textContent = str;
                            outputEle.insertBefore(ele, pushEle);
                        });
                        set.delete();
                    }
                    sets.delete();
                    break;
                }
            case Module.StrategyID.Pointing:
            case Module.StrategyID.BoxLine:
                // Pointing: "In box X, candidate Y can only be found in row/col Z:"
                // Box/Line: "In row/col X, candidate Y can only be found in box Z:"
                {
                    let sets = strategy.sets;
                    for (let i = 0; i < sets.size(); i++) {
                        let set = sets.get(i);
                        let unit = "", can = "", box = "";
                        if (set.rows.includes('1')) {
                            unit += "row " + alphaChar[set.rows.indexOf('1')];
                        } else if (set.cols.includes('1')) {
                            unit += "col " + numerChar[set.cols.indexOf('1')];
                        } else continue;
                        if (set.boxes.includes('1')) {
                            box += numerChar[set.boxes.indexOf('1')];
                        } else continue;
                        if (set.candidates.includes('1')) {
                            can += numerChar[set.candidates.indexOf('1')];
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
                        let elims = set.eliminations;
                        for (let j = 0; j < elims.size(); j++) {
                            let e = elims.get(j);
                            let str = "\t" + numerChar[e.candidate] + " removed from " + alphaChar[e.row] + numerChar[e.col] + "\r\n";
                            let ele = document.createElement('span');
                            ele.textContent = str;
                            outputEle.insertBefore(ele, pushEle);
                        }
                        elims.delete();
                        set.delete();
                    }
                    sets.delete();
                    break;
                }
            case Module.StrategyID.XWing:
            case Module.StrategyID.Swordfish:
            case Module.StrategyID.Jellyfish:
                // "On rows/cols X, candidate Y can only be found on cols/rows Z:"
                {
                    let sets = strategy.sets;
                    for (let i = 0; i < sets.size(); i++) {
                        let set = sets.get(i);
                        let can = "", units = "", elimUnits = "";
                        if (set.candidates.includes('1')) {
                            can += numerChar[set.candidates.indexOf('1')];
                        } else continue;
                        if (set.elimUnitType === Module.StrategyUnit.Row) {
                            units += "cols";
                            for (let c = 0; c < set.cols.length; c++)
                                if (set.cols[c] == '1') units += " " + numerChar[c] + ",";
                            elimUnits += "rows";
                            for (let r = 0; r < set.rows.length; r++)
                                if (set.rows[r] == '1') elimUnits += " " + alphaChar[r] + ",";
                        } else if (set.elimUnitType === Module.StrategyUnit.Col) {
                            units += "rows";
                            for (let r = 0; r < set.rows.length; r++)
                                if (set.rows[r] == '1') units += " " + alphaChar[r] + ",";
                            elimUnits += "cols";
                            for (let c = 0; c < set.cols.length; c++)
                                if (set.cols[c] == '1') elimUnits += " " + numerChar[c] + ",";
                        } else continue;
                        units = units.slice(0, -1);         // remove final comma
                        elimUnits = elimUnits.slice(0, -1); // remove final comma
                        let string = "On " + units + ", candidate " + can + " can only be found on " + elimUnits + ":\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = string;
                        outputEle.insertBefore(ele, pushEle);
                        // "X removed from Y"
                        let elims = set.eliminations;
                        for (let j = 0; j < elims.size(); j++) {
                            let e = elims.get(j);
                            let str = "\t" + numerChar[e.candidate] + " removed from " + alphaChar[e.row] + numerChar[e.col] + "\r\n";
                            let ele = document.createElement('span');
                            ele.textContent = str;
                            outputEle.insertBefore(ele, pushEle);
                        }
                        elims.delete();
                        set.delete();
                    }
                    sets.delete();
                    break;
                }
            case Module.StrategyID.YWing:
            case Module.StrategyID.XYZWing:
            case Module.StrategyID.WXYZWing:
            case Module.StrategyID.VWXYZWing:
                // "Cells X contain the candidates Y and only candidate Z is in more than 1 unit; therefore one of the yellow Z's must be a solution:"
                // "Cells X contain the candidates Y and all the candidates are restricted to one unit:"
                {
                    let bentSets = strategy.bentSets;
                    for (let i = 0; i < bentSets.size(); i++) {
                        let wing = bentSets.get(i);
                        let cells = "", cans = "";
                        for (let c = 0; c < wing.cells.length; c++)
                            if (wing.cells[c] === '1') cells += " " + alphaChar[Math.floor(c / Board.N)] + numerChar[c % Board.N] + ",";
                        cells = cells.slice(0, -1);   // remove the final comma
                        for (let c = 0; c < wing.candidates.length; c++)
                            if (wing.candidates[c] == '1') cans += " " + numerChar[c] + ",";
                        cans = cans.slice(0, -1);  // remove the final comma
                        let string = "";
                        if (wing.rule === Module.BentsetRule.NonRestCan) {
                            let elimCan = "";
                            if (wing.elimCandidates.includes('1')) {
                                elimCan += numerChar[wing.elimCandidates.indexOf('1')];
                            } else continue;
                            string = "Cells" + cells + " contain" + cans + " and only candidate " + elimCan + " is in more than 1 unit; therefore one of the yellow " + elimCan + "'s must be a solution:\r\n";
                        } else if (wing.rule === Module.BentsetRule.Locked) {
                            string = "Cells" + cells + " contain" + cans + " and every candidate is restricted to one unit:\r\n";
                        } else continue;
                        let ele = document.createElement('span');
                        ele.textContent = string;
                        outputEle.insertBefore(ele, pushEle);
                        // "X removed from Y"
                        let elims = wing.eliminations;
                        for (let j = 0; j < elims.size(); j++) {
                            let e = elims.get(j);
                            let str = "\t" + numerChar[e.candidate] + " removed from " + alphaChar[e.row] + numerChar[e.col] + "\r\n";
                            let ele = document.createElement('span');
                            ele.textContent = str;
                            outputEle.insertBefore(ele, pushEle);
                        }
                        elims.delete();
                        wing.delete();
                    }
                    bentSets.delete();
                    break;
                }
            case Module.StrategyID.SinglesChain:
            case Module.StrategyID.Medusa:
                {
                    let coloring = strategy.coloring;
                    let string = "";
                    if (coloring.rule === Module.ColoringRule.Color) {
                        let can = "", unit = "", elimColor = "red";
                        if (coloring.conflictUnitType === Module.StrategyUnit.Cell)
                            can += "candidates";
                        else if (coloring.conflictCandidates.includes('1'))
                            can += numerChar[coloring.conflictCandidates.indexOf('1')] + "'s";
                        switch (coloring.conflictUnitType) {
                            case Module.StrategyUnit.Row:
                                unit += "row " + alphaChar[coloring.conflictUnit];
                                break;
                            case Module.StrategyUnit.Col:
                                unit += "col " + numerChar[coloring.conflictUnit];
                                break;
                            case Module.StrategyUnit.Box:
                                unit += "box " + numerChar[coloring.conflictUnit];
                                break;
                            case Module.StrategyUnit.Cell:
                                unit += "cell " + alphaChar[Math.floor(coloring.conflictUnit / Board.N)] + numerChar[coloring.conflictUnit % Board.N];
                                break;
                        }
                        string = "All of the " + can + " in " + unit + " can see a " + elimColor + " candidate; all " + elimColor + " candidates can be removed and all green candidates are solutions:\r\n";
                    } else if (coloring.rule === Module.ColoringRule.Candidate) {
                        string = "Either the blue candidates are the solutions or the green candidates are the solutions; some candidates can see both colors and can be removed:\r\n";
                    }
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    let elims = strategy.eliminations;
                    for (let i = 0; i < elims.size(); i++) {
                        let e = elims.get(i);
                        let str = "\t" + numerChar[e.candidate] + " removed from " + alphaChar[e.row] + numerChar[e.col] + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    elims.delete();
                    // "X set to Y"
                    let sols = strategy.solutions;
                    for (let i = 0; i < sols.size(); i++) {
                        let s = sols.get(i);
                        let str = "\t" + alphaChar[s.row] + numerChar[s.col] + " set to " + numerChar[s.candidate] + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    sols.delete();
                    coloring.delete();
                    break;
                }
            case Module.StrategyID.XCycle:
            case Module.StrategyID.AlternatingInferenceChain:
                {
                    let cycle = strategy.cycle;
                    let string = "";
                    if (cycle.rule === Module.CycleRule.Continuous) {
                        string += "The chain implies that either all blue candidates are the solution or all purple candidates are the solution; some candidates can see both colors and can be removed:\r\t";
                    } else {
                        let cell = cycle.discontinuity;
                        let disc = alphaChar[cell.row] + numerChar[cell.col];
                        let can = numerChar[cell.candidate];
                        if (cycle.rule === Module.CycleRule.WeakDiscontinuity)
                            string += "When " + disc + " is set to " + can + " the chain implies that it can't be " + can + ":\r\n";
                        else if (cycle.rule === Module.CycleRule.StrongDiscontinuity)
                            string += "When " + can + " is removed from " + disc + " the chain implies that it must be " + can + ":\r\n";
                    }
                    let ele = document.createElement('span');
                    ele.textContent = string;
                    outputEle.insertBefore(ele, pushEle);
                    // "X removed from Y"
                    let elims = strategy.eliminations;
                    for (let i = 0; i < elims.size(); i++) {
                        let e = elims.get(i);
                        let str = "\t" + numerChar[e.candidate] + " removed from " + alphaChar[e.row] + numerChar[e.col] + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    elims.delete();
                    // "X set to Y"
                    let sols = strategy.solutions;
                    for (let i = 0; i < sols.size(); i++) {
                        let s = sols.get(i);
                        let str = "\t" + alphaChar[s.row] + numerChar[s.col] + " set to " + numerChar[s.candidate] + "\r\n";
                        let ele = document.createElement('span');
                        ele.textContent = str;
                        outputEle.insertBefore(ele, pushEle);
                    }
                    sols.delete();
                    cycle.delete();
                    break;
                }
        }

        // Space between steps
        outputEle.insertBefore(document.createElement('br'), pushEle);

        // Push the details to the top of the output box
        pushEle.style.height = 0;
        titleEle.parentElement.scrollTop = titleEle.offsetTop;
        let offset = parseInt(titleEle.offsetTop - outputEle.scrollTop);
        if (offset > 0) {
            if (pushEle) pushEle.style.height = offset + 'px';
            titleEle.parentElement.scrollTop = titleEle.offsetTop;
        }
    }
    highlightStrategy(strategy) {
        if (!strategy) return;
        // Highlight strategy specific details on board
        switch (strategy.id) {
            case Module.StrategyID.Error: {
                // Highlight error cells
                let errors = strategy.singles;
                for (let i = 0; i < errors.size(); i++) {
                    let e = errors.get(i);
                    Board.highlightCell(cellEleFromIndex(e.cell), 'red');
                }
                errors.delete();
                return;
            }
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
            case Module.StrategyID.BoxLine: {
                // Sets, highlight candidates in each set
                let sets = strategy.sets;
                for (let i = 0; i < sets.size(); i++) {
                    let set = sets.get(i);
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
                    set.delete();
                }
                sets.delete();
                break;
            }
            case Module.StrategyID.XWing:
            case Module.StrategyID.Swordfish:
            case Module.StrategyID.Jellyfish: {
                // Fish, highlight candidates and rows or cols the fish is aligned on
                let sets = strategy.sets;
                for (let i = 0; i < sets.size(); i++) {
                    let fish = sets.get(i);
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
                    fish.delete();
                }
                sets.delete();
                break;
            }
            case Module.StrategyID.YWing:
            case Module.StrategyID.XYZWing:
            case Module.StrategyID.WXYZWing:
            case Module.StrategyID.VWXYZWing: {
                // Bent sets, highlight the cells and elim candidates in the bent set
                let bentSets = strategy.bentSets;
                for (let i = 0; i < bentSets.size(); i++) {
                    let bentSet = bentSets.get(i);
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
                    bentSet.delete();
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
                bentSets.delete();
                break;
            }
            case Module.StrategyID.SinglesChain:
            case Module.StrategyID.Medusa: {
                // Coloring, highlight candidates and connections in the graph, highlight conflict cells/candidates                   
                let canvas = document.getElementById("sudoku-board-canvas");
                let ctx = canvas.getContext('2d');
                let coloring = strategy.coloring;
                // Map the graph's colors to display colors
                let mapColors = ['blue', 'green'];
                let map = new Map();
                let vertices = coloring.vertices;
                for (let i = 0; i < vertices.size(); i++) {
                    let v = vertices.get(i);
                    if (!map.has(v.color) && mapColors.length)
                        map.set(v.color, mapColors.pop());
                }
                // Color vertices
                for (let i = 0; i < vertices.size(); i++) {
                    let v = vertices.get(i);
                    let color = map.get(v.color);
                    if (coloring.rule == Module.ColoringRule.Color)
                        color = (v.color == coloring.solutionColor) ? 'green' : 'red';
                    Board.drawVertex(v.row, v.col, v.candidate, color, ctx);
                }
                vertices.delete();
                // Draw links
                let links = coloring.links;
                for (let i = 0; i < links.size(); i++) {
                    let l = links.get(i);
                    let strong = l.link === Module.Link.Strong;
                    Board.drawLink(l.fromRow, l.fromCol, l.fromCan, l.toRow, l.toCol, l.toCan, strong, ctx);
                }
                links.delete();
                // Color conflict cells/candidates
                let rule = coloring.rule;
                if (rule == Module.ColoringRule.Color) {
                    let conflictColor = 'yellow';
                    let conflictCans = [];
                    for (let can = 0; can < coloring.conflictCandidates.length; can++)
                        if (coloring.conflictCandidates[can] == '1')
                            conflictCans.push(can);
                    for (let cell = 0; cell < coloring.conflictCells.length; cell++) {
                        if (coloring.conflictCells[cell] == '1') {
                            //conflictCans.forEach(can => {
                            //    if (this.cellCandidates[cell][can] == 1)
                            //        Board.drawVertex(Math.floor(cell / Board.N), cell % Board.N, can, conflictColor, ctx);
                            //});
                            Board.highlightCell(cellEleFromIndex(cell), conflictColor);
                        }
                    }
                }
                coloring.delete();
                if (rule === Module.ColoringRule.Candidate) break;
                else return;
            }
            case Module.StrategyID.XCycle:
            case Module.StrategyID.AlternatingInferenceChain: {
                // Cycles, highlight candidates and connections in the graph
                let canvas = document.getElementById("sudoku-board-canvas");
                let ctx = canvas.getContext('2d');
                let cycle = strategy.cycle;
                let rule = cycle.rule;
                let cycleIsDisc = (rule === Module.CycleRule.WeakDiscontinuity || rule === Module.CycleRule.StrongDiscontinuity);
                let disc = cycle.discontinuity;
                let cycleColors = ['blue', 'purple'];
                let colorOne = true;    // alternate colors
                let links = cycle.links;
                for (let i = 0; i < links.size(); i++) {
                    let l = links.get(i);
                    let strong = l.link === Module.Link.Strong;
                    let color = colorOne ? cycleColors[0] : cycleColors[1];
                    if (cycleIsDisc && l.fromRow === disc.row && l.fromCol === disc.col && l.fromCan === disc.candidate) {
                        color = (rule === Module.CycleRule.WeakDiscontinuity) ? 'red' : 'green';
                    } else colorOne = !colorOne;
                    Board.drawVertex(l.fromRow, l.fromCol, l.fromCan, color, ctx);
                    Board.drawLink(l.fromRow, l.fromCol, l.fromCan, l.toRow, l.toCol, l.toCan, strong, ctx);
                }
                links.delete();
                cycle.delete();
                if (rule === Module.CycleRule.Continuous) break;
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
        elims.delete();
        let sols = strategy.solutions;
        for (var i = 0; i < sols.size(); i++) {
            let s = sols.get(i);
            let cellNum = Number(s.row) * Board.N + Number(s.col);
            let canEle = candidateEleFromIndex(cellNum, Number(s.candidate));
            if (canEle) canEle.classList.add("candidate-solution");
        }
        sols.delete();
    }
    removeHighlighting() {
        Board.clearCanvas();
        Array.from(sudokuBoard.querySelectorAll(".cell > input")).forEach(ele => ele.classList.remove("cell-highlighted-red", "cell-highlighted-orange", "cell-highlighted-yellow", "cell-highlighted-green", "cell-highlighted-blue", "cell-highlighted-purple")
        );
        Array.from(sudokuBoard.querySelectorAll('.candidate')).forEach(ele => ele.classList.remove("candidate-solution", "candidate-eliminated", "candidate-highlighted-red", "candidate-highlighted-orange", "candidate-highlighted-yellow", "candidate-highlighted-green", "candidate-highlighted-blue", "candidate-highlighted-purple")
        );
    }
    applyStrategyChanges(strategy) {
        if (!strategy) return;
        let sols = strategy.solutions;
        for (let i = 0; i < sols.size(); i++) {
            let s = sols.get(i);
            let cellNum = Number(s.row) * Board.N + Number(s.col);
            let candidate = Number(s.candidate);
            if (this.cellSolutions[cellNum] == 0) this.setCellSolution(cellNum, candidate);
        }
        sols.delete();
        let elims = strategy.eliminations;
        for (let i = 0; i < elims.size(); i++) {
            let e = elims.get(i);
            let cellNum = Number(e.row) * Board.N + Number(e.col);
            let candidate = Number(e.candidate);
            if (this.cellSolutions[cellNum] == 0) this.setCellCandidate(cellNum, candidate, false);
        }
        elims.delete();
    }
    step() {
        if (this.isSolved() || this.solving) return;
        let numClues = this.cellSolutions.filter(c => (typeof c === 'number') && (c >= 1 && c <= 9)).length;
        if (numClues < 17) {    // minimum for valid sudoku
            Board.writeToOutput("A valid sudoku must contain at least 17 clues", true);
            return;
        }
        let endStrategies = [Module.StrategyID.Solved, Module.StrategyID.Error, Module.StrategyID.None];

        // Handle the previous step
        let prevStep = this.solvePath[this.solvePath.length - 1];
        if (this.solvePath.length === 0) {
            // This is the first step, fill any 0-candidate cells with all candidates
            if (this.fillEmptyCells()) return;
        } else if (!endStrategies.includes(prevStep.id)) {
            this.applyStrategyChanges(prevStep);
            this.removeHighlighting();
        }

        // Asynchronous code
        let getStrategy = () => {
            return new Promise(resolve => {
                Board.showLoader();
                // Get the strategy info for this step
                setTimeout(() => {
                    let solver = new Module.SudokuBoard();
                    if (!solver) {
                        resolve(null);
                        return;
                    }
                    solver.setSolutions(this.getSolutionsStr());
                    solver.setCandidates(this.getCandidatesStr());
                    let strategy = solver.step();
                    solver.delete();
                    resolve(strategy);
                }, 0);
            });
        };
        let showStrategy = (strategy) => {
            Board.hideLoader();
            if (!strategy) return;
            // If no changes were made, return
            if (prevStep && endStrategies.includes(prevStep.id) && prevStep.id === strategy.id) {
                strategy.delete();
                return;
            }
            // Display strategy info
            this.highlightStrategy(strategy);   // on board
            this.printStrategy(strategy);       // in output box
            this.solvePath.push(strategy);
        };
        this.solving = true;
        getStrategy().then(strategy => showStrategy(strategy)).catch(e => console.log(e)).finally(() => this.solving = false);
    }
    solve() {
        if (this.isSolved() || this.solving) return;
        let numClues = this.cellSolutions.filter(c => (typeof c === 'number') && (c >= 1 && c <= 9)).length;
        if (numClues < 17) {    // minimum for valid sudoku
            Board.writeToOutput("A valid sudoku must contain at least 17 clues", true);
            return;
        }
        let solver = new Module.SudokuBoard();
        if (!solver) return null;
        let steps = [];
        const ms = 100;

        var getStrategies = () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    let solutions = this.getSolutionsStr();
                    let candidates = this.getCandidatesStr();
                    let endStrategies = [Module.StrategyID.Solved, Module.StrategyID.Error, Module.StrategyID.None];
                    let counter = 0;
                    const maxSteps = 100;
                    let strategy = null;
                    do {
                        solver.setSolutions(solutions);
                        solver.setCandidates(candidates);
                        strategy = solver.step();
                        solutions = solver.getSolutions();
                        candidates = solver.getCandidates();
                        steps.push(strategy);
                    } while (strategy && !endStrategies.includes(strategy.id) && counter++ < maxSteps);
                    resolve();
                }, 0);
            });
        };
        var runStrategies = () => {
            Board.hideLoader();
            return new Promise(resolve => {
                let s = 0;
                let prev = null;
                let intr = setInterval(() => {
                    if (prev) {
                        this.applyStrategyChanges(prev);
                        this.solvePath.push(prev);
                    }
                    if (s >= steps.length) {
                        resolve(true);
                        clearInterval(intr);
                        return;
                    }
                    let strategy = steps[s];
                    this.removeHighlighting();
                    this.highlightStrategy(strategy);   // on board
                    this.printStrategy(strategy);       // in output box
                    if (strategy.id === Module.StrategyID.Error) {
                        for (; s < steps.length; s++) steps[s].delete();
                        resolve(false);
                        clearInterval(intr);
                        return;
                    }
                    prev = strategy;
                    s++;
                }, ms);
            });
        };
        var verifySolution = (valid) => {
            return new Promise(resolve => {
                if (!valid) resolve(false);
                else if (!this.isSolved()) {
                    Board.writeToOutput("Using brute force to find a unique solution...");
                    setTimeout(() => {
                        solver.setSolutions(this.getSolutionsStr());
                        let found = solver.solve();
                        if (found) {
                            let solutions = solver.getSolutions();
                            for (let cell = 0; cell < solutions.length; cell++) {
                                if (this.clues[cell]) continue;
                                Board.clearCell(cellEleFromIndex(cell));
                                var solution = Number(solutions.charAt(cell)) - 1;
                                this.setCellSolution(cell, solution);
                            }
                            Board.writeToOutput("Solution found", true);
                            resolve(true);
                        } else {
                            Board.writeToOutput("Puzzle contains more than one solution", true);
                            resolve(false);
                        }
                    }, ms);
                } else resolve(true);
            });
        };

        (new Promise(resolve => {
            this.solving = true;
            this.fillEmptyCells();
            Board.showLoader();
            resolve();
        }))
        .then(() => getStrategies())
        .then(() => runStrategies())
        .then((valid) => verifySolution(valid))
        .catch(e => console.log(e))
        .finally(() => {
            this.solving = false;
            solver.delete();
        });
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

    if (window.sessionStorage.getItem("currentPuzzle")) {
        board.loadPuzzle(window.sessionStorage.getItem("currentPuzzle"));
        loadSessionData();
    } else {
        /* load the default puzzle */
        if (!currentPuzzle) currentPuzzle = "Easy Example";
        board.loadPuzzle(currentPuzzle);
        saveSessionData();
    }

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
    //    e.target.id === "digitInputCandidate" ||
    //    e.target.id === "digitInputSolution"
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
    window.sessionStorage.setItem("boardCellSolutions", board.getSolutionsStr());
    window.sessionStorage.setItem("boardCellCandidates", board.getCandidatesStr());
    window.sessionStorage.setItem("userCellSolutions", userData.cellSolutions.join(''));
    window.sessionStorage.setItem("userCellCandidates", userData.cellCandidates.map(cell => cell.join('')).join(''));
}
function loadSessionData() {
    currentPuzzle = window.sessionStorage.getItem("currentPuzzle");
    let solutions = window.sessionStorage.getItem("boardCellSolutions");
    let candidates = window.sessionStorage.getItem("boardCellCandidates");
    board.setData(solutions, candidates);
    userData.cellSolutions = window.sessionStorage.getItem("userCellSolutions").split('').map(Number);
    let userCandidates = window.sessionStorage.getItem("userCellCandidates");
    userData.cellCandidates = Array(Board.numCells);
    for (let cell = 0; cell < Board.numCells; cell++) {
        userData.cellCandidates[cell] = userCandidates.substr(cell * Board.N, Board.N).split('').map(Number);
    }
}

/* ----------------- sudokuBoard handlers ----------------- */

function sudokuBoardHandleClick(e) {
    if (e.target.tagName === "INPUT") {
        e.stopPropagation();    /* prevent document click handler from deselecting digit button */
        let cell = e.target;
        let cellNum = parseInt(cell.id, 10);

        /* digit button is currently selected, set the cell value */
        if (digitInputSelection >= 0 && digitInputSelection <= 9) {
            if (!board.solving) {
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
        if (!board.solving) board.resetCell(index);
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
        while (newCell.classList.contains("cell-input-locked")) {
            /* skip over locked cells */
            newIndex++;
            if (newIndex > 80) return;  /* no unlocked cells */
            newCell = cellEleFromIndex(newIndex);
        }
        newCell.select();
    } else if (e.key === "End") {
        /* navigate to the bottom right cell */
        e.preventDefault();
        let newIndex = 80;
        let newCell = cellEleFromIndex(newIndex);
        while (newCell.classList.contains("cell-input-locked")) {
            /* skip over locked cells */
            newIndex--;
            if (newIndex < 0) return;   /* no unlocked cells */
            newCell = cellEleFromIndex(newIndex);
        }
        newCell.select();
    } else if (e.key === "Escape") {
        /* deselect current cell */
        e.target.blur();
    } else if (board.solving || (e.key.length === 1 && !(/\d/.test(e.key)) && !e.ctrlKey)) {
        /* prevent invalid input from displaying or prevent any input if the board is currently being solved */
        e.preventDefault();
    }
}
function sudokuBoardHandleInput(e) {
    let cell = e.target;
    let cellNum = parseInt(cell.id, 10);
    if (cell.value.length === 1) {
        e.preventDefault();
        /* Set this cell */
        if (!board.solving) {
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
            } else board.resetCell(cellNum);
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
        e.preventDefault();
        if (!board.solving) board.resetCell(cellNum);
    }
}
function sudokuBoardHandlePaste(e) {
    let pastedData = (event.clipboardData || window.clipboardData).getData("text");
    let cell = e.target;
    let cellNum = parseInt(cell.id, 10);
    if (pastedData.length === 1) {
        e.preventDefault();
        /* Set this cell */
        if (!board.solving) {
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
            } else board.resetCell(cellNum);
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
        e.preventDefault();
        if (!board.solving) board.resetCell(cellNum);
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
        } else if (!board.solving) {
            /* otherwise set the cell value */
            if (digit == 0) {
                board.resetCell(cellInputSelection);
            } else if (digit >= 1 && digit <= 9) {
                let val = digit - 1;
                if (digitInputIsSolution) {
                    board.setCellSolution(cellInputSelection, val);
                } else {
                    // set candidate only if no solution in cell
                    if (board.cellSolutions[cellInputSelection] == 0) {
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
    if (button.id === "digitInputSolution") {
        otherButton = button.parentElement.querySelector("[id='digitInputCandidate']");
        digitInputIsSolution = true;
    } else if (button.id === "digitInputCandidate") {
        otherButton = button.parentElement.querySelector("[id='digitInputSolution']");
        digitInputIsSolution = false;
    } else {
        return;
    }
    /* swap which has the active classes */
    otherButton.classList.remove("digit-toggle-active");
    button.classList.add("digit-toggle-active");
}

document.querySelectorAll(".digit-button").forEach(button => {
    button.addEventListener("click", digitInputHandleClick);
});
document.querySelectorAll(".digit-toggle").forEach(button => {
    button.addEventListener("click", digitToggleHandleClick);
});


/* ----------------- Board input handlers ----------------- */

/* ---- Puzzles box ---- */

function puzzleSelectHandler(e) {
    var sel = e.target;
    var puzzle = sel.options[sel.selectedIndex].value;
    board.loadPuzzle(puzzle);
    saveSessionData();
}
function puzzleHelpHandler(e) {
    /* navigate page to help section */
    let help = document.getElementById("sudoku-help");
    if (help) help.scrollIntoView(true);
}
function puzzleRestartHandler(e) {
    board.loadPuzzle(currentPuzzle);
    saveSessionData();
}

document.getElementById("puzzle-select").addEventListener("change", puzzleSelectHandler);
document.getElementById("help-button").addEventListener("click", puzzleHelpHandler);
document.getElementById("restart-button").addEventListener("click", puzzleRestartHandler);

/* ---- Custom board editor ---- */

function customInputHandler(e) {
    let ele = document.getElementById("custom-input");
    if (!ele) return;
    let input = ele.value;
    if (currentPuzzle != "Custom") board.loadPuzzle("Custom");
    if (input.length != Board.numCells) {
        /* display error message */
        let popup = ele.parentElement.querySelector(".text-popup");
        popup.textContent = "Input must contain 81 characters";
        displayTextPopup(popup, 1000);
        return;
    }
    let solutionStr = input.replace(/[^1-9]/g, '0');
    if (solutionStr.split('').every(c => c === '0')) {
        /* display error message */
        let popup = ele.parentElement.querySelector(".text-popup");
        popup.textContent = "Input must contain at least 1 number";
        displayTextPopup(popup, 1000);
        return;
    }
    board.setData(solutionStr);
    ele.value = "";
    saveSessionData();
}
function customClearHandler(e) {
    if (currentPuzzle != "Custom") board.loadPuzzle("Custom");
    board.reset();
    saveSessionData();
}
function customLoadHandler(e) {
    if (currentPuzzle != "Custom") board.loadPuzzle("Custom");
    board.loadUserData();
    saveSessionData();
}
function customSaveHandler(e) {
    if (currentPuzzle != "Custom") board.loadPuzzle("Custom");
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
    if (board) board.step();
}
function solveHandler(e) {
    if (board) board.solve();
}

document.getElementById("solve-button").addEventListener("click", solveHandler);
document.getElementById("step-button").addEventListener("click", stepHandler);