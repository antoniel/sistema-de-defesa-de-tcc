import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { checkRole } from "../auth/auth.middleware"
import {
  acceptTeacherInviteSchema,
  createTeacherInviteSchema,
  validateInviteTokenSchema,
} from "./teacher-invite.schema"
import { TeacherInviteService } from "./teacher-invite.service"

const router = new Hono()

router.post("/", checkRole(["ADMIN"]), zValidator("json", createTeacherInviteSchema), async (c) => {
  try {
    const data = c.req.valid("json")
    const invite = await TeacherInviteService.createInvite(data)
    return c.json({ success: true, data: invite, message: "Invite sent successfully" }, 201)
  } catch (error: any) {
    throw new HTTPException(400, { message: error.message })
  }
})

router.get("/", checkRole(["ADMIN"]), async (c) => {
  try {
    const invites = await TeacherInviteService.listInvites()
    return c.json({ success: true, data: invites })
  } catch (error: any) {
    throw new HTTPException(500, { message: error.message })
  }
})

router.delete("/:id", checkRole(["ADMIN"]), async (c) => {
  try {
    const idParam = c.req.param("id")
    const inviteId = Number(idParam)
    if (isNaN(inviteId)) {
      throw new HTTPException(400, { message: "Invalid ID" })
    }
    await TeacherInviteService.cancelInvite(inviteId)
    return c.json({ success: true, message: "Invite cancelled successfully" })
  } catch (error: any) {
    throw new HTTPException(400, { message: error.message })
  }
})

router.post("/validate", zValidator("json", validateInviteTokenSchema), async (c) => {
  try {
    const data = c.req.valid("json")
    const invite = await TeacherInviteService.validateInviteToken(data)
    return c.json({
      success: true,
      data: {
        email: invite.email,
        nome: invite.nome,
        school: invite.school,
        academicTitle: invite.academicTitle,
      },
    })
  } catch (error: any) {
    throw new HTTPException(400, { message: error.message })
  }
})

router.post("/accept", zValidator("json", acceptTeacherInviteSchema), async (c) => {
  try {
    const data = c.req.valid("json")
    const user = await TeacherInviteService.acceptInvite(data)
    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      },
      message: "Account created successfully",
    })
  } catch (error: any) {
    throw new HTTPException(400, { message: error.message })
  }
})

export default router
