-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('HOME_DELIVERY', 'STORE_PICKUP');

-- CreateTable
CREATE TABLE "Order" (
    "order_id" BIGSERIAL NOT NULL,
    "order_code" TEXT NOT NULL,
    "order_user_id" BIGINT NOT NULL,
    "order_fulfillment_type" "FulfillmentType" NOT NULL,
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

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "Order_Item" (
    "order_item_id" BIGSERIAL NOT NULL,
    "order_item_order_id" BIGINT NOT NULL,
    "order_item_sku" TEXT NOT NULL,
    "order_item_product_name" TEXT NOT NULL,
    "order_item_product_image" TEXT,
    "order_item_unit_price" DECIMAL(65,30) NOT NULL,
    "order_item_quantity" INTEGER NOT NULL,
    "order_item_subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Order_Item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_order_code_key" ON "Order"("order_code");

-- CreateIndex
CREATE INDEX "Order_order_user_id_idx" ON "Order"("order_user_id");

-- CreateIndex
CREATE INDEX "Order_Item_order_item_order_id_idx" ON "Order_Item"("order_item_order_id");

-- CreateIndex
CREATE INDEX "Order_Item_order_item_sku_idx" ON "Order_Item"("order_item_sku");

-- AddForeignKey
ALTER TABLE "Order_Item" ADD CONSTRAINT "Order_Item_order_item_order_id_fkey" FOREIGN KEY ("order_item_order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
