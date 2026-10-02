// import {
//   Injectable,
//   OnModuleDestroy,
//   OnModuleInit,
// } from '@nestjs/common';

// import * as amqp from 'amqplib';

// import { UpdateOrderStatusService } from '../orders/update_order_status/update_order_status.service';

// @Injectable()
// export class RabbitMQService
//   implements OnModuleInit, OnModuleDestroy
// {
//   private connection: amqp.ChannelModel;
//   private channel: amqp.Channel;

//   constructor(
//     private readonly updateOrderStatusService: UpdateOrderStatusService,
//   ) {}

//   async onModuleInit() {
//     try {
//       // 1. Kết nối RabbitMQ
//       this.connection = await amqp.connect(
//         'amqp://admin:password@localhost:5672',
//       );

//       // 2. Tạo channel
//       this.channel = await this.connection.createChannel();


//       // Tạo Exchange (Order-Inventory)
//       await this.channel.assertExchange(
//         'order.events',
//         'direct',
//         {
//           durable: true,
//         },
//       );

//       // Tạo Queue (Payment-Order)
//       await this.channel.assertQueue(
//         'payment.order.queue',
//         {
//           durable: true,
//         },
//       );

//       // Binding: payment.succeeded (Payment-Order)
//       await this.channel.bindQueue(
//         'payment.order.queue',
//         'payment.events',
//         'payment.succeeded',
//       );

//       // Binding: payment.failed (Payment-Order)
//       await this.channel.bindQueue(
//         'payment.order.queue',
//         'payment.events',
//         'payment.failed',
//       );

//       console.log('RabbitMQ connected');
//       console.log('Queue "payment.order.queue" is ready');

//       // 6. Bắt đầu Consumer
//       await this.consume();
//     } catch (error) {
//       console.error('RabbitMQ setup failed:', error);
//     }
//   }

//   async publish(routingKey: string, message: any) 
//   {
//     this.channel.publish('order.events', routingKey, Buffer.from(JSON.stringify(message)));

//     console.log('Published:', {routingKey, message});
//   }

//   async consume() {
//     await this.channel.consume(
//       'payment.order.queue',
//       async (message) => {
//         if (!message) return;

//         try {
//           const routingKey = message.fields.routingKey;

//           const data = JSON.parse(
//             message.content.toString(),
//           );

//           console.log('Received event:', {
//             routingKey,
//             data,
//           });

//           // ======================================================
//           // Payment thành công
//           // ======================================================

//           if (routingKey === 'payment.succeeded') {
//             await this.updateOrderStatusService.markAsPaid(
//               Number(data.orderId),
//             );

//             console.log(
//               `Order ${data.orderId} đã được cập nhật thành PAID`,
//             );
//           }

//           // ======================================================
//           // Payment thất bại
//           // ======================================================

//           if (routingKey === 'payment.failed') {
//             console.log(
//               `Payment failed for order ${data.orderId}`,
//             );

//             // Sau này có thể xử lý Order khi payment failed
//           }

//           // Message xử lý thành công
//           this.channel.ack(message);
//         } catch (error) {
//           console.error(
//             'Error processing RabbitMQ message:',
//             error,
//           );

//           // Không ack nếu xử lý thất bại
//           // RabbitMQ có thể requeue message
//           this.channel.nack(
//             message,
//             false,
//             true,
//           );
//         }
//       },
//     );

//     console.log('Consumer is listening...');
//   }

//   async onModuleDestroy() {
//     await this.channel?.close();
//     await this.connection?.close();
//   }
// }


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
  constructor(
    private readonly updateOrderStatusService: UpdateOrderStatusService,
  ) {}

  // ======================================================
  // RABBITMQ
  // ======================================================

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  // ======================================================
  // RECONNECT STATE
  // ======================================================

  private reconnecting = false;

  private reconnectTimer?: NodeJS.Timeout;

  private isDestroyed = false;

  // ======================================================
  // CONFIG
  // ======================================================

  private readonly rabbitmqUrl =
    'amqp://admin:password@localhost:5672';

  // Order -> Inventory
  private readonly orderExchange =
    'order.events';

  // Payment -> Order
  private readonly paymentExchange =
    'payment.events';

  private readonly paymentQueue =
    'payment.order.queue';

  private readonly reconnectDelay = 5000;

  // ======================================================
  // MODULE INIT
  // ======================================================

  async onModuleInit() {
    await this.connect();
  }

  // ======================================================
  // CONNECT
  // ======================================================

  private async connect(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    // Đã connected
    if (this.connection && this.channel) {
      return;
    }

    // Đang reconnect
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    try {
      console.log(
        'Connecting RabbitMQ...',
      );

      // ======================================================
      // CONNECT
      // ======================================================

      const connection =
        await amqp.connect(
          this.rabbitmqUrl,
        );

      this.connection = connection;

      console.log(
        'RabbitMQ connected',
      );

      // ======================================================
      // CONNECTION ERROR
      // ======================================================

      connection.on(
        'error',
        (error) => {
          console.error(
            'RabbitMQ connection error:',
            error instanceof Error
              ? error.message
              : error,
          );
        },
      );

      // ======================================================
      // CONNECTION CLOSED
      // ======================================================

      connection.on(
        'close',
        () => {
          console.error(
            'RabbitMQ connection closed',
          );

          this.channel = undefined;
          this.connection = undefined;

          if (!this.isDestroyed) {
            this.scheduleReconnect();
          }
        },
      );

      // ======================================================
      // CREATE CHANNEL
      // ======================================================

      const channel =
        await connection.createChannel();

      this.channel = channel;

      console.log(
        'RabbitMQ channel created',
      );

      // ======================================================
      // ORDER EXCHANGE
      // ======================================================

      await channel.assertExchange(
        this.orderExchange,
        'direct',
        {
          durable: true,
        },
      );

      console.log(
        `Exchange "${this.orderExchange}" ready`,
      );

      // ======================================================
      // PAYMENT EXCHANGE
      // ======================================================

      await channel.assertExchange(
        this.paymentExchange,
        'direct',
        {
          durable: true,
        },
      );

      console.log(
        `Exchange "${this.paymentExchange}" ready`,
      );

      // ======================================================
      // PAYMENT -> ORDER QUEUE
      // ======================================================

      await channel.assertQueue(
        this.paymentQueue,
        {
          durable: true,
        },
      );

      console.log(
        `Queue "${this.paymentQueue}" ready`,
      );

      // ======================================================
      // BIND PAYMENT.SUCCEEDED
      // ======================================================

      await channel.bindQueue(
        this.paymentQueue,
        this.paymentExchange,
        'payment.succeeded',
      );

      // ======================================================
      // BIND PAYMENT.FAILED
      // ======================================================

      await channel.bindQueue(
        this.paymentQueue,
        this.paymentExchange,
        'payment.failed',
      );

      console.log(
        'Payment bindings ready',
      );

      // ======================================================
      // START CONSUMER
      // ======================================================

      await this.consume();

      console.log(
        'Consumer ready',
      );

      // ======================================================
      // CONNECT SUCCESS
      // ======================================================

      this.reconnecting = false;

      console.log(
        'RabbitMQ setup completed',
      );

    } catch (error) {
      console.error(
        'RabbitMQ connection failed:',
        error instanceof Error
          ? error.message
          : error,
      );

      this.channel = undefined;
      this.connection = undefined;

      this.reconnecting = false;

      if (!this.isDestroyed) {
        this.scheduleReconnect();
      }
    }
  }

  // ======================================================
  // RECONNECT
  // ======================================================

  private scheduleReconnect(): void {
    if (this.isDestroyed) {
      return;
    }

    // Đã có timer reconnect
    if (this.reconnectTimer) {
      return;
    }

    console.log(
      `RabbitMQ will reconnect in ${
        this.reconnectDelay / 1000
      } seconds...`,
    );

    this.reconnectTimer =
      setTimeout(async () => {
        this.reconnectTimer = undefined;

        await this.connect();
      }, this.reconnectDelay);
  }

  // ======================================================
  // PUBLISH
  // ======================================================

  async publish(
    routingKey: string,
    message: any,
  ) {
    if (!this.channel) {
      throw new Error(
        'RabbitMQ channel is not available',
      );
    }

    this.channel.publish(
      this.orderExchange,
      routingKey,
      Buffer.from(
        JSON.stringify(message),
      ),
    );

    console.log(
      'Published:',
      {
        routingKey,
        message,
      },
    );
  }

  // ======================================================
  // CONSUMER
  // ======================================================

  private async consume(): Promise<void> {
    if (!this.channel) {
      console.error(
        'Cannot start consumer: channel unavailable',
      );

      return;
    }

    // Giữ reference của channel hiện tại.
    // Khi reconnect sẽ tạo channel mới và
    // consume() được gọi lại.
    const channel = this.channel;

    await channel.consume(
      this.paymentQueue,
      async (message) => {
        if (!message) {
          return;
        }

        try {
          // ======================================================
          // MESSAGE
          // ======================================================

          const routingKey =
            message.fields.routingKey;

          const data = JSON.parse(
            message.content.toString(),
          );

          console.log(
            'Received event:',
            {
              routingKey,
              data,
            },
          );

          // ======================================================
          // PAYMENT SUCCESS
          // ======================================================

          if (
            routingKey ===
            'payment.succeeded'
          ) {
            await this.updateOrderStatusService.markAsPaid(
              Number(data.orderId),
            );

            console.log(
              `Order ${data.orderId} đã được cập nhật thành PAID`,
            );
          }

          // ======================================================
          // PAYMENT FAILED
          // ======================================================

          if (
            routingKey ===
            'payment.failed'
          ) {
            console.log(
              `Payment failed for order ${data.orderId}`,
            );

            // Sau này có thể xử lý Order
            // khi payment failed.
          }

          // ======================================================
          // ACK
          // ======================================================

          channel.ack(message);

        } catch (error) {
          console.error(
            'Error processing RabbitMQ message:',
            error instanceof Error
              ? error.message
              : error,
          );

          // ======================================================
          // NACK + REQUEUE
          // ======================================================

          try {
            channel.nack(
              message,
              false,
              true,
            );
          } catch (ackError) {
            console.error(
              'Failed to nack RabbitMQ message:',
              ackError instanceof Error
                ? ackError.message
                : ackError,
            );
          }
        }
      },
    );

    console.log(
      'Consumer is listening...',
    );
  }

  // ======================================================
  // MODULE DESTROY
  // ======================================================

  async onModuleDestroy() {
    this.isDestroyed = true;

    // Không reconnect nữa
    if (this.reconnectTimer) {
      clearTimeout(
        this.reconnectTimer,
      );

      this.reconnectTimer = undefined;
    }

    // Close channel
    try {
      await this.channel?.close();
    } catch (error) {
      console.error(
        'Error closing RabbitMQ channel:',
        error instanceof Error
          ? error.message
          : error,
      );
    }

    // Close connection
    try {
      await this.connection?.close();
    } catch (error) {
      console.error(
        'Error closing RabbitMQ connection:',
        error instanceof Error
          ? error.message
          : error,
      );
    }

    this.channel = undefined;
    this.connection = undefined;
  }
}
