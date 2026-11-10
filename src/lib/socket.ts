import { io } from 'socket.io-client';

const SOCKET_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? '' : 'http://localhost:4000');

export const socket = io(SOCKET_URL, {
  autoConnect: typeof window !== 'undefined',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  socket.on('connect', () => {
    console.log('⚡ Conectado al servidor de WebSockets:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('🔌 Desconectado de WebSockets:', reason);
  });
  socket.on('connect_error', (error) => {
    console.warn('⚠️ Error de conexión WebSocket (reintentando con polling/websocket):', error.message);
  });
}
