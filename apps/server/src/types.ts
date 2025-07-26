import { db, type SelectUser } from "./database"

type DatabaseInstance = typeof db

// Define Variables type for Hono context
export interface AppVariables {
  jwtPayload: {
    iss: string
    aud: string
    sub: SelectUser["id"]
    iat: number
    exp: number
  }
  db: DatabaseInstance
}
