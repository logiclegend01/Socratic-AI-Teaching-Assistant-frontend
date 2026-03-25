-- CreateEnum
CREATE TYPE "SelectAssistent" AS ENUM ('socratic', 'direct', 'creative', 'evaluator');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assistant" "SelectAssistent" NOT NULL DEFAULT 'socratic';
