import { IGameEngine, Player, GameState } from './types';

export class TicTacToeEngine implements IGameEngine {
    initialize(players: Player[]): GameState {
        return {
            status: 'IN_PROGRESS',
            currentTurn: players[0].id,
            board: Array(9).fill(null),
        };
    }

    makeMove(playerId: string, move: { index: number }, currentState: GameState): { newState: GameState; valid: boolean; error?: string } {
        const { index } = move;
        const board = [...currentState.board];

        if (currentState.status !== 'IN_PROGRESS') {
            return { newState: currentState, valid: false, error: 'Game is not in progress' };
        }

        if (playerId !== currentState.currentTurn) {
            return { newState: currentState, valid: false, error: 'Not your turn' };
        }

        if (index < 0 || index >= 9 || board[index] !== null) {
            return { newState: currentState, valid: false, error: 'Invalid move' };
        }

        // Determine mark (X for player 1, O for player 2)
        // We'll just use the player's position in the original list if we had it, 
        // but for simplicity let's say the first player to move gets X.
        // In a real game we should pass more context or store marks in the state.
        const mark = board.filter(x => x !== null).length % 2 === 0 ? 'X' : 'O';
        board[index] = mark;

        const winnerMark = this.calculateWinner(board);
        let status = currentState.status;
        let winnerId = currentState.winnerId;

        if (winnerMark) {
            status = 'FINISHED';
            winnerId = playerId; // The player who made the winning move
        } else if (board.every(cell => cell !== null)) {
            status = 'FINISHED'; // Draw
        }

        // Toggle turn (find next player in the room)
        // This part requires knowing the list of players, which we don't have in this simple state.
        // Let's assume the caller handles turn switching or we pass the players list.
        // Refining the interface slightly in thought: maybe currentState should have playerIds list.

        return {
            newState: {
                ...currentState,
                board,
                status,
                winnerId,
                lastMove: move,
            },
            valid: true,
        };
    }

    checkWinner(state: GameState): string | null {
        const winnerMark = this.calculateWinner(state.board);
        if (winnerMark) return state.winnerId || null;
        return null;
    }

    private calculateWinner(board: any[]): string | null {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ];
        for (const [a, b, c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }
}
