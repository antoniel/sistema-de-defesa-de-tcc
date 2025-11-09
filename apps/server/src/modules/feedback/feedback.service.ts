import { avg, count, eq, sql } from "drizzle-orm"
import { type Context } from "hono"
import { feedbackSubmissions, Users } from "../../database/schema"
import { type AppResult, err, ok } from "../../result"
import { type AppVariables } from "../../types"
import { type CreateFeedbackInput } from "./feedback.schema"

type CreateFeedbackError = { type: "database_error"; error: unknown } | { type: "duplicate_feedback" }

export const createFeedback = async (
  c: Context<{ Variables: AppVariables }>,
  data: CreateFeedbackInput
): Promise<AppResult<{ id: number }, CreateFeedbackError>> => {
  const dbInstance = c.get("db")
  const userId = c.get("jwtPayload").sub

  try {
    // Check if user already submitted feedback
    const [existingFeedback] = await dbInstance
      .select({ id: feedbackSubmissions.id })
      .from(feedbackSubmissions)
      .where(eq(feedbackSubmissions.userId, userId))
      .limit(1)

    if (existingFeedback) {
      return err({ type: "duplicate_feedback" })
    }

    const [newFeedback] = await dbInstance
      .insert(feedbackSubmissions)
      .values({
        userId,
        taskComplexityRating: data.taskComplexityRating,
        interfaceConsistencyRating: data.interfaceConsistencyRating,
        responseTimeRating: data.responseTimeRating,
        satisfactionRating: data.satisfactionRating,
        usagePurposes: JSON.stringify(data.usagePurposes),
        usagePurposeOther: data.usagePurposeOther,
        completedAllTasks: data.completedAllTasks,
      })
      .returning({ id: feedbackSubmissions.id })

    if (!newFeedback) {
      console.error("Failed to insert feedback submission")
      return err({ type: "database_error", error: "Insert operation did not return expected data." })
    }

    return ok({ id: newFeedback.id })
  } catch (error) {
    console.error("Error creating feedback submission:", error)
    return err({ type: "database_error", error })
  }
}

type GetFeedbackStatisticsError = { type: "database_error"; error: unknown }

export interface FeedbackStatistics {
  totalSubmissions: number
  averageTaskComplexity: number
  averageInterfaceConsistency: number
  averageResponseTime: number
  averageSatisfaction: number
  completedAllTasksCount: number
  notCompletedAllTasksCount: number
  studentSubmissions: number
  teacherSubmissions: number
}

export const getFeedbackStatistics = async (
  c: Context<{ Variables: AppVariables }>
): Promise<AppResult<FeedbackStatistics, GetFeedbackStatisticsError>> => {
  const dbInstance = c.get("db")

  try {
    const [statistics] = await dbInstance
      .select({
        totalSubmissions: count(),
        averageTaskComplexity: avg(feedbackSubmissions.taskComplexityRating),
        averageInterfaceConsistency: avg(feedbackSubmissions.interfaceConsistencyRating),
        averageResponseTime: avg(feedbackSubmissions.responseTimeRating),
        averageSatisfaction: avg(feedbackSubmissions.satisfactionRating),
        completedAllTasksCount: sql<number>`SUM(CASE WHEN ${feedbackSubmissions.completedAllTasks} = true THEN 1 ELSE 0 END)`,
        notCompletedAllTasksCount: sql<number>`SUM(CASE WHEN ${feedbackSubmissions.completedAllTasks} = false THEN 1 ELSE 0 END)`,
        studentSubmissions: sql<number>`SUM(CASE WHEN ${Users.role} = 'STUDENT' THEN 1 ELSE 0 END)`,
        teacherSubmissions: sql<number>`SUM(CASE WHEN ${Users.role} = 'TEACHER' OR ${Users.role} = 'ADMIN' THEN 1 ELSE 0 END)`,
      })
      .from(feedbackSubmissions)
      .leftJoin(Users, eq(feedbackSubmissions.userId, Users.id))

    if (!statistics) {
      return ok({
        totalSubmissions: 0,
        averageTaskComplexity: 0,
        averageInterfaceConsistency: 0,
        averageResponseTime: 0,
        averageSatisfaction: 0,
        completedAllTasksCount: 0,
        notCompletedAllTasksCount: 0,
        studentSubmissions: 0,
        teacherSubmissions: 0,
      })
    }

    return ok({
      totalSubmissions: Number(statistics.totalSubmissions),
      averageTaskComplexity: Number(statistics.averageTaskComplexity) || 0,
      averageInterfaceConsistency: Number(statistics.averageInterfaceConsistency) || 0,
      averageResponseTime: Number(statistics.averageResponseTime) || 0,
      averageSatisfaction: Number(statistics.averageSatisfaction) || 0,
      completedAllTasksCount: Number(statistics.completedAllTasksCount),
      notCompletedAllTasksCount: Number(statistics.notCompletedAllTasksCount),
      studentSubmissions: Number(statistics.studentSubmissions),
      teacherSubmissions: Number(statistics.teacherSubmissions),
    })
  } catch (error) {
    console.error("Error fetching feedback statistics:", error)
    return err({ type: "database_error", error })
  }
}
