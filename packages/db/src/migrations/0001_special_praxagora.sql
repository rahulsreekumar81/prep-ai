ALTER TYPE "public"."question_type" ADD VALUE 'dsa';--> statement-breakpoint
CREATE TABLE "dsa_question_bank" (
	"id" text PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"topic" text NOT NULL,
	"starter_code" jsonb NOT NULL,
	"test_cases" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "code_answer" text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "metadata" jsonb;