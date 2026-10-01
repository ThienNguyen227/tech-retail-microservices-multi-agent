import { Controller, Get } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller('rabbitmq')
export class RabbitMQController {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // @Get('test')
  // async test() {
  //   await this.rabbitMQService.publish(
  //     'payment.succeeded',
  //     {
  //       paymentId: 1,
  //       orderId: 123,
  //       amount: 100000,
  //     },
  //   );

  //   return {
  //     message: 'Event published',
  //   };
  // }
}