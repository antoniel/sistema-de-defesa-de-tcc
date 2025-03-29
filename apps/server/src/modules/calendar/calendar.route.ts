import { Hono } from "hono"
import { TODO } from "../todo"

export const calendarRoutes = new Hono()

// GET /calendar/auth (Iniciar fluxo de autenticação) - Original: actionAuth
calendarRoutes.get("/auth", (c) => TODO({ c, path: "/calendar/auth", method: "GET" }))

// POST /calendar/events (Criar evento) - Original: actionCreateEvent
calendarRoutes.post("/events", (c) => TODO({ c, path: "/calendar/events", method: "POST" }))
