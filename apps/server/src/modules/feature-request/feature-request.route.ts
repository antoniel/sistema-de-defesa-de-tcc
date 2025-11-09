import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { createFeatureRequestSchema, voteFeatureRequestSchema } from "./feature-request.schema"
import {
  checkIfUserVoted,
  createFeatureRequest,
  getAllFeatureRequests,
  voteFeatureRequest,
} from "./feature-request.service"

export const featureRequestRoutes = new Hono<{ Variables: AppVariables }>()
  .post("/", zValidator("json", createFeatureRequestSchema), async (c) => {
    const validatedData = c.req.valid("json")
    const result = await createFeatureRequest(c, validatedData)

    if (!result.ok) {
      throw match(result.error)
        .with(
          { type: "database_error" },
          () => new AppError(500, "Erro ao criar solicitação de funcionalidade. Tente novamente.")
        )
        .exhaustive()
    }

    return c.json(result.data, 201)
  })
  .get("/", async (c) => {
    const result = await getAllFeatureRequests(c)

    if (!result.ok) {
      throw match(result.error)
        .with(
          { type: "database_error" },
          () => new AppError(500, "Erro ao buscar solicitações de funcionalidade. Tente novamente.")
        )
        .exhaustive()
    }

    const userId = c.get("jwtPayload").sub

    // Add userVoted field to each request
    const requestsWithUserVoted = await Promise.all(
      result.data.map(async (request) => {
        const votedResult = await checkIfUserVoted(c, userId, request.id)
        return {
          ...request,
          userVoted: votedResult.ok ? votedResult.data : false,
        }
      })
    )

    return c.json(requestsWithUserVoted)
  })
  .post("/vote", zValidator("json", voteFeatureRequestSchema), async (c) => {
    const { featureRequestId } = c.req.valid("json")
    const userId = c.get("jwtPayload").sub

    const result = await voteFeatureRequest(c, userId, featureRequestId)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "not_found" }, () => new AppError(404, "Solicitação de funcionalidade não encontrada."))
        .with({ type: "duplicate_vote" }, () => new AppError(400, "Você já votou nesta solicitação."))
        .with({ type: "database_error" }, () => new AppError(500, "Erro ao votar. Tente novamente."))
        .exhaustive()
    }

    return c.json(result.data)
  })
