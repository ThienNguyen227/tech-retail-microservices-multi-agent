/*
  Warnings:

  - A unique constraint covering the columns `[payment_order_id]` on the table `payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payment_payment_order_id_key" ON "payment"("payment_order_id");
