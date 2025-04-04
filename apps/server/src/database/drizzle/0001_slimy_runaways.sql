ALTER TABLE "usuario" ALTER COLUMN "role" SET DATA TYPE user_role USING role::user_role;--> statement-breakpoint
ALTER TABLE "banca" DROP COLUMN "gender";--> statement-breakpoint
DROP TYPE "public"."gender";