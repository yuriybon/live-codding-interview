import { create } from 'zustand';
import axios from 'axios';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthState {
  // State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Check authentication status by calling /auth/me
  checkAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get('/auth/me', { withCredentials: true });

      if (response.data.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication status',
      });
    }
  },

  // Initiate Google OAuth login flow
  login: () => {
    // Redirect to backend OAuth endpoint
    window.location.href = '/auth/google';
  },

  // Logout user
  logout: async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });

      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      set({ error: 'Logout failed' });
    }
  },

  // Clear error message
  clearError: () => set({ error: null }),
}));
