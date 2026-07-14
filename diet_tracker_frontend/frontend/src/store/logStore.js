import { create } from "zustand";
import { format } from "date-fns";
import API_URL, { authHeaders } from "../services/api";
import { useAuthStore } from "./authStore";

export const useLogStore = create((set) => ({
  logs: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
  totals: {},
  date: format(new Date(), "yyyy-MM-dd"),
  loading: false,

  // set selected date
  setDate: (date) => set({ date }),

  // fetch meals for specific date
  fetchLogs: async (date) => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ loading: false });
        return;
      }

      const response = await fetch(
        `${API_URL}/logs/daily?user_id=${user.id}&date=${date}`,
        { headers: authHeaders() },
      );
      const data = await response.json();

      // organize meals by type
      const organized = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };

      // put all meals in general list
      // since your backend doesn't separate by meal type yet
      set({
        logs: organized,
        totals: {
          calories: data.total_calories,
        },
        loading: false,
        date,
      });
    } catch {
      set({ loading: false });
    }
  },

  // add new meal log
  addLog: async (food, calories) => {
    const user = useAuthStore.getState().user;
    const date = format(new Date(), "yyyy-MM-dd");

    const response = await fetch(`${API_URL}/food/add`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: user.id,
        food: food,
        calories: calories,
      }),
    });
    const data = await response.json();
    return data;
  },

  // delete meal
  deleteLog: async (id) => {
    await fetch(`${API_URL}/food/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },
}));
