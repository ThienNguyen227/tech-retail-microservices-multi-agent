import { Module } from '@nestjs/common';
import { CreateEmloyeeController } from './create_employee.controller';
import { CreateEmloyeeService } from './create_employee.service';

@Module({
  imports: [],
  controllers: [CreateEmloyeeController],
  providers: [CreateEmloyeeService],
  exports: [],
})
export class CreateEmloyeeModule {}