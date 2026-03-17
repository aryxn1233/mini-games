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

        if (action !== 'SHOW' && playerId !== newState.currentTurn) {
            return { newState, valid: false, error: "It's not your turn!" };
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
            cardsToPlay.push(hand.splice(index, 1)[0]);
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
        const activePlayerCount = Object.keys(state.hands).length - state.finishedPlayers.length;

        if (state.passCount >= activePlayerCount) {
            // Round ends, clear pile
            state.pile = [];
            state.currentRank = undefined;
            state.lastMove = undefined;
            state.passCount = 0;
            // Last person who played (or the person after the last passer?) 
            // Usually the last person who played starts the next round.
            // But if everyone passed, the turn stays with whoever was supposed to play next or resets?
            // "Last player who played cards starts next round"
        } else {
            this.nextTurn(state);
        }

        return { newState: state, valid: true };
    }

    private handleShow(playerId: string, state: BluffCardGameState): { newState: BluffCardGameState; valid: boolean; error?: string } {
        if (!state.lastMove) {
            return { newState: state, valid: false, error: "Nothing to challenge yet!" };
        }

        const isBluff = state.lastMove.cardsPlayed.some(c => c.rank !== state.lastMove!.declaredRank);
        const lastPlayerId = state.lastMove.playerId;

        state.status = 'REVEALING';
        // We handle the actual reveal and card pickup in a follow-up or a delay
        // For now, let's process the logic immediately for simple turn-based flow

        if (isBluff) {
            // Challenger is correct, liar takes pile
            state.hands[lastPlayerId].push(...state.pile);
            state.currentTurn = lastPlayerId; // Liar starts next round? "Last player who played cards starts next round"
            // Actually, after a challenge, the loser starts the next round.
        } else {
            // Challenger is wrong, challenger takes pile
            state.hands[playerId].push(...state.pile);
            state.currentTurn = playerId;
        }

        // Reset round state
        state.pile = [];
        state.currentRank = undefined;
        state.lastMove = undefined;
        state.passCount = 0;

        // After picking up cards, if someone was supposedly finished, they might not be anymore? 
        // No, you can only pick up cards if you lose a challenge. If you finished, you can't be challenged on your last move?
        // Wait, you CAN be challenged on your last move. If you finish and someone challenges and you bluffed, you pick up the pile and are no longer finished.
        state.finishedPlayers = state.finishedPlayers.filter(pid => state.hands[pid].length === 0);

        // Check if game is over
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
