import axios from "axios" // Import axios to use its types/helpers like isAxiosError
import apiClient from "./apiClient" // Import the configured axios instance

// No longer need API_BASE_URL here

// Define expected success response structure (adjust as needed)
interface LoginSuccessResponse {
  token: string
  user?: any // Replace 'any' with a specific User interface if available
}

// Define expected error response structure (adjust as needed)
interface ApiErrorResponse {
  message: string
  // Add other potential error properties
}

/**
 * Attempts to log in a user via the API using axios.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<LoginSuccessResponse>} A promise that resolves with login data (token, user info).
 * @throws {Error} Throws an error with a message from the API or a generic network error message.
 */
export const loginUser = async (email: string, password: string): Promise<LoginSuccessResponse> => {
  const url = `/api/auth/login` // Adjust endpoint if needed, use relative path

  try {
    // Use apiClient.post, passing data directly as the second argument
    const response = await apiClient.post<LoginSuccessResponse>(url, { email, password })

    // Axios response data is directly the body
    return response.data
  } catch (error) {
    console.error("Login failed:", error)

    // Axios error handling
    if (axios.isAxiosError(error)) {
      // Use the error message from the response data if available
      const errorMessage =
        (error.response?.data as ApiErrorResponse)?.message || error.message || "An unknown login error occurred."
      throw new Error(errorMessage)
    } else {
      // Handle non-Axios errors
      throw new Error(error instanceof Error ? error.message : "An unknown login error occurred.")
    }
  }
}

// Optional: Add functions for storing/retrieving token from localStorage
export const storeAuthToken = (token: string): void => {
  try {
    localStorage.setItem("authToken", token)
  } catch (error) {
    console.error("Failed to store auth token:", error)
  }
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem("authToken")
  } catch (error) {
    console.error("Failed to retrieve auth token:", error)
    return null
  }
}

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem("authToken")
  } catch (error) {
    console.error("Failed to remove auth token:", error)
  }
}
