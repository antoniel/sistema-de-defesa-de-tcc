import { eq } from "drizzle-orm"
import { db } from "../../database"
import { teacherInvites, Users } from "../../database/schema"
import { CreateTeacherInviteInput, AcceptTeacherInviteInput, ValidateInviteTokenInput } from "./teacher-invite.schema"
import { hash, compare } from "bcrypt"
import { randomBytes } from "crypto"
import { addDays } from "date-fns"
import { sendEmail } from "../../lib/email"

export class TeacherInviteService {
  /**
   * Cria um novo convite para professor
   */
  static async createInvite(data: CreateTeacherInviteInput) {
    // Verificar se já existe um usuário com este email
    const existingUser = await db.query.Users.findFirst({
      where: eq(Users.email, data.email),
    })

    if (existingUser) {
      throw new Error("Já existe um usuário com este email")
    }

    // Verificar se já existe um convite pendente para este email
    const existingInvite = await db.query.teacherInvites.findFirst({
      where: eq(teacherInvites.email, data.email),
    })

    if (existingInvite && existingInvite.status === "pending") {
      throw new Error("Já existe um convite pendente para este email")
    }

    // Gerar token único
    const inviteToken = randomBytes(32).toString("hex")
    
    // Definir data de expiração (7 dias)
    const expiresAt = addDays(new Date(), 7)

    // Criar convite
    const [invite] = await db.insert(teacherInvites).values({
      email: data.email,
      nome: data.nome,
      school: data.school,
      academicTitle: data.academicTitle,
      inviteToken,
      expiresAt,
    }).returning()

    // Enviar email
    await this.sendInviteEmail(invite)

    return invite
  }

  /**
   * Valida um token de convite
   */
  static async validateInviteToken(data: ValidateInviteTokenInput) {
    const invite = await db.query.teacherInvites.findFirst({
      where: eq(teacherInvites.inviteToken, data.token),
    })

    if (!invite) {
      throw new Error("Convite não encontrado")
    }

    if (invite.status !== "pending") {
      throw new Error("Convite já foi utilizado ou expirou")
    }

    if (new Date() > invite.expiresAt) {
      throw new Error("Convite expirou")
    }

    return invite
  }

  /**
   * Aceita um convite e cria o usuário
   */
  static async acceptInvite(data: AcceptTeacherInviteInput) {
    const invite = await this.validateInviteToken({ token: data.token })

    // Hash da senha
    const passwordHash = await hash(data.password, 10)

    // Criar usuário
    const [user] = await db.insert(Users).values({
      email: invite.email,
      nome: invite.nome,
      school: invite.school,
      academicTitle: invite.academicTitle,
      passwordHash,
      matricula: `PROF_${Date.now()}`, // Gerar matrícula única para professores
      role: "TEACHER",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    // Atualizar convite como aceito
    await db.update(teacherInvites)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        userId: user.id,
      })
      .where(eq(teacherInvites.id, invite.id))

    return user
  }

  /**
   * Lista todos os convites
   */
  static async listInvites() {
    return await db.query.teacherInvites.findMany({
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    })
  }

  /**
   * Cancela um convite
   */
  static async cancelInvite(inviteId: number) {
    const invite = await db.query.teacherInvites.findFirst({
      where: eq(teacherInvites.id, inviteId),
    })

    if (!invite) {
      throw new Error("Convite não encontrado")
    }

    if (invite.status !== "pending") {
      throw new Error("Convite não pode ser cancelado")
    }

    await db.update(teacherInvites)
      .set({ status: "expired" })
      .where(eq(teacherInvites.id, inviteId))

    return { success: true }
  }

  /**
   * Envia email de convite
   */
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