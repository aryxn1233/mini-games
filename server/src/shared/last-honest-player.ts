import { Player, LastHonestGameState, IGameEngine, GameState } from './types';

export class LastHonestEngine implements IGameEngine {
    initialize(players: Player[]): LastHonestGameState {
        const scores: { [playerId: string]: number } = {};
        players.forEach(p => scores[p.id] = 0);

        const setterIdx = Math.floor(Math.random() * players.length);
        const questionSetterId = players[setterIdx].id;

        return {
            status: 'WAITING',
            questionSetterId,
            answers: {},
            votes: {},
            scores,
            currentRound: 1,
            totalRounds: 5,
            board: {} // Compatibility
        };
    }

    makeMove(playerId: string, move: any, state: GameState): { newState: LastHonestGameState; valid: boolean; error?: string } {
        const newState = { ...(state as LastHonestGameState) };

        // 1. Submit Question (Setter only)
        if (newState.status === 'WAITING') {
            if (playerId !== newState.questionSetterId) {
                return { newState, valid: false, error: "Only the Question Setter can ask!" };
            }

            const { question } = move;
            if (!question || question.trim().length < 3) {
                return { newState, valid: false, error: "Question is too short!" };
            }

            newState.question = question;

            // Assign roles
            const players = Object.keys(newState.scores);
            const honestIdx = Math.floor(Math.random() * players.length);
            newState.honestPlayerId = players[honestIdx];

            newState.status = 'SUBMITTING';
            return { newState, valid: true };
        }

        // 2. Submit Answer
        if (newState.status === 'SUBMITTING') {
            if (newState.answers[playerId]) {
                return { newState, valid: false, error: "You already submitted your answer!" };
            }

            const { answer } = move;
            if (!answer || answer.trim().length < 1) {
                return { newState, valid: false, error: "Answer cannot be empty!" };
            }

            newState.answers[playerId] = answer;

            // Check if all players submitted
            const playerCount = Object.keys(newState.scores).length;
            if (Object.keys(newState.answers).length === playerCount) {
                newState.status = 'VOTING';
            }

            return { newState, valid: true };
        }

        // 3. Submit Vote
        if (newState.status === 'VOTING') {
            if (newState.votes[playerId]) {
                return { newState, valid: false, error: "You already voted!" };
            }

            const { votedPlayerId } = move;
            if (!newState.scores[votedPlayerId]) {
                return { newState, valid: false, error: "Invalid player selected!" };
            }

            // In this game, you SHOULD be able to vote for yourself if you are honest?
            // Actually, usually you vote for OTHERS. 
            // If I am honest, I know I'm honest. Voting for myself is a waste of a vote to find out who else is honest?
            // Wait, "Players must detect the honest player".
            // If I'm a liar, I want to find the honest one.
            // If I'm the honest one, I know I am. Do I vote?
            // Prompt says: "Voting is mandatory".
            // Let's allow voting for anyone except yourself to keep it semi-challenging even for the honest player (they have to guess who others might think is honest? No, they just wait).
            // Actually, let's forbid voting for self.
            if (votedPlayerId === playerId) {
                return { newState, valid: false, error: "You cannot vote for yourself!" };
            }

            newState.votes[playerId] = votedPlayerId;

            // Check if all players voted
            const playerCount = Object.keys(newState.scores).length;
            if (Object.keys(newState.votes).length === playerCount) {
                this.evaluateRound(newState);
            }

            return { newState, valid: true };
        }

        // 4. Next Round
        if (newState.status === 'REVEALING') {
            if (move.action === 'NEXT_ROUND') {
                this.startNextRound(newState);
                return { newState, valid: true };
            }
        }

        return { newState, valid: false, error: "Invalid action for current game state!" };
    }

    private evaluateRound(state: LastHonestGameState) {
        state.status = 'REVEALING';

        const honestId = state.honestPlayerId!;
        const players = Object.keys(state.scores);

        // Scoring Logic:
        // - Guessers (Liars): +10 if correctly guessed the Honest player.
        // - Honest Player: +20 if NO ONE or less than 30% of players caught them.
        //   Wait, let's keep it simple: +20 if not the majority vote? 
        //   Or just +10 per wrong guess?
        //   Actually: "Honest player wins if not detected".

        let honestDetectionCount = 0;
        players.forEach(voterId => {
            if (voterId === honestId) return; // Honest player's vote doesn't count towards their detection

            const votedId = state.votes[voterId];
            if (votedId === honestId) {
                state.scores[voterId] += 10;
                honestDetectionCount++;
            }
        });

        // If honest player was detected by less than half of the other players, they get a bonus
        const otherPlayersCount = players.length - 1;
        if (honestDetectionCount <= Math.floor(otherPlayersCount / 2)) {
            state.scores[honestId] += 20;
        }
    }

    private startNextRound(state: LastHonestGameState) {
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
        state.answers = {};
        state.votes = {};
        state.question = undefined;
        state.honestPlayerId = undefined;

        // Pick new setter (Round Robin)
        const players = Object.keys(state.scores);
        const currentSetterIdx = players.indexOf(state.questionSetterId);
        const nextSetterIdx = (currentSetterIdx + 1) % players.length;
        state.questionSetterId = players[nextSetterIdx];
    }

    checkWinner(state: LastHonestGameState): string | null {
        return state.winnerId || null;
    }
}
