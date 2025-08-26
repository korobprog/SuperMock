-- CreateTable
CREATE TABLE "public"."feedback_analysis" (
    "id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "skillLevels" JSONB NOT NULL,
    "communication_score" INTEGER NOT NULL,
    "technical_score" INTEGER NOT NULL,
    "overall_readiness" INTEGER NOT NULL,
    "suggestions" JSONB NOT NULL,
    "uniqueness_score" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "ai_model" TEXT NOT NULL DEFAULT 'meta-llama/llama-3.1-8b-instruct',
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_recommendations" (
    "id" SERIAL NOT NULL,
    "analysis_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_hours" INTEGER,
    "due_date" TIMESTAMP(3),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skill_progress" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "current_level" INTEGER NOT NULL,
    "target_level" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" TEXT NOT NULL DEFAULT 'ai_analysis',
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_analysis_log" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "input_data" JSONB NOT NULL,
    "output_data" JSONB,
    "ai_model" TEXT NOT NULL,
    "processing_time_ms" INTEGER NOT NULL,
    "tokens_used" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_analysis_feedback_id_key" ON "public"."feedback_analysis"("feedback_id");

-- CreateIndex
CREATE INDEX "feedback_analysis_user_id_idx" ON "public"."feedback_analysis"("user_id");

-- CreateIndex
CREATE INDEX "feedback_analysis_created_at_idx" ON "public"."feedback_analysis"("created_at");

-- CreateIndex
CREATE INDEX "feedback_analysis_overall_readiness_idx" ON "public"."feedback_analysis"("overall_readiness");

-- CreateIndex
CREATE INDEX "learning_recommendations_user_id_is_completed_idx" ON "public"."learning_recommendations"("user_id", "is_completed");

-- CreateIndex
CREATE INDEX "learning_recommendations_priority_idx" ON "public"."learning_recommendations"("priority");

-- CreateIndex
CREATE INDEX "learning_recommendations_due_date_idx" ON "public"."learning_recommendations"("due_date");

-- CreateIndex
CREATE INDEX "learning_recommendations_type_idx" ON "public"."learning_recommendations"("type");

-- CreateIndex
CREATE INDEX "skill_progress_skill_name_idx" ON "public"."skill_progress"("skill_name");

-- CreateIndex
CREATE INDEX "skill_progress_current_level_idx" ON "public"."skill_progress"("current_level");

-- CreateIndex
CREATE UNIQUE INDEX "skill_progress_user_id_skill_name_key" ON "public"."skill_progress"("user_id", "skill_name");

-- CreateIndex
CREATE INDEX "ai_analysis_log_user_id_idx" ON "public"."ai_analysis_log"("user_id");

-- CreateIndex
CREATE INDEX "ai_analysis_log_operation_idx" ON "public"."ai_analysis_log"("operation");

-- CreateIndex
CREATE INDEX "ai_analysis_log_success_idx" ON "public"."ai_analysis_log"("success");

-- CreateIndex
CREATE INDEX "ai_analysis_log_created_at_idx" ON "public"."ai_analysis_log"("created_at");

-- AddForeignKey
ALTER TABLE "public"."feedback_analysis" ADD CONSTRAINT "feedback_analysis_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback_analysis" ADD CONSTRAINT "feedback_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_recommendations" ADD CONSTRAINT "learning_recommendations_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "public"."feedback_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_recommendations" ADD CONSTRAINT "learning_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skill_progress" ADD CONSTRAINT "skill_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analysis_log" ADD CONSTRAINT "ai_analysis_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
