-- CreateTable
CREATE TABLE "user_tools" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_tools_user_id_profession_idx" ON "user_tools"("user_id", "profession");

-- CreateIndex
CREATE INDEX "user_tools_tool_name_profession_idx" ON "user_tools"("tool_name", "profession");

-- AddForeignKey
ALTER TABLE "user_tools" ADD CONSTRAINT "user_tools_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
