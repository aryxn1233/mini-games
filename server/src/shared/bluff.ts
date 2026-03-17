import { Player, BluffGameState, IGameEngine, GameState } from './types';

const DEFAULT_PROMPTS = [
    { id: '1', text: 'What is the most embarrassing thing you did in school?', category: 'funny' },
    { id: '2', text: 'If you could have any superpower, what would it be?', category: 'random' },
    { id: '3', text: 'What is your biggest fear?', category: 'deep' },
    { id: '4', text: 'What did you do last weekend?', category: 'personal' },
    { id: '5', text: 'What is a secret talent you have?', category: 'personal' },
    { id: '6', text: 'If you won a million dollars, what is the first thing you would buy?', category: 'random' },
    { id: '7', text: 'What is the weirdest food you have ever eaten?', category: 'funny' },
    { id: '8', text: 'Where is your dream vacation destination?', category: 'random' },
    { id: '9', text: 'What is something you have never told anyone?', category: 'deep' },
    { id: '10', text: 'What was your first childhood pet named?', category: 'personal' }
];

export class BluffEngine implements IGameEngine {
    initialize(players: Player[]): BluffGameState {
        const scores: { [playerId: string]: number } = {};
        players.forEach(p => scores[p.id] = 0);

        const liarCount = players.length >= 5 ? 2 : 1;
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const liarIds = shuffled.slice(0, liarCount).map(p => p.id);
        const prompt = DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)];

        return {
            status: 'SUBMITTING',
            prompt,
            liarIds,
            responses: {},
            votes: {},
            scores,
            currentRound: 1,
            totalRounds: 5, // Default 5 rounds
            mode: 'CLASSIC',
            board: {} // Compatibility
        };
    }

    makeMove(playerId: string, move: any, state: GameState): { newState: BluffGameState; valid: boolean; error?: string } {
        const newState = { ...(state as BluffGameState) };

        // 1. Submit Response
        if (newState.status === 'SUBMITTING') {
            if (newState.responses[playerId]) {
                return { newState, valid: false, error: "You already submitted your answer!" };
            }

            const { response } = move;
            if (!response || response.trim().length < 2) {
                return { newState, valid: false, error: "Answer is too short!" };
            }

            newState.responses[playerId] = response;

            // Check if all players submitted
            const playerCount = Object.keys(newState.scores).length;
            if (Object.keys(newState.responses).length === playerCount) {
                this.prepareVoting(newState);
            }

            return { newState, valid: true };
        }

        // 2. Submit Vote
        if (newState.status === 'VOTING') {
            if (newState.votes[playerId]) {
                return { newState, valid: false, error: "You already voted!" };
            }

            const { votedPlayerId } = move;
            if (!newState.scores[votedPlayerId]) {
                return { newState, valid: false, error: "Invalid player selected!" };
            }

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

        // 3. Next Round
        if (newState.status === 'REVEALING') {
            if (move.action === 'NEXT_ROUND') {
                this.startNextRound(newState);
                return { newState, valid: true };
            }
        }

        return { newState, valid: false, error: "Invalid action for current game state!" };
    }

    private prepareVoting(state: BluffGameState) {
        state.status = 'VOTING';

        // Shuffle responses anonymously
        const responsesArray = Object.entries(state.responses).map(([pid, text]) => ({
            text,
            authorId: pid // This will be sanitized in RoomManager before sending to clients
        }));

        state.shuffledResponses = responsesArray.sort(() => Math.random() - 0.5);
    }

    private evaluateRound(state: BluffGameState) {
        state.status = 'REVEALING';

        const liarIds = state.liarIds;
        const voters = Object.keys(state.scores);

        // Scoring:
        // Guessers: +10 for correct guess
        // Liars: +10 per fooled player, +30 bonus if NO ONE catches them

        const liarDetectionCounts: { [liarId: string]: number } = {};
        liarIds.forEach(id => liarDetectionCounts[id] = 0);

        voters.forEach(voterId => {
            if (liarIds.includes(voterId)) return; // Liars don't get guesser points against themselves

            const votedId = state.votes[voterId];
            if (liarIds.includes(votedId)) {
                state.scores[voterId] += 10;
                liarDetectionCounts[votedId]++;
            } else {
                // Voter was fooled by another player (maybe a truth player who sounded fake, or another liar)
                // If they voted for a liar, we already handled it.
                // If they voted for a truth player, the "author" of that response (if a liar) gets points later.
                // Actually the rules say: "Each player fooled -> +10 points" for the liar.
                // WE need to know WHO the voter voted for.
                const authorId = votedId;
                if (liarIds.includes(authorId)) {
                    state.scores[authorId] += 10;
                }
            }
        });

        // Check if any liar was completely undetected
        liarIds.forEach(liarId => {
            if (liarDetectionCounts[liarId] === 0) {
                state.scores[liarId] += 30;
            }
        });
    }

    private startNextRound(state: BluffGameState) {
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
        state.status = 'SUBMITTING';
        state.responses = {};
        state.votes = {};
        state.shuffledResponses = undefined;

        // Pick new prompt
        state.prompt = DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)];

        // Pick new liars (Ensuring fair distribution - avoid same liar consecutively)
        const players = Object.keys(state.scores);
        const liarCount = players.length >= 5 ? 2 : 1;

        let availablePlayers = players.filter(id => !state.liarIds.includes(id));
        if (availablePlayers.length < liarCount) {
            availablePlayers = players; // Fallback if too few players
        }

        const shuffled = availablePlayers.sort(() => Math.random() - 0.5);
        state.liarIds = shuffled.slice(0, liarCount);
    }

    checkWinner(state: BluffGameState): string | null {
        return state.winnerId || null;
    }
}
