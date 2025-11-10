-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_history" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "persona" TEXT,
    "current_tab" TEXT,
    "project_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "persona" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tab_content" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "tab_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tab_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tab_content_generation" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "tab_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tab_content_generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_responses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tab_type" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "persona" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_response_cache" (
    "prompt_hash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "persona" TEXT,
    "tab_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("prompt_hash")
);

-- CreateIndex
CREATE INDEX "idx_chat_history_project_id" ON "chat_history"("project_id");

-- CreateIndex
CREATE INDEX "idx_messages_chat_id" ON "messages"("chat_id");

-- CreateIndex
CREATE INDEX "idx_tab_content_chat_id" ON "tab_content"("chat_id");

-- CreateIndex
CREATE INDEX "idx_ai_responses_project_tab_hash" ON "ai_responses"("project_id", "tab_type", "prompt_hash");

-- AddForeignKey
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_content" ADD CONSTRAINT "tab_content_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_content_generation" ADD CONSTRAINT "tab_content_generation_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
