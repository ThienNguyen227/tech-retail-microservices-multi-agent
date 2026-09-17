-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "Branch" (
    "branch_id" BIGSERIAL NOT NULL,
    "branch_code" VARCHAR(50) NOT NULL,
    "branch_name" VARCHAR(100) NOT NULL,
    "branch_phone" VARCHAR(20) NOT NULL,
    "branch_email" VARCHAR(100) NOT NULL,
    "branch_status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "branch_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "Branch_Address" (
    "branch_address_id" BIGSERIAL NOT NULL,
    "branch_id" BIGINT NOT NULL,
    "branch_address_address_line" VARCHAR(255) NOT NULL,
    "branch_address_ward" VARCHAR(100) NOT NULL,
    "branch_address_province" VARCHAR(100) NOT NULL,
    "branch_address_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_address_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_Address_pkey" PRIMARY KEY ("branch_address_id")
);

-- CreateTable
CREATE TABLE "Branch_Business_Hour" (
    "branch_business_hour_id" BIGSERIAL NOT NULL,
    "branch_id" BIGINT NOT NULL,
    "branch_business_hour_day_of_week" "DayOfWeek" NOT NULL,
    "branch_business_hour_open_time" TIME(0),
    "branch_business_hour_close_time" TIME(0),
    "branch_business_hour_is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Branch_Business_Hour_pkey" PRIMARY KEY ("branch_business_hour_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_branch_code_key" ON "Branch"("branch_code");

-- CreateIndex
CREATE INDEX "idx_branch_status" ON "Branch"("branch_status");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_Address_branch_id_key" ON "Branch_Address"("branch_id");

-- CreateIndex
CREATE INDEX "idx_branch_business_hour_branch" ON "Branch_Business_Hour"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_Business_Hour_branch_id_branch_business_hour_day_of__key" ON "Branch_Business_Hour"("branch_id", "branch_business_hour_day_of_week");

-- AddForeignKey
ALTER TABLE "Branch_Address" ADD CONSTRAINT "Branch_Address_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch_Business_Hour" ADD CONSTRAINT "Branch_Business_Hour_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;
