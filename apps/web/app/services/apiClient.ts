import type { AppType } from "@tcc/server"
import { hc } from "hono/client"

const client = hc<AppType>("http://localhost:8080")

export default client
