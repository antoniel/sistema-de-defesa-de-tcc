import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { checkRole } from "../../middleware/auth"
import { AppError } from "../../utils/app-error"
import { 
  getBancaDocumentInfo,
  generateAtaDefesa,
  generateDeclaracaoParticipacao,
  generateDeclaracaoOrientacao
} from "./documento.service"

export const documentoRoutes = new Hono()

// --- Geração de Documentos Específicos (controller Documento) ---
// Montado sob /documentos

// GET /documentos/info/:bancaId (Info para gerar docs) - Original: actionDocumentoInfo
documentoRoutes.get("/info/:bancaId", 
  checkRole(["TEACHER", "ADMIN"]),
  zValidator("param", z.object({ bancaId: z.string() })),
  async (c) => {
    const { bancaId } = c.req.valid("param")
    const bancaIdNumber = parseInt(bancaId)
    
    if (isNaN(bancaIdNumber)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const result = await getBancaDocumentInfo(c, bancaIdNumber)
    return c.json(result)
  }
)

// POST /documentos/gerar/:bancaId (Gerar doc principal/ata) - Original: actionGetDoc
documentoRoutes.post("/gerar/:bancaId", 
  checkRole(["TEACHER", "ADMIN"]),
  zValidator("param", z.object({ bancaId: z.string() })),
  async (c) => {
    const { bancaId } = c.req.valid("param")
    const bancaIdNumber = parseInt(bancaId)
    const currentUser = c.get("user")
    
    if (isNaN(bancaIdNumber)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const result = await generateAtaDefesa(c, bancaIdNumber, currentUser.id)
    
    return c.body(result.pdf, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
    })
  }
)

// GET /documentos/participacao/:bancaId (Gerar declaração participação) - Original: actionGetDocParticipacao
documentoRoutes.get("/participacao/:bancaId", 
  checkRole(["TEACHER", "ADMIN"]),
  zValidator("param", z.object({ bancaId: z.string() })),
  async (c) => {
    const { bancaId } = c.req.valid("param")
    const bancaIdNumber = parseInt(bancaId)
    const currentUser = c.get("user")
    
    if (isNaN(bancaIdNumber)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const result = await generateDeclaracaoParticipacao(c, bancaIdNumber, currentUser.id)
    
    return c.body(result.pdf, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
    })
  }
)

// GET /documentos/orientacao/:bancaId (Gerar declaração orientação) - Original: actionGetDocOrientacao
documentoRoutes.get("/orientacao/:bancaId", 
  checkRole(["TEACHER", "ADMIN"]),
  zValidator("param", z.object({ bancaId: z.string() })),
  async (c) => {
    const { bancaId } = c.req.valid("param")
    const bancaIdNumber = parseInt(bancaId)
    const currentUser = c.get("user")
    
    if (isNaN(bancaIdNumber)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const result = await generateDeclaracaoOrientacao(c, bancaIdNumber, currentUser.id)
    
    return c.body(result.pdf, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
    })
  }
)
