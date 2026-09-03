import api from "./api";

const authService = {
  login: (identifier, password) =>
    api.post("/auth/login", {
      email: identifier,
      username: identifier,
      password,
    }),

  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),
};

export default authService;
