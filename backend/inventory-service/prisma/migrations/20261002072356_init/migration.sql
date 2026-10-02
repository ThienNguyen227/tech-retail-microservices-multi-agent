-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" SERIAL NOT NULL,
    "inventory_branch_id" INTEGER NOT NULL,
    "inventory_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventory_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "inventory_sku" (
    "inventory_sku_id" SERIAL NOT NULL,
    "inventory_sku_code" TEXT NOT NULL,

    CONSTRAINT "inventory_sku_pkey" PRIMARY KEY ("inventory_sku_id")
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "inventory_id" INTEGER NOT NULL,
    "inventory_sku_id" INTEGER NOT NULL,
    "inventory_stock_quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("inventory_id","inventory_sku_id")
);

-- CreateTable
CREATE TABLE "inventory_sku_serial" (
    "inventory_sku_serial_id" SERIAL NOT NULL,
    "inventory_sku_serial_number" TEXT NOT NULL,
    "inventory_sku_serial_status_id" INTEGER NOT NULL,
    "inventory_sku_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,

    CONSTRAINT "inventory_sku_serial_pkey" PRIMARY KEY ("inventory_sku_serial_id")
);

-- CreateTable
CREATE TABLE "inventory_sku_serial_status" (
    "inventory_sku_serial_status_id" SERIAL NOT NULL,
    "inventory_sku_serial_status_code" TEXT NOT NULL,
    "inventory_sku_serial_status_name" TEXT NOT NULL,

    CONSTRAINT "inventory_sku_serial_status_pkey" PRIMARY KEY ("inventory_sku_serial_status_id")
);

-- CreateTable
CREATE TABLE "inventory_transaction" (
    "inventory_transaction_id" SERIAL NOT NULL,
    "inventory_transaction_from" TEXT,
    "inventory_transaction_to" TEXT,
    "inventory_transaction_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventory_transaction_updated_at" TIMESTAMP(3) NOT NULL,
    "inventory_transaction_type_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,

    CONSTRAINT "inventory_transaction_pkey" PRIMARY KEY ("inventory_transaction_id")
);

-- CreateTable
CREATE TABLE "inventory_transaction_type" (
    "inventory_transaction_type_id" SERIAL NOT NULL,
    "inventory_transaction_type_code" TEXT NOT NULL,
    "inventory_transaction_type_name" TEXT NOT NULL,

    CONSTRAINT "inventory_transaction_type_pkey" PRIMARY KEY ("inventory_transaction_type_id")
);

-- CreateTable
CREATE TABLE "inventory_transaction_item" (
    "inventory_sku_id" INTEGER NOT NULL,
    "inventory_transaction_id" INTEGER NOT NULL,
    "inventory_transaction_item_quantity" INTEGER NOT NULL,
    "inventory_transaction_item_before" INTEGER NOT NULL,
    "inventory_transaction_item_after" INTEGER NOT NULL,

    CONSTRAINT "inventory_transaction_item_pkey" PRIMARY KEY ("inventory_sku_id","inventory_transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_inventory_branch_id_key" ON "inventory"("inventory_branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sku_inventory_sku_code_key" ON "inventory_sku"("inventory_sku_code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sku_serial_inventory_sku_serial_number_key" ON "inventory_sku_serial"("inventory_sku_serial_number");

-- CreateIndex
CREATE INDEX "inventory_sku_serial_inventory_sku_id_idx" ON "inventory_sku_serial"("inventory_sku_id");

-- CreateIndex
CREATE INDEX "inventory_sku_serial_inventory_id_idx" ON "inventory_sku_serial"("inventory_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sku_serial_status_inventory_sku_serial_status_cod_key" ON "inventory_sku_serial_status"("inventory_sku_serial_status_code");

-- CreateIndex
CREATE INDEX "inventory_transaction_inventory_transaction_type_id_idx" ON "inventory_transaction"("inventory_transaction_type_id");

-- CreateIndex
CREATE INDEX "inventory_transaction_inventory_id_idx" ON "inventory_transaction"("inventory_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transaction_type_inventory_transaction_type_code_key" ON "inventory_transaction_type"("inventory_transaction_type_code");

-- CreateIndex
CREATE INDEX "inventory_transaction_item_inventory_transaction_id_idx" ON "inventory_transaction_item"("inventory_transaction_id");

-- CreateIndex
CREATE INDEX "inventory_transaction_item_inventory_sku_id_idx" ON "inventory_transaction_item"("inventory_sku_id");

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_inventory_sku_id_fkey" FOREIGN KEY ("inventory_sku_id") REFERENCES "inventory_sku"("inventory_sku_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sku_serial" ADD CONSTRAINT "inventory_sku_serial_inventory_sku_serial_status_id_fkey" FOREIGN KEY ("inventory_sku_serial_status_id") REFERENCES "inventory_sku_serial_status"("inventory_sku_serial_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sku_serial" ADD CONSTRAINT "inventory_sku_serial_inventory_sku_id_fkey" FOREIGN KEY ("inventory_sku_id") REFERENCES "inventory_sku"("inventory_sku_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sku_serial" ADD CONSTRAINT "inventory_sku_serial_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_inventory_transaction_type_id_fkey" FOREIGN KEY ("inventory_transaction_type_id") REFERENCES "inventory_transaction_type"("inventory_transaction_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction_item" ADD CONSTRAINT "inventory_transaction_item_inventory_sku_id_fkey" FOREIGN KEY ("inventory_sku_id") REFERENCES "inventory_sku"("inventory_sku_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction_item" ADD CONSTRAINT "inventory_transaction_item_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "inventory_transaction"("inventory_transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;
