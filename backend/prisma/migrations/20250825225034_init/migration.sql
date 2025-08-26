-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "tg_id" TEXT,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "photo_url" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_tools" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preferences" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "slots_utc" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "interviewer_user_id" TEXT,
    "candidate_user_id" TEXT,
    "profession" TEXT,
    "language" TEXT,
    "slot_utc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "jitsi_room" TEXT,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_queues" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profession" TEXT,
    "language" TEXT,
    "slot_utc" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matches" (
    "id" SERIAL NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "slot_utc" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "session_id" TEXT,
    "meeting_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "action_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "message_data" TEXT,
    "message_key" TEXT,
    "title_key" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratings" TEXT,
    "recommendations" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_ratings" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_index" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "is_asked" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "openrouter_api_key" TEXT,
    "preferred_model" TEXT NOT NULL DEFAULT 'meta-llama/llama-3.1-8b-instruct',
    "questions_level" TEXT NOT NULL DEFAULT 'middle',
    "use_ai_generation" BOOLEAN NOT NULL DEFAULT false,
    "questions_count" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "stackblitz_api_key" TEXT,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."materials" (
    "id" SERIAL NOT NULL,
    "profession" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "read_time" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."material_translations" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_tools_user_id_profession_idx" ON "public"."user_tools"("user_id", "profession");

-- CreateIndex
CREATE INDEX "user_tools_tool_name_profession_idx" ON "public"."user_tools"("tool_name", "profession");

-- CreateIndex
CREATE INDEX "user_queues_slot_utc_role_status_idx" ON "public"."user_queues"("slot_utc", "role", "status");

-- CreateIndex
CREATE INDEX "user_queues_user_id_status_idx" ON "public"."user_queues"("user_id", "status");

-- CreateIndex
CREATE INDEX "matches_slot_utc_status_idx" ON "public"."matches"("slot_utc", "status");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "public"."notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "feedback_session_id_idx" ON "public"."feedback"("session_id");

-- CreateIndex
CREATE INDEX "feedback_from_user_id_idx" ON "public"."feedback"("from_user_id");

-- CreateIndex
CREATE INDEX "feedback_to_user_id_idx" ON "public"."feedback"("to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_ratings_session_id_question_index_key" ON "public"."question_ratings"("session_id", "question_index");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "public"."user_settings"("user_id");

-- CreateIndex
CREATE INDEX "materials_profession_category_idx" ON "public"."materials"("profession", "category");

-- CreateIndex
CREATE INDEX "materials_profession_difficulty_idx" ON "public"."materials"("profession", "difficulty");

-- CreateIndex
CREATE INDEX "materials_is_popular_created_at_idx" ON "public"."materials"("is_popular", "created_at");

-- CreateIndex
CREATE INDEX "material_translations_language_idx" ON "public"."material_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "material_translations_material_id_language_key" ON "public"."material_translations"("material_id", "language");

-- AddForeignKey
ALTER TABLE "public"."user_tools" ADD CONSTRAINT "user_tools_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preferences" ADD CONSTRAINT "preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_interviewer_user_id_fkey" FOREIGN KEY ("interviewer_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_queues" ADD CONSTRAINT "user_queues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_ratings" ADD CONSTRAINT "question_ratings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_translations" ADD CONSTRAINT "material_translations_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
