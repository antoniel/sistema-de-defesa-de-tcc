import { Hono } from "hono"
import { TODO } from "../todo"

export const usuarioRoutes = new Hono()

// GET /usuario (Listar usuários) - Original: actionGetUsuarios
usuarioRoutes.get("/", (c) => TODO({ c, path: "/usuario", method: "GET" }))

// POST /usuario (Criar usuário - implícito no Yii2)
usuarioRoutes.post("/", (c) => TODO({ c, path: "/usuario", method: "POST" }))

// POST /usuario/pre-cadastro (Pré-cadastro) - Original: actionPreRegister
usuarioRoutes.post("/pre-cadastro", (c) => TODO({ c, path: "/usuario/pre-cadastro", method: "POST" }))

// GET /usuario/:id (Ver usuário) - Original: actionView (mapped from POST in Yii2)
usuarioRoutes.get("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/usuario/:id", method: "GET", params: { id } })
})

// PUT /usuario/:id (Editar usuário) - Original: actionEditUsuario
usuarioRoutes.put("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/usuario/:id", method: "PUT", params: { id } })
})

// DELETE /usuario/:id (Deletar usuário - implícito no Yii2)
usuarioRoutes.delete("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/usuario/:id", method: "DELETE", params: { id } })
})

// PUT /usuario/:id/role (Editar permissão) - Original: actionEditRole (mapped from POST in Yii2)
usuarioRoutes.put("/:id/role", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/usuario/:id/role", method: "PUT", params: { id } })
})

// GET /usuario/:id/bancas (Listar bancas do usuário) - Original: actionGetBanca (controller Usuario)
usuarioRoutes.get("/:id/bancas", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/usuario/:id/bancas", method: "GET", params: { id } })
})
