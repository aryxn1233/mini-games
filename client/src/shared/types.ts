export type Player = {
  id: string;
  username: string;
  avatar?: string;
  color?: string;
  isReady: boolean;
};

export type Card = {
  suit: 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
  rank: string;
};

export type GameState = {
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED' | 'VOTING' | 'REVEALING' | 'SUBMITTING';
  winnerId?: string;
  currentTurn?: string;
  board: any;
  lastMove?: any;
};

export interface HangmanGameState extends GameState {
  word?: string;
  maskedWord: string[];
  guessedLetters: string[];
  wrongLetters: string[];
  attemptsLeft: number;
  setterId: string;
  guesserId: string;
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

export interface BluffGameState extends GameState {
  status: 'WAITING' | 'SUBMITTING' | 'VOTING' | 'REVEALING' | 'FINISHED';
  prompt: { id: string; text: string; category: string };
  liarIds: string[];
  responses: { [playerId: string]: string };
  shuffledResponses?: { text: string; authorId?: string }[];
  votes: { [voterId: string]: string };
  scores: { [playerId: string]: number };
  currentRound: number;
  totalRounds: number;
  mode: 'CLASSIC' | 'CHAOS' | 'QUICK';
  timer?: number;
}

export interface BluffCardGameState extends GameState {
  hands: { [playerId: string]: Card[] };
  pile: Card[];
  currentRank?: string;
  lastMove?: {
    playerId: string;
    cardsPlayed: Card[];
    declaredRank: string;
  };
  challengerId?: string;
  passCount: number;
  finishedPlayers: string[];
}

export type GameType = 'TIC_TAC_TOE' | 'SNAKE_LADDERS' | 'LUDO' | 'HANGMAN' | 'LIE_DETECTOR' | 'BLUFF' | 'BLUFF_CARD';

export interface IGameEngine {
  initialize(players: Player[]): GameState;
  makeMove(playerId: string, move: any, currentState: GameState): { newState: GameState; valid: boolean; error?: string };
  checkWinner(state: GameState): string | null;
}

export type ChatMessage = {
  playerId: string;
  username: string;
  text: string;
  timestamp: number;
};

export type Room = {
  id: string;
  code: string;
  players: Player[];
  status: 'WAITING' | 'PLAYING';
  gameType?: string;
  gameState?: GameState;
  rematchRequests?: string[];
  messages?: ChatMessage[];
};
