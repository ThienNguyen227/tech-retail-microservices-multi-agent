/*
  Warnings:

  - Added the required column `discount_type_code` to the `discount_type` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "discount_type" ADD COLUMN     "discount_type_code" TEXT NOT NULL;
