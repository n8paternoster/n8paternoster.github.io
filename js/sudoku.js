var sudokuBoard = document.getElementById("sudoku-board-container");

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