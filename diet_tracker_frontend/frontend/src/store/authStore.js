import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  // check token on page load
  init: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const userId = JSON.parse(atob(token.split(".")[1])).user_id;
      set({ user: { id: userId } });
    } catch {
      localStorage.clear();
    }
  },

  // login
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("http://127.0.0.1:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        set({
          user: data.user,
          loading: false,
        });
        return true;
      } else {
        set({
          error: data.error || "Login failed",
          loading: false,
        });
        return false;
      }
    } catch (err) {
      set({ error: "Login failed", loading: false });
      return false;
    }
  },

  // register
  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("http://127.0.0.1:5001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();

      if (data.message) {
        set({ loading: false });
        return true;
      } else {
        set({
          error: data.error || "Registration failed",
          loading: false,
        });
        return false;
      }
    } catch (err) {
      set({ error: "Registration failed", loading: false });
      return false;
    }
  },

  // logout
  logout: () => {
    localStorage.clear();
    set({ user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
