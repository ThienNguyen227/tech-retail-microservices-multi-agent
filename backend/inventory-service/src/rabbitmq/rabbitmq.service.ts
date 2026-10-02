// // import {
// //   Injectable,
// //   OnModuleDestroy,
// //   OnModuleInit,
// // } from '@nestjs/common';

// // import * as amqp from 'amqplib';

// // import { RestoreService } from '../inventories/restore/restore.service';

// // @Injectable()
// // export class RabbitMQService
// //   implements OnModuleInit, OnModuleDestroy
// // {
// //   constructor(
// //     private readonly restoreService: RestoreService,
// //   ) {}

// //   private connection: amqp.ChannelModel;
// //   private channel: amqp.Channel;

// //   // async onModuleInit() {
// //   //   try {
// //   //     // 1. Kết nối RabbitMQ
// //   //     this.connection = await amqp.connect(
// //   //       'amqp://admin:password@localhost:5672',
// //   //     );

// //   //     // 2. Tạo channel
// //   //     this.channel = await this.connection.createChannel();

// //   //     // Tạo Queue (Order-Inventory)
// //   //     await this.channel.assertQueue(
// //   //       'order.inventory.queue',
// //   //       {
// //   //         durable: true,
// //   //       },
// //   //     );

// //   //     // Binding: order.cancelled (Order-Inventory)
// //   //     await this.channel.bindQueue(
// //   //       'order.inventory.queue',
// //   //       'order.events',
// //   //       'order.cancelled',
// //   //     );


// //   //     console.log('RabbitMQ connected');
// //   //     console.log('Queue "order.inventory.queue" is ready');

// //   //     // 6. Bắt đầu Consumer
// //   //     await this.consume();
// //   //   } catch (error) {
// //   //     console.error(
// //   //       'RabbitMQ is unavailable. Order-Service will continue without RabbitMQ.',
// //   //     );
// //   //   }
// //   // }

// //   async onModuleInit() {
// //     try {
// //       console.log('1. Connecting RabbitMQ...');

// //       this.connection = await amqp.connect(
// //         'amqp://admin:password@localhost:5672',
// //       );

// //       console.log('2. RabbitMQ connected');

// //       this.channel = await this.connection.createChannel();

// //       console.log('3. Channel created');

// //       await this.channel.assertExchange(
// //         'order.events',
// //         'direct',
// //         {
// //           durable: true,
// //         },
// //       );

// //       console.log('4. Exchange ready');

// //       await this.channel.assertQueue(
// //         'order.inventory.queue',
// //         {
// //           durable: true,
// //         },
// //       );

// //       console.log('5. Queue ready');

// //       await this.channel.bindQueue(
// //         'order.inventory.queue',
// //         'order.events',
// //         'order.cancelled',
// //       );

// //       console.log('6. Binding ready');

// //       await this.consume();

// //       console.log('7. Consumer ready');

// //     } catch (error) {
// //       console.error('INVENTORY RABBITMQ ERROR:', error);
// //     }
// //   }

// //   async consume() {
// //     await this.channel.consume(
// //       'order.inventory.queue',
// //       async (message) => {
// //         if (!message) return;

// //         try {
// //           const routingKey = message.fields.routingKey;

// //           const data = JSON.parse(
// //             message.content.toString(),
// //           );

// //           console.log('Received event:', {
// //             routingKey,
// //             data,
// //           });

// //           // ======================================================
// //           // Order bị hủy
// //           // ======================================================

// //           if (routingKey === 'order.cancelled') {
// //             await this.restoreService.restore(
// //               data.items,
// //             );

// //             console.log(
// //               'Inventory đã hoàn tồn thành công',
// //             );
// //           }

          

// //           // Message xử lý thành công
// //           this.channel.ack(message);
// //         } catch (error) {
// //           console.error(
// //             'Error processing RabbitMQ message:',
// //             error,
// //           );

// //           // Không ack nếu xử lý thất bại
// //           // RabbitMQ có thể requeue message
// //           this.channel.nack(
// //             message,
// //             false,
// //             true,
// //           );
// //         }
// //       },
// //     );

// //     console.log('Consumer is listening...');
// //   }

// //   async onModuleDestroy() {
// //     await this.channel?.close();
// //     await this.connection?.close();
// //   }
// // }

// import {
//   Injectable,
//   OnModuleDestroy,
//   OnModuleInit,
// } from '@nestjs/common';

// import * as amqp from 'amqplib';

// import { RestoreService } from '../inventories/restore/restore.service';

// @Injectable()
// export class RabbitMQService
//   implements OnModuleInit, OnModuleDestroy
// {
//   constructor(
//     private readonly restoreService: RestoreService,
//   ) {}

//   // ======================================================
//   // RABBITMQ
//   // ======================================================

//   private connection?: amqp.ChannelModel;
//   private channel?: amqp.Channel;

//   // ======================================================
//   // RECONNECT STATE
//   // ======================================================

//   private reconnecting = false;
//   private reconnectTimer?: NodeJS.Timeout;
//   private isDestroyed = false;

//   // ======================================================
//   // CONFIG
//   // ======================================================

//   private readonly rabbitmqUrl =
//     'amqp://admin:password@localhost:5672';

//   private readonly exchangeName =
//     'order.events';

//   private readonly queueName =
//     'order.inventory.queue';

//   private readonly routingKey =
//     'order.cancelled';

//   private readonly reconnectDelay = 5000;

//   // ======================================================
//   // MODULE INIT
//   // ======================================================

//   async onModuleInit() {
//     await this.connect();
//   }

//   // ======================================================
//   // CONNECT RABBITMQ
//   // ======================================================

//   private async connect(): Promise<void> {
//     if (this.isDestroyed) {
//       return;
//     }

//     // Đã có connection + channel
//     if (this.connection && this.channel) {
//       return;
//     }

//     // Đang reconnect
//     if (this.reconnecting) {
//       return;
//     }

//     this.reconnecting = true;

//     try {
//       console.log(
//         'Connecting RabbitMQ...',
//       );

//       // ======================================================
//       // CONNECT
//       // ======================================================

//       const connection =
//         await amqp.connect(
//           this.rabbitmqUrl,
//         );

//       this.connection = connection;

//       console.log(
//         'RabbitMQ connected',
//       );

//       // ======================================================
//       // CONNECTION ERROR
//       // ======================================================

//       connection.on(
//         'error',
//         (error) => {
//           console.error(
//             'RabbitMQ connection error:',
//             error instanceof Error
//               ? error.message
//               : error,
//           );
//         },
//       );

//       // ======================================================
//       // CONNECTION CLOSED
//       // ======================================================

//       connection.on(
//         'close',
//         () => {
//           console.error(
//             'RabbitMQ connection closed',
//           );

//           this.channel = undefined;
//           this.connection = undefined;

//           if (!this.isDestroyed) {
//             this.scheduleReconnect();
//           }
//         },
//       );

//       // ======================================================
//       // CREATE CHANNEL
//       // ======================================================

//       const channel =
//         await connection.createChannel();

//       this.channel = channel;

//       console.log(
//         'RabbitMQ channel created',
//       );

//       // ======================================================
//       // EXCHANGE
//       // ======================================================

//       await channel.assertExchange(
//         this.exchangeName,
//         'direct',
//         {
//           durable: true,
//         },
//       );

//       console.log(
//         `Exchange "${this.exchangeName}" ready`,
//       );

//       // ======================================================
//       // QUEUE
//       // ======================================================

//       await channel.assertQueue(
//         this.queueName,
//         {
//           durable: true,
//         },
//       );

//       console.log(
//         `Queue "${this.queueName}" ready`,
//       );

//       // ======================================================
//       // BINDING
//       // ======================================================

//       await channel.bindQueue(
//         this.queueName,
//         this.exchangeName,
//         this.routingKey,
//       );

//       console.log(
//         `Binding "${this.routingKey}" ready`,
//       );

//       // ======================================================
//       // CONSUMER
//       // ======================================================

//       await this.consume(channel);

//       console.log(
//         'Consumer ready',
//       );

//       // ======================================================
//       // CONNECT SUCCESS
//       // ======================================================

//       this.reconnecting = false;

//       console.log(
//         'RabbitMQ setup completed',
//       );

//     } catch (error) {
//       console.error(
//         'RabbitMQ connection failed:',
//         error instanceof Error
//           ? error.message
//           : error,
//       );

//       this.channel = undefined;
//       this.connection = undefined;

//       this.reconnecting = false;

//       if (!this.isDestroyed) {
//         this.scheduleReconnect();
//       }
//     }
//   }

//   // ======================================================
//   // RECONNECT
//   // ======================================================

//   private scheduleReconnect(): void {
//     if (this.isDestroyed) {
//       return;
//     }

//     // Đã có timer reconnect
//     if (this.reconnectTimer) {
//       return;
//     }

//     console.log(
//       `RabbitMQ will reconnect in ${
//         this.reconnectDelay / 1000
//       } seconds...`,
//     );

//     this.reconnectTimer =
//       setTimeout(async () => {
//         this.reconnectTimer = undefined;

//         await this.connect();
//       }, this.reconnectDelay);
//   }

//   // ======================================================
//   // CONSUMER
//   // ======================================================

//   private async consume(
//     channel: amqp.Channel,
//   ): Promise<void> {
//     await channel.consume(
//       this.queueName,
//       async (message) => {
//         if (!message) {
//           return;
//         }

//         try {
//           // ======================================================
//           // MESSAGE
//           // ======================================================

//           const routingKey =
//             message.fields.routingKey;

//           const data = JSON.parse(
//             message.content.toString(),
//           );

//           console.log(
//             'Received event:',
//             {
//               routingKey,
//               data,
//             },
//           );

//           // ======================================================
//           // ORDER CANCELLED
//           // ======================================================

//           if (
//             routingKey ===
//             'order.cancelled'
//           ) {
//             await this.restoreService.restore(
              
//               data.items,
//             );

//             console.log(
//               'Inventory đã hoàn tồn thành công',
//             );
//           }

//           // ======================================================
//           // ACK
//           // ======================================================

//           channel.ack(message);

//         } catch (error) {
//           console.error(
//             'Error processing RabbitMQ message:',
//             error instanceof Error
//               ? error.message
//               : error,
//           );

//           // ======================================================
//           // NACK + REQUEUE
//           // ======================================================

//           try {
//             channel.nack(
//               message,
//               false,
//               true,
//             );
//           } catch (ackError) {
//             console.error(
//               'Failed to nack RabbitMQ message:',
//               ackError instanceof Error
//                 ? ackError.message
//                 : ackError,
//             );
//           }
//         }
//       },
//     );

//     console.log(
//       'Consumer is listening...',
//     );
//   }

//   // ======================================================
//   // MODULE DESTROY
//   // ======================================================

//   async onModuleDestroy() {
//     this.isDestroyed = true;

//     // Không reconnect nữa
//     if (this.reconnectTimer) {
//       clearTimeout(
//         this.reconnectTimer,
//       );

//       this.reconnectTimer = undefined;
//     }

//     // ======================================================
//     // CLOSE CHANNEL
//     // ======================================================

//     try {
//       await this.channel?.close();
//     } catch (error) {
//       console.error(
//         'Error closing RabbitMQ channel:',
//         error instanceof Error
//           ? error.message
//           : error,
//       );
//     }

//     // ======================================================
//     // CLOSE CONNECTION
//     // ======================================================

//     try {
//       await this.connection?.close();
//     } catch (error) {
//       console.error(
//         'Error closing RabbitMQ connection:',
//         error instanceof Error
//           ? error.message
//           : error,
//       );
//     }

//     this.channel = undefined;
//     this.connection = undefined;
//   }
// }

import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

import { RestoreService } from '../inventories/restore/restore.service';

@Injectable()
export class RabbitMQService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly restoreService: RestoreService,
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

  private readonly exchangeName =
    'order.events';

  private readonly queueName =
    'order.inventory.queue';

  private readonly routingKey =
    'order.cancelled';

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
      console.log('Connecting RabbitMQ...');

      // ======================================================
      // CONNECTION
      // ======================================================

      const connection = await amqp.connect(
        this.rabbitmqUrl,
      );

      this.connection = connection;

      console.log('RabbitMQ connected');

      // ======================================================
      // CONNECTION ERROR
      // ======================================================

      connection.on('error', (error) => {
        console.error(
          'RabbitMQ connection error:',
          error instanceof Error
            ? error.message
            : error,
        );
      });

      // ======================================================
      // CONNECTION CLOSED
      // ======================================================

      connection.on('close', () => {
        console.error(
          'RabbitMQ connection closed',
        );

        this.connection = undefined;
        this.channel = undefined;

        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      });

      // ======================================================
      // CHANNEL
      // ======================================================

      const channel =
        await connection.createChannel();

      this.channel = channel;

      console.log(
        'RabbitMQ channel created',
      );

      // ======================================================
      // EXCHANGE
      // ======================================================

      await channel.assertExchange(
        this.exchangeName,
        'direct',
        {
          durable: true,
        },
      );

      console.log(
        `Exchange "${this.exchangeName}" ready`,
      );

      // ======================================================
      // QUEUE
      // ======================================================

      await channel.assertQueue(
        this.queueName,
        {
          durable: true,
        },
      );

      console.log(
        `Queue "${this.queueName}" ready`,
      );

      // ======================================================
      // BINDING
      // ======================================================

      await channel.bindQueue(
        this.queueName,
        this.exchangeName,
        this.routingKey,
      );

      console.log(
        `Binding "${this.routingKey}" ready`,
      );

      // ======================================================
      // CONSUMER
      // ======================================================

      await this.consume(channel);

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

      this.connection = undefined;
      this.channel = undefined;

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

    if (this.reconnectTimer) {
      return;
    }

    console.log(
      `RabbitMQ will reconnect in ${
        this.reconnectDelay / 1000
      } seconds...`,
    );

    this.reconnectTimer = setTimeout(
      async () => {
        this.reconnectTimer = undefined;

        await this.connect();
      },
      this.reconnectDelay,
    );
  }

  // ======================================================
  // CONSUMER
  // ======================================================

  private async consume(
    channel: amqp.Channel,
  ): Promise<void> {
    await channel.consume(
      this.queueName,
      async (message) => {
        if (!message) {
          return;
        }

        try {
          // ======================================================
          // PARSE MESSAGE
          // ======================================================

          const routingKey =
            message.fields.routingKey;

          const payload = JSON.parse(
            message.content.toString(),
          );

          console.log(
            'Received event:',
            {
              routingKey,
              payload,
            },
          );

          // ======================================================
          // ORDER CANCELLED
          // ======================================================

          if (
            routingKey ===
            'order.cancelled'
          ) {
            await this.restoreService.restore(
              payload.eventId,
              payload.eventType,
              payload.data.items,
            );

            console.log(
              'Inventory đã hoàn tồn thành công',
            );
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

    // ======================================================
    // CLOSE CHANNEL
    // ======================================================

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

    // ======================================================
    // CLOSE CONNECTION
    // ======================================================

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