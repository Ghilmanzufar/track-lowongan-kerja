import type { User } from '../types';

let currentUser: User | null = null;
let accessToken: string | null = null;
let isInitialized = false;

type AuthListener = (user: User | null) => void;
const listeners: Set<AuthListener> = new Set();

function notify() {
  listeners.forEach((listener) => listener(currentUser));
}

export const authStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null) {
    accessToken = token;
  },

  getUser(): User | null {
    return currentUser;
  },

  setUser(user: User | null) {
    currentUser = user;
    notify();
  },

  setAuth(token: string, user: User) {
    accessToken = token;
    currentUser = user;
    isInitialized = true;
    notify();
  },

  clearAuth() {
    accessToken = null;
    currentUser = null;
    isInitialized = true;
    notify();
  },

  isAuthenticated(): boolean {
    return !!accessToken && !!currentUser;
  },

  isReady(): boolean {
    return isInitialized;
  },

  setInitialized(ready: boolean) {
    isInitialized = ready;
  },

  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
