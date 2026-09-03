-- CreateTable
CREATE TABLE "Users" (
    "user_id" BIGSERIAL NOT NULL,
    "user_name" VARCHAR(50) NOT NULL,
    "user_phone" VARCHAR(20) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "user_password_hash" VARCHAR(255) NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "user_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Registration_Otps" (
    "otp_id" BIGSERIAL NOT NULL,
    "otp_user_email" VARCHAR(255) NOT NULL,
    "otp_code_hash" VARCHAR(255) NOT NULL,
    "otp_attempts" SMALLINT NOT NULL DEFAULT 0,
    "otp_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "otp_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otp_expires_at" TIMESTAMP(3) NOT NULL,
    "otp_verified_at" TIMESTAMP(3),

    CONSTRAINT "Registration_Otps_pkey" PRIMARY KEY ("otp_id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "session_id" VARCHAR(36) NOT NULL,
    "session_user_id" BIGINT NOT NULL,
    "session_refresh_token_hash" VARCHAR(255) NOT NULL,
    "session_device_info" VARCHAR(255),
    "session_ip_address" VARCHAR(45),
    "session_expires_at" TIMESTAMP(3) NOT NULL,
    "session_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_revoked_at" TIMESTAMP(3),

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "Otps" (
    "otp_id" BIGSERIAL NOT NULL,
    "otp_user_id" BIGINT NOT NULL,
    "otp_code_hash" VARCHAR(255) NOT NULL,
    "otp_purpose" VARCHAR(30) NOT NULL DEFAULT 'FORGOT_PASSWORD',
    "otp_attempts" SMALLINT NOT NULL DEFAULT 0,
    "otp_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "otp_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otp_expires_at" TIMESTAMP(3) NOT NULL,
    "otp_verified_at" TIMESTAMP(3),

    CONSTRAINT "Otps_pkey" PRIMARY KEY ("otp_id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "role_description" VARCHAR(255),
    "role_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "permission_id" BIGSERIAL NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,
    "permission_resource" VARCHAR(50) NOT NULL,
    "permission_action" VARCHAR(50) NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "User_Roles" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_Roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "Role_Permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_Permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_user_phone_key" ON "Users"("user_phone");

-- CreateIndex
CREATE UNIQUE INDEX "Users_user_email_key" ON "Users"("user_email");

-- CreateIndex
CREATE INDEX "idx_registration_otp_email" ON "Registration_Otps"("otp_user_email");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "Sessions"("session_user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expires_at" ON "Sessions"("session_expires_at");

-- CreateIndex
CREATE INDEX "idx_otps_user_status" ON "Otps"("otp_user_id", "otp_status");

-- CreateIndex
CREATE INDEX "idx_otps_expires_at" ON "Otps"("otp_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_role_name_key" ON "Roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_permission_name_key" ON "Permissions"("permission_name");

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_session_user_id_fkey" FOREIGN KEY ("session_user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otps" ADD CONSTRAINT "Otps_otp_user_id_fkey" FOREIGN KEY ("otp_user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Roles" ADD CONSTRAINT "User_Roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Roles" ADD CONSTRAINT "User_Roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role_Permissions" ADD CONSTRAINT "Role_Permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role_Permissions" ADD CONSTRAINT "Role_Permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;
