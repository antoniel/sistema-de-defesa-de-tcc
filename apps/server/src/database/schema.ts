import { relations, sql } from "drizzle-orm"
import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["STUDENT", "TEACHER", "ADMIN"])
export type UserRole = (typeof userRole.enumValues)[number]
export const Users = pgTable("usuario", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_has").notNull(), // Nome da coluna original era password_has
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  school: text("school").notNull(), // Ex: Instituto de Computação
  matricula: text("matricula").notNull(),
  academicTitle: text("academic_title").notNull(), // Ex: Doutorado
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: userRole("role").notNull(),
})
export type InsertUser = typeof Users.$inferInsert
export type SelectUser = typeof Users.$inferSelect

export const Cursos = pgTable("cursos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  sigla: text("sigla").notNull().unique(), // Ex: 'BCC', 'ENGCOMP'
  // Adicionar outros campos como coordenacao, disciplina principal, etc., se necessário
})
export type InsertCurso = typeof Cursos.$inferInsert
export type SelectCurso = typeof Cursos.$inferSelect

export const modalidadeEnum = pgEnum("modalidade", ["remoto", "local"])
export const Bancas = pgTable(
  "banca",
  {
    id: serial("id").primaryKey(),
    // user_id no dump original parece redundante se temos a relação N:N em usuario_banca
    // Mantendo por ora para refletir o dump, mas pode ser removido.
    // userId: int('user_id').notNull().references(() => usuarios.id), // FK para usuario (Proprietário?)
    orientadorId: integer("orientador_id")
      .notNull()
      .references(() => Users.id),
    cursoId: integer("curso_id")
      .notNull()
      .references(() => Cursos.id), // FK para curso (ajustado de text)
    autor: text("autor").notNull(), // Nome do autor/aluno principal
    alunoId: integer("aluno_id")
      .notNull()
      .references(() => Users.id),
    matricula: text("matricula"), // Matrícula do autor/aluno principal
    turma: text("turma").notNull(),
    periodoAcademico: text("periodo_academico").notNull(),
    tituloTrabalho: text("titulo_trabalho").notNull(),
    resumo: text("resumo").notNull(),
    abstract: text("abstract").notNull(),
    palavrasChave: text("palavras_chave").notNull(),
    dataRealizacao: timestamp("data_realizacao").notNull(),
    notaFinal: text("nota_final"),
    local: text("local"), // Room or Meeting Link
    modalidade: modalidadeEnum("modalidade").notNull(), // 'remoto' or 'local'
    visible: boolean("visible").notNull().default(true),
  },
  (table) => {
    return {
      alunoCursoUnique: unique("aluno_curso_unique").on(table.alunoId, table.cursoId),
    }
  }
)
export type InsertBanca = typeof Bancas.$inferInsert
export type SelectBanca = typeof Bancas.$inferSelect

export const documentos = pgTable("documento", {
  id: serial("id").primaryKey(),
  path: text("path"), // Caminho no storage
  descricao: text("descricao").notNull(), // Nome original do arquivo?
  status: text("status").notNull(), // Ex: 'pending', 'approved', 'rejected'
  dataSubmissao: timestamp("data_submissao").notNull(),
})

export const invites = pgTable("invite", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id), // Quem foi convidado (opcional até aceitar?)
  bancaId: integer("banca_id")
    .notNull()
    .references(() => Bancas.id), // Para qual banca
  emailConvidado: text("email_convidado").notNull(), // Email para onde o convite foi enviado
  roleConvidado: text("role_convidado").notNull(), // Papel oferecido (orientador, avaliador)
  inviteHash: text("invite_hash").unique(), // Hash único do convite
  status: text("status").default("pending"), // Ex: pending, accepted, expired
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const resetPasswords = pgTable("reset_password", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => Users.id),
  resetPasswordHash: text("reset_password_hash").unique(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at").notNull(), // Adicionado para controle
})

export const sessions = pgTable("session", {
  id: text("id").primaryKey(), // Aumentado tamanho
  userId: integer("user_id").references(() => Users.id), // Associar sessão a usuário
  expire: timestamp("expire").notNull(),
  data: text("data"), // Usar text em vez de blob para JSON
  // token_access removido, geralmente gerenciado por JWT em header
})

export const usuariosBancas = pgTable("usuario_banca", {
  id: serial("id").primaryKey(),
  usuarioId: integer("id_usuario")
    .notNull()
    .references(() => Users.id),
  bancaId: integer("id_banca")
    .notNull()
    .references(() => Bancas.id),
  role: text("role").notNull(), // Ex: 'orientador', 'co-orientador', 'discente', 'avaliador'
  nota: text("nota"),
  // Adicionar unique constraint para (usuarioId, bancaId) ?
})
export type InsertUsuarioBanca = typeof usuariosBancas.$inferInsert
export type SelectUsuarioBanca = typeof usuariosBancas.$inferSelect

export const bancasDocumentos = pgTable("banca_documento", {
  id: serial("id").primaryKey(),
  bancaId: integer("id_banca")
    .notNull()
    .$type<number>() // Explicitly cast to integer
    .references(() => Bancas.id, { onDelete: "cascade" }), // Ensure cascading deletes
  documentoId: integer("id_documento")
    .notNull()
    .references(() => documentos.id),
})

// Nova tabela para convites de professores
export const teacherInvites = pgTable("teacher_invite", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  nome: text("nome").notNull(),
  school: text("school").notNull(),
  academicTitle: text("academic_title").notNull(),
  inviteToken: text("invite_token").unique().notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  acceptedAt: timestamp("accepted_at"),
  acceptedByUserId: integer("accepted_by_user_id").references(() => Users.id),
})

// === DEFINIÇÃO DAS RELAÇÕES ===

export const usuariosRelations = relations(Users, ({ one, many }) => ({
  sessoes: many(sessions),
  convitesEnviados: many(invites), // Se um admin pode convidar
  resetsSenha: many(resetPasswords),
  bancasAssociadas: many(usuariosBancas), // Relação através da tabela de junção
  convitesProfessores: many(teacherInvites, { relationName: "acceptedByUser" }), // Relação com convites aceitos
  // bancasCriadas: many(bancas), // Descomentar se banca.userId for mantido
}))

export const cursosRelations = relations(Cursos, ({ many }) => ({
  bancas: many(Bancas),
}))

export const bancasRelations = relations(Bancas, ({ one, many }) => ({
  orientador: one(Users, {
    fields: [Bancas.orientadorId],
    references: [Users.id],
  }),
  curso: one(Cursos, {
    fields: [Bancas.cursoId],
    references: [Cursos.id],
  }),
  // criador: one(usuarios, { // Descomentar se banca.userId for mantido
  //     fields: [bancas.userId],
  //     references: [usuarios.id],
  // }),
  membros: many(usuariosBancas), // Relação com usuários através da tabela de junção
  documentosAssociados: many(bancasDocumentos), // Relação com documentos através da tabela de junção
  convites: many(invites), // Convites relacionados a esta banca
}))

export const documentosRelations = relations(documentos, ({ many }) => ({
  bancasAssociadas: many(bancasDocumentos), // Relação através da tabela de junção
}))

export const invitesRelations = relations(invites, ({ one }) => ({
  usuarioConvidado: one(Users, {
    fields: [invites.userId],
    references: [Users.id],
  }),
  banca: one(Bancas, {
    fields: [invites.bancaId],
    references: [Bancas.id],
  }),
}))

export const resetPasswordsRelations = relations(resetPasswords, ({ one }) => ({
  usuario: one(Users, {
    fields: [resetPasswords.userId],
    references: [Users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  usuario: one(Users, {
    fields: [sessions.userId],
    references: [Users.id],
  }),
}))

// Relações para a tabela de junção usuario_banca
export const usuariosBancasRelations = relations(usuariosBancas, ({ one }) => ({
  usuario: one(Users, {
    fields: [usuariosBancas.usuarioId],
    references: [Users.id],
  }),
  banca: one(Bancas, {
    fields: [usuariosBancas.bancaId],
    references: [Bancas.id],
  }),
}))

// Relações para a tabela de junção banca_documento
export const bancasDocumentosRelations = relations(bancasDocumentos, ({ one }) => ({
  banca: one(Bancas, {
    fields: [bancasDocumentos.bancaId],
    references: [Bancas.id],
  }),
  documento: one(documentos, {
    fields: [bancasDocumentos.documentoId],
    references: [documentos.id],
  }),
}))

// Relações para a tabela teacher_invite
export const teacherInvitesRelations = relations(teacherInvites, ({ one }) => ({
  acceptedByUser: one(Users, {
    fields: [teacherInvites.acceptedByUserId],
    references: [Users.id],
  }),
}))
