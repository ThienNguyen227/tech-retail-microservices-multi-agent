import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/user.module';

// Refactor
import { RegisterModule } from './customer_session/register/register.module';
import { ForgotPasswordModule } from './customer_session/forgot_password/forgot_password.module';
import { LoginModule } from './customer_session/login/login.module';

// ADMIN - SESSION
import { LoginAdminModule } from './admin_session/login_admin/login_admin.module';
import { LogoutAdminModule } from './admin_session/logout_admin/logout_admin.module';
import { RefreshAccessTokenModule } from './admin_session/refresh_access_token/refresh_access_token.module';
import { ForgotPasswordAdminModule } from './admin_session/forgot_password/forgot_password.module';
import { AdminProfileModule } from './admin_session/profile/profile.module';
import { UpdateAdminProfileModule } from './admin_session/update_profile/update_profile.module';
import { GetUserListModule } from './admin_session/get_user_list/get_user_list.module';
import { UpdateUserStatusModule } from './admin_session/update_user_status/update_user_status.module';
import { CreateEmloyeeModule } from './admin_session/create_employee/create_employee.module';

@Module({
  imports: [
    PrismaModule, 
    RedisModule, 
    UsersModule, 
    
    // CUSTOMER SESSION
    RegisterModule, 
    ForgotPasswordModule, 
    LoginModule,

    // ADMIN SESSION
    LoginAdminModule,
    LogoutAdminModule,
    RefreshAccessTokenModule,
    ForgotPasswordAdminModule,
    AdminProfileModule,
    UpdateAdminProfileModule,
    GetUserListModule,
    UpdateUserStatusModule,
    CreateEmloyeeModule,
  ],
})
export class AppModule {}