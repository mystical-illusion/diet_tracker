import api from './api';

export const goalService = {
  getGoals: async () => {
    const res = await api.get('/goals');
    return res.data;
  },
  updateGoals: async (goals) => {
    const res = await api.post('/goals', goals);
    return res.data;
  }
};