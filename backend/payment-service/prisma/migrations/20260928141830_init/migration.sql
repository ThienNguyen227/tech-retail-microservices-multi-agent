-- CreateTable
CREATE TABLE "payment" (
    "payment_id" SERIAL NOT NULL,
    "payment_order_id" INTEGER NOT NULL,
    "payment_order_code" TEXT NOT NULL,
    "payment_user_id" INTEGER NOT NULL,
    "payment_amount" DECIMAL(65,30) NOT NULL,
    "payment_currency" TEXT NOT NULL DEFAULT 'VND',
    "payment_payment_method_id" INTEGER NOT NULL,
    "payment_status_id" INTEGER NOT NULL,
    "payment_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "payment_transaction" (
    "payment_transaction_id" SERIAL NOT NULL,
    "payment_transaction_payment_id" INTEGER NOT NULL,
    "payment_transaction_transaction_code" TEXT NOT NULL,
    "payment_transaction_gateway_transaction_id" TEXT,
    "payment_transaction_amount" DECIMAL(65,30) NOT NULL,
    "payment_transaction_currency" TEXT NOT NULL DEFAULT 'VND',
    "payment_transaction_status_id" INTEGER NOT NULL,
    "payment_transaction_gateway_response_code" TEXT,
    "payment_transaction_gateway_message" TEXT,
    "payment_transaction_gateway_response" JSONB,
    "payment_transaction_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_transaction_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transaction_pkey" PRIMARY KEY ("payment_transaction_id")
);

-- CreateTable
CREATE TABLE "payment_status" (
    "payment_status_id" SERIAL NOT NULL,
    "payment_status_code" TEXT NOT NULL,
    "payment_status_name" TEXT NOT NULL,

    CONSTRAINT "payment_status_pkey" PRIMARY KEY ("payment_status_id")
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
CREATE INDEX "payment_payment_order_id_idx" ON "payment"("payment_order_id");

-- CreateIndex
CREATE INDEX "payment_payment_order_code_idx" ON "payment"("payment_order_code");

-- CreateIndex
CREATE INDEX "payment_payment_user_id_idx" ON "payment"("payment_user_id");

-- CreateIndex
CREATE INDEX "payment_payment_payment_method_id_idx" ON "payment"("payment_payment_method_id");

-- CreateIndex
CREATE INDEX "payment_payment_status_id_idx" ON "payment"("payment_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_payment_transaction_transaction_code_key" ON "payment_transaction"("payment_transaction_transaction_code");

-- CreateIndex
CREATE INDEX "payment_transaction_payment_transaction_payment_id_idx" ON "payment_transaction"("payment_transaction_payment_id");

-- CreateIndex
CREATE INDEX "payment_transaction_payment_transaction_gateway_transaction_idx" ON "payment_transaction"("payment_transaction_gateway_transaction_id");

-- CreateIndex
CREATE INDEX "payment_transaction_payment_transaction_status_id_idx" ON "payment_transaction"("payment_transaction_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_status_payment_status_code_key" ON "payment_status"("payment_status_code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_payment_method_code_key" ON "payment_method"("payment_method_code");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_payment_payment_method_id_fkey" FOREIGN KEY ("payment_payment_method_id") REFERENCES "payment_method"("payment_method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_payment_status_id_fkey" FOREIGN KEY ("payment_status_id") REFERENCES "payment_status"("payment_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_payment_transaction_payment_id_fkey" FOREIGN KEY ("payment_transaction_payment_id") REFERENCES "payment"("payment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_payment_transaction_status_id_fkey" FOREIGN KEY ("payment_transaction_status_id") REFERENCES "payment_status"("payment_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;
