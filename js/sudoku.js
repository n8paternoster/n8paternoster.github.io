var sudokuBoard = document.getElementById("sudoku-board-container");
var boardData;

/* prevent non-numeric input from displaying, handle tab presses */
sudokuBoard.addEventListener("keydown", function (e) {
    if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        let index = parseInt(e.target.id, 10);
        index = (index + 1) % 81;
        let nextCell = ((index < 10) ? "0" : "") + index.toString();
        sudokuBoard.querySelector("[id='" + nextCell + "']").focus();
        return;
    }
    else if (e.key.length === 1 && /\D/.test(e.key) && !e.ctrlKey) {
        e.preventDefault();
    }
});

/* prevent invalid numeric from displaying, delegate event to sudokuBoard */
sudokuBoard.addEventListener("change", function (e) {
    if (e.target.value > 9) e.target.value = "";
});

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

document.getElementById("solveButton").addEventListener("click", solveBoard);
document.getElementById("clearButton").addEventListener("click", clearBoard);