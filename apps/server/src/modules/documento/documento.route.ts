import { Hono } from "hono"
import { TODO } from "../todo"

export const documentoRoutes = new Hono()

// --- Geração de Documentos Específicos (controller Documento) ---
// Montado sob /documentos

// GET /documentos/info/:bancaId (Info para gerar docs) - Original: actionDocumentoInfo
documentoRoutes.get("/info/:bancaId", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/documentos/info/:bancaId", method: "GET", params: { bancaId } })
})

// POST /documentos/gerar/:bancaId (Gerar doc principal/ata) - Original: actionGetDoc
documentoRoutes.post("/gerar/:bancaId", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/documentos/gerar/:bancaId", method: "POST", params: { bancaId } })
})

// GET /documentos/participacao/:bancaId (Gerar declaração participação) - Original: actionGetDocParticipacao
documentoRoutes.get("/participacao/:bancaId", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/documentos/participacao/:bancaId", method: "GET", params: { bancaId } })
})

// GET /documentos/orientacao/:bancaId (Gerar declaração orientação) - Original: actionGetDocOrientacao
documentoRoutes.get("/orientacao/:bancaId", (c) => {
  const bancaId = c.req.param("bancaId")
  return TODO({ c, path: "/documentos/orientacao/:bancaId", method: "GET", params: { bancaId } })
})
