import api from "./api";

const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),
};

export default authService;
