CREATE TABLE "teacher_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"invitation_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by" integer NOT NULL,
	"user_id" integer,
	CONSTRAINT "teacher_invitation_email_unique" UNIQUE("email"),
	CONSTRAINT "teacher_invitation_invitation_hash_unique" UNIQUE("invitation_hash")
);
--> statement-breakpoint
ALTER TABLE "teacher_invitation" ADD CONSTRAINT "teacher_invitation_invited_by_usuario_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_invitation" ADD CONSTRAINT "teacher_invitation_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;