// ─────────────────────────────────────────────────────────────────────────────
// src/services/socketService.js
// Manages the Socket.io connection to the LeadSync backend.
// Keeps one singleton connection that the whole app shares.
// ─────────────────────────────────────────────────────────────────────────────

import { io } from 'socket.io-client';
import { SERVER_URL } from '../utils/config';

let socket = null;

/**
 * Open (or re-use) the socket connection.
 * Returns the socket instance.
 */
export const connectSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SERVER_URL, {
    transports: ['websocket'],   // skip long-polling on mobile
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected →', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected –', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Error –', err.message);
  });

  return socket;
};

/**
 * Disconnect gracefully (call on app unmount / cleanup).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Expose the raw socket so screens can attach listeners.
 */
export const getSocket = () => socket;
