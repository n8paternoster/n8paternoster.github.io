var sudokuBoard = document.getElementById("sudoku-board");
var boardData;

function cellFromIndex(index) {
    if (index < 0 || index > 80) return null;
    let id = ((index < 10) ? "0" : "") + index.toString();
    return sudokuBoard.querySelector("[id='" + id + "']");
}

function handleKey(e) {
    const tabKeys = ["Tab", "Enter", " "];
    const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (tabKeys.includes(e.key)) {
        /* tab forward or backward to a sequential cell */
        e.preventDefault();
        let index = parseInt(e.target.id, 10);
        let newIndex = e.shiftKey ? index - 1 : (index + 1) % 81;
        if (newIndex < 0) newIndex = 80;
        cellFromIndex(newIndex).select();
    } else if (arrowKeys.includes(e.key)) {
        /* navigate to an adjacent cell */
        e.preventDefault();
        let index = parseInt(e.target.id, 10);
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
    } else if (e.key.length === 1 && /\D/.test(e.key) && !e.ctrlKey) {
        /* prevent invalid input from displaying */
        e.preventDefault();
    }
}

/* prevent non-numeric input from displaying, handle tab presses */
sudokuBoard.addEventListener("keydown", handleKey);

/* auto tab after a number is entered */
sudokuBoard.addEventListener("input", function (e) {
    if (e.target.value.length === 1) {
        if (e.target.value === '0') e.target.value = "";
        let index = parseInt(e.target.id, 10);
        let newIndex = (index + 1) % 81;
        cellFromIndex(newIndex).select();
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

document.getElementById("solve-button").addEventListener("click", solveBoard);
document.getElementById("clear-button").addEventListener("click", clearBoard);