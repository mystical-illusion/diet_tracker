import { create } from "zustand";
import API_URL, { authHeaders } from "../services/api";

export const useFoodStore = create((set) => ({
  foods: [],
  loading: false,

  // get all meals
  fetchFoods: async () => {
    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/food/list`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      set({ foods: data.meals, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // add new meal
  addFood: async (food, calories, user_id) => {
    const response = await fetch(`${API_URL}/food/add`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ food, calories, user_id }),
    });
    const data = await response.json();
    return data;
  },

  // update meal
  updateFood: async (id, food, calories) => {
    const response = await fetch(`${API_URL}/food/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ food, calories }),
    });
    const data = await response.json();
    return data;
  },

  // delete meal
  deleteFood: async (id) => {
    await fetch(`${API_URL}/food/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    set((s) => ({
      foods: s.foods.filter((f) => f.id !== id),
    }));
  },
}));
