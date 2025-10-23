'use strict'

//global arguments 
const MINE = '💣'
const FLAGGED = '🚩'
var gAwaitFirstClick = false
var gClickedOnMine = false
var gBoard
var gGameInterval = null
var gLivesLeft = 3
var gHintsLeft = 3
var gRequestedHint = false
var gRequestedMegaHint = false
var gUsedMegaHint = false
var gMegaStart = null
var gPendingHintBtnId = null



var gManualMinesTarget = 0
var gManualMinesLeft = 0
var gManualBoard = null
var gActiveBoard = 'main'


//full game object
const gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isManual: false
}

//level of game object
var gLevel = {
    SIZE: 4,
    MINES: 2
}

function onInit() {
    resetHints()
    const imgEl = document.querySelector('.face-button img')
    imgEl.src = 'images/NormalFace.png'
    closeCustomPanel()

    gAwaitFirstClick = true
    gClickedOnMine = false
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    stopTimer()
    document.querySelector('.time-value').textContent = 0
    gLivesLeft = Math.min(3, gLevel.MINES)
    var h1 = document.getElementById('h1')
    var h2 = document.getElementById('h2')
    var h3 = document.getElementById('h3')
    h1 && h1.classList.add('hidden-heart')
    h2 && h2.classList.add('hidden-heart')
    h3 && h3.classList.add('hidden-heart')
    if (gLivesLeft >= 1 && h1) h1.classList.remove('hidden-heart')
    if (gLivesLeft >= 2 && h2) h2.classList.remove('hidden-heart')
    if (gLivesLeft >= 3 && h3) h3.classList.remove('hidden-heart')

    if (gGame.isManual) {
        gManualBoard = buildBoard(gLevel.SIZE)
        gActiveBoard = 'manual'
        gAwaitFirstClick = false
        gGame.isOn = false
        var elLeft = document.getElementById('custom-left')
        if (elLeft) {
            elLeft.classList.remove('hidden')
            elLeft.textContent = `Mines left: ${gManualMinesLeft}`
        }
        renderBoard(gManualBoard)
    } else {
        gBoard = buildBoard(gLevel.SIZE)
        gActiveBoard = 'main'
        gAwaitFirstClick = true
        gGame.isOn = true
        var elLeftHide = document.getElementById('custom-left')
        if (elLeftHide) elLeftHide.classList.add('hidden')
        renderBoard(gBoard)
    }
}

function resetHints() {
    gHintsLeft = 3
    gRequestedHint = false
    gRequestedMegaHint = false
    gUsedMegaHint = false
    gMegaStart = null
    gPendingHintBtnId = null

    var h1img = document.querySelector('#hint1 img')
    var h2img = document.querySelector('#hint2 img')
    var h3img = document.querySelector('#hint3 img')
    var mImg  = document.querySelector('#megaHint img')

    if (h1img) h1img.src = 'images/on.png'
    if (h2img) h2img.src = 'images/on.png'
    if (h3img) h3img.src = 'images/on.png'
    if (mImg)  mImg.src  = 'images/megaHintOn.png'
}



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
    return board
}

function placeMines(board, safeI, safeJ) {
    var amount = gLevel.MINES
    var size = board.length
    var placed = 0
    while (placed < amount) {
        var row = Math.floor(Math.random() * size)
        var col = Math.floor(Math.random() * size)
        if (!gGame.isManual && safeI !== null && safeJ !== null) {
            if (row === safeI && col === safeJ) continue
        }
        if (!board[row][col].isMine) {
            board[row][col].isMine = true
            placed++
        }
    }
}

// count mines around each cell and set cell's minesAroundCount
function setMinesNegsCount(board) {
    var size = board.length
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            var cell = board[i][j]
            var counter = 0
            cell.neighbors = []
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

function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            strHTML += `<td class="cell cell-${i}-${j} covered"
              onclick="onCellClicked(this, ${i}, ${j})"
              oncontextmenu="onCellMarked(this, ${i}, ${j}); return false;">
            </td>`;
        }
        strHTML += '</tr>'
    }

    var targetSel = (gActiveBoard === 'manual') ? '#board-manual' : '#board-main'
    var otherSel = (gActiveBoard === 'manual') ? '#board-main' : '#board-manual'
    var wrapToShow = (gActiveBoard === 'manual') ? 'manual-board-wrap' : 'main-board-wrap'
    var wrapToHide = (gActiveBoard === 'manual') ? 'main-board-wrap' : 'manual-board-wrap'

    document.querySelector(targetSel).innerHTML = strHTML
    document.querySelector(otherSel).innerHTML = ''
    document.getElementById(wrapToShow).classList.remove('hidden')
    document.getElementById(wrapToHide).classList.add('hidden')

    for (var i2 = 0; i2 < board.length; i2++) {
        for (var j2 = 0; j2 < board[0].length; j2++) {
            renderCell(i2, j2)
        }
    }
}


function renderCell(i, j) {
    var board = (gActiveBoard === 'manual') ? gManualBoard : gBoard
    var cell = board[i][j]
    var boardSel = (gActiveBoard === 'manual') ? '#board-manual' : '#board-main'
    var elCell = document.querySelector(boardSel + ' .cell-' + i + '-' + j)
    if (!elCell) return

    if (cell.isRevealed) {
        elCell.classList.remove('covered')
        elCell.classList.add('revealed')
        elCell.textContent = cell.toDisplay
    } else {
        elCell.classList.remove('revealed')
        elCell.classList.add('covered')
        if (gActiveBoard === 'manual' && cell.isMine) {
            elCell.textContent = MINE
            elCell.classList.add('marked')
        } else {
            elCell.textContent = cell.isMarked ? FLAGGED : ''
            elCell.classList.remove('marked')
        }
    }
}


function onCellClicked(elCell, i, j) {
    if (gRequestedMegaHint) {
        if (!gMegaStart) {
            gMegaStart = { i: i, j: j }
            return
        } else {
            getMegaHint(gMegaStart.i, gMegaStart.j, i, j)
            gRequestedMegaHint = false
            gUsedMegaHint = true
            gMegaStart = null
            var mh = document.getElementById('megaHint')
            if (mh) mh.querySelector('img').src = 'images/megaHintOff.png'
            return
        }
    }

    if (gRequestedHint) {
        getHint(i, j)
        gRequestedHint = false
        gHintsLeft--
        if (gPendingHintBtnId) {
            var hb = document.getElementById(gPendingHintBtnId)
            if (hb) hb.querySelector('img').src = 'images/off.png'
            gPendingHintBtnId = null
        }
        return
    }

    if (gActiveBoard === 'manual') return
    if (!gGame.isOn) return

    if (gAwaitFirstClick && !gGame.isManual) {
        placeMines(gBoard, i, j)
        setMinesNegsCount(gBoard)
        gAwaitFirstClick = false
    }

    if (!gGameInterval) startTimer()

    var cell = gBoard[i][j]
    if (cell.isRevealed || cell.isMarked) return

    if (cell.isMine) {
        onHitMine(i, j)
        return
    }


    cell.isRevealed = true
    gGame.revealedCount += 1
    renderCell(i, j)

    if (cell.minesAroundCount === 0) {
        var neig = cell.neighbors
        for (var k = 0; k < neig.length; k++) {
            var n = neig[k]
            if (!n.isRevealed && !n.isMine && !n.isMarked) {
                n.isRevealed = true
                gGame.revealedCount += 1
                renderCell(n.i, n.j)
            }
        }
    }

    checkGame()
}
function onHitMine(i, j) {
    var heartEl
    if (gLivesLeft <= 0) return

    gLivesLeft--

    if (gLivesLeft === 2) heartEl = document.getElementById('h3')
    else if (gLivesLeft === 1) heartEl = document.getElementById('h2')
    else heartEl = document.getElementById('h1')

    heartEl && heartEl.classList.add('hidden-heart')

    gBoard[i][j].isRevealed = true
    renderCell(i, j)
    setTimeout(function () {
        gBoard[i][j].isRevealed = false
        renderCell(i, j)

        if (gLivesLeft === 0) {
            gClickedOnMine = true
            gameOver()
        }
    }, 700)
}



function onCellMarked(elCell, i, j) {

    if (gActiveBoard === 'manual') {
        var cellM = gManualBoard[i][j]
        if (cellM.isRevealed) return

        if (!cellM.isMine && gManualMinesLeft > 0) {
            cellM.isMine = true
            gManualMinesLeft--

        } else if (cellM.isMine) {
            cellM.isMine = false
            gManualMinesLeft++
        }

        var elLeft2 = document.getElementById('custom-left')
        if (elLeft2) {
            elLeft2.classList.remove('hidden')
            elLeft2.textContent = 'Mines left: ' + gManualMinesLeft
        }


        var el = document.querySelector('.cell-' + i + '-' + j)
        if (cellM.isMine) {
            el.textContent = MINE
            el.classList.add('marked')
            el.classList.remove('revealed')
            el.classList.add('covered')
        } else {
            el.textContent = ''
            el.classList.remove('marked')
            el.classList.remove('revealed')
            el.classList.add('covered')
        }


        if (gManualMinesLeft === 0) {
            setMinesNegsCount(gManualBoard)
            renderBoard(gManualBoard)

            setTimeout(function () {
                gBoard = buildBoard(gLevel.SIZE)
                for (var r = 0; r < gLevel.SIZE; r++) {
                    for (var c = 0; c < gLevel.SIZE; c++) {
                        gBoard[r][c].isMine = gManualBoard[r][c].isMine
                    }
                }
                setMinesNegsCount(gBoard) 

                gActiveBoard = 'main'
                gGame.isManual = false
                gGame.isOn = true
                gAwaitFirstClick = false

                var cp = document.getElementById('custom-panel')
                if (cp) cp.classList.add('hidden')
                var cl = document.getElementById('custom-left')
                if (cl) cl.classList.add('hidden')

                renderBoard(gBoard)
            }, 1000)
        }
        return
    }


    if (!gGame.isOn) return
    var cell = gBoard[i][j]
    if (cell.isRevealed) return
    cell.isMarked = !cell.isMarked
    gGame.markedCount += cell.isMarked ? 1 : -1
    renderCell(i, j)
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

//timers
function startTimer() {
    if (gGameInterval) return
    gGameInterval = setInterval(function () {
        gGame.secsPassed++
        document.querySelector('.time-value').innerText = gGame.secsPassed
    }, 1000)
}

function stopTimer() {
    if (!gGameInterval) return
    clearInterval(gGameInterval)
    gGameInterval = null
}

function resetLives() {
    var h1 = document.getElementById('h1')
    var h2 = document.getElementById('h2')
    var h3 = document.getElementById('h3')
    if (h1) h1.classList.remove('hidden-heart')
    if (h2) h2.classList.remove('hidden-heart')
    if (h3) h3.classList.remove('hidden-heart')
}

function updateLives() {
    var h1 = document.getElementById('h1')
    var h2 = document.getElementById('h2')
    var h3 = document.getElementById('h3')
    if (h1) h1.classList.toggle('hidden-heart', gLivesLeft < 3)
    if (h2) h2.classList.toggle('hidden-heart', gLivesLeft < 2)
    if (h3) h3.classList.toggle('hidden-heart', gLivesLeft < 1)
}


//check and end game
function checkGame() {
    var tableSize = (gLevel.SIZE * gLevel.SIZE) - gLevel.MINES
    if (tableSize === gGame.revealedCount) {
        gameOver()
    }
    return
}

function gameOver() {
    gGame.isOn = false
    stopTimer()
    const imgEl = document.querySelector('.face-button img')

    if (!gClickedOnMine) {
        imgEl.src = 'images/win.png'
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard.length; j++) {
                gBoard[i][j].isRevealed = true
                renderCell(i, j)
            }
        }

    } else {
        imgEl.src = 'images/loose.png'
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard.length; j++) {
                if (gBoard[i][j].isMine) {
                    gBoard[i][j].isRevealed = true
                    renderCell(i, j)
                }
            }
        }
    }
}

//levels control 
function hideShowLevelMenu() {
    var menu = document.querySelector('.level-menu')
    menu.classList.toggle('hidden')
}

function setLevel(level) {
    var cp = document.getElementById('custom-panel')
    if (cp) cp.classList.add('hidden')
    var cl = document.getElementById('custom-left')
    if (cl) cl.classList.add('hidden')

    switch (level) {
        case 'Beginner':
            gGame.isManual = false
            gLevel.SIZE = 4
            gLevel.MINES = 2
            onInit()
            hideShowLevelMenu()
            break;
        case 'Intermediate':
            gGame.isManual = false
            gLevel.SIZE = 8
            gLevel.MINES = 14
            hideShowLevelMenu()
            onInit()
            break;
        case 'Expert':
            gGame.isManual = false
            gLevel.SIZE = 12
            gLevel.MINES = 32
            hideShowLevelMenu()
            onInit()
            break;
        case 'Custom':
            gGame.isManual = false
            hideShowLevelMenu()
            openCustomPanel()
            break;
        case 'Manual':
            gGame.isManual = true
            hideShowLevelMenu()
            openCustomPanel()
            break
    }
}

function openCustomPanel() {
    var cp = document.getElementById('custom-panel')
    if (cp) cp.classList.remove('hidden')
}
function closeCustomPanel() {
    var cp = document.getElementById('custom-panel')
    if (cp) cp.classList.add('hidden')
}

function startCustomPlacement() {
    gGame.isManual = false
    var size = +document.getElementById('custom-size').value
    var mines = +document.getElementById('custom-mines').value
    if (size < 2 || size > 20) return alert('Size must be 2–20')
    if (mines < 1 || mines >= size * size) return alert('Invalid mines count, min is 1')
    gLevel.SIZE = size
    gLevel.MINES = mines
    var cl = document.getElementById('custom-left')
    if (cl) cl.classList.add('hidden')
    onInit()
}

function startManualPlacement() {
    gGame.isManual = true

    var size = +document.getElementById('custom-size').value
    var mines = +document.getElementById('custom-mines').value
    if (size < 2 || size > 20) return alert('Size must be 2–20')
    if (mines < 3) {
        mines = 3
        var mInput = document.getElementById('custom-mines')
        if (mInput) mInput.value = 3
    }
    if (mines < 1 || mines >= size * size) return alert(`Invalid mines count, mines must be 3-${size * size}`)

    gLevel.SIZE = size
    gLevel.MINES = mines

    gManualMinesTarget = mines
    gManualMinesLeft = mines
    var elLeft = document.getElementById('custom-left')
    if (elLeft) {
        elLeft.textContent = `Mines left: ${gManualMinesLeft}`
        elLeft.classList.remove('hidden')
    }
    onInit()
}


function usedHint(hintId) {
    if (hintId === 'megaHint') {
        if (gUsedMegaHint) return
        gRequestedMegaHint = true
        gMegaStart = null
        var el = document.getElementById('megaHint')
        if (el) el.querySelector('img').src = 'images/megaHintOn.png'
        return
    }
    if (gHintsLeft === 0) return
    gRequestedHint = true
    gPendingHintBtnId = hintId
    var el2 = document.getElementById(hintId)
    if (el2) el2.querySelector('img').src = 'images/on.png'
}

//hints 
function getHint(i, j) {
    var cellsToFlip = []
    var size = gBoard.length
    for (var r = i - 1; r <= i + 1; r++) {
        for (var c = j - 1; c <= j + 1; c++) {
            if (r < 0 || r >= size || c < 0 || c >= size) continue
            var cell = gBoard[r][c]
            if (!cell.isRevealed) {
                cell._wasHidden = true
                cell.isRevealed = true
                renderCell(r, c)
                cellsToFlip.push({ i: r, j: c })
            }
        }
    }
    setTimeout(function () {
        for (var idx = 0; idx < cellsToFlip.length; idx++) {
            var pos = cellsToFlip[idx]
            var c2 = gBoard[pos.i][pos.j]
            if (c2._wasHidden) {
                c2.isRevealed = false
                delete c2._wasHidden
                renderCell(pos.i, pos.j)
            }
        }
    }, 1500)
}

function getMegaHint(i1, j1, i2, j2) {
    var r0 = Math.min(i1, i2)
    var r1 = Math.max(i1, i2)
    var c0 = Math.min(j1, j2)
    var c1 = Math.max(j1, j2)

    var cellsToFlip = []
    for (var r = r0; r <= r1; r++) {
        for (var c = c0; c <= c1; c++) {
            var cell = gBoard[r][c]
            if (!cell.isRevealed) {
                cell._wasHidden = true
                cell.isRevealed = true
                renderCell(r, c)
                cellsToFlip.push({ i: r, j: c })
            }
        }
    }

    setTimeout(function () {
        for (var idx = 0; idx < cellsToFlip.length; idx++) {
            var pos = cellsToFlip[idx]
            var c2 = gBoard[pos.i][pos.j]
            if (c2._wasHidden) {
                c2.isRevealed = false
                delete c2._wasHidden
                renderCell(pos.i, pos.j)
            }
        }
    }, 2000)
}
window.addEventListener('load', function () {
  gLevel.SIZE = 4
  gLevel.MINES = 2
  gGame.isManual = false
  onInit()
})

//change mode
function changeMode(){
    document.body.classList.toggle('dark-mode');
}
  

    


