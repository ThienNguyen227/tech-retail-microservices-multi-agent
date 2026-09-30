CREATE UNIQUE INDEX unique_pending_transaction_per_payment
ON payment_transaction (payment_id)
WHERE payment_transaction_status_id = 1;