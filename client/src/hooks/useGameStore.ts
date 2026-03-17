import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Room, Player, GameState } from '../shared/types';

interface GameStore {
    socket: Socket | null;
    player: Player | null;
    room: Room | null;
    gameState: GameState | null;
    messages: any[];
    error: string | null;

    connect: (username: string) => void;
    createRoom: () => void;
    joinRoom: (code: string) => void;
    startGame: (gameType: string) => void;
    makeMove: (move: any) => void;
    requestRematch: () => void;
    resetRoom: () => void;
    sendMessage: (text: string) => void;
    leaveRoom: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const useGameStore = create<GameStore>((set, get) => ({
    socket: null,
    player: null,
    room: null,
    gameState: null,
    messages: [],
    error: null,

    connect: (username: string) => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            const player: Player = { id: socket.id!, username, isReady: false };
            set({ socket, player });
        });

        socket.on('room_created', (room: Room) => set({ room, messages: (room as any).messages || [] }));
        socket.on('room_updated', (room: Room) => set({ room, messages: (room as any).messages || [] }));
        socket.on('game_started', (room: Room) => set({ room, gameState: room.gameState, messages: (room as any).messages || [] }));
        socket.on('game_state_updated', (gameState: GameState) => set({ gameState }));
        socket.on('new_message', (message: any) => {
            set(state => ({ messages: [...state.messages, message] }));
        });
        socket.on('error', (error: string) => set({ error }));

        socket.on('disconnect', () => {
            set({ socket: null, player: null, room: null, gameState: null, messages: [] });
        });
    },

    leaveRoom: () => {
        const { socket } = get();
        if (socket) {
            socket.emit('leave_room');
            set({ room: null, gameState: null, messages: [] });
        }
    },

    createRoom: () => {
        const { socket, player } = get();
        if (socket && player) {
            socket.emit('create_room', player);
        }
    },

    joinRoom: (code: string) => {
        const { socket, player } = get();
        if (socket && player) {
            socket.emit('join_room', { code, player });
        }
    },

    startGame: (gameType: string) => {
        const { socket, room } = get();
        if (socket && room) {
            socket.emit('start_game', { code: room.code, gameType });
        }
    },

    makeMove: (move: any) => {
        const { socket, room } = get();
        if (socket && room) {
            socket.emit('make_move', { code: room.code, move });
        }
    },

    requestRematch: () => {
        const { socket, room } = get();
        if (socket && room) {
            socket.emit('request_rematch', { code: room.code });
        }
    },

    resetRoom: () => {
        const { socket, room } = get();
        if (socket && room) {
            socket.emit('reset_room', { code: room.code });
        }
    },

    sendMessage: (text: string) => {
        const { socket, room } = get();
        if (socket && room) {
            socket.emit('send_message', { code: room.code, text });
        }
    }
}));
