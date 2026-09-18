-- CreateTable
CREATE TABLE "Inventory" (
    "inventory_id" BIGSERIAL NOT NULL,
    "inventory_branch_id" BIGINT NOT NULL,
    "inventory_sku" TEXT NOT NULL,
    "inventory_quantity" INTEGER NOT NULL DEFAULT 0,
    "inventory_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventory_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "Inventory_Transaction" (
    "inventory_transaction_id" BIGSERIAL NOT NULL,
    "inventory_transaction_inventory_id" BIGINT NOT NULL,
    "inventory_transaction_type" TEXT NOT NULL,
    "inventory_transaction_before" INTEGER NOT NULL,
    "inventory_transaction_after" INTEGER NOT NULL,
    "inventory_transaction_reference_id" TEXT,
    "inventory_transaction_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_Transaction_pkey" PRIMARY KEY ("inventory_transaction_id")
);

-- CreateIndex
CREATE INDEX "Inventory_inventory_sku_idx" ON "Inventory"("inventory_sku");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_inventory_branch_id_inventory_sku_key" ON "Inventory"("inventory_branch_id", "inventory_sku");

-- CreateIndex
CREATE INDEX "Inventory_Transaction_inventory_transaction_inventory_id_idx" ON "Inventory_Transaction"("inventory_transaction_inventory_id");

-- CreateIndex
CREATE INDEX "Inventory_Transaction_inventory_transaction_reference_id_idx" ON "Inventory_Transaction"("inventory_transaction_reference_id");

-- AddForeignKey
ALTER TABLE "Inventory_Transaction" ADD CONSTRAINT "Inventory_Transaction_inventory_transaction_inventory_id_fkey" FOREIGN KEY ("inventory_transaction_inventory_id") REFERENCES "Inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;
