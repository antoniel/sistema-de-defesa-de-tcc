import { and, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { InferResultType } from "../database"
import { Bancas, usuariosBancas } from "../database/schema"
import { err, ok, type AppResult } from "../result"
import type { AppVariables } from "../types"

export type BancaInfoForDocument = InferResultType<
  "Bancas",
  {
    orientador: true
    curso: true
    membros: {
      with: {
        usuario: true
      }
    }
  }
>

export type DocumentInfoError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

export type DocumentGenerationError =
  | { type: "banca_not_found" }
  | { type: "access_denied" }
  | { type: "pdf_generation_error"; error: unknown }
  | { type: "database_error"; error: unknown }

export const getBancaInfoForDocument = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
): Promise<AppResult<BancaInfoForDocument, DocumentInfoError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaInfo = await dbInstance.query.Bancas.findFirst({
      with: {
        orientador: true,
        curso: true,
        membros: {
          with: {
            usuario: true,
          },
        },
      },
      where: eq(Bancas.id, bancaId),
    })
    if (!bancaInfo) {
      return err({ type: "banca_not_found" })
    }

    return ok(bancaInfo)
  } catch (error) {
    console.error("Error fetching banca info:", error)
    return err({ type: "database_error", error })
  }
}

export const checkUserAccessToBanca = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number,
  documentType: "ata" | "participacao" | "orientacao"
): Promise<AppResult<boolean, DocumentGenerationError>> => {
  const dbInstance = c.get("db")

  try {
    // Verificar se o usuário tem acesso à banca
    const userBancaRelation = await dbInstance
      .select()
      .from(usuariosBancas)
      .where(and(eq(usuariosBancas.bancaId, bancaId), eq(usuariosBancas.usuarioId, userId)))
      .limit(1)

    if (userBancaRelation.length === 0) {
      return err({ type: "access_denied" })
    }

    const userRole = userBancaRelation[0].role

    // Verificar acesso específico por tipo de documento
    switch (documentType) {
      case "ata":
        // Qualquer membro da banca pode acessar a ata
        return ok(true)

      case "participacao":
        // Qualquer membro da banca pode acessar sua declaração de participação
        return ok(true)

      case "orientacao":
        // Apenas orientadores e coorientadores podem acessar
        if (userRole === "orientador" || userRole === "coorientador") {
          return ok(true)
        }
        return err({ type: "access_denied" })

      default:
        return err({ type: "access_denied" })
    }
  } catch (error) {
    console.error("Error checking user access:", error)
    return err({ type: "database_error", error })
  }
}

// PDF generation moved to frontend
// Backend now only provides data via getBancaInfoForDocument function
