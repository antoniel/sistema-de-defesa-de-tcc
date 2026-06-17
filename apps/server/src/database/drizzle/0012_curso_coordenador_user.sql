ALTER TABLE "cursos" ADD COLUMN "coordenador_id" integer;--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_coordenador_id_usuario_id_fk" FOREIGN KEY ("coordenador_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cursos" DROP COLUMN "nome_coordenador";
