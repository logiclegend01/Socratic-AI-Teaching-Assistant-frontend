-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT;

-- CreateIndex
CREATE INDEX "Messages_chatId_idx" ON "Messages"("chatId");
