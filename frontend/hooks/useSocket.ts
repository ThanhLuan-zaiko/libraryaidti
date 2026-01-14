import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/v1/ws';

export interface WSEvent {
    type: string;
    payload: any;
}

export function useSocket() {
    const { user } = useAuth(); // Get user from AuthContext
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<{ [key: string]: ((payload: any) => void)[] }>({});
    const retryCountRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        setStatus('connecting');

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('WS Connected');
            setStatus('connected');
            retryCountRef.current = 0;
        };

        ws.onclose = (event) => {
            // console.log(`WS Disconnected (Code: ${event.code})`);
            setStatus('disconnected');

            // Reconnect logic
            const timeout = Math.min(1000 * (2 ** retryCountRef.current), 30000);
            retryCountRef.current += 1;

            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, timeout);
        };

        ws.onmessage = (event) => {
            try {
                const data: WSEvent = JSON.parse(event.data);
                const callbacks = listenersRef.current[data.type] || [];
                callbacks.forEach(cb => cb(data.payload));
            } catch (err) {
                console.error('WS Parse Error', err);
            }
        };

        socketRef.current = ws;
    }, [user]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setStatus('disconnected');
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        }
    }, []);

    const joinRoom = useCallback((roomId: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                action: 'join_room',
                payload: roomId
            }));
        } else {
            const check = setInterval(() => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({
                        action: 'join_room',
                        payload: roomId
                    }));
                    clearInterval(check);
                } else if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
                    clearInterval(check);
                }
            }, 500);
        }
    }, []);

    const leaveRoom = useCallback((roomId: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                action: 'leave_room',
                payload: roomId
            }));
        }
    }, []);

    const subscribe = useCallback((event: string, callback: (payload: any) => void) => {
        if (!listenersRef.current[event]) {
            listenersRef.current[event] = [];
        }
        listenersRef.current[event].push(callback);

        return () => {
            listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
        };
    }, []);

    // Auto connect/disconnect based on user state
    // Auto connect on mount
    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        status,
        joinRoom,
        leaveRoom,
        subscribe
    };
}
