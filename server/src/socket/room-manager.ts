import { Room, Player, GameState, ChatMessage, HangmanGameState, LieDetectorGameState, BluffGameState, BluffCardGameState } from '../shared/types';
import { TicTacToeEngine } from '../shared/tic-tac-toe';
import { SnakeLaddersEngine } from '../shared/snake-ladders';
import { LudoEngine } from '../shared/ludo';
import { HangmanEngine } from '../shared/hangman';
import { LieDetectorEngine } from '../shared/lie-detector';
import { BluffEngine } from '../shared/bluff';
import { BluffCardEngine } from '../shared/bluff-card';

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
        if (room.players.length >= 8) return null; // Increased for social deduction games

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
            case 'LIE_DETECTOR': return new LieDetectorEngine();
            case 'BLUFF': return new BluffEngine();
            case 'BLUFF_CARD': return new BluffCardEngine();
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
        if (sanitizedRoom.gameType === 'LIE_DETECTOR' && sanitizedRoom.gameState) {
            const lieState = sanitizedRoom.gameState as LieDetectorGameState;
            // Hide the correct answer and the statement player's intent until revealing
            if (lieState.status !== 'REVEALING' && lieState.status !== 'FINISHED') {
                const hiddenState = { ...lieState };
                delete hiddenState.correctAnswer;
                sanitizedRoom.gameState = hiddenState;
            }
        }
        if (sanitizedRoom.gameType === 'BLUFF' && sanitizedRoom.gameState) {
            const bluffState = sanitizedRoom.gameState as BluffGameState;
            if (bluffState.status !== 'REVEALING' && bluffState.status !== 'FINISHED') {
                const hiddenState = { ...bluffState };
                const isLiar = bluffState.liarIds.includes(playerId);

                // Hide liarIds from non-liars
                if (!isLiar) {
                    delete (hiddenState as any).liarIds;
                }

                // Hide authorId in shuffledResponses until reveal
                if (hiddenState.shuffledResponses) {
                    hiddenState.shuffledResponses = hiddenState.shuffledResponses.map(r => ({
                        text: r.text
                    }));
                }
                sanitizedRoom.gameState = hiddenState;
            }
        }
        if (sanitizedRoom.gameType === 'BLUFF_CARD' && sanitizedRoom.gameState) {
            const bluffCardState = sanitizedRoom.gameState as any;
            const hiddenState = { ...bluffCardState };

            // Hide other hands
            const sanitizedHands: { [playerId: string]: any } = {};
            Object.keys(bluffCardState.hands).forEach(pid => {
                if (pid === playerId) {
                    sanitizedHands[pid] = bluffCardState.hands[pid];
                } else {
                    // Just send dummy cards of the same length
                    sanitizedHands[pid] = Array(bluffCardState.hands[pid].length).fill({ suit: 'BACK', rank: 'BACK' });
                }
            });
            hiddenState.hands = sanitizedHands;

            // Hide pile content
            hiddenState.pileCount = bluffCardState.pile.length;
            hiddenState.pile = Array(bluffCardState.pile.length).fill({ suit: 'BACK', rank: 'BACK' });

            // Hide last move cards unless revealing
            if (bluffCardState.status !== 'REVEALING' && hiddenState.lastMove) {
                const hiddenMove = { ...hiddenState.lastMove };
                hiddenMove.cardsPlayed = Array(hiddenState.lastMove.cardsPlayed.length).fill({ suit: 'BACK', rank: 'BACK' });
                hiddenState.lastMove = hiddenMove;
            }

            sanitizedRoom.gameState = hiddenState;
        }
        return sanitizedRoom;
    }
}

export const roomManager = new RoomManager();
