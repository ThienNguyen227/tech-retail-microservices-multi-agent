import { Module } from '@nestjs/common';

import { CalculateFinalPriceController } from './calculate_final_price.controller';
import { CalculateFinalPriceService } from './calculate_final_price.service';

@Module({
  imports: [],
  controllers: [CalculateFinalPriceController],
  providers: [CalculateFinalPriceService],
  exports: [CalculateFinalPriceService],
})
export class CalculateFinalPriceModule {}