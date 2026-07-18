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
  loginAt: number | null;
  // step 1: verify password -> sends OTP (returns { otpRequired, email })
  login: (credentials: { email: string; password: string }) => Promise<any>;
  // step 2: verify OTP -> sets token + authenticated
  verifyOtp: (data: { email: string; otp: string }) => Promise<void>;
  // step 2 (authenticator app): verify TOTP/backup code -> sets token
  verifyTotp: (data: { email: string; otp: string }) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  checkSession: () => void;
}

const SESSION_MS = 24 * 60 * 60 * 1000; // 24 hours

const API_BASE = import.meta.env.VITE_API_BASE || "https://dlockservices.com/api";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false, // default false
      isLoading: false,
      loginAt: null,

      // Step 1: email + password -> OTP sent
      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const res = await axios.post(`${API_BASE}/admin/auth/login`, credentials);
          set({ isLoading: false });
          return res.data; // { otpRequired: true, email }
        } catch (error: any) {
          console.error("Login error:", error.response?.data || error.message);
          set({ isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      // Step 2: verify OTP -> login
      verifyOtp: async ({ email, otp }) => {
        try {
          set({ isLoading: true });
          const res = await axios.post(`${API_BASE}/admin/auth/verify-otp`, { email, otp });
          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
            loginAt: Date.now(),
          });
        } catch (error: any) {
          console.error("OTP verify error:", error.response?.data || error.message);
          set({ isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      // Step 2 (authenticator app): verify TOTP or backup code -> login
      verifyTotp: async ({ email, otp }) => {
        try {
          set({ isLoading: true });
          const res = await axios.post(`${API_BASE}/admin/auth/verify-totp`, { email, otp });
          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
            loginAt: Date.now(),
          });
        } catch (error: any) {
          console.error("TOTP verify error:", error.response?.data || error.message);
          set({ isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      resendOtp: async (email) => {
        await axios.post(`${API_BASE}/admin/auth/resend-otp`, { email });
      },

      // ✅ Logout
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, loginAt: null });
      },

      // auto-logout after 24 hours
      checkSession: () => {
        const { loginAt, isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated && loginAt && Date.now() - loginAt > SESSION_MS) {
          set({ user: null, token: null, isAuthenticated: false, loginAt: null });
        }
      },
    }),
    { name: "auth-storage" } // localStorage persist
  )
);
