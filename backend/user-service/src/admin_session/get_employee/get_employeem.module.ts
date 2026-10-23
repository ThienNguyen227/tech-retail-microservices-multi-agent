import { Module } from '@nestjs/common';
import { GetEmployeeController } from './get_employee.controller';
import { GetEmployeeService } from './get_employee.service';

@Module({
  imports: [],
  controllers: [GetEmployeeController],
  providers: [GetEmployeeService],
  exports: [],
})
export class GetEmployeeModule {}