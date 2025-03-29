// --- JWT Configuration ---
// It's highly recommended to load these from environment variables
export const JWT_SECRET = process.env.JWT_SECRET || "your-very-secret-key" // CHANGE THIS and use env var
export const JWT_ISSUER = process.env.JWT_ISSUER || "your-app-name"
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "your-app-audience"
export const JWT_EXPIRY_SECONDS = process.env.JWT_EXPIRY_SECONDS ? parseInt(process.env.JWT_EXPIRY_SECONDS, 10) : 3600 // 1 hour default

if (JWT_SECRET === "your-very-secret-key" && process.env.NODE_ENV !== "test") {
  console.warn("⚠️ WARNING: JWT_SECRET is not set or using default. Set a strong secret in environment variables!")
}
