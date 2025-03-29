import { Hono } from "hono"
import { TODO } from "../todo" // Assuming todo.ts is in src/

export const bancaRoutes = new Hono()

// --- Gerenciamento de Bancas ---

// POST /banca (Criar banca) - Original: actionCreate
bancaRoutes.post("/", (c) => TODO({ c, path: "/banca", method: "POST" }))

// GET /banca (Listar bancas) - Original: actionGetBancas
bancaRoutes.get("/", (c) => TODO({ c, path: "/banca", method: "GET" }))

// GET /banca/:id (Detalhes da banca) - Original: actionGetBanca
bancaRoutes.get("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/banca/:id", method: "GET", params: { id } })
})

// GET /banca/usuario/:userId (Listar bancas por usuário) - Original: actionGetBancasByUser
bancaRoutes.get("/usuario/:userId", (c) => {
  const userId = c.req.param("userId")
  return TODO({ c, path: "/banca/usuario/:userId", method: "GET", params: { userId } })
})

// DELETE /banca/:id (Deletar banca) - Original: actionDeleteBanca
bancaRoutes.delete("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/banca/:id", method: "DELETE", params: { id } })
})

// PUT /banca/:id/visibilidade (Atualizar visibilidade) - Original: actionUpdateVisibility
bancaRoutes.put("/:id/visibilidade", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/banca/:id/visibilidade", method: "PUT", params: { id } })
})

// --- Gerenciamento de Usuários na Banca ---

// GET /banca/:bancaId/usuarios (Listar usuários da banca) - Original: actionGetUsers / actionUsuariosBancaByBanca
bancaRoutes.get("/:bancaId/usuarios", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/banca/:bancaId/usuarios", method: "GET", params: { bancaId } })
})

// POST /usuario-banca/:inviteId/accept (Adicionar usuário à banca via convite) - Original: actionAdd (using inviteId as :id)
// Note: Changed path from Yii2's `/usuario-banca/:id` to be more descriptive
bancaRoutes.post("/usuario-banca/:inviteId/accept", (c) => {
  const inviteId = c.req.param("inviteId")
  return TODO({ c, path: "/usuario-banca/:inviteId/accept", method: "POST", params: { inviteId } })
})

// POST /banca/convites/email (Enviar email de convite) - Original: actionSendEmail
bancaRoutes.post("/convites/email", (c) => TODO({ c, path: "/banca/convites/email", method: "POST" }))

// DELETE /banca/:bancaId/usuarios/:userId (Remover usuário da banca) - Original: actionDeleteUserBanca
bancaRoutes.delete("/:bancaId/usuarios/:userId", (c) => {
  const bancaId = c.req.param("bancaId")
  const userId = c.req.param("userId")
  return TODO({ c, path: "/banca/:bancaId/usuarios/:userId", method: "DELETE", params: { bancaId, userId } })
})

// GET /usuario-banca/relacao/banca/:bancaId/usuario/:userId (Obter ID da relação UB) - Original: actionId
// Note: Changed path from Yii2's `/usuario-banca/id/<id_banca>/<id_usuario>`
bancaRoutes.get("/usuario-banca/relacao/banca/:bancaId/usuario/:userId", (c) => {
  const bancaId = c.req.param("bancaId")
  const userId = c.req.param("userId")
  return TODO({
    c,
    path: "/usuario-banca/relacao/banca/:bancaId/usuario/:userId",
    method: "GET",
    params: { bancaId, userId },
  })
})

// --- Gerenciamento de Notas ---

// POST /banca/:bancaId/usuarios/:userId/nota (Atribuir nota individual) - Original: actionGiveScore
bancaRoutes.post("/:bancaId/usuarios/:userId/nota", (c) => {
  const bancaId = c.req.param("bancaId")
  const userId = c.req.param("userId")
  return TODO({ c, path: "/banca/:bancaId/usuarios/:userId/nota", method: "POST", params: { bancaId, userId } })
})

// POST /banca/:bancaId/notas (Atribuir notas em lote) - Original: actionGiveScoreInBatch
bancaRoutes.post("/:bancaId/notas", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/banca/:bancaId/notas", method: "POST", params: { bancaId } })
})

// GET /banca/:bancaId/nota (Obter nota final) - Original: actionNota
bancaRoutes.get("/:bancaId/nota", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/banca/:bancaId/nota", method: "GET", params: { bancaId } })
})

// --- Gerenciamento de Documentos da Banca ---

// GET /banca/:bancaId/documentos (Listar documentos) - Original: actionGetDocuments (BancaController)
bancaRoutes.get("/:bancaId/documentos", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/banca/:bancaId/documentos", method: "GET", params: { bancaId } })
})

// POST /banca/:bancaId/documentos (Adicionar documento) - Original: actionAddDocument (BancaController)
bancaRoutes.post("/:bancaId/documentos", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/banca/:bancaId/documentos", method: "POST", params: { bancaId } })
})

// GET /banca/:bancaId/documentos/:docId (Detalhes do documento) - Original: actionGetDocument (BancaController)
bancaRoutes.get("/:bancaId/documentos/:docId", (c) => {
  const bancaId = c.req.param("bancaId")
  const docId = c.req.param("docId")
  return TODO({ c, path: "/banca/:bancaId/documentos/:docId", method: "GET", params: { bancaId, docId } })
})

// GET /banca/:bancaId/documentos/:docId/view (Visualizar/Baixar documento) - Original: actionViewDocument (BancaController)
bancaRoutes.get("/:bancaId/documentos/:docId/view", (c) => {
  const bancaId = c.req.param("bancaId")
  const docId = c.req.param("docId")
  return TODO({ c, path: "/banca/:bancaId/documentos/:docId/view", method: "GET", params: { bancaId, docId } })
})

// DELETE /banca/:bancaId/documentos/:docId (Deletar documento) - Original: actionDeleteDocument (BancaController)
bancaRoutes.delete("/:bancaId/documentos/:docId", (c) => {
  const bancaId = c.req.param("bancaId")
  const docId = c.req.param("docId")
  return TODO({ c, path: "/banca/:bancaId/documentos/:docId", method: "DELETE", params: { bancaId, docId } })
})
