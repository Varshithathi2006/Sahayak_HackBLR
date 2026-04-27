import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setCookie, removeCookie, getCookie } from "./cookieHelper";

interface User {
  id: string;
  email: string;
  name: string;
  role: "client" | "bank";
  orgId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isInitialized: false,
      setAuth: (user, token) => {
        set({ user, token });
        setCookie("auth-token", token, 7);
        setCookie("user-data", JSON.stringify(user), 7);
      },
      logout: () => {
        set({ user: null, token: null });
        removeCookie("auth-token");
        removeCookie("user-data");
      },
      setInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
