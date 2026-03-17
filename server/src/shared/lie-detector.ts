import { Player, LieDetectorGameState, IGameEngine, GameState } from './types';

export class LieDetectorEngine implements IGameEngine {
    initialize(players: Player[]): LieDetectorGameState {
        const scores: { [playerId: string]: number } = {};
        players.forEach(p => scores[p.id] = 0);

        // Pick random statement player
        const statementPlayerId = players[Math.floor(Math.random() * players.length)].id;

        return {
            status: 'WAITING', // Waiting for statement
            statementPlayerId,
            votes: {},
            scores,
            currentRound: 1,
            totalRounds: players.length * 2, // 2 rounds per player
            board: {} // Compatibility
        };
    }

    makeMove(playerId: string, move: any, state: GameState): { newState: LieDetectorGameState; valid: boolean; error?: string } {
        const newState = { ...(state as LieDetectorGameState) };

        // 1. Submit Statement
        if (newState.status === 'WAITING') {
            if (playerId !== newState.statementPlayerId) {
                return { newState, valid: false, error: "Only the statement player can submit a statement!" };
            }

            const { statement, isTruth } = move;
            if (!statement || statement.trim().length < 5) {
                return { newState, valid: false, error: "Statement is too short!" };
            }

            newState.statement = statement;
            newState.correctAnswer = isTruth ? 'TRUTH' : 'LIE';
            newState.status = 'VOTING';
            newState.votes = {};
            return { newState, valid: true };
        }

        // 2. Submit Vote
        if (newState.status === 'VOTING') {
            if (playerId === newState.statementPlayerId) {
                return { newState, valid: false, error: "You cannot vote on your own statement!" };
            }

            if (newState.votes[playerId]) {
                return { newState, valid: false, error: "You already voted!" };
            }

            const { vote } = move;
            if (vote !== 'TRUTH' && vote !== 'LIE') {
                return { newState, valid: false, error: "Invalid vote!" };
            }

            newState.votes[playerId] = vote;

            // Check if all other players have voted
            const playerCount = Object.keys(newState.scores).length;
            if (Object.keys(newState.votes).length === playerCount - 1) {
                this.evaluateResults(newState);
            }

            return { newState, valid: true };
        }

        // 3. Reveal Result (Manual trigger or automatically after delay handled by server/client)
        if (newState.status === 'REVEALING') {
            if (move.action === 'NEXT_ROUND') {
                this.startNextRound(newState);
                return { newState, valid: true };
            }
        }

        return { newState, valid: false, error: "Invalid action for current game state!" };
    }

    private evaluateResults(state: LieDetectorGameState) {
        state.status = 'REVEALING';

        let correctGuesses = 0;
        let totalGuesses = 0;

        for (const [pid, vote] of Object.entries(state.votes)) {
            totalGuesses++;
            if (vote === state.correctAnswer) {
                state.scores[pid] += 10;
                correctGuesses++;
            }
        }

        // Statement player bonus
        const fooledMajority = correctGuesses < totalGuesses / 2;
        if (fooledMajority) {
            state.scores[state.statementPlayerId] += 20;
        }
    }

    private startNextRound(state: LieDetectorGameState) {
        if (state.currentRound >= state.totalRounds) {
            state.status = 'FINISHED';
            // Determine winner
            let maxScore = -1;
            let winnerId = '';
            for (const [pid, score] of Object.entries(state.scores)) {
                if (score > maxScore) {
                    maxScore = score;
                    winnerId = pid;
                }
            }
            state.winnerId = winnerId;
            return;
        }

        state.currentRound++;
        state.status = 'WAITING';
        state.statement = undefined;
        state.correctAnswer = undefined;
        state.votes = {};

        // Rotate statement player
        const playerIds = Object.keys(state.scores);
        const currentIndex = playerIds.indexOf(state.statementPlayerId);
        state.statementPlayerId = playerIds[(currentIndex + 1) % playerIds.length];
    }

    checkWinner(state: LieDetectorGameState): string | null {
        return state.winnerId || null;
    }
}
