import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './products/product.module';



// AI_SESSION
import { SearchProductModule } from './ai_session/search_product/search_product.module';
import { GetProductDetailModule } from './ai_session/get_product_detail/get_product_detail.module';

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
    GetProductDetailModule,


  ],
})
export class AppModule {}