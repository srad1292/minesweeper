let currentState = [];
let mineCount = 0;
let difficulty = 'beginner'

function startGame(rows = 9, columns = 9, mines = 10) {
    /**
     * @type {rows: number, columns: number, mines: number}
     */
    let gameSettings = {
        rows: rows,
        columns: columns,
        mines: mines
    };

    mineCount = mines;

    currentState = buildStartingState(gameSettings);
    setMineCount();
    let ableToStart = placeMines(gameSettings);
    //console.log({gameSettings});
    //console.log({currentState});
    if(ableToStart) {
        placeNumbers(gameSettings, currentState);
        buildDisplay(currentState, gameSettings);
    } else {
        askToTryAgain();
    }
}

function askToTryAgain() {
    let response = confirm("Setup failed.  Try again?");
    if( response === true ) {
        restart();
    }
}

function buildStartingState(gameSettings) {
    let board = [];
    for(let rowIndex = 0; rowIndex < gameSettings.rows; rowIndex++) {
        let row = [];
        for(let columnIndex = 0; columnIndex < gameSettings.columns; columnIndex++) {
            row.push({value: " ", display: " ", isRevealed: false});
        }
        board.push(row);
    }

    return board;
}

function setMineCount() {
    let flagCount = document.getElementById("flag-count");
    flagCount.innerHTML = `Mines: ${mineCount}`;
}

function placeMines(gameSettings) {
    let randomChance = (gameSettings.rows * gameSettings.columns / gameSettings.mines) + 1;
    let randomMineResult;
    let shouldPlaceMine = false;
    let minesToPlace = mineCount;
    let row = 0;
    let column = 0;
    let pass = 0;

    while(minesToPlace > 0 && pass < 12) {
        if(currentState[row][column].value === ' ') {
            randomMineResult = Math.floor(Math.random() * randomChance);
            shouldPlaceMine = randomMineResult === 1;
            if(shouldPlaceMine) {
                let canPlaceMine = checkIfSquareCanBeBomb(row, column, gameSettings);
                if(!canPlaceMine) {
                    let adjacent = [...getBeforeIndices(row, column, gameSettings), ...getAfterIndices(row, column, gameSettings)];
                    let markSafeSet = adjacent[Math.floor(Math.random() * adjacent.length)];
                    if(currentState[markSafeSet[0]][markSafeSet[1]].value === "B") {
                        minesToPlace++;
                    }
                    currentState[markSafeSet[0]][markSafeSet[1]].value = "S";
                }
                currentState[row][column].value = "B";
                minesToPlace--;
            }
        }
        column = column === gameSettings.columns-1 ? 0 : column + 1;
        if(column === 0) {
            row = row === gameSettings.rows-1 ? 0 : row + 1;
        }

        if(row === 0 && column === 0) {
            pass+=1;
        }
    }

    return minesToPlace === 0 && pass < 12;
}

function getBeforeIndices(row, column, gameSettings) {
    let adjacentIndices = [];
    if(row > 0) {
        if(column > 0) {
            adjacentIndices.push([row-1, column-1]);
        }
        adjacentIndices.push([row-1, column]);
        if(column < gameSettings.columns-1) {
            adjacentIndices.push([row-1, column+1]);
        }
    }

    if(column > 0) {
        adjacentIndices.push([row, column-1]);
    }
    return adjacentIndices
}

function getAfterIndices(row, column, gameSettings) {
    let adjacentIndices = [];
    if(column < gameSettings.columns-1) {
        adjacentIndices.push([row, column+1]);
    }

    if(row < gameSettings.rows-1) {
        if(column > 0) {
            adjacentIndices.push([row+1, column-1]);
        }
        adjacentIndices.push([row+1, column]);
        if(column < gameSettings.columns-1) {
            adjacentIndices.push([row+1, column+1]);
        }
    }

    return adjacentIndices;
}

function checkIfSquareCanBeBomb(row, column, gameSettings) {
    let beforeIndices = getBeforeIndices(row, column, gameSettings);
    let afterIndices = getBeforeIndices(row, column, gameSettings);
    
    let freeBeforeSpace = false;
    beforeIndices.forEach(indexSet => {
        if(currentState[indexSet[0]][indexSet[1]].value === " ") {
            freeBeforeSpace = true;
        }
    });

    let afterMarkedSafe = false; 
    afterIndices.forEach(indexSet => {
        if(currentState[indexSet[0]][indexSet[1]].value === "S") {
            afterMarkedSafe = true;
        }
    });

    return freeBeforeSpace || afterMarkedSafe;
}

function placeNumbers(gameSettings, currentState) {
    currentState.forEach((stateRow, rowIndex) => {
        stateRow.forEach((stateElement, elementIndex) => {
            if(stateElement.value === "B") {
                return;
            }
            let bombCount = 0;
            let adjacent = [...getBeforeIndices(rowIndex, elementIndex, gameSettings), ...getAfterIndices(rowIndex, elementIndex, gameSettings)];
            adjacent.forEach(indexSet => {
                if(currentState[indexSet[0]][indexSet[1]].value === "B") {
                    bombCount++;
                }
            });
            stateElement.value = bombCount === 0 ? " " : bombCount; 
        });
    });
}

function buildDisplay(currentState, gameSettings) {
    let board = document.getElementById("board");

    currentState.forEach((stateRow, rowIndex) => {
        var row = document.createElement("div");
        row.className = "row";
        stateRow.forEach((stateElement, elementIndex) => {
            var square = document.createElement("div");
            square.innerHTML = currentState[rowIndex][elementIndex].display;
            square.id = `${rowIndex}-${elementIndex}`;
            var classes = ['square', 'not-revealed'];
            square.classList.add(...classes);

            square.addEventListener("click", function() {
                leftClick(square, rowIndex, elementIndex, gameSettings)
            });

            square.addEventListener("contextmenu", function(event) {
                event.preventDefault();
                rightClick(square, rowIndex, elementIndex)
            });

            row.appendChild(square);
        });
        board.appendChild(row);
    });
}

function leftClick(square, rowIndex, elementIndex, gameSettings) {
    if(currentState[rowIndex][elementIndex].display !== " ") { return; }

    currentState[rowIndex][elementIndex].isRevealed = true;
    let value = currentState[rowIndex][elementIndex].value;
    currentState[rowIndex][elementIndex].display = value;
    square.innerHTML = value;
    let classes = [];
    square.classList.remove('not-revealed');

    if(value === "B") {
        classes = ["revealed", "black", "boom"];
        square.classList.add(...classes);
        setTimeout(function() {
            gameLost();
        }, 0);
        return;
    }

    let color = getColor(value);
    
    classes = [color, 'revealed'];
    square.classList.add(...classes);

    if(value === " ") {
        revealAdjacent(rowIndex, elementIndex, gameSettings);
    }

    if(mineCount === 0) {
        checkIfGameWon(currentState);
    }
}

function revealSquare(rowIndex, columnIndex, gameSettings) {
    currentState[rowIndex][columnIndex].isRevealed = true;
    let value = currentState[rowIndex][columnIndex].value;
    currentState[rowIndex][columnIndex].display = value;
    let square = document.getElementById(`${rowIndex}-${columnIndex}`);
    square.innerHTML = value;
    let classes = [];
    square.classList.remove('not-revealed');

    let color = getColor(value);
    
    classes = [color, 'revealed'];
    square.classList.add(...classes);

    if(value === " ") {
        revealAdjacent(rowIndex, columnIndex, gameSettings);
    }
}

function revealAdjacent(rowIndex, columnIndex, gameSettings) {
    let maxRow = gameSettings.rows-1;
    let maxColumn = gameSettings.columns-1;

    if(rowIndex > 0 && columnIndex > 0 && currentState[rowIndex-1][columnIndex-1].isRevealed === false) {
        revealSquare(rowIndex-1, columnIndex-1, gameSettings);
    }
    if(rowIndex > 0 && currentState[rowIndex-1][columnIndex].isRevealed === false) {
        revealSquare(rowIndex-1, columnIndex, gameSettings);
    }
    if(rowIndex > 0 && columnIndex < maxColumn && currentState[rowIndex-1][columnIndex+1].isRevealed === false) {
        revealSquare(rowIndex-1, columnIndex+1, gameSettings);
    }
    if(columnIndex > 0 && currentState[rowIndex][columnIndex-1].isRevealed === false) {
        revealSquare(rowIndex, columnIndex-1, gameSettings);
    }
    if(columnIndex < maxColumn && currentState[rowIndex][columnIndex+1].isRevealed === false) {
        revealSquare(rowIndex, columnIndex+1, gameSettings);
    }
    if(rowIndex < maxRow && columnIndex > 0 && currentState[rowIndex+1][columnIndex-1].isRevealed === false) {
        revealSquare(rowIndex+1, columnIndex-1, gameSettings);
    }
    if(rowIndex < maxRow && currentState[rowIndex+1][columnIndex].isRevealed === false) {
        revealSquare(rowIndex+1, columnIndex, gameSettings);
    }
    if(rowIndex < maxRow && columnIndex < maxColumn && currentState[rowIndex+1][columnIndex+1].isRevealed === false) {
        revealSquare(rowIndex+1, columnIndex+1, gameSettings);
    }
}

function getColor(value) {
    let color = "";
    switch(value) {
        case 1:
            color = "blue";
            break;
        case 2:
            color = "green";
            break;
        case 3:
            color = "red";
            break;
        case 4:
            color = "yellow";
            break;
        case 5:
            color = "purple";
            break;
        case 6:
            color = "orange";
            break;
        case 7:
            color = "dark-red";
            break;
        case 8:
            color = "dark-green";
            break;
        default:
            color = "black";
            break;
    }
    return color;
}

function rightClick(square, rowIndex, elementIndex) {
    if(currentState[rowIndex][elementIndex].isRevealed) { return; }


    let currentDisplay = currentState[rowIndex][elementIndex].display; 
    let newDisplay = "";
    if(currentDisplay === " ") {
        square.classList.add("black");
        newDisplay = "F";
        mineCount -= 1;
    } else if(currentDisplay === "F") {
        newDisplay = "?";
        mineCount += 1;
    } else {
        newDisplay = " ";
        square.classList.remove("black");
    }

    setMineCount();
    currentState[rowIndex][elementIndex].display = newDisplay;
    square.innerHTML = newDisplay;
    if(mineCount === 0) {
        checkIfGameWon(currentState);
    }
}

function checkIfGameWon(currentState) {
    let gameComplete = true;
    currentState.forEach((stateRow, rowIndex) => {
        stateRow.forEach((stateElement, elementIndex) => { 
            if(stateElement.isRevealed === false && stateElement.display !== 'F' ) {
                gameComplete = false;
            }
        });
    });

    if(gameComplete) {
        setTimeout(function() {
            finishGame();
        }, 0);
    }
}

function gameLost() {
    let board = document.getElementById("board");
    board.classList.add("disabled");
    alert("Sorry, you lost!");
}

function finishGame() {
    alert("You Won!");
}

function restart() {
    let board = document.getElementById("board");
    board.classList.remove("disabled");
    board.innerHTML = "";
    if(difficulty === 'beginner') {
        startGame(9, 9, 10);
    } else if(difficulty === 'intermediate') {
        startGame(16, 16, 40);
    } else if(difficulty === 'expert') {
        startGame(16, 30, 99);
    }
}

function changeDifficulty() {
    let difficultyElement = document.getElementById("difficulty");
    difficulty = difficultyElement.value;
}


startGame(9, 9, 10);