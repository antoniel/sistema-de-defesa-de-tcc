ALTER TABLE "feedback_submission" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "feedback_submission" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "feedback_submission" DROP COLUMN "academic_profile";--> statement-breakpoint
ALTER TABLE "feedback_submission" ADD CONSTRAINT "feedback_submission_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
DROP TYPE "public"."academic_profile";