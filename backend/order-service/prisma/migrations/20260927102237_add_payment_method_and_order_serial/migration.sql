/*
  Warnings:

  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order_Item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order_Item" DROP CONSTRAINT "Order_Item_order_item_order_id_fkey";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "Order_Item";

-- CreateTable
CREATE TABLE "order" (
    "order_id" BIGSERIAL NOT NULL,
    "order_code" TEXT NOT NULL,
    "order_user_id" BIGINT NOT NULL,
    "order_fulfillment_type" "FulfillmentType" NOT NULL,
    "order_payment_method_id" INTEGER NOT NULL,
    "order_recipient_name" TEXT NOT NULL,
    "order_recipient_phone" TEXT NOT NULL,
    "order_address_line" TEXT NOT NULL,
    "order_ward" TEXT NOT NULL,
    "order_province" TEXT NOT NULL,
    "order_subtotal" DECIMAL(65,30) NOT NULL,
    "order_shipping_fee" DECIMAL(65,30) NOT NULL,
    "order_discount_amount" DECIMAL(65,30) NOT NULL,
    "order_total_amount" DECIMAL(65,30) NOT NULL,
    "order_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "order_item_id" BIGSERIAL NOT NULL,
    "order_item_order_id" BIGINT NOT NULL,
    "order_item_sku" TEXT NOT NULL,
    "order_item_serial_number" TEXT,
    "order_item_product_name" TEXT NOT NULL,
    "order_item_product_image" TEXT NOT NULL,
    "order_item_unit_price" DECIMAL(65,30) NOT NULL,
    "order_item_quantity" INTEGER NOT NULL,
    "order_item_subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "payment_method_id" SERIAL NOT NULL,
    "payment_method_code" TEXT NOT NULL,
    "payment_method_name" TEXT NOT NULL,
    "payment_method_status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("payment_method_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_order_code_key" ON "order"("order_code");

-- CreateIndex
CREATE INDEX "order_order_user_id_idx" ON "order"("order_user_id");

-- CreateIndex
CREATE INDEX "order_item_order_item_order_id_idx" ON "order_item"("order_item_order_id");

-- CreateIndex
CREATE INDEX "order_item_order_item_sku_idx" ON "order_item"("order_item_sku");

-- CreateIndex
CREATE INDEX "order_item_order_item_serial_number_idx" ON "order_item"("order_item_serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_payment_method_code_key" ON "payment_method"("payment_method_code");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_order_payment_method_id_fkey" FOREIGN KEY ("order_payment_method_id") REFERENCES "payment_method"("payment_method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_item_order_id_fkey" FOREIGN KEY ("order_item_order_id") REFERENCES "order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
