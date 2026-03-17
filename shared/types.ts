export type Player = {
    id: string;
    username: string;
    avatar?: string;
    color?: string;
    isReady: boolean;
};

export type GameState = {
    status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED' | 'VOTING' | 'REVEALING';
    winnerId?: string;
    currentTurn?: string;
    board: any;
    lastMove?: any;
};

export interface IGameEngine {
    initialize(players: Player[]): GameState;
    makeMove(playerId: string, move: any, currentState: GameState): { newState: GameState; valid: boolean; error?: string };
    checkWinner(state: GameState): string | null;
}

export interface LieDetectorGameState extends GameState {
    statementPlayerId: string;
    statement?: string;
    status: 'WAITING' | 'VOTING' | 'REVEALING' | 'FINISHED';
    votes: { [playerId: string]: 'TRUTH' | 'LIE' };
    correctAnswer?: 'TRUTH' | 'LIE';
    scores: { [playerId: string]: number };
    currentRound: number;
    totalRounds: number;
}

export type Room = {
    id: string;
    code: string;
    players: Player[];
    status: 'WAITING' | 'PLAYING';
    gameType?: 'TIC_TAC_TOE' | 'SNAKE_LADDERS' | 'LUDO' | 'HANGMAN' | 'LIE_DETECTOR';
    gameState?: GameState;
    rematchRequests?: string[];
    messages?: any[];
};
