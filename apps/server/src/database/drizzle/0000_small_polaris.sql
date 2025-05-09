CREATE TYPE "public"."modalidade" AS ENUM('remoto', 'local');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'TEACHER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "banca" (
	"id" serial PRIMARY KEY NOT NULL,
	"orientador_id" integer NOT NULL,
	"curso_id" integer NOT NULL,
	"autor" text NOT NULL,
	"matricula" text,
	"turma" text NOT NULL,
	"periodo_academico" text NOT NULL,
	"titulo_trabalho" text NOT NULL,
	"resumo" text NOT NULL,
	"abstract" text NOT NULL,
	"palavras_chave" text NOT NULL,
	"data_realizacao" timestamp NOT NULL,
	"nota_final" text,
	"local" text,
	"modalidade" "modalidade" NOT NULL,
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"password_has" text NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"school" text NOT NULL,
	"matricula" text NOT NULL,
	"academic_title" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"status" "user_status" NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" "user_role" NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "banca_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_banca" integer NOT NULL,
	"id_documento" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cursos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"sigla" text NOT NULL,
	CONSTRAINT "cursos_sigla_unique" UNIQUE("sigla")
);
--> statement-breakpoint
CREATE TABLE "documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text,
	"descricao" text NOT NULL,
	"status" text NOT NULL,
	"data_submissao" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"banca_id" integer NOT NULL,
	"email_convidado" text NOT NULL,
	"role_convidado" text NOT NULL,
	"invite_hash" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "invite_invite_hash_unique" UNIQUE("invite_hash")
);
--> statement-breakpoint
CREATE TABLE "reset_password" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reset_password_hash" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "reset_password_reset_password_hash_unique" UNIQUE("reset_password_hash")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer,
	"expire" timestamp NOT NULL,
	"data" text
);
--> statement-breakpoint
CREATE TABLE "usuario_banca" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_banca" integer NOT NULL,
	"role" text NOT NULL,
	"nota" text
);
--> statement-breakpoint
ALTER TABLE "banca" ADD CONSTRAINT "banca_orientador_id_usuario_id_fk" FOREIGN KEY ("orientador_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banca" ADD CONSTRAINT "banca_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banca_documento" ADD CONSTRAINT "banca_documento_id_banca_banca_id_fk" FOREIGN KEY ("id_banca") REFERENCES "public"."banca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banca_documento" ADD CONSTRAINT "banca_documento_id_documento_documento_id_fk" FOREIGN KEY ("id_documento") REFERENCES "public"."documento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_banca_id_banca_id_fk" FOREIGN KEY ("banca_id") REFERENCES "public"."banca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reset_password" ADD CONSTRAINT "reset_password_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_banca" ADD CONSTRAINT "usuario_banca_id_usuario_usuario_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_banca" ADD CONSTRAINT "usuario_banca_id_banca_banca_id_fk" FOREIGN KEY ("id_banca") REFERENCES "public"."banca"("id") ON DELETE no action ON UPDATE no action;