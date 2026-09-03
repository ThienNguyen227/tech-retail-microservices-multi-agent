CREATE UNIQUE INDEX unique_pending_forgot_password_otp_user
ON "Otps" ("otp_user_id")
WHERE "otp_status" = 'PENDING'
  AND "otp_purpose" = 'FORGOT_PASSWORD';