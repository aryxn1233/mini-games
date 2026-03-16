import { Server, Socket } from 'socket.io';
import { roomManager } from './room-manager';
import { Player } from '../shared/types';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        socket.on('create_room', (player: Player) => {
            const room = roomManager.createRoom({ ...player, id: socket.id });
            socket.join(room.code);
            socket.emit('room_created', room);
        });

        socket.on('join_room', ({ code, player }: { code: string; player: Player }) => {
            const room = roomManager.joinRoom(code, { ...player, id: socket.id });
            if (room) {
                socket.join(room.code);
                broadcastToRoom(room.code);
            } else {
                socket.emit('error', 'Room not found or full');
            }
        });

        socket.on('start_game', ({ code, gameType }: { code: string; gameType: string }) => {
            const { room, error } = roomManager.startGame(code, gameType);
            if (room) {
                broadcastToRoom(code, 'game_started');
            } else if (error) {
                socket.emit('error', error);
            }
        });

        socket.on('leave_room', () => {
            const room = roomManager.leaveRoom(socket.id);
            if (room) {
                socket.leave(room.code);
                broadcastToRoom(room.code);
            }
        });

        socket.on('make_move', ({ code, move }: { code: string; move: any }) => {
            const room = roomManager.getRoom(code);
            if (room && room.gameState && room.gameType) {
                const engine = roomManager.getEngine(room.gameType);
                if (engine) {
                    const { newState, valid, error } = engine.makeMove(socket.id, move, room.gameState);
                    if (valid) {
                        room.gameState = newState;
                        // For Hangman, we need to broadcast sanitized state
                        broadcastToRoom(code, 'game_state_updated');
                    } else {
                        socket.emit('error', error);
                    }
                }
            }
        });

        socket.on('request_rematch', ({ code }: { code: string }) => {
            const room = roomManager.requestRematch(code, socket.id);
            if (room) {
                broadcastToRoom(code);
                if (room.status === 'PLAYING') {
                    broadcastToRoom(code, 'game_started');
                }
            }
        });

        socket.on('reset_room', ({ code }: { code: string }) => {
            const room = roomManager.resetRoom(code);
            if (room) {
                broadcastToRoom(code);
            }
        });

        socket.on('send_message', ({ code, text }: { code: string; text: string }) => {
            const room = roomManager.getRoom(code);
            const player = room?.players.find(p => p.id === socket.id);
            if (room && player) {
                const message = {
                    playerId: socket.id,
                    username: player.username,
                    text,
                    timestamp: Date.now()
                };
                const updatedRoom = roomManager.addMessage(code, message);
                if (updatedRoom) {
                    io.to(code).emit('new_message', message);
                }
            }
        });

        // WebRTC Signaling for Voice Chat
        socket.on('voice_signal', ({ to, signal }: { to: string; signal: any }) => {
            io.to(to).emit('voice_signal', { from: socket.id, signal });
        });

        socket.on('disconnect', () => {
            const room = roomManager.leaveRoom(socket.id);
            if (room) {
                broadcastToRoom(room.code);
            }
            console.log('User disconnected:', socket.id);
        });

        function broadcastToRoom(code: string, event: string = 'room_updated') {
            const room = roomManager.getRoom(code);
            if (!room) return;

            // Get all sockets in the room
            const roomSockets = io.sockets.adapter.rooms.get(code);
            if (!roomSockets) return;

            roomSockets.forEach(socketId => {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (targetSocket) {
                    const sanitizedRoom = roomManager.sanitizeRoom(room, socketId);
                    if (event === 'game_state_updated') {
                        targetSocket.emit(event, sanitizedRoom.gameState);
                    } else {
                        targetSocket.emit(event, sanitizedRoom);
                    }
                }
            });
        }
    });
};
