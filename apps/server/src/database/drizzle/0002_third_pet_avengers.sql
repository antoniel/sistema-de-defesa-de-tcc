CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_username_unique";--> statement-breakpoint
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_auth_key_unique";--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "status" SET DATA TYPE user_status;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "usuario" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "usuario" DROP COLUMN "auth_key";