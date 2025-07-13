CREATE TABLE "teacher_invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"school" text NOT NULL,
	"academic_title" text NOT NULL,
	"invite_token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"accepted_at" timestamp,
	"accepted_by_user_id" integer,
	CONSTRAINT "teacher_invite_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
ALTER TABLE "teacher_invite" ADD CONSTRAINT "teacher_invite_accepted_by_user_id_usuario_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;