var sudokuBoard = document.getElementById("sudoku-board-container");
var boardData;

/* prevent non-numeric input from displaying, delegate event to sudokuBoard */
sudokuBoard.addEventListener("keydown", function (e) {
    if (e.key.length === 1 && /\D/.test(e.key) && !e.ctrlKey) {
        e.preventDefault();
    }
});

/* prevent invalid numeric from displaying, delegate event to sudokuBoard */
sudokuBoard.addEventListener("change", function (e) {
    if (e.target.value > 9) e.target.value = "";
});

function readBoardInput(form) {
    var array = Array(81).fill('0');
    var cellInputs = form.querySelectorAll("input");
    cellInputs.forEach(function (cell) {
        let index = parseInt(cell.id, 10);
        if (cell.value) array[index] = cell.value;
    });
    boardData = array.join('');
    console.log(boardData);
}

function fillBoard(data) {
    var cellInputs = sudokuBoard.querySelectorAll("input");
    cellInputs.forEach(function (cell) {
        let index = parseInt(cell.id, 10);
        if (data[index]) cell.value = data[index];
    });
}

function solveBoard() {
    /* Read data */
    var sudokuBoardForm = document.getElementById("sudoku-board-form");
    readBoardInput(sudokuBoardForm);

    /* Solve */
    var instance = new Module.sudokuBoard();
    instance.fillData(boardData);
    console.log(boardData);
    instance.solve();

    /* Set data */
    boardData = instance.getData();
    instance.delete();

    /* Display data on board */
    fillBoard(boardData);
}





//var getDataButton = document.getElementById("getDataButton");
//var solveButton = document.getElementById("solveButton");


//getDataButton.addEventListener("click", function () {
//    var sudokuBoardForm = document.getElementById("sudoku-board-form");
//    readBoardInput(sudokuBoardForm);
//});

//solveButton.addEventListener("click", function (e) {
//    var instance = new Module.sudokuBoard();
//    instance.fillData(boardData);
//    console.log(boardData);
//    instance.solve();
//    boardData = instance.getData();
//    instance.delete();
//    console.log(boardData);
//    fillBoard(boardData);
//});

document.getElementById("solveButton").addEventListener("click", solveBoard);