import { IGameEngine, Player, GameState } from './types';

export class SnakeLaddersEngine implements IGameEngine {
    private boardMap: { [key: number]: number } = {
        // Ladders
        2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94,
        // Snakes
        16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80
    };

    initialize(players: Player[]): GameState {
        const board: { [playerId: string]: number } = {};
        players.forEach(p => board[p.id] = 1); // Start at square 1

        return {
            status: 'IN_PROGRESS',
            currentTurn: players[0].id,
            board: board,
        };
    }

    makeMove(playerId: string, move: { dice: number }, currentState: GameState): { newState: GameState; valid: boolean; error?: string } {
        if (currentState.status !== 'IN_PROGRESS') {
            return { newState: currentState, valid: false, error: 'Game is not in progress' };
        }

        if (playerId !== currentState.currentTurn) {
            return { newState: currentState, valid: false, error: 'Not your turn' };
        }

        const { dice } = move;
        if (dice < 1 || dice > 6) {
            return { newState: currentState, valid: false, error: 'Invalid dice roll' };
        }

        const board = { ...currentState.board };
        let newPos = board[playerId] + dice;

        if (newPos > 100) {
            // Must land exactly on 100
            newPos = board[playerId]; // No move
        } else {
            // Check for snakes or ladders
            if (this.boardMap[newPos]) {
                newPos = this.boardMap[newPos];
            }
        }

        board[playerId] = newPos;

        let status = currentState.status;
        let winnerId = currentState.winnerId;

        if (newPos === 100) {
            status = 'FINISHED' as any;
            winnerId = playerId;
        }

        return {
            newState: {
                ...currentState,
                board,
                status,
                winnerId,
                lastMove: { dice, originalPos: currentState.board[playerId], newPos },
            },
            valid: true,
        };
    }

    checkWinner(state: GameState): string | null {
        return state.winnerId || null;
    }
}
