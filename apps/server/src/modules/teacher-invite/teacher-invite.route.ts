import { Router } from "express"
import { TeacherInviteService } from "./teacher-invite.service"
import { createTeacherInviteSchema, acceptTeacherInviteSchema, validateInviteTokenSchema } from "./teacher-invite.schema"
import { validateRequest } from "../../middleware/validate-request"
import { requireAuth } from "../auth/auth.middleware"

const router = Router()

// Criar convite (apenas admins)
router.post(
  "/",
  requireAuth(["ADMIN"]),
  validateRequest(createTeacherInviteSchema),
  async (req, res) => {
    try {
      const invite = await TeacherInviteService.createInvite(req.body)
      res.status(201).json({
        success: true,
        data: invite,
        message: "Convite enviado com sucesso",
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }
)

// Listar convites (apenas admins)
router.get(
  "/",
  requireAuth(["ADMIN"]),
  async (req, res) => {
    try {
      const invites = await TeacherInviteService.listInvites()
      res.json({
        success: true,
        data: invites,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
)

// Cancelar convite (apenas admins)
router.delete(
  "/:id",
  requireAuth(["ADMIN"]),
  async (req, res) => {
    try {
      const inviteId = parseInt(req.params.id)
      if (isNaN(inviteId)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        })
      }

      await TeacherInviteService.cancelInvite(inviteId)
      res.json({
        success: true,
        message: "Convite cancelado com sucesso",
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }
)

// Validar token de convite (público)
router.post(
  "/validate",
  validateRequest(validateInviteTokenSchema),
  async (req, res) => {
    try {
      const invite = await TeacherInviteService.validateInviteToken(req.body)
      res.json({
        success: true,
        data: {
          email: invite.email,
          nome: invite.nome,
          school: invite.school,
          academicTitle: invite.academicTitle,
        },
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }
)

// Aceitar convite (público)
router.post(
  "/accept",
  validateRequest(acceptTeacherInviteSchema),
  async (req, res) => {
    try {
      const user = await TeacherInviteService.acceptInvite(req.body)
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          role: user.role,
        },
        message: "Conta criada com sucesso",
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }
)

export default router