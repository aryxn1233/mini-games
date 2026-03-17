import { Room, Player, GameState, ChatMessage } from '../shared/types';
import { TicTacToeEngine } from '../shared/tic-tac-toe';
import { SnakeLaddersEngine } from '../shared/snake-ladders';
import { LudoEngine } from '../shared/ludo';
import { HangmanEngine } from '../shared/hangman';
import { HangmanGameState } from '../shared/types';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerToRoom: Map<string, string> = new Map();

    createRoom(host: Player): Room {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room: Room = {
            id: Math.random().toString(36).substring(2, 9),
            code,
            players: [host],
            status: 'WAITING',
        };
        this.rooms.set(code, room);
        this.playerToRoom.set(host.id, code);
        return room;
    }

    joinRoom(code: string, player: Player): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;
        if (room.players.length >= 4) return null; // Simple limit

        room.players.push(player);
        this.playerToRoom.set(player.id, code);
        return room;
    }

    getRoom(code: string): Room | undefined {
        return this.rooms.get(code);
    }

    getRoomByPlayer(playerId: string): Room | undefined {
        const code = this.playerToRoom.get(playerId);
        return code ? this.rooms.get(code) : undefined;
    }

    leaveRoom(playerId: string): Room | null {
        const code = this.playerToRoom.get(playerId);
        if (!code) return null;

        const room = this.rooms.get(code);
        if (!room) return null;

        room.players = room.players.filter(p => p.id !== playerId);
        this.playerToRoom.delete(playerId);

        if (room.players.length === 0) {
            this.rooms.delete(code);
            return null;
        }

        return room;
    }

    startGame(code: string, gameType: string): { room: Room | null; error?: string } {
        const room = this.rooms.get(code);
        if (!room) return { room: null, error: 'Room not found' };

        if (room.players.length < 2) {
            return { room: null, error: 'At least 2 players are needed to start!' };
        }

        room.gameType = gameType;
        room.status = 'PLAYING';

        const engine = this.getEngine(gameType);
        if (engine) {
            room.gameState = engine.initialize(room.players);
        }

        return { room };
    }

    requestRematch(code: string, playerId: string): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;

        if (!room.rematchRequests) room.rematchRequests = [];
        if (!room.rematchRequests.includes(playerId)) {
            room.rematchRequests.push(playerId);
        }

        // If everyone in the room wants a rematch, restart the game
        if (room.rematchRequests.length === room.players.length) {
            this.startGame(code, room.gameType!);
            room.rematchRequests = [];
        }

        return room;
    }

    resetRoom(code: string): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;
        room.status = 'WAITING';
        room.gameState = undefined;
        room.rematchRequests = [];
        return room;
    }

    addMessage(code: string, message: ChatMessage): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;

        if (!room.messages) room.messages = [];
        room.messages.push(message);

        // Keep only last 50 messages
        if (room.messages.length > 50) {
            room.messages.shift();
        }

        return room;
    }

    getEngine(gameType: string) {
        switch (gameType) {
            case 'TIC_TAC_TOE': return new TicTacToeEngine();
            case 'SNAKE_LADDERS': return new SnakeLaddersEngine();
            case 'LUDO': return new LudoEngine();
            case 'HANGMAN': return new HangmanEngine();
            default: return null;
        }
    }

    sanitizeRoom(room: Room, playerId: string): Room {
        const sanitizedRoom = { ...room };
        if (sanitizedRoom.gameType === 'HANGMAN' && sanitizedRoom.gameState) {
            const hangmanState = sanitizedRoom.gameState as HangmanGameState;
            // Hide the secret word from everyone except the setter, UNLESS the game is finished
            if (playerId !== hangmanState.setterId && hangmanState.status !== 'FINISHED') {
                const hiddenState = { ...hangmanState };
                delete hiddenState.word;
                sanitizedRoom.gameState = hiddenState;
            }
        }
        return sanitizedRoom;
    }
}

export const roomManager = new RoomManager();
