import axios from "axios"

const API_BASE_URL = "https://sistema-de-defesas-api.app.ic.ufba.br" // Using the provided production URL

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Add any other default headers your API might need
  },
  // You can configure other axios options here, like timeouts
  // timeout: 10000, // e.g., 10 seconds
})

// Optional: Add interceptors for requests (e.g., adding auth tokens)
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Or get token from your auth context/store
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Optional: Add interceptors for responses (e.g., handling global errors, refreshing tokens)
// apiClient.interceptors.response.use(
//   (response) => {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     return response;
//   },
//   (error) => {
//     // Any status codes that falls outside the range of 2xx cause this function to trigger
//     if (error.response?.status === 401) {
//       // Handle unauthorized errors (e.g., redirect to login)
//       console.error('Unauthorized, redirecting to login...');
//       // removeAuthToken(); // Example: Clear token
//       // window.location.href = '/login'; // Force redirect
//     }
//     // It's good practice to return the rejection for specific error handling in components/services
//     return Promise.reject(error);
//   }
// );

export default apiClient
