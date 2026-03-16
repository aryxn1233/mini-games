import { Player, HangmanGameState, IGameEngine } from './types';

export class HangmanEngine implements IGameEngine {
    initialize(players: Player[]): HangmanGameState {
        // Roll for roles: first player is setter, second is guesser
        const setterId = players[0].id;
        const guesserId = players[1].id;

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
            newState.currentTurn = newState.guesserId;
            return { newState, valid: true };
        }

        // 2. Handle Guessing
        if (newState.status === 'IN_PROGRESS') {
            if (playerId !== newState.guesserId) return { newState, valid: false, error: "Not your turn to guess!" };
            
            const letter = move.letter?.toUpperCase();
            if (!letter || letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
                return { newState, valid: false, error: "Invalid letter!" };
            }

            if (newState.guessedLetters.includes(letter) || newState.wrongLetters.includes(letter)) {
                return { newState, valid: false, error: "You already guessed this letter!" };
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
        // Guesser wins if maskedWord is fully revealed
        if (state.maskedWord && !state.maskedWord.includes('_')) {
            return state.guesserId;
        }

        // Setter wins if attempts reach zero
        if (state.attemptsLeft <= 0) {
            return state.setterId;
        }

        return null;
    }
}
