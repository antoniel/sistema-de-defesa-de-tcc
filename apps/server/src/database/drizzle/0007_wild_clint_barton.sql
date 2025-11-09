CREATE TYPE "public"."academic_profile" AS ENUM('STUDENT', 'TEACHER');--> statement-breakpoint
CREATE TABLE "feature_request_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feature_request_id" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_feature_request_unique" UNIQUE("user_id","feature_request_id")
);
--> statement-breakpoint
CREATE TABLE "feature_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"academic_profile" "academic_profile" NOT NULL,
	"task_complexity_rating" integer NOT NULL,
	"interface_consistency_rating" integer NOT NULL,
	"response_time_rating" integer NOT NULL,
	"satisfaction_rating" integer NOT NULL,
	"would_use_system" boolean NOT NULL,
	"usage_purposes" text NOT NULL,
	"usage_purpose_other" text,
	"completed_all_tasks" boolean NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_request_vote" ADD CONSTRAINT "feature_request_vote_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request_vote" ADD CONSTRAINT "feature_request_vote_feature_request_id_feature_request_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request" ADD CONSTRAINT "feature_request_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submission" ADD CONSTRAINT "feedback_submission_user_id_usuario_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;