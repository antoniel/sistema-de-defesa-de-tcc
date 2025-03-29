import { Hono } from "hono"
import { TODO } from "../todo"

export const authRoutes = new Hono()

// --- Login ---
// POST /auth/login (Realizar login) - Original: actionLogin
authRoutes.post("/login", (c) => TODO({ c, path: "/auth/login", method: "POST" }))

// DELETE /auth/logout (Realizar logout/refresh - assumindo logout) - Original: actionRefreshToken
authRoutes.delete("/logout", (c) => TODO({ c, path: "/auth/logout", method: "DELETE" }))

// --- Invites ---
// GET /invites/:hash (Obter dados do convite) - Original: actionGetInvite
authRoutes.get("/invites/:hash", (c) => {
  const hash = c.req.param("hash")
  return TODO({ c, path: "/invites/:hash", method: "GET", params: { hash } })
})
// Note: Accepting an invite likely happens via POST /usuario-banca/:inviteId/accept in banca.ts

// --- Reset Password ---
// POST /auth/reset-password (Solicitar reset) - Original: actionCreate (ResetPasswordController)
authRoutes.post("/reset-password", (c) => TODO({ c, path: "/auth/reset-password", method: "POST" }))

// GET /auth/reset-password/:hash (Verificar hash de reset) - Original: actionGetResetHash
authRoutes.get("/reset-password/:hash", (c) => {
  const hash = c.req.param("hash")
  return TODO({ c, path: "/auth/reset-password/:hash", method: "GET", params: { hash } })
})

// POST /auth/reset-password/reset (Efetuar reset) - Original: actionReset
authRoutes.post("/reset-password/reset", (c) => TODO({ c, path: "/auth/reset-password/reset", method: "POST" }))
