import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

import { UpdateOrderStatusService } from '../orders/update_order_status/update_order_status.service';

@Injectable()
export class RabbitMQService
  implements OnModuleInit, OnModuleDestroy
{
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;

  constructor(
    private readonly updateOrderStatusService: UpdateOrderStatusService,
  ) {}

  async onModuleInit() {
    // 1. Kết nối RabbitMQ
    this.connection = await amqp.connect(
      'amqp://admin:password@localhost:5672',
    );

    // 2. Tạo channel
    this.channel = await this.connection.createChannel();

    // 3. Tạo Queue
    await this.channel.assertQueue(
      'payment.order.queue',
      {
        durable: true,
      },
    );

    // 4. Binding: payment.succeeded
    await this.channel.bindQueue(
      'payment.order.queue',
      'payment.events',
      'payment.succeeded',
    );

    // 5. Binding: payment.failed
    await this.channel.bindQueue(
      'payment.order.queue',
      'payment.events',
      'payment.failed',
    );

    console.log('RabbitMQ connected');
    console.log('Queue "payment.order.queue" is ready');

    // 6. Bắt đầu Consumer
    await this.consume();
  }

  async consume() {
    await this.channel.consume(
      'payment.order.queue',
      async (message) => {
        if (!message) return;

        try {
          const routingKey = message.fields.routingKey;

          const data = JSON.parse(
            message.content.toString(),
          );

          console.log('Received event:', {
            routingKey,
            data,
          });

          // ======================================================
          // Payment thành công
          // ======================================================

          if (routingKey === 'payment.succeeded') {
            await this.updateOrderStatusService.markAsPaid(
              Number(data.orderId),
            );

            console.log(
              `Order ${data.orderId} đã được cập nhật thành PAID`,
            );
          }

          // ======================================================
          // Payment thất bại
          // ======================================================

          if (routingKey === 'payment.failed') {
            console.log(
              `Payment failed for order ${data.orderId}`,
            );

            // Sau này có thể xử lý Order khi payment failed
          }

          // Message xử lý thành công
          this.channel.ack(message);
        } catch (error) {
          console.error(
            'Error processing RabbitMQ message:',
            error,
          );

          // Không ack nếu xử lý thất bại
          // RabbitMQ có thể requeue message
          this.channel.nack(
            message,
            false,
            true,
          );
        }
      },
    );

    console.log('Consumer is listening...');
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

