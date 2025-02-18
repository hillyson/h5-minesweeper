class Minesweeper {
    constructor(rows = 9, cols = 9, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.gameOver = false;
        this.revealed = 0;
        this.timeInterval = null;
        this.time = 0;
        this.firstClick = true;
        this.autoFlag = false;
        this.init();
    }

    init() {
        this.createBoard();
        this.setupEventListeners();
        this.updateMinesCount();
        this.startTimer();
    }

    createBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        this.board = [];

        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                board.appendChild(cell);
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighbors: 0,
                    element: cell
                };
            }
        }
    }

    placeMinesExcept(safeRow, safeCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // 检查是否在安全区域内（点击位置及其周围）
            const isSafe = Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1;
            
            if (!this.board[row][col].isMine && !isSafe) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
    }

    calculateNumbers() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.board[i][j].isMine) {
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                                if (this.board[ni][nj].isMine) count++;
                            }
                        }
                    }
                    this.board[i][j].neighbors = count;
                }
            }
        }
    }

    setupEventListeners() {
        const board = document.getElementById('board');
        this.isLeftButtonDown = false;
        this.isRightButtonDown = false;

        // 将绑定后的事件处理函数保存为类属性
        this.boundHandleMouseDown = (e) => {
            if (e.button === 0) this.isLeftButtonDown = true;
            if (e.button === 2) {
                this.isRightButtonDown = true;
                e.preventDefault();
            }
            if (this.isLeftButtonDown && this.isRightButtonDown) {
                this.handleBothClick(e);
            }
        };

        this.boundHandleMouseUp = (e) => {
            if (e.button === 0) this.isLeftButtonDown = false;
            if (e.button === 2) this.isRightButtonDown = false;
        };

        this.boundHandleMouseLeave = () => {
            this.isLeftButtonDown = false;
            this.isRightButtonDown = false;
        };

        this.boundHandleClick = this.handleClick.bind(this);
        this.boundHandleRightClick = this.handleRightClick.bind(this);
        this.boundNewGame = this.newGame.bind(this);
        this.boundChangeDifficulty = this.changeDifficulty.bind(this);

        board.addEventListener('mousedown', this.boundHandleMouseDown);
        board.addEventListener('mouseup', this.boundHandleMouseUp);
        board.addEventListener('mouseleave', this.boundHandleMouseLeave);
        board.addEventListener('click', this.boundHandleClick);
        board.addEventListener('contextmenu', this.boundHandleRightClick);
        document.getElementById('new-game').addEventListener('click', this.boundNewGame);
        document.getElementById('difficulty').addEventListener('change', this.boundChangeDifficulty);
        document.getElementById('auto-flag').addEventListener('change', (e) => {
            this.autoFlag = e.target.checked;
        });
    }

    handleBothClick(e) {
        if (this.gameOver) return;
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const currentCell = this.board[row][col];

        if (!currentCell.isRevealed || currentCell.isMine) return;

        let flaggedCount = 0;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const ni = row + di;
                const nj = col + dj;
                if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                    if (this.board[ni][nj].isFlagged) flaggedCount++;
                }
            }
        }

        if (flaggedCount === currentCell.neighbors) {
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    const ni = row + di;
                    const nj = col + dj;
                    if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                        const neighborCell = this.board[ni][nj];
                        if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                            this.reveal(ni, nj);
                        }
                    }
                }
            }
        }
    }

    handleClick(e) {
        if (this.gameOver) return;
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.board[row][col].isFlagged) return;
        
        this.reveal(row, col);
    }

    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (!this.board[row][col].isRevealed) {
            this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
            cell.classList.toggle('flagged');
            this.updateMinesCount();
        }
    }

    reveal(row, col) {
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMinesExcept(row, col);
            this.calculateNumbers();
        }

        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        this.revealed++;

        if (cell.isMine) {
            this.gameOver = true;
            this.revealAll();
            alert('游戏结束！');
            return;
        }

        const revealedCells = new Set();
        revealedCells.add(`${row},${col}`);

        if (cell.neighbors === 0) {
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    const ni = row + di;
                    const nj = col + dj;
                    if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                        if (!this.board[ni][nj].isRevealed) {
                            this.reveal(ni, nj);
                            revealedCells.add(`${ni},${nj}`);
                        }
                    }
                }
            }
        } else {
            cell.element.textContent = cell.neighbors;
        }

        // 在所有格子被揭示后进行自动标雷检查
        if (this.autoFlag) {
            // 检查所有已揭示的带数字的格子
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    const cell = this.board[i][j];
                    if (cell.isRevealed && cell.neighbors > 0) {
                        this.checkAutoFlag(i, j);
                    }
                }
            }
        }

        if (this.revealed === this.rows * this.cols - this.mines) {
            alert('恭喜你赢了！');
            this.gameOver = true;
        }
    }

    checkAutoFlag(row, col, checked = new Set()) {
        const key = `${row},${col}`;
        if (checked.has(key)) return;
        checked.add(key);

        // 检查当前格子
        const flaggedBefore = this.countFlagged();
        this.checkSingleCell(row, col);
        const flaggedAfter = this.countFlagged();

        // 如果有新的标记或者是首次检查，检查周围所有已揭示的格子
        if (flaggedAfter > flaggedBefore || flaggedBefore === 0) {
            // 先检查直接相邻的格子
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    const ni = row + di;
                    const nj = col + dj;
                    if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                        const neighborCell = this.board[ni][nj];
                        if (neighborCell.isRevealed && neighborCell.neighbors > 0) {
                            this.checkAutoFlag(ni, nj, checked);
                        }
                    }
                }
            }

            // 然后检查更大范围的已揭示格子
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    const cell = this.board[i][j];
                    if (cell.isRevealed && cell.neighbors > 0 && !checked.has(`${i},${j}`)) {
                        this.checkAutoFlag(i, j, checked);
                    }
                }
            }
        }
    }

    checkSingleCell(row, col) {
        const cell = this.board[row][col];
        if (!cell.isRevealed || cell.neighbors === 0) return;

        let unrevealed = 0;
        let flagged = 0;
        const unrevealedCells = [];

        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const ni = row + di;
                const nj = col + dj;
                if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                    const neighborCell = this.board[ni][nj];
                    if (!neighborCell.isRevealed) {
                        unrevealed++;
                        if (!neighborCell.isFlagged) {
                            unrevealedCells.push({row: ni, col: nj});
                        }
                    }
                    if (neighborCell.isFlagged) {
                        flagged++;
                    }
                }
            }
        }

        // 如果未揭示的格子数量等于周围的雷数，且已标记的数量小于雷数，则标记所有未标记的格子
        if ((unrevealed === cell.neighbors && flagged < cell.neighbors) ||
            (unrevealed > 0 && flagged + unrevealed === cell.neighbors)) {
            unrevealedCells.forEach(({row: ni, col: nj}) => {
                if (!this.board[ni][nj].isFlagged) {
                    this.board[ni][nj].isFlagged = true;
                    this.board[ni][nj].element.classList.add('flagged');
                    this.updateMinesCount();
                }
            });
        }
    }

    revealAll() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
                if (cell.isMine) {
                    cell.element.classList.add('mine');
                }
            }
        }
    }

    countFlagged() {
        let flagged = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].isFlagged) flagged++;
            }
        }
        return flagged;
    }

    updateMinesCount() {
        const flagged = this.countFlagged();
        document.getElementById('mines-count').textContent = this.mines - flagged;
    }

    startTimer() {
        this.time = 0;
        if (this.timeInterval) clearInterval(this.timeInterval);
        this.timeInterval = setInterval(() => {
            this.time++;
            document.getElementById('timer').textContent = this.time;
        }, 1000);
    }

    changeDifficulty(e) {
        const difficulty = e.target.value;
        switch (difficulty) {
            case 'easy':
                this.rows = 9;
                this.cols = 9;
                this.mines = 10;
                break;
            case 'medium':
                this.rows = 16;
                this.cols = 16;
                this.mines = 40;
                break;
            case 'hard':
                this.rows = 16;
                this.cols = 30;
                this.mines = 99;
                break;
        }
        document.documentElement.style.setProperty('--cols', `repeat(${this.cols}, 30px)`);
        document.documentElement.style.setProperty('--rows', `repeat(${this.rows}, 30px)`);
        this.newGame();
    }

    newGame() {
        clearInterval(this.timeInterval);
        this.gameOver = false;
        this.revealed = 0;
        this.firstClick = true;
        const board = document.getElementById('board');
        
        // 使用保存的绑定函数来移除事件监听器
        board.removeEventListener('mousedown', this.boundHandleMouseDown);
        board.removeEventListener('mouseup', this.boundHandleMouseUp);
        board.removeEventListener('mouseleave', this.boundHandleMouseLeave);
        board.removeEventListener('click', this.boundHandleClick);
        board.removeEventListener('contextmenu', this.boundHandleRightClick);
        
        this.init();
    }
}

// 启动游戏
new Minesweeper();