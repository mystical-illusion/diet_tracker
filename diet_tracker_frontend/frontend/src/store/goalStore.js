import { create } from "zustand";
import API_URL, { authHeaders } from "../services/api";
import { useAuthStore } from "./authStore";

export const useGoalStore = create((set) => ({
  goal: null,
  loading: false,

  // get user goal
  fetchGoal: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ loading: false });
        return;
      }

      const response = await fetch(`${API_URL}/goals/${user.id}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      set({ goal: data.goal, loading: false });
    } catch (err) {
      console.error("Failed to fetch goal:", err);
      set({ loading: false });
    }
  },

  // save or update goal
  saveGoal: async (daily_goal) => {
    try {
      const user = useAuthStore.getState().user;

      const response = await fetch(`${API_URL}/goals/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: user.id,
          daily_goal: daily_goal,
        }),
      });
      const data = await response.json();
      set({ goal: data.goal });
      return data;
    } catch (err) {
      console.error("Failed to save goal:", err);
      throw err;
    }
  },
}));
