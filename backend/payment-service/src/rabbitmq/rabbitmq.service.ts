import {Injectable, OnModuleDestroy, OnModuleInit} from '@nestjs/common';

import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy 
{ 
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;

  async onModuleInit() {
    // 1. Kết nối RabbitMQ
    this.connection = await amqp.connect('amqp://admin:password@localhost:5672');

    // 2. Tạo channel
    this.channel = await this.connection.createChannel();

    // 3. Tạo Exchange
    await this.channel.assertExchange(
      'payment.events',
      'direct',
      {
        durable: true,
      },
    );

    console.log('RabbitMQ connected');
    console.log('Exchange "payment.events" is ready');
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(routingKey: string, message: any) 
  {
    this.channel.publish('payment.events', routingKey, Buffer.from(JSON.stringify(message)));

    console.log('Published:', {routingKey, message});
  }
}

