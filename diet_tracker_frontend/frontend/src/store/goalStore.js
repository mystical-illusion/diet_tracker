// import { create } from "zustand";
// import API_URL, { authHeaders } from "../services/api";
// import { useAuthStore } from "./authStore";

// export const useGoalStore = create((set) => ({
//   goal: null,
//   loading: false,

//   // get user goal
//   fetchGoal: async () => {
//     set({ loading: true });
//     try {
//       const user = useAuthStore.getState().user;

//       // add this check!
//       if (!user || !user.id) {
//         console.log("No user or user.id:", user);
//         set({ loading: false });
//         return;
//       }

//       console.log("Fetching goal for user:", user.id);

//       const response = await fetch(`${API_URL}/goals/${user.id}`, {
//         headers: authHeaders(),
//       });

//       // check if response is ok first!
//       if (!response.ok) {
//         console.log("Goal response status:", response.status);
//         set({ loading: false });
//         return;
//       }

//       const data = await response.json();
//       set({ goal: data.goal, loading: false });
//     } catch (err) {
//       console.error("Failed to fetch goal:", err);
//       set({ loading: false });
//     }
//   },
//   // save or update goal
//   saveGoal: async (daily_goal) => {
//     try {
//       const user = useAuthStore.getState().user;

//       const response = await fetch(`${API_URL}/goals/`, {
//         method: "POST",
//         headers: authHeaders(),
//         body: JSON.stringify({
//           user_id: user.id,
//           daily_goal: daily_goal,
//         }),
//       });
//       const data = await response.json();
//       set({ goal: data.goal });
//       return data;
//     } catch (err) {
//       console.error("Failed to save goal:", err);
//       throw err;
//     }
//   },
// }));

import { create } from "zustand";
import { API_URL, authHeaders } from "../services/api"; // ✅ Correct named import
import { useAuthStore } from "./authStore";

export const useGoalStore = create((set) => ({
  goal: null,
  loading: false,

  // Fetch user daily calorie goal
  fetchGoal: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;

      // Guard check: verify authenticated user exists
      if (!user || !user.id) {
        console.log("No user or user.id found:", user);
        set({ goal: { daily_goal: 2000 }, loading: false });
        return;
      }

      console.log("Fetching goal for user:", user.id);

      const response = await fetch(`${API_URL}/goals/${user.id}`, {
        headers: authHeaders(),
      });

      // Guard check: prevent parsing HTML error pages (e.g. 404/500)
      if (!response.ok) {
        console.warn(`Goal fetch returned HTTP status: ${response.status}`);
        set({ goal: { daily_goal: 2000 }, loading: false });
        return;
      }

      const data = await response.json();
      set({
        goal: data.goal || { daily_goal: 2000 },
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch goal:", err);
      // Fallback state so dashboard components do not crash
      set({
        goal: { daily_goal: 2000 },
        loading: false,
      });
    }
  },

  // Save or update user daily calorie goal
  saveGoal: async (daily_goal) => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;

      // Guard check: ensure user is authenticated
      if (!user || !user.id) {
        set({ loading: false });
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${API_URL}/goals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          user_id: user.id,
          daily_goal: daily_goal,
        }),
      });

      // Defensive check before parsing JSON
      if (!response.ok) {
        throw new Error(`Failed to save goal: ${response.status}`);
      }

      const data = await response.json();
      set({
        goal: data.goal || { daily_goal: daily_goal },
        loading: false,
      });
      return data;
    } catch (err) {
      console.error("Failed to save goal:", err);
      set({ loading: false });
      throw err;
    }
  },
}));
