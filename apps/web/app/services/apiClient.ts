import type { AppType } from "@tcc/server"
import { hc } from "hono/client"

const client = hc<AppType>("http://localhost:3000")

export default client
