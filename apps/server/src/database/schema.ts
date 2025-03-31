import { relations, sql } from "drizzle-orm"
import {
  boolean,
  char,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["STUDENT", "TEACHER", "ADMIN"])
export type UserRole = (typeof userRole.enumValues)[number]
export const Users = pgTable("usuario", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_has", { length: 255 }).notNull(), // Nome da coluna original era password_has
  authKey: varchar("auth_key", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  school: varchar("school", { length: 64 }).notNull(), // Ex: Instituto de Computação
  academicTitle: varchar("academic_title", { length: 64 }).notNull(), // Ex: Doutorado
  lattesUrl: varchar("lattesUrl", { length: 255 }), // Aumentado tamanho para URL
  status: varchar("status", { length: 12 }).notNull().default("active"), // Ex: active, inactive
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: varchar("role", { length: 64 }).notNull(), // Papel oferecido (orientador, avaliador)
})
export type InsertUser = typeof Users.$inferInsert
export type SelectUser = typeof Users.$inferSelect

export const cursos = pgTable(
  "cursos",
  {
    id: serial("id").primaryKey(),
    nome: varchar("nome", { length: 255 }).notNull(),
    sigla: varchar("sigla", { length: 10 }).notNull().unique(), // Ex: 'BCC', 'ENGCOMP'
    // Adicionar outros campos como coordenacao, disciplina principal, etc., se necessário
  },
  (table) => ({
    siglaIdx: uniqueIndex("sigla_idx").on(table.sigla),
  })
)

// --- Tabela de Bancas ---
export const Bancas = pgTable("banca", {
  id: serial("id").primaryKey(),
  // user_id no dump original parece redundante se temos a relação N:N em usuario_banca
  // Mantendo por ora para refletir o dump, mas pode ser removido.
  // userId: int('user_id').notNull().references(() => usuarios.id), // FK para usuario (Proprietário?)
  cursoId: integer("curso_id")
    .notNull()
    .references(() => cursos.id), // FK para curso (ajustado de varchar)
  disciplina: varchar("disciplina", { length: 10 }).notNull(), // Código da disciplina? Ex: MATA62
  autor: varchar("autor", { length: 100 }).notNull(), // Nome do autor/aluno principal
  matricula: varchar("matricula", { length: 10 }), // Matrícula do autor/aluno principal
  pronomeAutor: varchar("pronome_autor", { length: 20 }), // Campo adicionado baseado no controller
  turma: varchar("turma", { length: 45 }).notNull(),
  ano: varchar("ano", { length: 4 }).notNull(),
  semestreLetivo: varchar("semestre_letivo", { length: 1 }), // Ex: '1', '2'
  tipoBanca: char("tipo_banca", { length: 10 }).notNull(), // Ex: 'TCC1', 'TCC2', 'Mestrado'
  tituloTrabalho: varchar("titulo_trabalho", { length: 255 }).notNull(),
  resumo: text("resumo").notNull(),
  abstract: text("abstract").notNull(),
  palavrasChave: text("palavras_chave").notNull(),
  dataRealizacao: timestamp("data_realizacao").notNull(),
  notaFinal: varchar("nota_final", { length: 10 }),
  local: varchar("local", { length: 255 }), // Room or Meeting Link
  modalidade: varchar("modalidade", { length: 10 }).notNull(), // 'remoto' or 'local'
  visible: boolean("visible").notNull().default(true),
})

// --- Tabela de Documentos ---
export const documentos = pgTable("documento", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 255 }), // Caminho no storage
  descricao: text("descricao").notNull(), // Nome original do arquivo?
  status: varchar("status", { length: 64 }).notNull(), // Ex: 'pending', 'approved', 'rejected'
  dataSubmissao: timestamp("data_submissao").notNull(),
})

// --- Tabela de Convites (Invite) ---
export const invites = pgTable(
  "invite",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => Users.id), // Quem foi convidado (opcional até aceitar?)
    bancaId: integer("banca_id")
      .notNull()
      .references(() => Bancas.id), // Para qual banca
    emailConvidado: varchar("email_convidado", { length: 64 }).notNull(), // Email para onde o convite foi enviado
    roleConvidado: varchar("role_convidado", { length: 64 }).notNull(), // Papel oferecido (orientador, avaliador)
    inviteHash: varchar("invite_hash", { length: 255 }).unique(), // Hash único do convite
    status: varchar("status", { length: 20 }).default("pending"), // Ex: pending, accepted, expired
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    hashIdx: uniqueIndex("hash_idx").on(table.inviteHash),
  })
)

// --- Tabela de Reset de Senha ---
export const resetPasswords = pgTable(
  "reset_password",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => Users.id),
    resetPasswordHash: varchar("reset_password_hash", { length: 255 }).unique(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    expiresAt: timestamp("expires_at").notNull(), // Adicionado para controle
  },
  (table) => ({
    hashResetIdx: uniqueIndex("hash_reset_idx").on(table.resetPasswordHash),
  })
)

// --- Tabela de Sessão (Opcional, se usar DB session) ---
export const sessions = pgTable("session", {
  id: varchar("id", { length: 128 }).primaryKey(), // Aumentado tamanho
  userId: integer("user_id").references(() => Users.id), // Associar sessão a usuário
  expire: timestamp("expire").notNull(),
  data: text("data"), // Usar text em vez de blob para JSON
  // token_access removido, geralmente gerenciado por JWT em header
})

// --- Tabela de Junção: Usuário <-> Banca (N:N) ---
export const usuariosBancas = pgTable("usuario_banca", {
  id: serial("id").primaryKey(),
  usuarioId: integer("id_usuario")
    .notNull()
    .references(() => Users.id),
  bancaId: integer("id_banca")
    .notNull()
    .references(() => Bancas.id),
  role: varchar("role", { length: 64 }).notNull(), // Ex: 'orientador', 'co-orientador', 'discente', 'avaliador'
  nota: varchar("nota", { length: 10 }),
  // Adicionar unique constraint para (usuarioId, bancaId) ?
})

// --- Tabela de Junção: Banca <-> Documento (N:N) ---
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

// === DEFINIÇÃO DAS RELAÇÕES ===

export const usuariosRelations = relations(Users, ({ one, many }) => ({
  sessoes: many(sessions),
  convitesEnviados: many(invites), // Se um admin pode convidar
  resetsSenha: many(resetPasswords),
  bancasAssociadas: many(usuariosBancas), // Relação através da tabela de junção
  // bancasCriadas: many(bancas), // Descomentar se banca.userId for mantido
}))

export const cursosRelations = relations(cursos, ({ many }) => ({
  bancas: many(Bancas),
}))

export const bancasRelations = relations(Bancas, ({ one, many }) => ({
  curso: one(cursos, {
    fields: [Bancas.cursoId],
    references: [cursos.id],
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
