import api from "./api";

const logService = {
  getLogs: (date) => api.get("/logs/daily", { params: { date } }),
  addLog: (payload) => api.post("/logs/add", payload),
  updateLog: (id, payload) => api.put(`/logs/${id}`, payload),
  deleteLog: (id) => api.delete(`/logs/${id}`),
  getSummary: (from, to) => api.get("/logs/summary", { params: { from, to } }),
  getProgress: (date) =>
    api.get("/nutrition/goal-progress", { params: { date } }),
  getDaily: (date) => api.get("/nutrition/daily", { params: { date } }),
  getWeekly: (start) => api.get("/nutrition/weekly", { params: { start } }),
  getTrends: (days = 30) => api.get("/nutrition/trends", { params: { days } }),
  getTopFoods: (limit = 8) =>
    api.get("/nutrition/top-foods", { params: { limit } }),
};

export default logService;
