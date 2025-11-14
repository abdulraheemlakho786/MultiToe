class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameMode = 'local'; // 'local', 'online', 'computer'
        this.gameActive = true;
        this.playerName = '';
        this.playerSymbol = '';
        this.currentRoom = null;
        this.isOnlineGame = false;
        this.autoResetTimer = null;
        this.socket = null;
        this.isConnected = false;
        
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        this.initializeElements();
        this.bindEvents();
        this.updateGameMode('local');
    }

    initializeElements() {
        // Game elements
        this.boardElement = document.getElementById('gameBoard');
        this.cells = document.querySelectorAll('.board-cell');
        this.statusText = document.getElementById('statusText');
        this.resetBtn = document.getElementById('resetBtn');
        this.winningLine = document.getElementById('winningLine');
        this.winningLinePath = this.winningLine.querySelector('.winning-line-path');
        
        // Mode selection elements
        this.modeSelection = document.getElementById('modeSelection');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Player name elements
        this.playerNameSection = document.getElementById('playerNameSection');
        this.playerNameInput = document.getElementById('playerNameInput');
        this.nameSubmitBtn = document.getElementById('nameSubmitBtn');
        
        // Online multiplayer elements
        this.onlinePanel = document.getElementById('onlinePanel');
        this.quickMatchBtn = document.getElementById('quickMatchBtn');
        this.createPrivateRoomBtn = document.getElementById('createPrivateRoomBtn');
        this.matchmakingStatus = document.getElementById('matchmakingStatus');
        this.privateRoomForm = document.getElementById('privateRoomForm');
        this.roomCodeDisplay = document.getElementById('roomCodeDisplay');
        this.createPrivateSubmitBtn = document.getElementById('createPrivateSubmitBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        this.copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
        this.roomInfo = document.getElementById('roomInfo');
        this.currentRoomCode = document.getElementById('currentRoomCode');
        this.yourSymbol = document.getElementById('yourSymbol');
        this.playerXName = document.getElementById('playerXName');
        this.playerOName = document.getElementById('playerOName');
        this.playerXStatus = document.getElementById('playerXStatus');
        this.playerOStatus = document.getElementById('playerOStatus');
        this.playerXInfo = document.getElementById('playerXInfo');
        this.playerOInfo = document.getElementById('playerOInfo');
        this.matchStatus = document.getElementById('matchStatus');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        // Countdown elements
        this.countdownDisplay = document.getElementById('countdownDisplay');
        this.countdownNumber = document.getElementById('countdownNumber');
    }

    bindEvents() {
        // Cell clicks
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.clearAutoResetTimer();
            this.resetGame();
        });

        // Mode selection
        this.modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.updateGameMode(mode);
                this.updateModeSelection(mode);
            });
        });

        // Player name submission
        this.nameSubmitBtn.addEventListener('click', () => this.setPlayerName());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setPlayerName();
            }
        });

        // Online multiplayer events
        this.quickMatchBtn.addEventListener('click', () => this.startQuickMatch());
        this.createPrivateRoomBtn.addEventListener('click', () => this.showPrivateRoomForm());
        this.createPrivateSubmitBtn.addEventListener('click', () => this.createPrivateRoom());
        this.copyRoomCodeBtn.addEventListener('click', () => this.copyRoomCode());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());

        // Form submission prevention
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.classList.contains('name-input')) {
                    e.preventDefault();
                    this.setPlayerName();
                }
            }
        });
    }

    updateModeSelection(selectedMode) {
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === selectedMode);
        });
    }

    setPlayerName() {
        const name = this.playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }

        this.playerName = name.toUpperCase();
        this.playerNameSection.style.display = 'none';
        
        // Update status to show player name
        this.updateStatus();
    }

    showPlayerNameInput() {
        this.playerNameSection.style.display = 'block';
        this.playerNameInput.focus();
    }

    startQuickMatch() {
        if (!this.playerName) {
            alert('Please set your name first');
            this.showPlayerNameInput();
            return;
        }

        // Show matchmaking status
        this.matchmakingStatus.style.display = 'block';
        this.privateRoomForm.style.display = 'none';
        this.matchStatus.textContent = 'SEARCHING FOR OPPONENT...';

        // Connect to WebSocket server
        this.connectToServer(() => {
            if (this.socket) {
                this.socket.emit('quick_match', { playerName: this.playerName });
            }
        });
    }

    showPrivateRoomForm() {
        if (!this.playerName) {
            alert('Please set your name first');
            this.showPlayerNameInput();
            return;
        }

        this.matchmakingStatus.style.display = 'none';
        this.privateRoomForm.style.display = 'block';
    }

    createPrivateRoom() {
        // Generate room code
        const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.roomCodeDisplay.textContent = roomCode;
        
        // Show room info
        this.currentRoomCode.textContent = roomCode;
        this.yourSymbol.textContent = 'X';
        this.playerSymbol = 'X';
        this.currentRoom = { code: roomCode, symbol: 'X' };
        
        this.onlinePanel.style.display = 'block';
        this.modeSelection.style.display = 'none';
        this.roomInfo.style.display = 'block';
        this.privateRoomForm.style.display = 'none';
        this.matchStatus.textContent = 'ROOM CREATED - WAITING FOR OPPONENT';

        // Connect to server
        this.connectToServer(() => {
            if (this.socket) {
                this.socket.emit('create_room', { roomCode, playerName: this.playerName });
            }
        });
    }

    copyRoomCode() {
        const roomCode = this.currentRoomCode.textContent;
        navigator.clipboard.writeText(roomCode).then(() => {
            this.matchStatus.textContent = 'ROOM CODE COPIED!';
            setTimeout(() => {
                this.matchStatus.textContent = 'SHARE CODE TO INVITE PLAYERS';
            }, 2000);
        });
    }

    connectToServer(callback) {
        if (this.socket && this.isConnected) {
            if (callback) callback();
            return;
        }

        // Create WebSocket connection to Vercel serverless function
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to game server');
            this.isConnected = true;
            this.connectionStatus.textContent = 'CONNECTED';
            this.connectionStatus.style.color = '#4A8C4A';
            
            if (callback) callback();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            this.isConnected = false;
            this.connectionStatus.textContent = 'DISCONNECTED';
            this.connectionStatus.style.color = '#8C4A4A';
            
            this.handleDisconnection();
        });

        // Game events
        this.socket.on('room_created', (data) => {
            console.log('Room created:', data.roomCode);
        });

        this.socket.on('waiting_for_opponent', () => {
            this.matchStatus.textContent = 'WAITING FOR OPPONENT...';
        });

        this.socket.on('match_found', (data) => {
            this.matchStatus.textContent = 'MATCH FOUND!';
            this.handleRoomJoined(data);
        });

        this.socket.on('game_state', (data) => {
            this.handleGameState(data);
        });

        this.socket.on('player_joined', (data) => {
            this.handlePlayerJoined(data);
        });

        this.socket.on('move_made', (data) => {
            this.handleMoveMade(data);
        });

        this.socket.on('game_reset', (data) => {
            this.handleGameReset(data);
        });

        this.socket.on('player_left', (data) => {
            this.handlePlayerLeft(data);
        });

        this.socket.on('player_disconnected', (data) => {
            this.handlePlayerDisconnected(data);
        });

        this.socket.on('spectator_mode', () => {
            this.matchStatus.textContent = 'SPECTATOR MODE';
        });

        this.socket.on('error', (data) => {
            alert(data.message);
            this.resetOnlineState();
        });
    }

    handleRoomJoined(data) {
        this.currentRoom = {
            code: data.roomCode,
            symbol: data.symbol,
            players: data.room.players,
            board: data.room.board,
            currentPlayer: data.room.currentPlayer,
            gameActive: data.room.gameActive
        };

        this.playerSymbol = data.symbol;
        this.yourSymbol.textContent = data.symbol;
        this.currentRoomCode.textContent = data.roomCode;
        
        this.showRoomInfo();
        this.updateGameState(data.room);
    }

    handleGameState(data) {
        this.currentRoom = data.room;
        this.updateGameState(data.room);
    }

    handlePlayerJoined(data) {
        if (this.currentRoom) {
            this.currentRoom.players = data.players;
            this.currentRoom.board = data.board;
            this.currentRoom.currentPlayer = data.currentPlayer;
            
            this.updateGameState(this.currentRoom);
        }
    }

    handleMoveMade(data) {
        this.currentRoom.board = data.board;
        this.currentRoom.currentPlayer = data.currentPlayer;
        
        // Update local board
        this.board = [...data.board];
        
        // Update UI
        this.updateBoardDisplay();
        this.updateStatus();
        this.updatePlayerStatus();
        
        if (data.winner) {
            this.handleGameEnd(data.winner, true);
        } else if (!data.gameActive) {
            this.handleGameEnd(null, false);
        }
    }

    handleGameReset(data) {
        this.board = [...data.board];
        this.currentRoom.board = [...data.board];
        this.currentRoom.currentPlayer = data.currentPlayer;
        this.currentRoom.gameActive = true;
        this.gameActive = true;
        
        this.updateBoardDisplay();
        this.updateStatus();
        this.updatePlayerStatus();
        this.clearAutoResetTimer();
    }

    handlePlayerLeft(data) {
        this.updatePlayerStatus();
        this.matchStatus.textContent = 'PLAYER LEFT THE GAME';
    }

    handlePlayerDisconnected(data) {
        this.updatePlayerStatus();
        this.matchStatus.textContent = 'PLAYER DISCONNECTED';
    }

    handleDisconnection() {
        if (this.isOnlineGame) {
            this.matchStatus.textContent = 'CONNECTION LOST';
            this.connectionStatus.textContent = 'DISCONNECTED';
            this.connectionStatus.style.color = '#8C4A4A';
        }
    }

    updateGameState(room) {
        // Update board display
        this.board = [...room.board];
        this.updateBoardDisplay();
        
        // Update status
        this.updateStatus();
        this.updatePlayerStatus();
        
        // Check game state
        const winner = this.checkWinner();
        if (winner) {
            this.handleGameEnd(winner, true);
        } else if (this.isBoardFull()) {
            this.handleGameEnd(null, false);
        }
    }

    updateBoardDisplay() {
        this.cells.forEach((cell, index) => {
            cell.classList.remove('x', 'o');
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase());
            }
        });
    }

    updatePlayerStatus() {
        if (!this.currentRoom) return;

        this.playerXName.textContent = this.currentRoom.players.X.name || 'Waiting...';
        this.playerOName.textContent = this.currentRoom.players.O.name || 'Waiting...';

        // Reset all status
        this.playerXStatus.className = 'player-status';
        this.playerOStatus.className = 'player-status';
        this.playerXInfo.className = 'player-info';
        this.playerOInfo.className = 'player-info';

        // X player status
        const currentPlayer = this.currentRoom.currentPlayer;
        if (this.currentRoom.players.X.online) {
            if (currentPlayer === 'X' && this.currentRoom.gameActive && this.playerSymbol === 'X') {
                this.playerXStatus.classList.add('your-turn');
                this.playerXStatus.textContent = 'YOUR TURN';
                this.playerXInfo.classList.add('your-turn');
            } else {
                this.playerXStatus.classList.add('online');
                this.playerXStatus.textContent = 'READY';
            }
        } else {
            this.playerXStatus.classList.add('waiting');
            this.playerXStatus.textContent = 'OFFLINE';
        }

        // O player status
        if (this.currentRoom.players.O.online) {
            if (currentPlayer === 'O' && this.currentRoom.gameActive && this.playerSymbol === 'O') {
                this.playerOStatus.classList.add('your-turn');
                this.playerOStatus.textContent = 'YOUR TURN';
                this.playerOInfo.classList.add('your-turn');
            } else {
                this.playerOStatus.classList.add('online');
                this.playerOStatus.textContent = 'READY';
            }
        } else {
            this.playerOStatus.classList.add('waiting');
            this.playerOStatus.textContent = 'OFFLINE';
        }
    }

    showRoomInfo() {
        this.onlinePanel.style.display = 'block';
        this.modeSelection.style.display = 'none';
        this.roomInfo.style.display = 'block';
        this.privateRoomForm.style.display = 'none';
        this.matchmakingStatus.style.display = 'none';
        
        // Update connection status
        this.connectionStatus.textContent = this.isConnected ? 'CONNECTED' : 'CONNECTING...';
        this.connectionStatus.style.color = this.isConnected ? '#4A8C4A' : '#FFE941';
    }

    handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        
        if (!this.gameActive || this.board[index]) {
            return;
        }

        // Online game - check if it's the player's turn
        if (this.isOnlineGame && this.playerSymbol !== this.currentRoom?.currentPlayer) {
            return;
        }

        this.makeMove(index, this.currentPlayer);
        
        if (this.gameMode === 'computer' && this.gameActive && this.currentPlayer === 'O') {
            setTimeout(() => this.computerMove(), 500);
        } else if (this.isOnlineGame) {
            // Send move to server
            if (this.socket && this.currentRoom) {
                this.socket.emit('make_move', {
                    roomCode: this.currentRoom.code,
                    index: index
                });
            }
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        this.cells[index].classList.add(player.toLowerCase());
        
        const winner = this.checkWinner();
        if (winner) {
            this.handleGameEnd(winner, true);
        } else if (this.isBoardFull()) {
            this.handleGameEnd(null, false);
        } else {
            this.currentPlayer = player === 'X' ? 'O' : 'X';
            this.updateStatus();
        }
    }

    computerMove() {
        const moveIndex = this.getComputerMove();
        if (moveIndex !== null) {
            this.makeMove(moveIndex, this.currentPlayer);
        }
    }

    getComputerMove() {
        // 1. Try to win
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            const values = [this.board[a], this.board[b], this.board[c]];
            
            if (values.filter(v => v === 'O').length === 2 && values.includes(null)) {
                return values.indexOf(null);
            }
        }

        // 2. Block opponent
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            const values = [this.board[a], this.board[b], this.board[c]];
            
            if (values.filter(v => v === 'X').length === 2 && values.includes(null)) {
                return values.indexOf(null);
            }
        }

        // 3. Take center
        if (!this.board[4]) {
            return 4;
        }

        // 4. Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => !this.board[i]);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 5. Take any available space
        const availableSpaces = [];
        for (let i = 0; i < 9; i++) {
            if (!this.board[i]) {
                availableSpaces.push(i);
            }
        }

        return availableSpaces.length > 0 ? availableSpaces[0] : null;
    }

    checkWinFor(player) {
        return this.winningCombinations.some(combination => 
            combination.every(index => this.board[index] === player)
        );
    }

    checkWinner() {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return combination;
            }
        }
        return null;
    }

    isBoardFull() {
        return this.board.every(cell => cell !== null);
    }

    handleGameEnd(winningCombination, hasWinner) {
        this.gameActive = false;
        
        if (hasWinner && winningCombination) {
            this.showWinningLine(winningCombination);
            const winner = this.board[winningCombination[0]];
            
            if (this.isOnlineGame && this.currentRoom) {
                const winnerName = this.currentRoom.players[winner].name;
                this.statusText.textContent = `${winnerName} WINS!`;
            } else {
                this.statusText.textContent = `PLAYER ${winner} WINS!`;
            }
        } else {
            this.statusText.textContent = 'GAME DRAW!';
        }

        // Update player status to show game ended
        setTimeout(() => {
            if (this.currentRoom) {
                this.updatePlayerStatus();
            }
        }, 1000);
        
        // Auto reset after 3 seconds
        this.startAutoResetTimer();
    }

    showWinningLine(combination) {
        const cellSize = 96; // Based on CSS grid size
        const cellGap = 2;
        
        const getCellCenter = (index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            return {
                x: col * (cellSize + cellGap) + cellSize / 2,
                y: row * (cellSize + cellGap) + cellSize / 2
            };
        };

        const start = getCellCenter(combination[0]);
        const end = getCellCenter(combination[2]);

        this.winningLinePath.setAttribute('x1', start.x);
        this.winningLinePath.setAttribute('y1', start.y);
        this.winningLinePath.setAttribute('x2', start.x);
        this.winningLinePath.setAttribute('y2', start.y);

        this.winningLine.style.display = 'block';

        // Animate the line drawing
        this.animateLine(start, end);
    }

    animateLine(start, end) {
        const steps = 8;
        const duration = 300;
        const stepTime = duration / steps;

        for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
                const progress = i / steps;
                const currentX = start.x + (end.x - start.x) * progress;
                const currentY = start.y + (end.y - start.y) * progress;
                
                this.winningLinePath.setAttribute('x2', currentX);
                this.winningLinePath.setAttribute('y2', currentY);
            }, i * stepTime);
        }
    }

    startAutoResetTimer() {
        this.clearAutoResetTimer();
        
        let countdown = 3;
        this.countdownDisplay.style.display = 'block';
        this.updateCountdown(countdown);
        
        this.autoResetTimer = setInterval(() => {
            countdown--;
            this.updateCountdown(countdown);
            
            if (countdown <= 0) {
                this.clearAutoResetTimer();
                
                if (this.isOnlineGame && this.socket && this.currentRoom) {
                    // Reset online game via server
                    this.socket.emit('reset_game', { roomCode: this.currentRoom.code });
                } else {
                    // Reset local game
                    this.resetGame();
                }
            }
        }, 1000);
    }

    clearAutoResetTimer() {
        if (this.autoResetTimer) {
            clearInterval(this.autoResetTimer);
            this.autoResetTimer = null;
        }
        this.countdownDisplay.style.display = 'none';
    }

    updateCountdown(number) {
        this.countdownNumber.textContent = number;
        this.countdownNumber.classList.remove('countdown-pulse');
        void this.countdownNumber.offsetWidth; // Trigger reflow
        this.countdownNumber.classList.add('countdown-pulse');
    }

    updateStatus() {
        if (this.gameMode === 'computer' && this.currentPlayer === 'O') {
            this.statusText.textContent = 'COMPUTER\'S TURN';
        } else if (this.isOnlineGame && this.currentRoom) {
            const currentPlayerSymbol = this.currentRoom.currentPlayer;
            const currentPlayerName = this.currentRoom.players[currentPlayerSymbol].name || `PLAYER ${currentPlayerSymbol}`;
            this.statusText.textContent = `${currentPlayerName}'S TURN`;
        } else if (this.playerName) {
            this.statusText.textContent = `${this.playerName}'S TURN`;
        } else {
            this.statusText.textContent = `PLAYER ${this.currentPlayer}'S TURN`;
        }
    }

    updateGameMode(mode) {
        this.clearAutoResetTimer();
        
        // Leave current room if switching modes
        if (this.isOnlineGame && this.socket) {
            this.leaveRoom();
        }
        
        this.gameMode = mode;
        this.isOnlineGame = (mode === 'online');
        
        if (mode === 'online') {
            this.onlinePanel.style.display = 'block';
            this.modeSelection.style.display = 'none';
        } else {
            this.onlinePanel.style.display = 'none';
            this.modeSelection.style.display = 'block';
        }
        
        this.resetGame();
    }

    resetGame() {
        this.clearAutoResetTimer();
        
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        // Clear cells
        this.cells.forEach(cell => {
            cell.classList.remove('x', 'o');
        });
        
        // Hide winning line
        this.winningLine.style.display = 'none';
        
        // Reset current room state for online games
        if (this.currentRoom) {
            this.currentRoom.board = [...this.board];
            this.currentRoom.currentPlayer = 'X';
            this.currentRoom.gameActive = true;
        }
        
        this.updateStatus();
    }

    leaveRoom() {
        if (this.socket) {
            this.socket.emit('leave_room');
        }
        
        this.resetOnlineState();
    }

    resetOnlineState() {
        this.clearAutoResetTimer();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.currentRoom = null;
        this.isOnlineGame = false;
        this.playerSymbol = '';
        this.isConnected = false;
        this.onlinePanel.style.display = 'none';
        this.modeSelection.style.display = 'block';
        this.resetGame();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TicTacToe();
});