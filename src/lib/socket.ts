import { io, Socket } from 'socket.io-client';

function getSocketOrigin(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL;

  if (rawUrl) {
    try {
      // Quita cualquier ruta como "/api" para conectar siempre al namespace raíz "/"
      return new URL(rawUrl).origin;
    } catch {
      return rawUrl.replace(/\/api\/?$/, '');
    }
  }

  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:4000';
}

export const socket: Socket = io(getSocketOrigin(), {
  autoConnect: typeof window !== 'undefined',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  reconnectionDelayMax: 10000,
  timeout: 10000,
});

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  socket.on('connect', () => {
    console.log('⚡ WebSocket conectado:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket desconectado:', reason);
  });
  socket.on('connect_error', (error) => {
    console.warn('⚠️ Error WebSocket:', error.message);
  });
}