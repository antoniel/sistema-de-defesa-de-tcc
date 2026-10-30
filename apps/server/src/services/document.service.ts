import { and, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { InferResultType } from "../database"
import { Bancas, usuariosBancas } from "../database/schema"
import { getUserById, toPublicUser, type PublicUser } from "../modules/usuario/usuario.service"
import { err, ok, type AppResult } from "../result"
import type { AppVariables } from "../types"

export type BancaInfoForDocument = InferResultType<
  "Bancas",
  {
    orientador: true
    curso: {
      with: {
        coordenador: true
      }
    }
    membros: {
      with: {
        usuario: true
      }
    }
  }
>

export type DocumentInfoError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

/** Variante de BancaInfoForDocument com usuários projetados (sem passwordHash). */
export type BancaInfoSanitized = Omit<BancaInfoForDocument, "orientador" | "curso" | "membros"> & {
  orientador: PublicUser
  curso: Omit<NonNullable<BancaInfoForDocument["curso"]>, "coordenador"> & { coordenador: PublicUser | null } | null
  membros: Array<Omit<BancaInfoForDocument["membros"][number], "usuario"> & { usuario: PublicUser }>
}

export type DocumentGenerationError =
  | { type: "banca_not_found" }
  | { type: "access_denied" }
  | { type: "pdf_generation_error"; error: unknown }
  | { type: "database_error"; error: unknown }

export const getBancaInfoForDocument = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
): Promise<AppResult<BancaInfoSanitized, DocumentInfoError>> => {
  const dbInstance = c.get("db")

  try {
    const bancaInfo = await dbInstance.query.Bancas.findFirst({
      with: {
        orientador: true,
        curso: {
          with: {
            coordenador: true,
          },
        },
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

    // Mesmas regras de visibilidade de getBancaById (banca.service.ts):
    // bancas visíveis são públicas; bancas privadas só para ADMIN e membros.
    if (!bancaInfo.visible) {
      const payload = c.get("jwtPayload")
      const currentUserId = payload ? Number(payload.sub) : null

      let isAdmin = false
      if (currentUserId !== null) {
        const userResult = await getUserById(c, currentUserId)
        isAdmin = userResult.ok && userResult.data.role === "ADMIN"
      }

      const isMember =
        currentUserId !== null &&
        (bancaInfo.orientadorId === currentUserId ||
          bancaInfo.membros.some((membro) => membro.usuario.id === currentUserId))

      if (!isAdmin && !isMember) {
        // 404 (não 403) para não revelar a existência de bancas privadas.
        return err({ type: "banca_not_found" })
      }
    }

    // Anti-vazamento: nenhuma resposta carrega o Users inteiro —
    // orientador, coordenador e membros projetados (sem passwordHash).
    const sanitized: BancaInfoSanitized = {
      ...bancaInfo,
      orientador: toPublicUser(bancaInfo.orientador),
      curso: bancaInfo.curso
        ? { ...bancaInfo.curso, coordenador: bancaInfo.curso.coordenador ? toPublicUser(bancaInfo.curso.coordenador) : null }
        : bancaInfo.curso,
      membros: bancaInfo.membros.map((membro) => ({
        ...membro,
        usuario: toPublicUser(membro.usuario),
      })),
    }
    return ok(sanitized)
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
