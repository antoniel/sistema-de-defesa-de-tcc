import { db } from "./database"

type DatabaseInstance = typeof db

// Define Variables type for Hono context
export interface AppVariables {
  jwtPayload: {
    iss: string
    aud: string
    sub: string
    iat: number
    exp: number
  }
  db: DatabaseInstance
}
