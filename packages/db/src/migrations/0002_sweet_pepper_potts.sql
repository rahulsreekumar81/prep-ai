CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'passed', 'failed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."round_session_status" AS ENUM('pending', 'in_progress', 'completed', 'passed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."round_type" AS ENUM('oa', 'phone_screen', 'coding', 'system_design', 'behavioral', 'mixed');--> statement-breakpoint
CREATE TABLE "company_pipelines" (
	"id" text PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"description" text,
	"total_rounds" integer DEFAULT 0 NOT NULL,
	"passing_threshold" real DEFAULT 0.6 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pipeline_id" text NOT NULL,
	"resume_text" text,
	"job_description" text,
	"current_round_index" integer DEFAULT 0 NOT NULL,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pipeline_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_id" text NOT NULL,
	"name" text NOT NULL,
	"round_type" "round_type" NOT NULL,
	"order_index" integer NOT NULL,
	"duration_minutes" integer DEFAULT 45 NOT NULL,
	"question_count" integer DEFAULT 1 NOT NULL,
	"description" text,
	"passing_score" real DEFAULT 6 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"round_id" text NOT NULL,
	"status" "round_session_status" DEFAULT 'pending' NOT NULL,
	"score" real,
	"feedback" text,
	"ai_conversation" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "interview_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "round_session_id" text;--> statement-breakpoint
ALTER TABLE "pipeline_attempts" ADD CONSTRAINT "pipeline_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_attempts" ADD CONSTRAINT "pipeline_attempts_pipeline_id_company_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."company_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_rounds" ADD CONSTRAINT "pipeline_rounds_pipeline_id_company_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."company_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_sessions" ADD CONSTRAINT "round_sessions_attempt_id_pipeline_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."pipeline_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_sessions" ADD CONSTRAINT "round_sessions_round_id_pipeline_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."pipeline_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_round_session_id_round_sessions_id_fk" FOREIGN KEY ("round_session_id") REFERENCES "public"."round_sessions"("id") ON DELETE no action ON UPDATE no action;