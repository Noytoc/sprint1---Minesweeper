'use strict'

const MINE = '💣'
const VICTORY = '😎' 
const LOOSE = '☠' 
const SMILEYFACE = '🙂'

var gBoard
var gGameInterval = null



//full game object
const gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0,
    cellsToWin: 0
}

//level of game
var gLevel = {
    SIZE: 4,
    MINES: 2
}


//Builds the board and set some mines
function buildBoard(size) {
    var board = []
    for (var i = 0; i < size; i++) {
        board[i] = []
        for (var j = 0; j < size; j++) {
            var cell = {
                minesAroundCount: 0,
                isRevealed: false,
                isMine: false,
                isMarked: false,
                toDisplay: 0,
                neighbors: [],
                i: i,
                j: j
            }
            board[i][j] = cell

        }
    }
    board[0][2].isMine = true
    board[1][2].isMine = true
    gBoard = board
    return board
}

// called when page loads or game restarts
function onInit() {
    chooseLevel()
    gGame.revealedCount = 0
    gGame.markedCount = 0,
        gGame.secsPassed = 0,
        gGame.cellsToWin = 0
    stopTimer()
    document.querySelector('.time-value').textContent = 0
    gBoard = buildBoard(gLevel.SIZE)
    setMinesNegsCount(gBoard)


    // createCells()
    console.table(gBoard)
    renderBoard(gBoard)
    gGame.isOn = true
}

//level of game - user has to choose, unless intermidiate
function chooseLevel() {
    //logic.. 
    gLevel.SIZE = 4
    gLevel.MINES = 2
    return gLevel
}

function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]
            const className = `cell cell-${i}-${j} covered`

            strHTML += `<td class="cell cell-${i}-${j} covered"
              onclick="onCellClicked(this, ${i}, ${j})"
              oncontextmenu="onCellMarked(this, ${i}, ${j}); return false;">
            </td>`;


        }
        strHTML += '</tr>'

    }
    document.querySelector('.board').innerHTML = strHTML
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            renderCell(i, j)

        }

    }
}



function renderCell(i, j) {
    var cell = gBoard[i][j]
    const elCell = document.querySelector(`.cell-${i}-${j}`)
    if (cell.isRevealed) {
        elCell.classList.remove('covered')
        elCell.classList.add('revealed')
        elCell.textContent = cell.toDisplay
    } else {
        elCell.classList.remove('revealed')
        elCell.classList.add('covered')
        elCell.textContent = ''
    }
}


function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return
    if (!gGameInterval) startTimer()
    var cell = gBoard[i][j]
    if (cell.isRevealed || cell.isMarked) return
    cell.isRevealed = true
    renderCell(i, j)
    if (cell.isMine) {
        gameOver()
        return
    }
    if (cell.minesAroundCount === 0) {
        var neig = cell.neighbors
        for (var k = 0; k < neig.length; k++) {
            if (!neig[k].isRevealed) {
                neig[k].isRevealed = true
                renderCell(neig[k].i, neig[k].j)
            }
        }
    }

}

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    var cell = gBoard[i][j]
    if (cell.isRevealed || cell.isMarked) return
    cell.isMarked = true
    renderMarkedCell(i, j)
    setTimeout(() => {
        unMarkCell(cell.i, cell.j)
    }, 1200)
}

function renderMarkedCell(i, j) {
    var cell = gBoard[i][j]
    const elCell = document.querySelector(`.cell-${i}-${j}`)

    elCell.classList.remove('unMarked')
    elCell.classList.add('marked')
    elCell.textContent = cell.toDisplay
}
function unMarkCell(i, j) {
    const elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.classList.remove('marked')
    elCell.classList.add('unMarked')
    gBoard[i][j].isMarked = false
    renderCell(i, j)

}


// count mines around each cell and set cell's minesAroundCount
function setMinesNegsCount(board) {
    var size = board.length
    for (var i = 0; i < size; i++) {
        var row = board[i]
        for (var j = 0; j < size; j++) {
            var cell = row[j]
            var counter = 0
            cell.neigbhors = []
            for (var k = i - 1; k <= i + 1; k++) {
                for (var l = j - 1; l <= j + 1; l++) {
                    if (k < 0 || k >= size || l < 0 || l >= size) continue
                    if (k === i && l === j) continue
                    cell.neighbors.push(board[k][l])
                    if (board[k][l].isMine) counter++
                }
            }
            cell.minesAroundCount = counter
            cell.toDisplay = (cell.isMine) ? MINE : (counter === 0) ? '' : cell.minesAroundCount + ''
        }
    }
}

function startTimer() {
    if (gGameInterval) return
    gGameInterval = setInterval(() => {
        gGame.secsPassed++
        document.querySelector('.time-value').innerText = gGame.secsPassed
    }, 1000)
}

function stopTimer() {
    if (!gGameInterval) return
    clearInterval(gGameInterval)
    gGameInterval = null
}

function gameOver() {
    gGame.isOn= false
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j]
            cell.isRevealed = true
            renderCell(i, j)
        }
    }
    
    
}