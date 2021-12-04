var sudokuBoard = document.getElementById("sudoku-board-container");
var boardData;

/* return the input element for the next sequential cell */
function nextCell(id) {
    let index = parseInt(id, 10);
    index = (index + 1) % 81;
    let nextID = ((index < 10) ? "0" : "") + index.toString();
    return sudokuBoard.querySelector("[id='" + nextID + "']");
}

/* prevent non-numeric input from displaying, handle tab presses */
sudokuBoard.addEventListener("keydown", function (e) {
    if (e.key === "Tab" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nextCell(e.target.id).select();
        return;
    }
    else if (e.key.length === 1 && /\D/.test(e.key) && !e.ctrlKey) {
        e.preventDefault();
    }
});

/* auto tab after a number is entered */
sudokuBoard.addEventListener("input", function (e) {
    if (e.target.value.length === 1) {
        if (e.target.value === '0') e.target.value = "";
        nextCell(e.target.id).select();
    }
});
/* prevent invalid numeric from displaying */
sudokuBoard.addEventListener("change", function (e) {
    if (e.target.value.length > 1) e.target.value = "";
});
/* highlight text when cell is selected */
sudokuBoard.addEventListener("click", function (e) {
    if (e.target.tagName === "INPUT") {
        e.stopPropagation();
        e.target.select();
    }
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