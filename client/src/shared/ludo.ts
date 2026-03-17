import { IGameEngine, Player, GameState } from './types';

export type LudoToken = {
    id: string;
    position: number; // -1: base, 0-51: path, 52-57: home stretch, 58: home
    color: string;
};

export class LudoEngine implements IGameEngine {
    initialize(players: Player[]): GameState {
        const colors = ['red', 'blue', 'green', 'yellow'];
        const board: { [playerId: string]: LudoToken[] } = {};

        players.forEach((p, i) => {
            board[p.id] = [
                { id: '1', position: -1, color: colors[i] },
                { id: '2', position: -1, color: colors[i] },
                { id: '3', position: -1, color: colors[i] },
                { id: '4', position: -1, color: colors[i] },
            ];
        });

        return {
            status: 'IN_PROGRESS',
            currentTurn: players[0].id,
            board: board,
        };
    }

    makeMove(playerId: string, move: { tokenId: string; dice: number }, currentState: GameState): { newState: GameState; valid: boolean; error?: string } {
        if (currentState.status !== 'IN_PROGRESS') {
            return { newState: currentState, valid: false, error: 'Game is not in progress' };
        }

        if (playerId !== currentState.currentTurn) {
            return { newState: currentState, valid: false, error: 'Not your turn' };
        }

        const { tokenId, dice } = move;
        const tokens = (currentState.board[playerId] as LudoToken[]) || [];
        const tokenIndex = tokens.findIndex(t => t.id === tokenId);

        if (tokenIndex === -1) {
            return { newState: currentState, valid: false, error: 'Token not found' };
        }

        const token = tokens[tokenIndex];
        let newPosition = token.position;

        if (token.position === -1) {
            if (dice === 6) {
                newPosition = 0; // Enter the board
            } else {
                return { newState: currentState, valid: false, error: 'Must roll 6 to enter' };
            }
        } else {
            newPosition += dice;
            if (newPosition > 58) {
                return { newState: currentState, valid: false, error: 'Invalid move' };
            }
        }

        const newTokens = [...tokens];
        newTokens[tokenIndex] = { ...token, position: newPosition };

        const newBoard = { ...currentState.board };
        newBoard[playerId] = newTokens;

        // TODO: Capture logic, turn switching, and win detection
        // For now, simple update

        let finalStatus: any = currentState.status;
        let winnerId = currentState.winnerId;

        if (newTokens.every(t => t.position === 58)) {
            finalStatus = 'FINISHED';
            winnerId = playerId;
        }

        return {
            newState: {
                ...currentState,
                board: newBoard,
                status: finalStatus,
                winnerId,
                lastMove: move,
            },
            valid: true,
        };
    }

    checkWinner(state: GameState): string | null {
        return state.winnerId || null;
    }
}
