import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './products/product.module';



// AI_SESSION
import { SearchProductModule } from './ai_session/search_product/search_product.module';

import { GetPhoneDetailModule } from './ai_session/get_product_detail/get_phone_detail/get_phone_detail.module';
import { GetLaptopDetailModule } from './ai_session/get_product_detail/get_laptop_detail/get_laptop_detail.module';
import { GetTabletDetailModule } from './ai_session/get_product_detail/get_tablet_detail/get_tablet_detail.module';

import { ComparePhoneModule } from './ai_session/compare_product/compare_phone/compare_phone.module';
import { CompareLaptopModule } from './ai_session/compare_product/compare_laptop/compare_laptop.module';
import { CompareTabletModule } from './ai_session/compare_product/compare_tablet/compare_tablet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('DATABASE_URL') ||
          'mongodb://root:password@localhost:27017/product_service?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    ProductModule,

    // AI_SESSION
    SearchProductModule,

    /// 2. GET PRODUCT DETAIL
    GetPhoneDetailModule,
    GetLaptopDetailModule,
    GetTabletDetailModule,

    /// 3. COMPARE PRODUCT
    ComparePhoneModule,
    CompareLaptopModule,
    CompareTabletModule,


  ],
})
export class AppModule {}