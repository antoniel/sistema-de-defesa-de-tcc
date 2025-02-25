import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      RefreshToken: `${refreshToken}`,
    };
  }
  return Promise.resolve(config);
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (
      [401].includes(error.response.status) &&
      localStorage.getItem("token")
    ) {
      await api.delete("/login");

      localStorage.clear();
      window.location.href = `/login?ref=${window.location.href}`;
    }
    return Promise.reject(error);
  }
);

export default api;
