export type Player = {
    id: string;
    username: string;
    avatar?: string;
    color?: string;
    isReady: boolean;
};

export type GameState = {
    status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED';
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

export type Room = {
    id: string;
    code: string;
    players: Player[];
    status: 'WAITING' | 'PLAYING';
    gameType?: string;
    gameState?: GameState;
    rematchRequests?: string[];
    messages?: any[];
};
