import type { Context } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { getBancaInfoForDocument } from "../../services/document.service"
import type { AppVariables } from "../../types"

export const getBancaDocumentInfo = async (c: Context<{ Variables: AppVariables }>, bancaId: number) => {
  const result = await getBancaInfoForDocument(c, bancaId)

  if (!result.ok) {
    throw match(result.error)
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
      .exhaustive()
  }

  return result.data
}

// PDF generation functions removed - moved to frontend
// Only getBancaDocumentInfo remains for providing data to frontend
