-- CreateTable
CREATE TABLE "Customer" (
    "customer_id" BIGSERIAL NOT NULL,
    "customer_user_id" BIGINT NOT NULL,
    "customer_code" VARCHAR(50) NOT NULL,
    "customer_full_name" VARCHAR(100),
    "customer_date_of_birth" DATE,
    "customer_gender" VARCHAR(10),
    "customer_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "customer_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "Customer_Address" (
    "customer_address_id" BIGSERIAL NOT NULL,
    "customer_address_customer_id" BIGINT NOT NULL,
    "customer_address_line" VARCHAR(255) NOT NULL,
    "customer_address_ward" VARCHAR(100),
    "customer_address_province" VARCHAR(100),
    "customer_address_default" BOOLEAN NOT NULL DEFAULT false,
    "customer_address_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_address_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_Address_pkey" PRIMARY KEY ("customer_address_id")
);

-- CreateTable
CREATE TABLE "Membership_tiers" (
    "membership_tier_id" BIGSERIAL NOT NULL,
    "membership_tier_name" VARCHAR(50) NOT NULL,
    "membership_tier_min_points" INTEGER NOT NULL DEFAULT 0,
    "membership_tier_discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "membership_tier_description" VARCHAR(255),

    CONSTRAINT "Membership_tiers_pkey" PRIMARY KEY ("membership_tier_id")
);

-- CreateTable
CREATE TABLE "Customer_membership" (
    "customer_membership_customer_id" BIGINT NOT NULL,
    "customer_membership_tier_id" BIGINT NOT NULL,
    "customer_membership_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_membership_expired_at" TIMESTAMP(3),
    "customer_membership_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Customer_membership_pkey" PRIMARY KEY ("customer_membership_customer_id","customer_membership_tier_id")
);

-- CreateTable
CREATE TABLE "Customer_Points" (
    "customer_point_id" BIGSERIAL NOT NULL,
    "customer_point_customer_id" BIGINT NOT NULL,
    "customer_points" INTEGER NOT NULL,
    "customer_point_type" VARCHAR(30) NOT NULL,
    "customer_point_reference_id" BIGINT,
    "customer_point_description" VARCHAR(255),
    "customer_point_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_Points_pkey" PRIMARY KEY ("customer_point_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customer_user_id_key" ON "Customer"("customer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customer_code_key" ON "Customer"("customer_code");

-- CreateIndex
CREATE INDEX "idx_customer_user_id" ON "Customer"("customer_user_id");

-- CreateIndex
CREATE INDEX "idx_customer_code" ON "Customer"("customer_code");

-- CreateIndex
CREATE INDEX "idx_address_customer_id" ON "Customer_Address"("customer_address_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_tiers_membership_tier_name_key" ON "Membership_tiers"("membership_tier_name");

-- CreateIndex
CREATE INDEX "idx_points_customer_id" ON "Customer_Points"("customer_point_customer_id");

-- CreateIndex
CREATE INDEX "idx_points_created_at" ON "Customer_Points"("customer_point_created_at");

-- AddForeignKey
ALTER TABLE "Customer_Address" ADD CONSTRAINT "Customer_Address_customer_address_customer_id_fkey" FOREIGN KEY ("customer_address_customer_id") REFERENCES "Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer_membership" ADD CONSTRAINT "Customer_membership_customer_membership_customer_id_fkey" FOREIGN KEY ("customer_membership_customer_id") REFERENCES "Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer_membership" ADD CONSTRAINT "Customer_membership_customer_membership_tier_id_fkey" FOREIGN KEY ("customer_membership_tier_id") REFERENCES "Membership_tiers"("membership_tier_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer_Points" ADD CONSTRAINT "Customer_Points_customer_point_customer_id_fkey" FOREIGN KEY ("customer_point_customer_id") REFERENCES "Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
