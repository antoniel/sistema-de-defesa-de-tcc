ALTER TABLE "banca" ADD COLUMN "aluno_id" integer;--> statement-breakpoint
UPDATE "banca" b
SET "aluno_id" = u.id
FROM "usuario" u
WHERE b."matricula" IS NOT NULL AND b."matricula" = u."matricula";--> statement-breakpoint
ALTER TABLE "banca" ALTER COLUMN "aluno_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banca"
  ADD CONSTRAINT "banca_aluno_id_usuario_id_fk"
  FOREIGN KEY ("aluno_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;