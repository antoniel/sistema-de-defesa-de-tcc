CREATE TABLE "banca" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"disciplina" varchar(10) NOT NULL,
	"autor" varchar(100) NOT NULL,
	"matricula" varchar(10),
	"pronome_autor" varchar(20),
	"turma" varchar(45) NOT NULL,
	"ano" varchar(4) NOT NULL,
	"semestre_letivo" varchar(1),
	"tipo_banca" char(10) NOT NULL,
	"titulo_trabalho" varchar(255) NOT NULL,
	"resumo" text NOT NULL,
	"abstract" text NOT NULL,
	"palavras_chave" text NOT NULL,
	"data_realizacao" timestamp NOT NULL,
	"nota_final" varchar(10),
	"local" varchar(255),
	"visible" boolean DEFAULT true NOT NULL
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
	"nome" varchar(255) NOT NULL,
	"sigla" varchar(10) NOT NULL,
	CONSTRAINT "cursos_sigla_unique" UNIQUE("sigla")
);
--> statement-breakpoint
CREATE TABLE "documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" varchar(255),
	"descricao" text NOT NULL,
	"status" varchar(64) NOT NULL,
	"data_submissao" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"banca_id" integer NOT NULL,
	"email_convidado" varchar(64) NOT NULL,
	"role_convidado" varchar(64) NOT NULL,
	"invite_hash" varchar(255),
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "invite_invite_hash_unique" UNIQUE("invite_hash")
);
--> statement-breakpoint
CREATE TABLE "reset_password" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reset_password_hash" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "reset_password_reset_password_hash_unique" UNIQUE("reset_password_hash")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" integer,
	"expire" timestamp NOT NULL,
	"data" text
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_has" varchar(255) NOT NULL,
	"auth_key" varchar(255) NOT NULL,
	"email" varchar(64) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"school" varchar(64) NOT NULL,
	"academic_title" varchar(64) NOT NULL,
	"lattesUrl" varchar(255),
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" varchar(64) NOT NULL,
	CONSTRAINT "usuario_username_unique" UNIQUE("username"),
	CONSTRAINT "usuario_auth_key_unique" UNIQUE("auth_key"),
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuario_banca" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_banca" integer NOT NULL,
	"role" varchar(64) NOT NULL,
	"nota" varchar(10)
);
--> statement-breakpoint
ALTER TABLE "banca" ADD CONSTRAINT "banca_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banca_documento" ADD CONSTRAINT "banca_documento_id_banca_banca_id_fk" FOREIGN KEY ("id_banca") REFERENCES "public"."banca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banca_documento" ADD CONSTRAINT "banca_documento_id_documento_documento_id_fk" FOREIGN KEY ("id_documento") REFERENCES "public"."documento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_banca_id_banca_id_fk" FOREIGN KEY ("banca_id") REFERENCES "public"."banca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reset_password" ADD CONSTRAINT "reset_password_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_banca" ADD CONSTRAINT "usuario_banca_id_usuario_usuario_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_banca" ADD CONSTRAINT "usuario_banca_id_banca_banca_id_fk" FOREIGN KEY ("id_banca") REFERENCES "public"."banca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sigla_idx" ON "cursos" USING btree ("sigla");--> statement-breakpoint
CREATE UNIQUE INDEX "hash_idx" ON "invite" USING btree ("invite_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "hash_reset_idx" ON "reset_password" USING btree ("reset_password_hash");