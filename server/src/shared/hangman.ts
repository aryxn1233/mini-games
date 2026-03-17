import { Player, HangmanGameState, IGameEngine } from './types';

export class HangmanEngine implements IGameEngine {
    initialize(players: Player[]): HangmanGameState {
        // Randomly pick a setter
        const setterIndex = Math.floor(Math.random() * players.length);
        const setterId = players[setterIndex].id;

        // Randomly pick the first guesser (for compatibility, though all can guess)
        const otherPlayers = players.filter(p => p.id !== setterId);
        const guesserId = otherPlayers.length > 0
            ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id
            : players[(setterIndex + 1) % players.length].id;

        return {
            status: 'WAITING',
            currentTurn: setterId, // Setter starts by picking a word
            board: {}, // General board compatibility
            setterId,
            guesserId,
            maskedWord: [],
            guessedLetters: [],
            wrongLetters: [],
            attemptsLeft: 6
        };
    }

    makeMove(playerId: string, move: any, currentState: HangmanGameState): { newState: HangmanGameState; valid: boolean; error?: string } {
        const newState = { ...currentState };

        // 1. Handle Word Setting
        if (newState.status === 'WAITING') {
            if (playerId !== newState.setterId) return { newState, valid: false, error: "Only the word setter can pick the word!" };

            const word = move.word?.toUpperCase();
            if (!word || word.length < 3 || word.length > 12 || !/^[A-Z]+$/.test(word)) {
                return { newState, valid: false, error: "Word must be 3-12 letters and A-Z only!" };
            }

            newState.word = word;
            newState.maskedWord = word.split('').map(() => '_');
            newState.status = 'IN_PROGRESS';
            // In multiplayer, everyone who is NOT the setter can guess.
            // We set currentTurn to a generic value or keep it as guesserId for single-guesser logic.
            // For UI purposes, we'll keep currentTurn logic but allow any non-setter to make a move.
            newState.currentTurn = newState.guesserId;
            return { newState, valid: true };
        }

        // 2. Handle Guessing
        if (newState.status === 'IN_PROGRESS') {
            // Allow ANY player who is NOT the setter to guess
            if (playerId === newState.setterId) return { newState, valid: false, error: "You are the word setter, you can't guess!" };

            const letter = move.letter?.toUpperCase();
            if (!letter || letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
                return { newState, valid: false, error: "Invalid letter!" };
            }

            if (newState.guessedLetters.includes(letter) || newState.wrongLetters.includes(letter)) {
                return { newState, valid: false, error: "This letter has already been guessed!" };
            }

            if (newState.word?.includes(letter)) {
                newState.guessedLetters.push(letter);
                // Update masked word
                newState.maskedWord = newState.word.split('').map(char =>
                    newState.guessedLetters.includes(char) ? char : '_'
                );
            } else {
                newState.wrongLetters.push(letter);
                newState.attemptsLeft--;
            }

            // In multiplayer, the "turn" could rotate or just stay on whoever guessed last.
            // For now, let's keep currentTurn as the player who just moved if it's not setter.
            newState.currentTurn = playerId;

            // Check Win/Loss
            const winner = this.checkWinner(newState);
            if (winner) {
                newState.status = 'FINISHED';
                newState.winnerId = winner;
            }

            return { newState, valid: true };
        }

        return { newState, valid: false, error: "Game already finished!" };
    }

    checkWinner(state: HangmanGameState): string | null {
        // Players (guessers) win if maskedWord is fully revealed
        if (state.maskedWord && !state.maskedWord.includes('_')) {
            // In multiplayer, anyone other than setter wins? 
            // Usually we return the ID of the person who made the winning move.
            // If winnerId is already set in makeMove, it will be used.
            return state.currentTurn || state.guesserId;
        }

        // Setter wins if attempts reach zero
        if (state.attemptsLeft <= 0) {
            return state.setterId;
        }

        return null;
    }
}
