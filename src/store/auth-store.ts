import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false, // default false
      isLoading: false,

      // ✅ Login API se
      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const res = await axios.post("http://localhost:5001/api/admin/auth/login", credentials);

          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error("Login error:", error.response?.data || error.message);
          set({ isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      // ✅ Logout
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "auth-storage" } // localStorage persist
  )
);
