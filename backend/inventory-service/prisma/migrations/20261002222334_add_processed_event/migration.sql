-- CreateTable
CREATE TABLE "processed_event" (
    "processed_event_id" SERIAL NOT NULL,
    "processed_event_event_id" INTEGER NOT NULL,
    "processed_event_event_type" TEXT NOT NULL,
    "processed_event_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_event_pkey" PRIMARY KEY ("processed_event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processed_event_processed_event_event_id_key" ON "processed_event"("processed_event_event_id");
