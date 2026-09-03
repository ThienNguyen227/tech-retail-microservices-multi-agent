CREATE UNIQUE INDEX unique_pending_registration_otp_email
ON "Registration_Otps" ("otp_user_email")
WHERE "otp_status" = 'PENDING';