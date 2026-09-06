import { io } from 'socket.io-client';

// Ajusta la URL a la de tu backend (NestJS)
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
});