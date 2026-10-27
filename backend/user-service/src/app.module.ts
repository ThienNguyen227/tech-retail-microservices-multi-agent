import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

// CUSTOMER - SESSION
import { RegisterModule } from './customer_session/register/register.module';
import { ForgotPasswordModule } from './customer_session/forgot_password/forgot_password.module';
import { LoginModule } from './customer_session/login/login.module';
import { LogoutCustomerModule } from './customer_session/logout/logout.module';
import { RefreshAccessTokenCustomerModule } from './customer_session/refresh_access_token/refresh_access_token.module';
import { AccountInformationModule } from './customer_session/account_information/account_information.module';

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
import { UpdateUserModule } from './admin_session/update_user/update_user.module';
import { EmployeeModule } from './admin_session/employee/employee.module';

// AI SESSION
import { SearchUserModule } from './ai_session/search_user/search_user.module';

@Module({
  imports: [
    PrismaModule, 
    RedisModule,  
    
    // CUSTOMER SESSION
    RegisterModule, 
    ForgotPasswordModule, 
    LoginModule,
    LogoutCustomerModule,
    RefreshAccessTokenCustomerModule,
    AccountInformationModule,

    // ADMIN SESSION
    /// 1. AUTH
    LoginAdminModule,
    LogoutAdminModule,
    RefreshAccessTokenModule,
    ForgotPasswordAdminModule,

    /// 2. USER
    AdminProfileModule,
    UpdateAdminProfileModule,
    GetUserListModule,
    UpdateUserStatusModule,
    CreateEmloyeeModule,
    UpdateUserModule,

    /// 3. EMPLOYEE
    EmployeeModule,


    // AI SESSION
    SearchUserModule,
  ],
})
export class AppModule {}