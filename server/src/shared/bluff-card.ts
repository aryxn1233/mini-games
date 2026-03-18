import { Player, Card, BluffCardGameState, IGameEngine, GameState } from './types';

const SUITS: ('HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES')[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export class BluffCardEngine implements IGameEngine {
    initialize(players: Player[]): BluffCardGameState {
        const deck: Card[] = [];
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                deck.push({ suit, rank });
            });
        });

        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Deal cards
        const hands: { [playerId: string]: Card[] } = {};
        players.forEach(p => hands[p.id] = []);

        deck.forEach((card, index) => {
            const playerIndex = index % players.length;
            hands[players[playerIndex].id].push(card);
        });

        // Random first player
        const firstPlayerId = players[Math.floor(Math.random() * players.length)].id;

        return {
            status: 'STARTING',
            currentTurn: firstPlayerId,
            hands,
            pile: [],
            currentRank: undefined,
            lastMove: undefined,
            passCount: 0,
            finishedPlayers: [],
            board: {} // Compatibility
        };
    }

    makeMove(playerId: string, move: any, state: GameState): { newState: BluffCardGameState; valid: boolean; error?: string } {
        const newState = { ...(state as BluffCardGameState) };

        if (newState.status === 'FINISHED') {
            return { newState, valid: false, error: "Game is already finished!" };
        }

        const { action } = move;

        // Allow SHOW even if it's not our turn (challenging previous move)
        // Except during REVEALING status or if player already finished.
        if (newState.status === 'REVEALING') {
            if (action === 'NEXT_ROUND') {
                return this.handleNextRound(playerId, newState);
            }
            return { newState, valid: false, error: "Game is currently revealing cards!" };
        }

        if (action !== 'SHOW' && playerId !== newState.currentTurn) {
            return { newState, valid: false, error: "It's not your turn!" };
        }

        if (newState.finishedPlayers.includes(playerId)) {
            return { newState, valid: false, error: "You have already finished!" };
        }

        switch (action) {
            case 'PLAY':
                return this.handlePlay(playerId, move, newState);
            case 'PASS':
                return this.handlePass(playerId, newState);
            case 'SHOW':
                return this.handleShow(playerId, newState);
            default:
                return { newState, valid: false, error: "Invalid action!" };
        }
    }

    private handlePlay(playerId: string, move: any, state: BluffCardGameState): { newState: BluffCardGameState; valid: boolean; error?: string } {
        const { cards, declaredRank } = move;

        if (!cards || !Array.isArray(cards) || cards.length === 0 || cards.length > 4) {
            return { newState: state, valid: false, error: "Must play between 1 and 4 cards!" };
        }

        if (state.currentRank && declaredRank !== state.currentRank) {
            return { newState: state, valid: false, error: `Must play ${state.currentRank}s this round!` };
        }

        if (!RANKS.includes(declaredRank)) {
            return { newState: state, valid: false, error: "Invalid rank declared!" };
        }

        // Validate player has these cards
        const hand = state.hands[playerId];
        const cardsToPlay: Card[] = [];

        for (const cardToFind of cards) {
            const index = hand.findIndex(c => c.suit === cardToFind.suit && c.rank === cardToFind.rank);
            if (index === -1) {
                return { newState: state, valid: false, error: "You don't have those cards!" };
            }
            // Temporarily remove card (actual move confirmed below)
            cardsToPlay.push(hand[index]);
        }

        // Actually remove cards from hand
        for (const cardToPlay of cardsToPlay) {
            const index = hand.findIndex(c => c.suit === cardToPlay.suit && c.rank === cardToPlay.rank);
            hand.splice(index, 1);
        }

        // Update state
        state.currentRank = declaredRank;
        state.pile.push(...cardsToPlay);
        state.lastMove = {
            playerId,
            cardsPlayed: cardsToPlay,
            declaredRank
        };
        state.passCount = 0;
        state.status = 'IN_PROGRESS';

        // Check if player finished
        if (hand.length === 0 && !state.finishedPlayers.includes(playerId)) {
            state.finishedPlayers.push(playerId);
        }

        this.nextTurn(state);
        return { newState: state, valid: true };
    }

    private handlePass(playerId: string, state: BluffCardGameState): { newState: BluffCardGameState; valid: boolean; error?: string } {
        if (!state.currentRank) {
            return { newState: state, valid: false, error: "First player must play cards!" };
        }

        state.passCount++;

        // If all players minus finished players have passed
        const activePlayerIds = Object.keys(state.hands).filter(pid => !state.finishedPlayers.includes(pid));
        const activePlayerCount = activePlayerIds.length;

        if (state.passCount >= activePlayerCount) {
            // Round ends, all cards on table are removed from the game (discarded)
            let lastPlayerId = state.lastMove?.playerId;
            state.pile = [];
            state.currentRank = undefined;
            state.lastMove = undefined;
            state.passCount = 0;

            // The player who last played cards starts the next round
            // If the last player who played has finished, the next active player starts.
            if (lastPlayerId && !state.finishedPlayers.includes(lastPlayerId)) {
                state.currentTurn = lastPlayerId;
            } else {
                // Find next active player to start
                const playerIds = Object.keys(state.hands);
                let nextIdx = (playerIds.indexOf(state.currentTurn!) + 1) % playerIds.length;
                while (state.finishedPlayers.includes(playerIds[nextIdx])) {
                    nextIdx = (nextIdx + 1) % playerIds.length;
                }
                state.currentTurn = playerIds[nextIdx];
            }
        } else {
            this.nextTurn(state);
        }

        return { newState: state, valid: true };
    }

    private handleShow(playerId: string, state: BluffCardGameState): { newState: BluffCardGameState; valid: boolean; error?: string } {
        if (!state.lastMove) {
            return { newState: state, valid: false, error: "Nothing to challenge yet!" };
        }

        // According to rules: "Challenge the last player's move only"
        // Also "Only the last move is revealed"
        state.challengerId = playerId;
        state.status = 'REVEALING';

        return { newState: state, valid: true };
    }

    private handleNextRound(playerId: string, state: BluffCardGameState): { newState: BluffCardGameState; valid: boolean; error?: string } {
        if (!state.lastMove || !state.challengerId) return { newState: state, valid: false };

        const isBluff = state.lastMove.cardsPlayed.some(c => c.rank !== state.lastMove!.declaredRank);
        const lastPlayerId = state.lastMove.playerId;
        const challengerId = state.challengerId;

        if (isBluff) {
            // CASE 2: LAST PLAYER WAS BLUFFING
            // Challenger is CORRECT -> Last player takes ALL cards from the pile
            state.hands[lastPlayerId].push(...state.pile);
            state.currentTurn = lastPlayerId;
        } else {
            // CASE 1: LAST PLAYER WAS TRUTHFUL
            // Challenger is WRONG -> Challenger takes ALL cards from the pile
            state.hands[challengerId].push(...state.pile);
            state.currentTurn = challengerId;
        }

        // Round resets immediately
        state.pile = [];
        state.currentRank = undefined;
        state.lastMove = undefined;
        state.challengerId = undefined;
        state.passCount = 0;
        state.status = 'IN_PROGRESS';

        // If someone was finished but pick up cards, they are back in the game
        state.finishedPlayers = state.finishedPlayers.filter(pid => state.hands[pid].length === 0);

        this.checkGameStatus(state);
        return { newState: state, valid: true };
    }

    private nextTurn(state: BluffCardGameState) {
        const playerIds = Object.keys(state.hands);
        const currentIndex = playerIds.indexOf(state.currentTurn!);

        let nextIndex = (currentIndex + 1) % playerIds.length;
        // Skip finished players
        while (state.finishedPlayers.includes(playerIds[nextIndex]) && state.finishedPlayers.length < playerIds.length - 1) {
            nextIndex = (nextIndex + 1) % playerIds.length;
        }

        state.currentTurn = playerIds[nextIndex];
        this.checkGameStatus(state);
    }

    private checkGameStatus(state: BluffCardGameState) {
        const totalPlayers = Object.keys(state.hands).length;
        if (state.finishedPlayers.length >= totalPlayers - 1) {
            state.status = 'FINISHED';
            state.winnerId = state.finishedPlayers[0];
        }
    }

    checkWinner(state: BluffCardGameState): string | null {
        return state.winnerId || null;
    }
}
