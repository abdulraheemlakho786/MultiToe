// Vercel Serverless Function for Real-Time Tic-Tac-Toe
export default function handler(req, res) {
    const io = require('socket.io')(res.socket.server, {
        cors: { origin: "*" }
    });

    // Store active games and rooms
    const activeRooms = new Map();
    const players = new Map();

    io.on('connection', (socket) => {
        console.log('Player connected:', socket.id);

        // Create private room
        socket.on('create_room', (data) => {
            const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
            const room = {
                code: roomCode,
                players: {
                    X: { id: null, name: '', socketId: null, online: false },
                    O: { id: null, name: '', socketId: null, online: false }
                },
                board: Array(9).fill(null),
                currentPlayer: 'X',
                gameActive: true,
                spectators: []
            };

            activeRooms.set(roomCode, room);
            players.set(socket.id, { roomCode, symbol: null });
            
            socket.join(roomCode);
            socket.emit('room_created', { roomCode });
        });

        // Join private room
        socket.on('join_room', (data) => {
            const { roomCode, playerName } = data;
            const room = activeRooms.get(roomCode);
            
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Find available position
            let symbol = null;
            if (!room.players.X.socketId) {
                symbol = 'X';
                room.players.X = { id: socket.id, name: playerName, socketId: socket.id, online: true };
            } else if (!room.players.O.socketId) {
                symbol = 'O';
                room.players.O = { id: socket.id, name: playerName, socketId: socket.id, online: true };
            } else {
                // Room full, join as spectator
                room.spectators.push(socket.id);
                socket.emit('spectator_mode');
                socket.join(roomCode);
                players.set(socket.id, { roomCode, symbol: 'SPECTATOR' });
                return;
            }

            socket.join(roomCode);
            players.set(socket.id, { roomCode, symbol });
            
            // Send game state to new player
            socket.emit('game_state', {
                roomCode,
                room: room
            });

            // Notify all players in room
            io.to(roomCode).emit('player_joined', {
                players: room.players,
                board: room.board,
                currentPlayer: room.currentPlayer
            });
        });

        // Quick match
        socket.on('quick_match', (data) => {
            const { playerName } = data;
            players.set(socket.id, { roomCode: null, symbol: null, name: playerName });
            
            // Try to find opponent
            const waitingPlayers = Array.from(players.entries())
                .filter(([id, info]) => 
                    id !== socket.id && 
                    info.roomCode === null && 
                    info.symbol === null
                );

            if (waitingPlayers.length > 0) {
                // Pair players
                const opponentId = waitingPlayers[0][0];
                const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
                
                const room = {
                    code: roomCode,
                    players: {
                        X: { id: socket.id, name: playerName, socketId: socket.id, online: true },
                        O: { id: opponentId, name: waitingPlayers[1]?.name || 'PLAYER', socketId: opponentId, online: true }
                    },
                    board: Array(9).fill(null),
                    currentPlayer: 'X',
                    gameActive: true,
                    spectators: []
                };

                activeRooms.set(roomCode, room);
                
                // Update player records
                players.set(socket.id, { roomCode, symbol: 'X', name: playerName });
                players.set(opponentId, { 
                    roomCode, 
                    symbol: 'O', 
                    name: waitingPlayers[1]?.name || 'PLAYER' 
                });

                // Add both players to room
                socket.join(roomCode);
                io.sockets.sockets.get(opponentId)?.join(roomCode);

                // Notify both players
                socket.emit('match_found', { 
                    roomCode, 
                    symbol: 'X',
                    room 
                });
                io.to(opponentId).emit('match_found', { 
                    roomCode, 
                    symbol: 'O',
                    room 
                });
            } else {
                // Add to waiting queue
                socket.emit('waiting_for_opponent');
            }
        });

        // Make move
        socket.on('make_move', (data) => {
            const { roomCode, index } = data;
            const room = activeRooms.get(roomCode);
            const player = players.get(socket.id);
            
            if (!room || !player || player.symbol !== room.currentPlayer || !room.gameActive) {
                return;
            }

            if (room.board[index]) {
                return; // Cell already taken
            }

            // Update game state
            room.board[index] = player.symbol;
            room.currentPlayer = player.symbol === 'X' ? 'O' : 'X';

            // Check for winner
            const winner = checkWinner(room.board);
            if (winner) {
                room.gameActive = false;
            } else if (room.board.every(cell => cell !== null)) {
                room.gameActive = false; // Draw
            }

            // Broadcast move to all players in room
            io.to(roomCode).emit('move_made', {
                board: room.board,
                currentPlayer: room.currentPlayer,
                winner: winner,
                gameActive: room.gameActive
            });
        });

        // Reset game
        socket.on('reset_game', (data) => {
            const { roomCode } = data;
            const room = activeRooms.get(roomCode);
            
            if (room) {
                room.board = Array(9).fill(null);
                room.currentPlayer = 'X';
                room.gameActive = true;

                io.to(roomCode).emit('game_reset', {
                    board: room.board,
                    currentPlayer: room.currentPlayer
                });
            }
        });

        // Leave room
        socket.on('leave_room', () => {
            const player = players.get(socket.id);
            if (player && player.roomCode) {
                const room = activeRooms.get(player.roomCode);
                if (room) {
                    // Remove player
                    if (room.players[player.symbol]) {
                        room.players[player.symbol].online = false;
                    }
                    
                    players.delete(socket.id);
                    socket.leave(player.roomCode);
                    
                    io.to(player.roomCode).emit('player_left', {
                        symbol: player.symbol,
                        players: room.players
                    });

                    // Clean up empty rooms
                    if (!room.players.X.online && !room.players.O.online) {
                        activeRooms.delete(player.roomCode);
                    }
                }
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.id);
            const player = players.get(socket.id);
            
            if (player && player.roomCode) {
                const room = activeRooms.get(player.roomCode);
                if (room && room.players[player.symbol]) {
                    room.players[player.symbol].online = false;
                    io.to(player.roomCode).emit('player_disconnected', {
                        symbol: player.symbol
                    });
                }
            }
            
            players.delete(socket.id);
        });
    });

    // Helper function to check winner
    function checkWinner(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return combination;
            }
        }
        return null;
    }

    // Don't send response - keep connection alive for WebSocket
    return res.status(200).json({ 
        message: 'Game server started',
        timestamp: new Date().toISOString()
    });
}
