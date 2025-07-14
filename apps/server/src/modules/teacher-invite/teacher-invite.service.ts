import { hash } from "bcrypt"
import { randomBytes } from "crypto"
import { addDays } from "date-fns"
import { eq } from "drizzle-orm"
import { db } from "../../database"
import { teacherInvites, Users } from "../../database/schema"
import { sendEmail } from "../../lib/email"
import type {
  AcceptTeacherInviteInput,
  CreateTeacherInviteInput,
  ValidateInviteTokenInput,
} from "./teacher-invite.schema"

export class TeacherInviteService {
  static async createInvite(data: CreateTeacherInviteInput) {
    const existingUser = await db.query.Users.findFirst({
      where: eq(Users.email, data.email),
    })
    if (existingUser) {
      throw new Error("A user with this email already exists")
    }
    const existingInvite = await db.query.teacherInvites.findFirst({
      where: eq(teacherInvites.email, data.email),
    })
    if (existingInvite && existingInvite.status === "pending") {
      throw new Error("A pending invite for this email already exists")
    }
    const inviteToken = randomBytes(32).toString("hex")
    const expiresAt = addDays(new Date(), 7)
    const [invite] = await db
      .insert(teacherInvites)
      .values({
        email: data.email,
        nome: data.nome,
        school: data.school,
        academicTitle: data.academicTitle,
        inviteToken,
        expiresAt,
      })
      .returning()
    await this.sendInviteEmail(invite)
    return invite
  }

  static async validateInviteToken(data: ValidateInviteTokenInput) {
    const invite = await db.query.teacherInvites.findFirst({
      where: eq(teacherInvites.inviteToken, data.token),
    })
    if (!invite) {
      throw new Error("Invite not found")
    }
    if (invite.status !== "pending") {
      throw new Error("Invite already used or expired")
    }
    if (new Date() > invite.expiresAt) {
      throw new Error("Invite expired")
    }
    return invite
  }

  static async acceptInvite(data: AcceptTeacherInviteInput) {
    const invite = await this.validateInviteToken({ token: data.token })
    const passwordHash = await hash(data.password, 10)
    const [user] = await db
      .insert(Users)
      .values({
        email: invite.email,
        nome: invite.nome,
        school: invite.school,
        academicTitle: invite.academicTitle,
        passwordHash,
        matricula: `PROF_${Date.now()}`,
        role: "TEACHER",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    await db
      .update(teacherInvites)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        userId: user.id,
      })
      .where(eq(teacherInvites.id, invite.id))
    return user
  }

  static async listInvites() {
    return await db.query.teacherInvites.findMany({
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    })
  }

  static async cancelInvite(inviteId: number) {
    const invite = await db.query.teacherInvites.findFirst({
      where: eq(teacherInvites.id, inviteId),
    })
    if (!invite) {
      throw new Error("Invite not found")
    }
    if (invite.status !== "pending") {
      throw new Error("Invite cannot be cancelled")
    }
    await db.update(teacherInvites).set({ status: "expired" }).where(eq(teacherInvites.id, inviteId))
    return { success: true }
  }

  private static async sendInviteEmail(invite: any) {
    const inviteUrl = `${process.env.FRONTEND_URL}/invite/teacher?token=${invite.inviteToken}`
    const emailContent = `
      <h2>Convite para participar do sistema de bancas</h2>
      <p>Olá ${invite.nome},</p>
      <p>Você foi convidado para participar do sistema de bancas acadêmicas.</p>
      <p><strong>Suas informações:</strong></p>
      <ul>
        <li><strong>Nome:</strong> ${invite.nome}</li>
        <li><strong>Instituição:</strong> ${invite.school}</li>
        <li><strong>Título Acadêmico:</strong> ${invite.academicTitle}</li>
      </ul>
      <p>Para aceitar o convite e criar sua conta, clique no link abaixo:</p>
      <p><a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceitar Convite</a></p>
      <p>Este link expira em 7 dias.</p>
      <p>Se você não solicitou este convite, pode ignorar este email.</p>
    `
    await sendEmail({
      to: invite.email,
      subject: "Convite para participar do sistema de bancas",
      html: emailContent,
    })
  }
}
