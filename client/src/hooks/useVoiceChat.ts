import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { useGameStore } from './useGameStore';

export function useVoiceChat() {
    const { socket, room, player } = useGameStore();
    const [peers, setPeers] = useState<{ [playerId: string]: Peer.Instance }>({});
    const [streams, setStreams] = useState<{ [playerId: string]: MediaStream }>({});
    const [isMuted, setIsMuted] = useState(false);
    const [remoteMutes, setRemoteMutes] = useState<{ [playerId: string]: boolean }>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [playerId: string]: Peer.Instance }>({});

    useEffect(() => {
        if (!socket || !room || !player) return;
        let isMounted = true;

        const initVoice = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!isMounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                
                // For each other player already in the room
                room.players.forEach(otherPlayer => {
                    if (otherPlayer.id !== player.id && !peersRef.current[otherPlayer.id]) {
                        const isInitiator = player.id < otherPlayer.id;
                        
                        if (isInitiator) {
                            console.log(`Initiating connection to ${otherPlayer.id}`);
                            const peer = createPeer(otherPlayer.id, socket.id!, stream, true);
                            peersRef.current[otherPlayer.id] = peer;
                            setPeers(prev => ({ ...prev, [otherPlayer.id]: peer }));
                        }
                    }
                });
            } catch (err) {
                console.error('Failed to get local stream', err);
            }
        };

        initVoice();

        socket.on('voice_signal', ({ from, signal }: { from: string; signal: any }) => {
            if (!isMounted) return;
            
            if (peersRef.current[from]) {
                try {
                    if (!peersRef.current[from].destroyed) {
                        peersRef.current[from].signal(signal);
                    }
                } catch (err) {
                    console.warn('Signal could not be applied', err);
                }
            } else if (localStreamRef.current) {
                // Only create peer if we have our own stream ready
                console.log(`Receiving connection from ${from}`);
                const peer = createPeer(from, socket.id!, localStreamRef.current, false);
                peer.signal(signal);
                peersRef.current[from] = peer;
                setPeers(prev => ({ ...prev, [from]: peer }));
            }
        });

        return () => {
            isMounted = false;
            socket.off('voice_signal');
            Object.values(peersRef.current).forEach(p => {
                try { p.destroy(); } catch (e) {}
            });
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            peersRef.current = {};
            setPeers({});
            setStreams({});
        };
    }, [socket, room?.code]);

    const createPeer = (targetId: string, callerId: string, stream: MediaStream, initiator: boolean) => {
        const peer = new Peer({
            initiator,
            trickle: true,
            stream,
        });

        peer.on('signal', signal => {
            socket?.emit('voice_signal', { to: targetId, signal });
        });

        peer.on('stream', remoteStream => {
            setStreams(prev => ({ ...prev, [targetId]: remoteStream }));
        });

        peer.on('error', err => console.error('Peer error', err));
        
        peer.on('close', () => {
            delete peersRef.current[targetId];
            setPeers({ ...peersRef.current });
            setStreams(prev => {
                const next = { ...prev };
                delete next[targetId];
                return next;
            });
        });

        return peer;
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleRemoteMute = (playerId: string) => {
        setRemoteMutes(prev => ({ ...prev, [playerId]: !prev[playerId] }));
    };

    return { streams, isMuted, toggleMute, remoteMutes, toggleRemoteMute };
}
