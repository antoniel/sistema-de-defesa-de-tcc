import { desc, eq, sql } from "drizzle-orm"
import { type Context } from "hono"
import { featureRequests, featureRequestVotes, Users } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { type CreateFeatureRequestInput } from "./feature-request.schema"

type CreateFeatureRequestError = { type: "database_error"; error: unknown }

export const createFeatureRequest = async (
  c: Context<{ Variables: AppVariables }>,
  data: CreateFeatureRequestInput
): Promise<AppResult<{ id: number }, CreateFeatureRequestError>> => {
  const dbInstance = c.get("db")
  const userId = c.get("jwtPayload").sub

  try {
    const [newFeatureRequest] = await dbInstance
      .insert(featureRequests)
      .values({
        userId,
        title: data.title,
        description: data.description,
        voteCount: 0,
      })
      .returning({ id: featureRequests.id })

    if (!newFeatureRequest) {
      console.error("Failed to insert feature request")
      return err({ type: "database_error", error: "Insert operation did not return expected data." })
    }

    return ok({ id: newFeatureRequest.id })
  } catch (error) {
    console.error("Error creating feature request:", error)
    return err({ type: "database_error", error })
  }
}

type GetAllFeatureRequestsError = { type: "database_error"; error: unknown }

export interface FeatureRequestWithAuthor {
  id: number
  title: string
  description: string
  voteCount: number
  createdAt: Date
  authorName: string
  authorId: number
}

export const getAllFeatureRequests = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<FeatureRequestWithAuthor[], GetAllFeatureRequestsError>> => {
  const dbInstance = c.get("db")

  try {
    const requests = await dbInstance
      .select({
        id: featureRequests.id,
        title: featureRequests.title,
        description: featureRequests.description,
        voteCount: featureRequests.voteCount,
        createdAt: featureRequests.createdAt,
        authorName: Users.nome,
        authorId: Users.id,
      })
      .from(featureRequests)
      .innerJoin(Users, eq(featureRequests.userId, Users.id))
      .orderBy(desc(featureRequests.voteCount), desc(featureRequests.createdAt))

    return ok(requests)
  } catch (error) {
    console.error("Error fetching feature requests:", error)
    return err({ type: "database_error", error })
  }
}

type VoteFeatureRequestError =
  | { type: "not_found" }
  | { type: "duplicate_vote" }
  | { type: "database_error"; error: unknown }

export const voteFeatureRequest = async (
  c: Context<{ Variables: AppVariables }>,
  userId: number,
  featureRequestId: number
): Promise<AppResult<{ voteCount: number }, VoteFeatureRequestError>> => {
  const dbInstance = c.get("db")

  try {
    // Check if feature request exists
    const [featureRequest] = await dbInstance
      .select({ id: featureRequests.id })
      .from(featureRequests)
      .where(eq(featureRequests.id, featureRequestId))
      .limit(1)

    if (!featureRequest) {
      return err({ type: "not_found" })
    }

    // Check if user has already voted
    const existingVote = await dbInstance
      .select({ id: featureRequestVotes.id })
      .from(featureRequestVotes)
      .where(
        sql`${featureRequestVotes.userId} = ${userId} AND ${featureRequestVotes.featureRequestId} = ${featureRequestId}`
      )
      .limit(1)

    if (existingVote.length > 0) {
      return err({ type: "duplicate_vote" })
    }

    // Add vote in a transaction
    await dbInstance.transaction(async (tx) => {
      // Insert vote
      await tx.insert(featureRequestVotes).values({
        userId,
        featureRequestId,
      })

      // Increment vote count
      await tx
        .update(featureRequests)
        .set({
          voteCount: sql`${featureRequests.voteCount} + 1`,
        })
        .where(eq(featureRequests.id, featureRequestId))
    })

    // Get updated vote count
    const [updatedRequest] = await dbInstance
      .select({ voteCount: featureRequests.voteCount })
      .from(featureRequests)
      .where(eq(featureRequests.id, featureRequestId))
      .limit(1)

    return ok({ voteCount: updatedRequest?.voteCount ?? 0 })
  } catch (error) {
    console.error("Error voting on feature request:", error)
    return err({ type: "database_error", error })
  }
}

type CheckIfUserVotedError = { type: "database_error"; error: unknown }

export const checkIfUserVoted = async (
  c: Context<{ Variables: AppVariables }>,
  userId: number,
  featureRequestId: number
): Promise<AppResult<boolean, CheckIfUserVotedError>> => {
  const dbInstance = c.get("db")

  try {
    const existingVote = await dbInstance
      .select({ id: featureRequestVotes.id })
      .from(featureRequestVotes)
      .where(
        sql`${featureRequestVotes.userId} = ${userId} AND ${featureRequestVotes.featureRequestId} = ${featureRequestId}`
      )
      .limit(1)

    return ok(existingVote.length > 0)
  } catch (error) {
    console.error("Error checking if user voted:", error)
    return err({ type: "database_error", error })
  }
}
